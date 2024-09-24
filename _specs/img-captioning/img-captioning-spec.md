# Image Captioning Specification

All images need to be captioned before the LoRA model can be trained.

## Caption Generation

- Captions will contain a description of the image and the character in the image, along with a trigger word that will help the Flux model associate the subject with the trigger word.
- We will be using an Anthropic Claude model (for now) to caption the images.
- Caption generation will be run concurrently with the background removal process.
- All user interactions are handled from the `pre-processing.tsx` component.

## Inputs

Arguments into caption generation will be:
* 'model'
* 'prompt'
* 'trigger'
* 'image'
* 'age'
* 'gender'

## Process

1. The `handleCaptionImage` function in `pre-processing.tsx` initiates the captioning process for each image.
2. It calls the `captionImageAction` from `@/actions/img-caption-actions`.
3. The captioning process is performed on the server-side to ensure security and to leverage server resources.
4. The image is downsized using the `downsizeImage` utility function from `utils/image-utils`.

## Outputs

Captions will be stored in the following ways:
1. In-memory: The `images` state in `pre-processing.tsx` is updated with the new caption.
2. Database: Captions will be written to the 'preprocessed_images' table in the database using the 'caption' column and 'llm' column.
   * 'caption' will contain the output from the LLM.
   * 'llm' column will contain the name of the LLM that was used to caption the image.

## Error Handling

- If an error occurs during the captioning process, it's caught in the `handleCaptionImage` function.
- An error toast is displayed to the user with a generic error message.
- The error is logged to the console for debugging purposes.

## Testing

If users have trouble running the standalone test file, instruct them to run this command:
```bash
npx tsx test-captioning.ts
```