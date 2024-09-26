# Upload Photos Specification

## Overview
This specification outlines the functionality for uploading and managing photos in the Costumes app.

## User Interface

1. When the user loads the page, all fields are empty.

## Functionality

### New Person
1. The user populates all data fields for the person's information.
2. They can upload multiple photos, which are read as base64 strings and stored temporarily.
3. They can crop and rotate the photos individually.

### Modified Association
- Images are directly associated with a person using `personId`.

### Modified Submission
1. When the user clicks 'Submit':
   - All information (person data and images) are sent as JSON to the `/api/upload-user-images` endpoint.
   - Images are uploaded to the GCP bucket specified by `GCP_USER_IMG_UPLOAD_BUCKET_NAME` from `.env.local`, with server-side renaming:
     - Original images prefixed with 'o_'
     - Cropped images prefixed with 'c_'
   - Both original and cropped images are saved to the bucket.
   - The actual Google Cloud Storage URLs (`https://storage.googleapis.com/[BUCKET_NAME]/[OBJECT_NAME]`) are saved in the database.
   - The user receives feedback on the success or failure of the submission.

### Photo Upload
1. The user can upload multiple photos at once.
2. Uploaded photos are displayed in a grid layout.
3. Each photo can be cropped individually via a modal.
4. Each photo has a delete button.
5. Each photo can be rotated 90 degrees clockwise.
6. The order of the buttons:
   - Delete
   - Rotate 90 degrees clockwise
   - Crop

### Photo Cropping
1. When a user clicks the crop button on a photo:
   - A modal appears with cropping functionality.
   - The modal fits the entire image without scrolling.
   - The user selects an area to crop.
   - Once cropping is finished, they can:
     - Select 'Crop' to save the cropped image.
     - Select 'Cancel' to discard the cropped image.
   - After cropping, both the original and cropped versions are prepared for upload.

### Image Rotation
1. When a user rotates an image:
   - The image is rotated 90 degrees clockwise on the client-side.
   - The rotated image is saved as a cropped version.

### Data Management
1. Person data is sent to the `/api/upload-images` endpoint and saved in the `persons` table in the database.
2. Image data, including both original and cropped URLs, are saved in the `images` table in the database, referencing the `personId` they belong to.

## Technical Requirements
1. Use Next.js API routes for database operations and image uploads.
2. Implement proper error handling for all database and file system operations.
3. Ensure all user inputs are properly validated before submission.
4. Use optimistic updates where appropriate to improve user experience.
5. Images are sent as base64-encoded strings in the request payload.

## Post-Submission
1. After successful submission, the form is reset.
2. The user is notified of the successful upload.

# Technical Details

## Images

- **Storage:** 
  - Images are stored in the GCP bucket defined by `GCP_USER_IMG_UPLOAD_BUCKET_NAME`.
  - Images are saved with a path structure like `/{prefix}_{uuid}_{fileName}` where `prefix` is 'o_' for original and 'c_' for cropped images.
  - The database stores the full GCP URL: `https://storage.googleapis.com/[BUCKET_NAME]/[OBJECT_NAME]`
  
- **Naming Convention:**
  - File renaming is handled server-side.
  - Original images are saved with an 'o_' prefix.
    - Example: `o_{uuid}_{fileName}.jpg`
  - Cropped images are saved with a 'c_' prefix.
    - Example: `c_{uuid}_{fileName}.jpg`
  - If there is a cropped version, always display the cropped version in the UI.

- **Database Storage:**
  - The `originalUrl` field in the `images` table stores the full GCP URL for the image.
  - The `croppedUrl` field stores the URL of the cropped version if implemented.

## Person Data

- The `persons` table stores the following information:
  - firstName
  - lastName
  - ethnicity
  - gender
  - birthdate

## API

- The `/api/upload-user-images` endpoint:
  1. Accepts person data and image data as base64-encoded strings.
  2. Inserts person data into the `persons` table in the database.
  3. Uploads images to GCP, handling file renaming server-side with 'o_' and 'c_' prefixes.
  4. Saves image information, including URLs, to the `images` table in the database.
  5. Returns the new `personId` and information about uploaded images.