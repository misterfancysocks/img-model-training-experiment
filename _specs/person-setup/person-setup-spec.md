# Person Setup Specification

## Overview
The Person Setup module handles the creation of user profiles, including collecting personal information and uploading photos. This module is split into two main components:
1. **Person Profile Creation**: Collects personal details.
2. **Photo Upload**: Allows users to upload photos as part of the profile setup.

Component: `/components/person-setup.tsx`
Page: `/app/person-setup/page.tsx`

This is the updated schema for the images table:
```sql
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personId INTEGER NOT NULL,
  uuid TEXT NOT NULL, -- {uuid}
  sanitizedFileName TEXT NOT NULL, -- sanitized version of original fileName
  bucket TEXT NOT NULL, -- bucket the file is stored in
  originalGcsObjectUrl TEXT NOT NULL, -- fully qualified url to the original image with the appropriate prefix ex. 'https://storage.googleapis.com/{bucket}/o_{uuid}_{sanitizedFileName}'
  modifiedGcsObjectUrl TEXT, -- url to the cropped image with the appropriate prefix ex. 'https://storage.googleapis.com/{bucket}/m_{uuid}_{sanitizedFileName}'
  isDeleted INTEGER DEFAULT 0, -- Flag to mark if the image is deleted; deleted = 1
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE
);
```

## UI Components

### Layout
- Use a responsive layout with a gradient background (`from-orange-900 to-black`)
- Implement a container with padding and centered content

### Header
- Display a large, bold title "Person Profile" with a Ghost icon
- Use Framer Motion for a fade-in animation effect

### Profile Form
- Use a `Card` component with a semi-transparent black background
- Include form fields for:
  - First Name (Input)
  - Last Name (Input)
  - Birthdate (Date Input)
  - Gender (Radio Group)
  - Ethnicity (Select)
  - Costume Ideas (Dynamic Inputs)

### Costume Ideas Section
- Allow adding/removing costume ideas (minimum 2, maximum 3)
- Use "Add Idea" and "Remove Idea" buttons

### Photo Upload Section
- Implement a drag-and-drop area for photo uploads
- Display uploaded photos in a grid
- Allow removal of individual uploaded photos

### Submit Button
- Include a "Review Uploaded Photos" button to submit the form

## Functionality

### Person Profile Creation
- **Input Fields**:
  - First Name (required)
  - Last Name (required)
  - Birthdate (required)
  - Gender (required, options: male, female, other)
  - Ethnicity (required, options: caucasian, african, asian, hispanic, other)
  - Costume Ideas (optional, 2-3 ideas)

- **Validations**:
  - All fields are required except Costume Ideas.
  - At least one photo must be uploaded.

- **Actions**:
  - Add/Remove Costume Ideas (up to 3).
  - Submit profile data and photos to `/api/upload-user-images`.

### Photo Upload
- **Features**:
  - Drag-and-drop functionality for uploading images.
  - Click to upload option.
  - Preview of uploaded photos with options to remove.
  
- **Validations**:
  - Only image files are accepted.
  - File size limits as per project guidelines.

- **Actions**:
  - Upload multiple photos.
  - Remove individual photos before submission.

## API Calls
- **POST `/api/upload-user-images`**:
  - **Payload**:
    ```json
    {
      "personData": {
        "firstName": "John",
        "lastName": "Doe",
        "birthdate": "1990-10-31",
        "gender": "male",
        "ethnicity": "caucasian"
      },
      "images": [
        {
            // do not make any modifications to the file name.
          "fileName": "profile_pic.jpg",
          "base64imgdata": "data:image/jpeg;base64,..."
        },
        ...
      ]
    }
    ```
  - **Response**:
    ```json
    {
      "personId": 1,
      "uploadedImages": [
        {
          "id": 1,
          "uuid": "abc123",
          "sanitizedFileName": "profile_pic.jpg",
          "originalGcsObjectUrl": "https://storage.googleapis.com/bucket/o_abc123_profile_pic.jpg"
        },
        ...
      ]
    }
    ```

## Expected Inputs and Outputs
- **Inputs**:
  - User personal information.
  - One or more image files for upload.

- **Outputs**:
  - Creation of a new person record in the database.
  - Uploaded images stored in Google Cloud Storage with the following details:
    - UUID generated for each image
    - Sanitized file name
    - Original GCS object URL with the format: `https://storage.googleapis.com/{bucket}/o_{uuid}_{sanitizedFileName}`
  - Response containing `personId` and details of uploaded images including their IDs, UUIDs, sanitized file names, and original GCS object URLs.

## Dependencies
- React and Next.js
- Framer Motion for animations
- shadcn/ui components (Button, Card, Input, Label, RadioGroup, Select)
- Lucide React for icons
- `useToast` hook for notifications

## Error Handling and Notifications
- Use the `useToast` hook for displaying notifications
- Show error toasts for failed uploads or invalid form submissions

## Navigation
- After successful submission, store the `personId` in localStorage
- Redirect to the review images page using Next.js `useRouter`

## Performance Considerations
- Convert uploaded photos to Base64 before sending to the server
- Consider implementing lazy loading for uploaded photo previews if dealing with many uploads
