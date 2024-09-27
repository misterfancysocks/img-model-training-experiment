# Pre-processing Specification

This component builds upon the [upload-and-crop](../components/upload-and-crop.tsx) functionality.

This component also executes the img-captioning defined in [img-captioning-spec](../img-captioning/img-captioning-spec.md).

## User Interface
- A menu on the left side allows the user to select a shoot.
- Images are loaded on the right side in a grid layout.
- If a cropped image exists (prefix of 'c_' in the filename), it will be displayed; otherwise, the original (prefix of 'o_') will be shown.
- If a preprocessed image exists (prefix of 'nobg_' in the filename), it will be displayed; otherwise, the original (prefix of 'o_') will be shown.

### Hierarchy to Check for Photos (in order):
1. **preprocessed** / 'nobg_'
2. **cropped** / 'c_'
3. **original** / 'o_'

### Shoot Selection
- Users can select a shoot from a dropdown menu.
- On selection, images for that shoot are fetched and displayed.

## Image Processing (Background Removal and Captioning)
1. **"Remove Background" Button:**
   - Located at the bottom of the page.
   - Initiates both the background removal and captioning processes for all images in the selected shoot.

2. **Background Removal:**
   - **Providers:**
     - **Fal API (default):**
       - **Process:**
         1. Generate a signed URL for the original image stored in Google Cloud Storage (GCP).
         2. Send this signed URL directly to the Fal API for background removal.
     - **Replicate API:**
       - **Process:**
         1. Convert the image to a Base64-encoded string after downsizing.
         2. Send the Base64 string to the Replicate API for background removal.
   - **Flow:**
     - Both Fal and Replicate processes run asynchronously and in parallel for all images.

3. **Image Captioning:**
   - Utilizes the `captionImageAction` from `@/actions/img-caption-actions`.
   - **Process:**
     1. Fetch person data related to the shoot from the database.
     2. Generate a signed URL for the image.
     3. Downsize the image before sending it for captioning.
     4. Send the downsized image and a predefined prompt to the Anthropic API to generate a caption.
     5. Store the generated caption along with the selected language model.

4. **Process Execution:**
   - For each image:
     - Display a loading spinner over the image being processed.
     - Perform background removal and captioning simultaneously.
     - Upon completion, update the image display with the processed image and store the caption in the database.

## Process Flow
1. **Select Shoot:**
   - User selects a shoot from the dropdown menu.
   - Images for the selected shoot are fetched and displayed in the grid.

2. **Initiate Processing:**
   - User clicks the "Remove Background" button.
   - For each image in the shoot:
     - **Background Removal:**
       - Depending on the selected provider (Fal or Replicate), send the appropriate data (signed URL or Base64 string) for background removal.
     - **Captioning:**
       - Generate a descriptive caption using the Anthropic API based on the image and person data.

3. **Update UI and Database:**
   - Display the processed image in the UI.
   - Store the processed image details and captions in the `preprocessed_images` table in the database.

4. **Save Processed Data:**
   - User clicks the "Save" button.
   - All preprocessed images and their captions are saved to the database.
   - Confirmation toast is displayed upon successful save.

## Image Handling
- **Processed Images:**
  - Prefixed with 'nobg_'.
  - Example: `o_img_01.png` -> `nobg_o_img_01.png`.
- **Storage:**
  - Processed images are saved in the GCP bucket with the 'nobg_' prefix.
- **Display Logic:**
  - UI checks for the existence of preprocessed images first, followed by cropped and original images.

## Save Functionality
- **"Save" Button:**
  - Saves all processed images and their corresponding captions to the `preprocessed_images` table in the database.
- **Database Operations:**
  1. Insert the processed image details:
     - `imageId`: Reference to the original image.
     - `beforeFileName`: Original filename.
     - `afterFileName`: Processed filename with 'nobg_' prefix.
     - `preprocessedUrl`: URL of the processed image.
     - `caption`: Generated caption.
     - `llm`: Language model used for captioning.
  2. Confirm successful insertion and update the UI accordingly.

## Error Handling
- **During Processing:**
  - Errors in background removal or captioning are logged to the console.
  - Display a toast message to inform the user of any failures.
- **Database Operations:**
  - Handle and log any errors that occur during database insertions.
  - Ensure that processing continues for other images even if one fails.

## State Management
- Utilizes React's `useState` for local state management:
  - `shoots`: List of available photo shoots.
  - `selectedShoot`: Currently selected shoot.
  - `images`: Array of image data for the selected shoot.
  - `isLoading`: Boolean indicating if the shoot is being loaded.
  - `processingImages`: Set of image IDs currently being processed.

## API Interactions
- **Background Removal:**
  - `/api/pre-process-images`: Handles background removal by interfacing with Fal or Replicate APIs.
- **Image Captioning:**
  - Utilizes `/api/img-caption`: Executes the captioning process using the Anthropic API.
- **Save Preprocessed Images:**
  - `/api/save-preprocessed-images`: Saves processed images and captions to the `preprocessed_images` table in the database.

## Environment Variables
Ensure the following environment variables are correctly set in your `.env.local` file:
- `FAL_KEY`: API key for Fal.
- `REPLICATE_API_TOKEN`: Token for Replicate API.
- `GCP_PROJECT_ID`: Google Cloud Project ID.
- `GCP_CLIENT_EMAIL`: Client email for GCP.
- `GCP_PRIVATE_KEY`: Private key for GCP.
- `GCP_USER_IMG_UPLOAD_BUCKET_NAME`: GCP bucket name for user image uploads.
- `ANTHROPIC_API_KEY`: API key for Anthropic.

## Security Considerations
- **Signed URLs:**
  - Signed URLs are used to securely grant temporary access to images in GCP without exposing private keys.
- **Data Validation:**
  - Validate all incoming data to prevent SQL injection and other security vulnerabilities.
- **Error Logging:**
  - Avoid exposing sensitive error information to the client. Log detailed errors on the server side only.

## Additional Notes
- **Performance Optimization:**
  - Consider batching API requests where possible to improve performance.
- **Scalability:**
  - Ensure that the system can handle a large number of simultaneous image processing requests without overloading the server.
- **User Feedback:**
  - Provide real-time feedback on the processing status of each image to enhance user experience.
