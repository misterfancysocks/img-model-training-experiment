# Upload User Images API Specification

## Overview
This API endpoint handles the upload of user images during the person setup process and the updating of images during the review process. It creates a new person record, associates uploaded images with that person, and allows for modifications to existing images.

## Endpoint
`POST /api/upload-user-images`

## Request Payload

### Initial Upload (Person Setup)
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
      "fileName": "profile_pic.jpg",
      "base64imgdata": "data:image/jpeg;base64,..."
    },
    // ... more images
  ]
}
```

### Image Update (Review Images)
```json
{
  "personId": 1,
  "images": [
    {
      "id": 1,
      "uuid": "abc123",
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
      "uuid": "def456",
      "deleted": true
    }
  ]
}
```

## Response

### Initial Upload
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
    // ... more images
  ]
}
```

### Image Update
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
      "signedModifiedUrl": "https://signed.url/for/viewing/modified"
    }
  ],
  "deletedImageIds": [2]
}
```

## Process Flow

### Initial Upload (Person Setup)
1. Validate the incoming payload.
2. Start a database transaction.
3. Insert the person data into the `persons` table.
4. For each image:
   - Generate a UUID.
   - Sanitize the file name.
   - Create the original file name with the format: `o_{uuid}_{sanitizedFileName}`.
   - Upload the original image to Google Cloud Storage.
   - Insert image metadata into the `images` table.
5. Commit the transaction.
6. Return the response with the new person ID and uploaded image details.

### Image Update (Review Images)
1. Validate the incoming payload.
2. Start a database transaction.
3. For each image in the payload:
   - If rotation or crop is specified:
     - Apply the rotation and/or crop to the image.
     - Generate a new file name with the format: `m_{uuid}_{sanitizedFileName}`.
     - Upload the modified image to Google Cloud Storage.
     - Update the `images` table with the new `modifiedGcsObjectUrl`.
   - If deleted is true:
     - Mark the image as deleted in the `images` table.
4. Commit the transaction.
5. Generate signed URLs for all updated images.
6. Return the response with updated image details and deleted image IDs.

## Database Schema
```sql
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personId INTEGER NOT NULL,
  uuid TEXT NOT NULL,
  sanitizedFileName TEXT NOT NULL,
  bucket TEXT NOT NULL,
  originalGcsObjectUrl TEXT NOT NULL,
  modifiedGcsObjectUrl TEXT,
  isDeleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE
);
```

## Important Notes
- Always use signed URLs for viewing images.
- Use `generateSignedUrl()` to create signed URLs for uploaded images.
- The `modifiedGcsObjectUrl` will initially be NULL for new uploads.
- The original is never modified. All modifications are done using the `modifiedGcsObjectUrl`.
- The `isDeleted` flag is used to mark images as deleted without physically removing them.

## Error Handling
- If any part of the process fails, the entire transaction should be rolled back.
- Proper error messages should be returned to the client.

## Security Considerations
- Validate and sanitize all input data.
- Ensure that the user has the necessary permissions to create a person and upload images.
- Use secure methods for handling and storing sensitive information.

## Performance Considerations
- Consider implementing batch uploads for multiple images to improve performance.
- Use efficient methods for Base64 decoding and file uploads.

## Dependencies
- Google Cloud Storage for image storage
- SQLite database for storing metadata
- UUID generation library
- File name sanitization library
