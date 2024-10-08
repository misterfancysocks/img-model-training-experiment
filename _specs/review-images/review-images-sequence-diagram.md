# Review Images Sequence Diagram

```mermaid
sequenceDiagram
    participant Client as Client (Browser)
    participant ReviewImages as ReviewImages Component
    participant GetImagesAPI as /api/get-user-images
    participant UpdateImagesAPI as /api/upload-user-images
    participant GCSUtil as GCS Utility
    participant DB as Database (SQLite)
    participant GCS as Google Cloud Storage

    Client->>ReviewImages: Initialize component
    ReviewImages->>GetImagesAPI: GET /api/get-user-images?personId={personId}
    GetImagesAPI->>DB: Fetch images for personId
    DB-->>GetImagesAPI: Return image data (id, uuid, fileName, originalUrl, modifiedUrl)
    GetImagesAPI->>GCSUtil: Generate signed URLs for images
    GCSUtil->>GCS: Request signed URLs (originalUrl, modifiedUrl)
    GCS-->>GCSUtil: Return signed URLs
    GCSUtil-->>GetImagesAPI: Return signed URLs
    GetImagesAPI-->>ReviewImages: Return image data with signed URLs
    ReviewImages-->>Client: Display images for review

    alt Rotate image
        Client->>ReviewImages: Click rotate button (imageId)
        ReviewImages->>ReviewImages: Update local rotation state (imageId, newRotation)
        ReviewImages-->>Client: Display rotated image preview
    end

    alt Crop image
        Client->>ReviewImages: Click crop button (imageId)
        ReviewImages-->>Client: Open crop dialog
        Client->>ReviewImages: Adjust crop area
        Client->>ReviewImages: Confirm crop
        ReviewImages->>ReviewImages: Update local crop state (imageId, cropData)
        ReviewImages-->>Client: Display cropped image preview
    end

    alt Delete image
        Client->>ReviewImages: Click delete button (imageId)
        ReviewImages->>ReviewImages: Mark image as deleted locally (imageId)
        ReviewImages-->>Client: Remove image from display
    end

    Client->>ReviewImages: Click "Create Your AI Model"
    ReviewImages->>UpdateImagesAPI: POST /api/upload-user-images (personId, modifiedImages)
    Note right of ReviewImages: modifiedImages: [{id, rotation, crop, deleted}]
    loop For each modified image
        UpdateImagesAPI->>GCSUtil: Process image changes (crop, rotate)
        GCSUtil->>GCS: Update images in storage (imageId, newImageData)
        GCS-->>GCSUtil: Confirm updates
        GCSUtil->>GCS: Generate new signed URL
        GCS-->>GCSUtil: Return new signed URL
        GCSUtil-->>UpdateImagesAPI: Return updated image data (newUrls, signedUrls)
    end
    UpdateImagesAPI->>DB: Update image metadata (URLs, deletions)
    DB-->>UpdateImagesAPI: Confirm database updates
    UpdateImagesAPI-->>ReviewImages: Return updated image data (id, newUrls, signedUrls, deletedIds)
    ReviewImages->>Client: Navigate to AI model generation page
```

## Notes on Implementation

1. **Local State Management**: The `ReviewImages` component manages local state for rotations, crops, and deletions. This state includes:
   - `imageId`
   - `rotation` (degrees)
   - `crop` (x, y, width, height)
   - `deleted` (boolean)

2. **Image Display**: The component applies local rotations and crops when displaying images to the user.

3. **Revert Changes**: Consider adding functionality to revert local changes before final submission.

4. **Batch Update API**: The `/api/upload-user-images` endpoint handles batch updates of image modifications. The payload includes:
   - `personId`
   - Array of modified images with their `id`, `rotation`, `crop`, and `deleted` status

5. **Error Handling**: Implement comprehensive error handling for the batch update process, including GCS operations and database updates.

6. **Performance**: Consider optimizing the batch update process for large numbers of images, possibly using parallel processing or chunked updates.

7. **User Feedback**: Provide clear feedback to the user during the update process and navigation to the AI model generation page.

8. **Signed URLs**: The system now generates and uses signed URLs for both original and modified images, enhancing security and access control.

These updated diagrams now accurately reflect the changes we've made, including the use of signed URLs and the handling of image modifications and deletions in the review process.