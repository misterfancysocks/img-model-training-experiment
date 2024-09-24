# Image Generation System Overview with fal.ai API Integration

## Storage Locations

- Lora files: `GCP_LORA_FILES_BUCKET_NAME=halloween-costume-loras`
- Generated images: `GCP_USER_IMG_GENERATED_BUCKET_NAME=halloween-costume-generated-images`

## Overview

This document outlines the design and implementation of the image generation system using the fal.ai `flux-lora` model. The system generates images based on user inputs and LoRA models stored in a Google Cloud Platform (GCP) bucket. The LoRA models are accessed via signed URLs to ensure secure and temporary access for the fal.ai API.

## Inputs

- **Prompt** *(to be developed, currently not implemented)*:
  - **Trigger Word** (used in place of the person's name)
  - **Age**
  - **Gender**
  - **Costume**
  - **Type of Shot**
  - **Background**

2. **LoRA URL**:
   - Located in GCP bucket: `halloween-costume-loras`
   - Each LoRA file is stored in a folder named after the `personid`
   - Accessed via a signed URL

3. **Database Data**:
   - Existing LoRA Models: Retrieved from the `loras` table
   - Select the most recent LoRA model based on `personid`

## Outputs

- **Generated Images**:
  - Quantity: 4 images per call
  - Resolution: 768x1024 pixels (portrait orientation)

## Process Overview

1. **Prompt Construction**:
   - Assemble the prompt using provided inputs
   - Example: "A [type of shot] of a [age]-year-old [gender] dressed as a [costume] with a [background] background, [trigger word]."

2. **LoRA Model Retrieval**:
   - Fetch the LoRA model details for the provided `loraId` from the database
   - LoRA file location: GCP bucket `halloween-costume-loras` under `personid` folder

3. **LoRA File Access via Signed URL**:
   - Generate a signed URL for the LoRA file in the GCP bucket
   - URL expiration: 15 minutes

4. **Image Generation with fal.ai API**:
   - Use the `fal-ai/flux-lora` model
   - API setup:
     ```bash
     npm install --save @fal-ai/serverless-client
     export FAL_KEY="YOUR_API_KEY"
     ```

5. **API Request Parameters**:
   - **Input Schema**:
     - `prompt`: The constructed prompt.
     - `image_size`: Set to match 768x1024 resolution.
       - Since `768x1024` is a portrait orientation, choose `portrait_4_3` or specify custom dimensions if supported.
     - `num_inference_steps`: Default is 28 (adjust as needed).
     - `guidance_scale`: Default is 3.5 (adjust as needed).
     - `num_images`: Set to **4**.
     - `loras`: Include the LoRA model **signed URL** and weight.
       ```json
       "loras": [
         {
           "path": "SIGNED_URL_TO_LORA_FILE",
           "scale": 1.0
         }
       ]
       ```
     - `output_format`: Set to `"jpeg"` or `"png"` as required.

6. **Making the API Call**:
   - Use the fal.ai client to submit the image generation request:
     ```javascript
     import * as fal from "@fal-ai/serverless-client";

   const result = await fal.subscribe("fal-ai/flux-lora", {
     input: {
       prompt: "Your constructed prompt here",
       image_size: "portrait_4_3",
       num_inference_steps: 28,
       guidance_scale: 3.5,
       num_images: 4,
       loras: [{ path: "SIGNED_URL_TO_LORA_FILE", scale: 1.0 }],
       output_format: "jpeg"
     },
     logs: true,
     onQueueUpdate: (update) => {
       if (update.status === "IN_PROGRESS") {
         update.logs.map((log) => log.message).forEach(console.log);
       }
     },
   });
   ```

7. **Response Handling**:
   - Extract image URLs from the API response
   - Download images from Fal.ai
   - Upload images to the GCP bucket `halloween-costume-generated-images`
   - All images should also be saved in a folder named after the `personId-loraId`, the folder should be located in `public/generated-images/`
   - Save metadata to `loras` table.
   field examples:
   ```markdown
    - fullUrl: `https://storage.googleapis.com/halloween-costume-generated-images/personId-loraId/image.jpg`
    - path: `personId-loraId/image.jpg`
    - bucket: `halloween-costume-generated-images`
   ```

## Implementation Details

1. **Endpoint**: `/api/generate-image` (POST)
2. **Request Body**:
   ```json
   {
     "prompt": "74828 is looking at the camera, smiling, with a haunted house in the background.",
     "loraId": 1,
     "num_images": 4,
     "image_size": "portrait_4_3"
   }
   ```
3. **Response**:
   ```json
   {
     "images": [
       {
         "url": "https://storage.googleapis.com/halloween-costume-generated-images/generated_1234567890_0.jpg",
         "width": 768,
         "height": 1024,
         "content_type": "image/jpeg"
       },
       // ... (3 more image objects)
     ],
     "seed": 1234567890,
     "prompt": "74828 is looking at the camera, smiling, with a haunted house in the background."
   }
   ```

## Error Handling

- Implement try-catch blocks for API calls and file operations
- Return appropriate error responses with status codes and messages
- Log errors for debugging purposes

## Security Considerations

- Use environment variables for API keys and credentials
- Implement rate limiting and user authentication for the `/api/generate-image` endpoint
- Use short-lived signed URLs for GCP bucket access

## Performance Optimization

- Implement caching for frequently used LoRA models
- Consider parallel processing for multiple image generations

## Future Enhancements

- Implement a user interface for custom prompt creation
- Add support for negative prompts
- Integrate with a queueing system for handling large numbers of requests

## Testing

- Develop unit tests for prompt construction and API call functions
- Implement integration tests for the entire image generation flow
- Create a test suite for error handling and edge cases