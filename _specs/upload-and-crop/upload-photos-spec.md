# Upload Photos Specification

## Overview
This specification outlines the functionality for uploading and managing photos in the Costumes app.

## User Interface

1. When the user loads the page, all fields should be empty.
2. The user should be able to select any previous shoots from the 'Select Existing Shoot' dropdown. The default option should be 'Create New Shoot'.

## Functionality

### New Shoot
1. If the user selects 'Create New Shoot':
   - They will populate all data fields (person and shoot information).
   - They can upload photos.
   - They can crop the photos if they wish.

### Existing Shoot
1. When the user selects an existing shoot:
   - The form should be populated with the shoot's data, including person data.
   - Existing images should be displayed and can be modified or added to.

### Photo Upload
1. The user should be able to upload as many photos as they want.
2. Uploaded photos should be displayed in a grid layout.
3. Each photo can be cropped individually.
4. Each photo should have a delete button.
5. Each button should be able to be rotated 90 degrees clockwise.

The order of the buttons should be:

- Delete
- Rotate 90 degrees clockwise
- Crop (crop and rorate clockwise should use different icons)

### Photo Cropping
1. When a user clicks the crop button on a photo:
   - A modal should appear with cropping functionality.
    - The modal should fit the entire image without scrolling.
   - The user should be able to select an area to crop.
   - Once the user is finished cropping, they can can:
       - select 'Crop' to save the cropped image.
       - select 'Cancel' to discard the cropped image.
   - After cropping, both the original and cropped versions should be saved.


### Submission
1. When the user clicks 'Submit':
   - All information (person data, shoot data, and images) should be saved to the database.
   - All images should be saved to the '/assets/{shootId}' directory on the server.
   - Cropped images should be saved alongside original images.
   - The user should receive feedback on the success or failure of the submission.

### Data Management
1. Person data and shoot data should be saved in separate tables in the database.
2. Image paths should be stored in the database, referencing the shoot they belong to.

## Technical Requirements
1. Use Next.js server actions for database operations.
2. Implement proper error handling for all database and file system operations.
3. Ensure all user inputs are properly validated before submission.
4. Use optimistic updates where appropriate to improve user experience.

## Post-Submission
1. After successful submission, the form should be reset.
2. The list of available shoots should be refreshed to include the newly added shoot.

# Technical Details

## Images

- Images should be saved to the `/assets/{shootId}` directory.
- Images should be saved as a path relative to the `/assets` directory.
    - Do not save images as base64 in the database.
- Cropped images should be saved with a 'c_' prefix in the filename.
    - Example: `c_test.jpg`
- Original images should be saved with a 'o_' prefix in the filename.
    - Example: `o_test.jpg`
- If there is a cropped version, always display the cropped version.