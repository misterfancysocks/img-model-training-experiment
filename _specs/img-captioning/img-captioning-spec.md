# Image Captioning Specification

All images need to be captioned before the LoRA model can be trained.

## Caption Generation

- Captions will contain a description of the image and the character in the image, along with a trigger word that will help the Flux model associate the subject with the trigger word.
- We will be using an Anthropic Claude model (claude-3-haiku-20240307) to caption the images.
- Caption generation will be run concurrently with the background removal process.
- All user interactions are handled from the `pre-processing.tsx` component.

## Inputs

Arguments into caption generation will be:
* 'imageUrl': The URL of the image to be captioned
* 'shootId': The ID of the shoot associated with the image

## Process

1. The `handleRemoveBackground` function in `pre-processing.tsx` initiates the captioning process for each image.
2. It calls the `captionImageAction` from `@/actions/img-caption-actions`.
3. The captioning process is performed on the server-side to ensure security and to leverage server resources.
4. The image is fetched and downsized using the `downsizeImage` utility function from `utils/image-utils`.
5. Person data associated with the shoot is fetched from the database.
6. The downsized image and a predefined prompt are sent to the Anthropic API for captioning.

## Outputs

Captions will be stored in the following ways:
1. In-memory: The `images` state in `pre-processing.tsx` is updated with the new caption and LLM model used.
2. Database: Captions will be written to the 'preprocessed_images' table in the database using the 'caption' column and 'llm' column.
   * 'caption' will contain the output from the LLM.
   * 'llm' column will contain the name of the LLM that was used to caption the image.

## Error Handling

- If an error occurs during the captioning process, it's caught in the `handleRemoveBackground` function.
- An error toast is displayed to the user with a generic error message.
- The error is logged to the console for debugging purposes.

## Testing

If users have trouble running the standalone test file, instruct them to run this command:
```bash
npx tsx test-captioning.ts
```