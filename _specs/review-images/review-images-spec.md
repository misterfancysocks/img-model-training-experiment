# Review Images Specification

## Overview
The Review Images module allows users to review, crop, rotate, and manage their uploaded photos. Changes are displayed to the user in the UI and stored locally until the user decides to create their AI model. Once the user clicks "Create Your AI Model", the changes are sent to the server, applied to the images, and the image preparation pipeline is triggered.

Component: `/components/review-images.tsx`
Page: `/app/review-images/page.tsx`

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
  - Always use signed URLs for viewing images.
  - If a modified version of an image exists, always display and make changes to the modified version.
  - Apply any local rotations or crops when displaying images to the user.

- **Actions**:
  - **Crop**:
    - Open cropping tool.
    - Allow users to select the crop area.
    - Store crop information locally.
    - Reset crop parameters when the crop button is clicked again.
  - **Rotate**:
    - Update rotation locally.
    - Display rotated image to the user without sending to the server.
  - **Delete**:
    - Mark image for deletion locally.
    - Remove from the displayed list without sending to the server.

### Image Management
- **Features**:
  - Real-time preview of changes based on local modifications.
  - Changes (rotations, crops) are stored locally and applied visually without sending to the server.
  - Ability to reset crop parameters by clicking the crop button again.
  - All changes are batched and sent to the server when the user clicks "Create Your AI Model".

- **Validations**:
  - Ensure modified images meet size and format requirements.

### Create AI Model
- When the user clicks "Create Your AI Model":
  - Send all accumulated changes (rotations, crops, deletions) to the server.
  - Trigger the image preparation pipeline (`/api/img-prep-pipeline`).


## API Calls
- **GET `/api/get-user-images?personId={personId}`**:
  - **Response**:
    ```json
    {
      "images": [
        {
          "id": 1,
          "uuid": "abc123",
          "sanitizedFileName": "profile_pic.jpg",
          "originalGcsObjectUrl": "https://storage.googleapis.com/bucket/o_abc123_profile_pic.jpg",
          "modifiedGcsObjectUrl": null,
          "signedOriginalUrl": "https://signed.url/for/viewing/original",
          "signedModifiedUrl": null
        },
        {
          "id": 2,
          "uuid": "def456",
          "sanitizedFileName": "another_pic.jpg",
          "originalGcsObjectUrl": "https://storage.googleapis.com/bucket/o_def456_another_pic.jpg",
          "modifiedGcsObjectUrl": "https://storage.googleapis.com/bucket/m_def456_another_pic.jpg",
          "signedOriginalUrl": "https://signed.url/for/viewing/original",
          "signedModifiedUrl": "https://signed.url/for/viewing/modified"
        }
      ]
    }
    ```

