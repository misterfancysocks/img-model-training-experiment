# Review Images Specification

## Overview
The Review Images module allows users to review, crop, rotate, and manage their uploaded photos. Changes are stored locally until the user decides to create their AI model.

Component: `/components/review-images.tsx`
Page: `/app/review-images/page.tsx`

This is the schema for the images table:
```sql
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personId INTEGER NOT NULL,
  uuid TEXT NOT NULL, -- {uuid}
  sanitizedFileName TEXT NOT NULL, -- sanitized version of original fileName
  bucket TEXT NOT NULL, -- bucket the file is stored in
  uncroppedGcsObjectUrl TEXT NOT NULL, -- fully qualified url to the original image with the appropriate prefix ex. 'https://storage.googleapis.com/{bucket}/o_{uuid}_{sanitizedFileName}'
  croppedGcsObjectUrl TEXT, -- url to the cropped image with the appropriate prefix ex. 'https://storage.googleapis.com/{bucket}/c_{uuid}_{sanitizedFileName}'
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
- Display a large, bold title "Review and Edit Photos" with a Ghost icon
- Use Framer Motion for a fade-in animation effect

### Image Gallery
- Use a `Card` component with a semi-transparent black background
- Display a grid of uploaded photos (responsive: 1 column on small screens, 2 on medium, 3 on large)
- Each image should be displayed in a square aspect ratio

### Image Actions
- For each image, provide the following action buttons:
  - Rotate: Button with a `RotateCw` icon
  - Crop: Button with a `CropIcon` icon, opens a dialog
  - Delete: Button with a `Trash2` icon

### Crop Dialog
- Use a `Dialog` component from shadcn/ui
- Implement `ReactCrop` for image cropping functionality
- Display the dialog with a semi-transparent black background and orange border

### Create AI Model Section
- Add a centered section below the image gallery
- Display an informative text about the next steps
- Include a prominent "Create Your AI Model" button with an `ArrowRight` icon

## Functionality
- **File Names**:
    - Note: the api will handle all file renaming.

### Image Review
- **Display**:
  - Show all uploaded images with options to crop, rotate, or delete.
  - **Always use signed URLs for viewing images.**
  - If a cropped version of an image exists, always display and make changes to the cropped version.
  - Apply any local rotations or crops when displaying images to the user.

- **Actions**:
  - **Crop**:
    - Open cropping tool.
    - Allow users to select the crop area.
    - Store crop information locally.
    - If a cropped version already exists, apply the new crop to the existing cropped image.
  - **Rotate**:
    - Update rotation locally.
    - Display rotated image to the user without sending to the server.
    - If a cropped version exists, rotate the cropped image.
  - **Delete**:
    - Mark image for deletion locally.
    - Remove from the displayed list without sending to the server.

### Image Management
- **Features**:
  - Real-time preview of changes based on local modifications.
  - Ability to revert local changes before final submission.
  - Always work with the cropped version of an image if it exists.
  
- **Validations**:
  - Ensure cropped images meet size and format requirements.

### Create AI Model
- When the user clicks "Create Your AI Model":
  - Send all accumulated changes (rotations, crops, deletions) to the server.
  - For images with both original and cropped versions, send changes based on the cropped version.
  - Navigate to the AI model generation page after successful update.

## API Calls
- **GET `/api/get-user-images?personId={personId}`**:
  - **Response**:
    ```json
    {
        // example of image where only the original is available
      "images": [
        {
          "id": 1,
          "fileName": "uuid_user_uploaded_image.jpg",
          "originalUrl": "https://storage.googleapis.com/bucket/o_{fileName}",
          "croppedUrl": null,
          "signedOriginalUrl": "https://signed.url/for/viewing/original",
          "signedCroppedUrl": null
        },
        // example of image where both the original and cropped are available.
        // client should always display the cropped image if it is available.
        {
          "id": 2,
          "fileName": "uuid_another_pic.jpg",
          "originalUrl": "https://storage.googleapis.com/bucket/o_{fileName}",
          "croppedUrl": "https://storage.googleapis.com/bucket/c_{fileName}",
          "signedOriginalUrl": "https://signed.url/for/viewing/original",
          "signedCroppedUrl": "https://signed.url/for/viewing/cropped"
        },
        ...
      ]
    }
    ```

- **POST `/api/upload-user-images`**:
  - **Payload**:
    ```json
    {
      "personId": 1,
      "images": [
        {
          "id": 1,
          "rotation": 90,
          "crop": {
            "x": 10,
            "y": 10,
            "width": 100,
            "height": 100
          }
        },
        {
          "id": 2,
          "deleted": true
        }
      ]
    }
    ```
  - **Response**:
    ```json
    {
      "updatedImages": [
        {
          "id": 1,
          "fileName": "uuid_user_uploaded_image.jpg",
          "originalUrl": "https://storage.googleapis.com/bucket/o_{fileName}",
          "croppedUrl": "https://storage.googleapis.com/bucket/c_{fileName}",
          "signedOriginalUrl": "https://signed.url/for/viewing/original",
          "signedCroppedUrl": "https://signed.url/for/viewing/cropped"
        }
      ],
      "deletedImageIds": [2]
    }
    ```

Note: The server applies rotations and crops to the images, saves them to GCS, and updates the database with new URLs. Rotation degrees are not stored in the database; instead, the rotated image is saved directly to GCS. When both original and cropped versions exist, changes are applied to the cropped version.