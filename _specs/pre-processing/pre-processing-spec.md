# Pre-processing Specification

This component builds upon the [upload-and-crop](../components/upload-and-crop.tsx) functionality.

This component also executes the img-captioning defined in [img-captioning-spec](../img-captioning/img-captioning-spec.md).

## User Interface
- A menu on the left side allows the user to select a shoot.
- Images are loaded on the right side in a grid layout.
- If a cropped image exists (prefix of 'c_' in the filename), it will be displayed; otherwise, the original (prefix of 'o_') will be shown.
- If a preprocessed image exists (prefix of 'nobg_' in the filename), it will be displayed; otherwise, the original (prefix of 'o_') will be shown.

Hierarchy to check for photos (in order):
1. preprocessed / 'nobg_'
2. cropped /'c_'
3. original /'o_'

### Shoot Selection
- Users can select a shoot from a dropdown menu.
- On selection, images for that shoot are fetched and displayed.

### Image Processing (Background Removal and Captioning)
1. A 'Process Images' button is present at the bottom of the page.
2. When clicked, it initiates both the background removal and captioning processes for all images in the selected shoot.
3. Background removal uses the Replicate API (lucataco/remove-bg model) or Fal API.
4. Captioning is performed using the `captionImageAction` from `@/actions/img-caption-actions`.
5. Both processes run asynchronously and in parallel for all images.

### Image Downsizing
- Before captioning, images are downsized using the `/api/downsize-image` endpoint.
- This endpoint uses the `sharp` library to resize images server-side.

### Process Flow
1. User selects a shoot from the dropdown menu.
2. Images for the selected shoot are loaded and displayed in the grid.
3. User clicks 'Process Images' to initiate background removal and captioning for all images.
4. For each image:
   - A loading spinner is displayed over the image being processed.
   - The image is first downsized, then sent for background removal and captioning simultaneously.
   - Once processed, the new image URL is updated in the UI, and the caption is stored.

### Image Handling
- Processed images (background removed) will have a 'nobg_' prefix added to their filename.
  Example: `c_img_01.jpg` -> `nobg_c_img_01.jpg`
- The UI updates to display the processed images once available.
- Captions are stored in the component's state and will be saved to the database.

## Save Functionality
- A 'Save' button is available to save the processed images and captions.
- When clicked, it will:
  1. Save images to the 'preprocessed' folder.
  2. Update the 'preprocessed_images' table in the database with new image URLs and captions.

## Error Handling
- If an error occurs during any process (background removal, captioning, etc.), a toast message will display the error.
- Errors are also logged to the console for debugging.

## State Management
- The component uses React's useState for managing local state:
  - `shoots`: List of available photo shoots
  - `selectedShoot`: Currently selected shoot
  - `images`: Array of image data for the selected shoot
  - `isLoading`: Boolean to track loading state
  - `processingImages`: Set of image IDs currently being processed

## API Interactions
- `/api/get-shoots`: Fetches list of available shoots
- `/api/get-shoot-details`: Fetches details for a specific shoot
- `/api/downsize-image`: Resizes images server-side for captioning
- `/api/save-preprocessed-image`: Saves processed images and captions to the database

Note: Ensure all necessary API routes and server actions are implemented to support these functionalities.