- **POST `/api/upload-user-images`**:
  - **Payload for modifications**:
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
          "rotation": 0,
          "crop": null
        },
        {
          "id": 3,
          "deleted": true
        }
      ]
    }
    ```
  - **Response for modifications**:
    ```json
    {
      "updatedImages": [
        {
          "id": 1,
          "uuid": "abc123",
          "sanitizedFileName": "profile_pic.jpg",
          "originalGcsObjectUrl": "https://storage.googleapis.com/bucket/o_abc123_profile_pic.jpg",
          "modifiedGcsObjectUrl": "https://storage.googleapis.com/bucket/m_abc123_profile_pic.jpg",
          "signedOriginalUrl": "https://signed.url/for/viewing/original",
          "signedModifiedUrl": "https://signed.url/for/viewing/modified",
          "isDeleted": 0
        },
        {
          "id": 2,
          "uuid": "def456",
          "sanitizedFileName": "another_pic.jpg",
          "originalGcsObjectUrl": "https://storage.googleapis.com/bucket/o_def456_another_pic.jpg",
          "modifiedGcsObjectUrl": null,
          "signedOriginalUrl": "https://signed.url/for/viewing/original",
          "signedModifiedUrl": null,
          "isDeleted": 0
        },
        {
          "id": 3,
          "uuid": "ghi789",
          "sanitizedFileName": "deleted_pic.jpg",
          "originalGcsObjectUrl": "https://storage.googleapis.com/bucket/o_ghi789_deleted_pic.jpg",
          "modifiedGcsObjectUrl": null,
          "signedOriginalUrl": "https://signed.url/for/viewing/original",
          "signedModifiedUrl": null,
          "isDeleted": 1
        }
      ]
    }
    ```

## Data Flow
1. Fetch images from the server using signed URLs.
2. Display images to the user with local modifications.
3. Store all modifications (crop, rotate, delete) locally.
4. When "Create Your AI Model" is clicked, send all modifications to the server in a single request.
5. Server processes modifications and updates images in GCS.
6. When confirmation received, send request to `api/img-prep-pipeline`


## Error Handling
- Display error messages using toast notifications.
- Implement retry logic for failed API calls.

## Performance Considerations
- Use efficient image manipulation libraries for client-side previews.
- Implement lazy loading for images in the review grid.

## Cropping Implementation

The cropping functionality in the ReviewImages component is implemented using the `react-image-crop` library. Here's a detailed breakdown of the implementation:

1. **Crop State**:
   - `cropImageId`: Stores the ID of the image being cropped.
   - `activeCrop`: Stores the current crop state (of type `Crop` from react-image-crop).

2. **Cropping Interface**:
   - Displayed in a dialog using the `Dialog` component from shadcn/ui.
   - Uses the `ReactCrop` component from react-image-crop.

3. **ReactCrop Configuration**:
   ```typescript
   <ReactCrop
     crop={activeCrop}
     onChange={handleCropChange}
     onComplete={handleCropComplete}
   >
     <img src={imageUrl} alt={`Crop Photo ${cropImageId}`} />
   </ReactCrop>
   ```

4. **Crop Change Handling**:
   - `handleCropChange` function updates the `activeCrop` state as the user adjusts the crop area.
   ```typescript
   const handleCropChange = useCallback((crop: Crop, percentCrop: PercentCrop) => {
     setActiveCrop(crop);
   }, []);
   ```

5. **Crop Completion Handling**:
   - `handleCropComplete` function is called when the user finishes cropping.
   - It rounds the crop values to integers and updates the `images` state with the new crop information.
   ```typescript
   const handleCropComplete = useCallback((crop: Crop, percentCrop: PercentCrop) => {
     if (cropImageId !== null) {
       const validatedCrop: Crop = {
         x: Math.round(crop.x),
         y: Math.round(crop.y),
         width: Math.round(crop.width),
         height: Math.round(crop.height),
         unit: crop.unit,
       };

       setImages(prevImages => prevImages.map(img => 
         img.id === cropImageId
           ? { ...img, localModifications: { ...img.localModifications, crop: validatedCrop }, crop: validatedCrop }
           : img
       ));
     }
   }, [cropImageId]);
   ```

6. **Visual Application of Crop**:
   - The crop is applied visually to the image in the gallery using CSS transforms.
   ```typescript
   <img
     src={imageUrl}
     alt={`Photo ${image.id}`}
     style={{
       transform: `rotate(${rotation}deg) translate(-${cropX}px, -${cropY}px)`,
       width: `${imageWidth}px`,
       height: `${imageHeight}px`,
     }}
   />
   ```

7. **Crop Data Storage**:
   - Crop information is stored locally in the `images` state array.
   - Each image object in the array has a `localModifications` property that includes the crop data.
   - The crop data is only sent to the server when the user clicks "Create Your AI Model".

8. **Crop Reset**:
   - To reset the crop, implement a `handleCropReset` function:
   ```typescript
   const handleCropReset = useCallback((id: number) => {
     setImages(prevImages => prevImages.map(img => 
       img.id === id
         ? { ...img, localModifications: { ...img.localModifications, crop: null } }
         : img
     ));
     setActiveCrop(undefined);
   }, []);
   ```

This implementation allows for free-form cropping without aspect ratio restrictions, with all modifications stored locally until the user decides to create their AI model.