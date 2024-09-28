# Image Preparation Pipeline API Specification

## Overview
The Image Preparation Pipeline API automates the process of removing backgrounds from images and generating captions. This API is triggered when a user selects 'Generate AI Model' from the Review Images component after images and data have been saved.

## API Endpoints

### 1. Image Preparation Pipeline
**Endpoint:** `POST /api/img-prep-pipeline`

**Input:**
- `personId`: The ID of the person associated with the images

**Output:**
- An array of processed image data, including:
  - `imageId`: Original image ID
  - `preprocessedUrl`: URL of the processed image (with background removed)
  - `caption`: Generated caption for the image

**Process:**
1. Fetch images for the person
2. For each image:
   - Generate signed URL
   - Remove background
   - Upload processed image
   - Generate caption
   - Save preprocessed image data
3. Return processed image data

### 2. Get User Images
**Endpoint:** `GET /api/get-user-images`

**Input:**
- Query parameter: `personId`

**Output:**
- An array of image objects, each containing:
  - `id`: INTEGER
  - `uuid`: TEXT
  - `sanitizedFileName`: TEXT
  - `originalGcsObjectUrl`: TEXT
  - `modifiedGcsObjectUrl`: TEXT (if available)
  - `signedOriginalUrl`: TEXT
  - `signedModifiedUrl`: TEXT (if available)

### 3. Generate Signed URL (Internal)
**Note:** This is an internal function, not an exposed API endpoint.

**Input:**
- `fileName`: The name of the file in GCS
- `bucket`: The GCS bucket object

**Output:**
- `signedUrl`: A temporary signed URL for accessing the file

### 4. Remove Background (Fal.ai API)
**Endpoint:** Fal.ai API endpoint

**Input:**
- `image_url`: Signed URL of the image to process

**Output:**
- `url`: URL of the processed image with background removed

### 5. Upload Processed Image (Internal)
**Note:** This is an internal function, not an exposed API endpoint.

**Input:**
- `buffer`: The image data
- `fileName`: The name to give the file in GCS
- `bucket`: The GCS bucket object

**Output:**
- `url`: The public URL of the uploaded image in GCS

### 6. Generate Caption (Anthropic API)
**Endpoint:** Anthropic API endpoint

**Input:**
- `image`: Base64 encoded image data
- `prompt`: Text prompt for caption generation

**Output:**
- `text`: Generated caption text

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
2. Server fetches images using `/api/get-user-images`
3. For each image:
   a. Generate signed URL
   b. Send to Fal.ai for background removal
   c. Upload processed image to GCS
   d. Send to Anthropic API for caption generation
   e. Save preprocessed image data to database
4. Return processed image data to client

## Error Handling
- Log errors for failed image processing or captioning
- Continue processing other images even if one fails
- Return a list of successfully processed images and any errors encountered

## Security Considerations
- Use signed URLs for secure, temporary access to GCS
- Validate all incoming data to prevent injection attacks
- Implement proper authentication and authorization checks

## Performance Optimization
- Process images in parallel
- Consider implementing a queue system for handling large batches of images

## Additional Notes
- Ensure all necessary environment variables are set (GCP credentials, Fal AI key, Anthropic API key, etc.)
- Monitor API usage and implement rate limiting if necessary
