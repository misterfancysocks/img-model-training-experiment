'use server'

import Anthropic from '@anthropic-ai/sdk';
import { downsizeImage } from '@/utils/image-utils';
import fs from 'fs/promises';
import path from 'path';
import { getPersonDataForShoot } from '@/db/queries/shoot-queries'; // Add this import

export async function captionImageAction(imageUrl: string, shootId: number): Promise<{ caption: string; model: string }> {
  const anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });

  const model = "claude-3-haiku-20240307"; // Store the actual model being used

  // Read the prompt from the file
  const promptPath = path.join(process.cwd(), '.prompts', 'caption_person.txt');
  const promptContent = await fs.readFile(promptPath, 'utf-8');

  try {
    // Fetch person data for the shoot
    const personData = await getPersonDataForShoot(shootId);
    if (!personData) {
      throw new Error('Person data not found for the given shoot');
    }

    console.log('\x1b[36mFetching image from URL:\x1b[0m', imageUrl);
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    
    // console.log('\x1b[36mImage fetched and converted to base64\x1b[0m');
    // console.log('\x1b[36mBase64 image (first 100 chars):\x1b[0m', base64Image.substring(0, 100));

    const downsizedImage = await downsizeImage(base64Image);
    // console.log('\x1b[36mImage downsized\x1b[0m');
    // console.log('\x1b[36mDownsized image (first 100 chars):\x1b[0m', downsizedImage.substring(0, 100));

    const anthropicResponse = await anthropicClient.messages.create({
      model: model,
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
                data: downsizedImage,
              },
            },
            {
              type: "text",
              text: promptContent,
            },
          ],
        },
      ],
    });

    console.log('\x1b[36mAnthropic API response:\x1b[0m', anthropicResponse);

    if (anthropicResponse.content && anthropicResponse.content[0] && anthropicResponse.content[0].type === 'text') {
      const generatedCaption = anthropicResponse.content[0].text;
      const fullCaption = `${personData.trigger || 'TRIGGER'}, a ${personData.ethnicity}, ${personData.age} year old, ${personData.gender}. ${generatedCaption}`;
      console.log('\x1b[36mImage caption:\x1b[0m', fullCaption);
      console.log('\x1b[36mLLM:\x1b[0m', model);
      return { caption: fullCaption, model: model };
    } else {
      throw new Error('Unexpected response format from Anthropic API');
    }
  } catch (error) {
    console.error('\x1b[36mError in captionImageAction:\x1b[0m', error);
    throw error;
  }
}