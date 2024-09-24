import fetch from 'node-fetch';
import readline from 'readline';
import { Buffer } from 'buffer';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// Import types and rename ImageData to avoid conflict
import { PersonData, ShootData, ImageData as DbImageData, PreprocessedImageData, LoraData, GeneratedImageData, LoraPromptData } from '@/db/schema/schema';

// Update the local ImageData type to match DbImageData
type ImageData = DbImageData;

// Define the Shoot type
type Shoot = {
  id: number;
  name: string;
  costume: string;
};

/**
 * Fetches all available shoots from the API.
 * @returns A promise that resolves to an array of Shoot objects.
 */
const fetchShoots = async (): Promise<Shoot[]> => {
  const response = await fetch('http://localhost:3002/api/get-shoots');
  if (!response.ok) throw new Error('Failed to fetch shoots');
  return response.json();
};

/**
 * Fetches details of a specific shoot, including associated images.
 * @param shootId - The ID of the shoot to fetch details for.
 * @returns A promise that resolves to an array of ImageData objects.
 */
const fetchShootDetails = async (shootId: number): Promise<{
  person: PersonData;
  shoot: ShootData;
  images: ImageData[];
  preprocessedImages: PreprocessedImageData[];
  loras: LoraData[];
  generatedImages: GeneratedImageData[];
  loraPrompts: LoraPromptData[];
}> => {
  const response = await fetch(`http://localhost:3002/api/get-shoot-details?id=${shootId}`);
  if (!response.ok) throw new Error('Failed to fetch shoot details');
  const data = await response.json();
  console.log('\x1b[36mShoot details:\x1b[0m', data.shoot);
  console.log('\x1b[36mPerson details:\x1b[0m', data.person);

  return data;
};

/**
 * Converts an image file path to a base64-encoded string.
 * @param filePath - The path of the image file to convert.
 * @returns A promise that resolves to the base64-encoded string of the image.
 */
async function getBase64FromFile(filePath: string): Promise<string> {
  console.log(`Checking file path: ${filePath}`);
  try {
    await fs.access(filePath);
    console.log('File exists, reading...');
    const buffer = await fs.readFile(filePath);
    console.log(`File read, buffer length: ${buffer.length}`);
    const base64 = buffer.toString('base64');
    console.log(`Base64 string length: ${base64.length}`);
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    throw new Error(`File does not exist or cannot be read: ${filePath}`);
  }
}

/**
 * Prompts the user for input in the terminal.
 * @param query - The question to present to the user.
 * @returns A promise that resolves to the user's input as a string.
 */
const promptUser = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
};

/**
 * Downsizes an image using the Sharp library.
 * @param base64 - The base64-encoded string of the image.
 * @param width - The desired width to resize the image to. Defaults to 800 pixels.
 * @returns A promise that resolves to the downsized image as a base64 string.
 */
const downsizeImage = async (base64: string, width: number = 800): Promise<string> => {
  try {
    console.log('Downsizing image...');
    console.log('Input base64 length:', base64.length);
    const buffer = Buffer.from(base64.split(',')[1], 'base64');
    console.log('Buffer length:', buffer.length);
    
    const metadata = await sharp(buffer).metadata();
    //console.log('Image metadata:', metadata);

    const resizedBuffer = await sharp(buffer)
      .resize({ width })
      .toBuffer();
    console.log('Resized buffer length:', resizedBuffer.length);
    return resizedBuffer.toString('base64');
  } catch (error) {
    console.error('Error in downsizeImage:', error);
    throw error;
  }
};

/**
 * Starts the captioning process using Anthropic's API.
 * @param downsizedImageBase64 - The base64-encoded string of the downsized image.
 * @param image - The ImageData object to update with the caption.
 * @param shootId - The ID of the shoot being processed.
 * @param person - The PersonData object to use for caption formatting.
 * @returns A promise that resolves to the updated ImageData object with the caption.
 */
const startCaptioning = async (
  downsizedImageBase64: string,
  image: ImageData,
  shootId: number,
  person: PersonData // Add this parameter
): Promise<ImageData> => {
  const anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });

  // Read the prompt from the file
  const promptPath = path.join(process.cwd(), '.prompts', 'caption_person.txt');
  const promptContent = await fs.readFile(promptPath, 'utf-8');

  try {
    const response = await anthropicClient.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: downsizedImageBase64,
              },
            },
            {
              type: "text",
              text: promptContent, // Use the content from the file
            },
          ],
        },
      ],
    });

    // Check if the response has content and it's of the expected type
    if (response.content && response.content[0] && response.content[0].type === 'text') {
      const generatedCaption = response.content[0].text;
      // Insert the generated caption into the specified string format
      image.caption = `${person.trigger || 'TRIGGER'}, a ${person.ethnicity}, ${person.age} year old, ${person.gender}. ${generatedCaption}`;
      console.log('\x1b[36mImage caption:\x1b[0m', image.caption);
    } else {
      console.error('Unexpected response format from Anthropic API');
    }
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
  }

  return image;
};

/**
 * The main function to execute the captioning script.
 * It fetches shoots, prompts the user to select one, processes each image by downsizing and captioning.
 */
const main = async () => {
  try {
    console.log('Current working directory:', process.cwd());

    const shoots = await fetchShoots();
    console.log('Available shoots:');
    shoots.forEach(shoot => {
      console.log(`ID: ${shoot.id}, Name: ${shoot.name}, Costume: ${shoot.costume}`);
    });

    const shootIdStr = await promptUser('Enter the shoot ID to process: ');
    const shootId = parseInt(shootIdStr, 10);

    if (isNaN(shootId)) {
      throw new Error('Invalid shoot ID');
    }

    const shootDetails = await fetchShootDetails(shootId);
    console.log(`Processing ${shootDetails.images.length} images for shoot ID ${shootId}...`);

    // Process all images concurrently
    const processingPromises = shootDetails.images.map(async (image) => {
      const imagePath = path.join(process.cwd(), 'public', image.croppedUrl || image.originalUrl);
      console.log(`Processing image path: ${imagePath}`);
      
      try {
        const base64Image = await getBase64FromFile(imagePath);
        console.log('Successfully read image file');

        // Downsize image for captioning
        const downsizedImage = await downsizeImage(base64Image);
        console.log('Successfully downsized image');

        // Start captioning process
        const updatedImage = await startCaptioning(downsizedImage, image, shootId, shootDetails.person);
        console.log('\x1b[36mUpdated image ID:\x1b[0m');
        console.log(`${updatedImage.id} \nwith caption: ${updatedImage.caption}`);
        return updatedImage;
      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error);
        return null;
      }
    });

    // Wait for all images to be processed
    const processedImages = await Promise.all(processingPromises);

    // Filter out any null results (failed processing)
    const successfullyProcessedImages = processedImages.filter((img): img is ImageData => img !== null);

    console.log('Processing complete.');
    console.log(`Successfully processed ${successfullyProcessedImages.length} out of ${shootDetails.images.length} images.`);

    // Here you can add any additional logic to handle the processed images,
    // such as saving the updated captions to the database.

  } catch (error) {
    console.error('Error:', error);
  }
};

main();