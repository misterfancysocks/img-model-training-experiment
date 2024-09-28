# Image Preparation Pipeline API Specification

## Overview
The Image Preparation Pipeline API automates the process of removing backgrounds from images and generating captions. This API is triggered when a user selects 'Generate AI Model' from the Review Images component after images and data have been saved.

## API Endpoints

### 1. Image Preparation Pipeline
**Endpoint:** `POST /api/img-prep-pipeline`

**Input:**
- `personId`: The ID of the person associated with the images

**Output:**
- `processedImages`: An array of successfully processed image data, including:
  - `imageId`: Original image ID
  - `preprocessedUrl`: URL of the processed image (with background removed)
  - `caption`: Generated caption for the image
- `failedImages`: Number of images that failed processing
- `totalImages`: Total number of images processed

**Process:**
1. Fetch images for the person
2. For each image:
   - Generate signed URL
   - Remove background using Fal.ai
   - Convert processed image to base64
   - Generate caption using Anthropic API
   - Upload processed image to GCS
   - Save preprocessed image data
3. Return processed image data, including success and failure counts

### 2. Get User Images (Internal)
**Note:** This is an internal database operation, not an exposed API endpoint.

**Input:**
- `personId`: The ID of the person

**Output:**
- An array of image objects, each containing:
  - `id`: INTEGER
  - `uuid`: TEXT
  - `sanitizedFileName`: TEXT
  - `bucket`: TEXT
  - `originalGcsObjectUrl`: TEXT
  - `modifiedGcsObjectUrl`: TEXT (if available)

### 3. Generate Signed URL (Internal)
**Note:** This is an internal function, not an exposed API endpoint.

**Input:**
- `bucket`: The GCS bucket object
- `fileName`: The name of the file in GCS

**Output:**
- `signedUrl`: A temporary signed URL for accessing the file

### 4. Remove Background (Fal.ai API)
**Endpoint:** Fal.ai API endpoint

**Input:**
- `image_url`: Signed URL of the image to process

**Output:**
- `image`: Object containing the URL of the processed image with background removed

### 5. Upload Processed Image (Internal)
**Note:** This is an internal function, not an exposed API endpoint.

**Input:**
- `bucket`: The GCS bucket object
- `fileName`: The name to give the file in GCS
- `buffer`: The image data as a Buffer
- `contentType`: The MIME type of the image

**Output:**
- `url`: The public URL of the uploaded image in GCS

### 6. Generate Caption (Anthropic API)
**Endpoint:** Anthropic API endpoint

**Input:**
- `model`: The model to use for caption generation
- `max_tokens`: Maximum number of tokens for the response
- `messages`: Array containing the image (as base64) and the prompt

**Output:**
- `content`: Array containing the generated caption text

### 7. Save Preprocessed Image Data (Internal Database Operation)
**Note:** This is an internal database operation, not an exposed API endpoint.

**Input:**
- `imageId`: ID of the original image
- `beforeFileName`: Original file name
- `afterFileName`: Processed file name
- `preprocessedUrl`: URL of the processed image
- `caption`: Generated caption
- `llm`: Language model used for captioning

**Output:**
- Confirmation of successful database insertion

## Process Flow

1. Client calls `/api/img-prep-pipeline` with `personId`
2. Server fetches images from the database
3. For each image:
   a. Generate signed URL
   b. Send to Fal.ai for background removal
   c. Convert processed image to base64
   d. Send to Anthropic API for caption generation
   e. Upload processed image to GCS
   f. Save preprocessed image data to database
4. Return processed image data, success count, and failure count to client

## Error Handling
- Log detailed errors for failed image processing or captioning
- Continue processing other images even if one fails
- Return a list of successfully processed images and the count of failed images

## Security Considerations
- Use signed URLs for secure, temporary access to GCS
- Validate all incoming data to prevent injection attacks
- Implement proper authentication and authorization checks

## Performance Optimization
- Process images in parallel using Promise.allSettled
- Use efficient base64 encoding/decoding methods

## Additional Notes
- Ensure all necessary environment variables are set (GCP credentials, Fal AI key, Anthropic API key, etc.)
- Monitor API usage and implement rate limiting if necessary
- Consider implementing a queue system for handling large batches of images in the future
