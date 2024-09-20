# Pre-processing specification

This component builds upon the [upload-and-crop](../components/upload-and-crop.tsx) functionality.

## User Interface
- A menu on the left side allows the user to select a shoot.
- Images are loaded on the right side in a grid layout.
- If a cropped image exists (prefix of 'c_' in the filename), it will be displayed; otherwise, the original (prefix of 'o_') will be shown.

## Background Removal Functionality
1. A 'Remove Background' button is present at the bottom of the page.
2. When clicked, this button initiates the background removal process for all images in the selected shoot.
3. The process uses the Replicate API (lucataco/remove-bg model) for background removal.

### Process Flow
1. User selects a shoot from the dropdown menu.
2. Images for the selected shoot are loaded and displayed in the grid.
3. User clicks the 'Remove Background' button.
4. For images:
  - All images are processed in parallel.
  - A loading spinner is displayed over the images.
  - The image is sent to the `/api/remove-background` endpoint.
  - The endpoint calls the Replicate or Fal (depending on arg passed to route) API to remove the background.
  - Once processed, the new image URL is returned and the new display URL is updated.
5. Processed images are displayed in place of the originals.
6. A toast message confirms the completion of the background removal process.

### Image Handling
#### Server Side
- Processed images will have a 'nobg_' prefix added to their filename.
  Example: `c_img_01.jpg` -> `nobg_c_img_01.jpg`
#### Client Side
- The UI updates to display the processed images once available.

## Save Functionality
- A 'Save' button is available to save the processed images.
- When clicked, it will:
  1. Save images to the 'preprocessed' folder.
  2. Update the 'preprocessed' image table in the database.

## Error Handling
- If an error occurs during the background removal process, a toast message will display the error.
- The UI will handle cases where the background removal fails for individual images.
