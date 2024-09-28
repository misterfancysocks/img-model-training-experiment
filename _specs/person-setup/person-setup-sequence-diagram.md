# Person Setup Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Client as Client (Browser)
    participant UploadAPI as /api/upload-user-images
    participant GCSUtil as GCS Utility
    participant DB as Database (SQLite)
    participant GCS as Google Cloud Storage

    User->>Client: Enters personal information
    User->>Client: Uploads photos
    Client->>Client: Validates form data
    Client->>Client: Converts photos to Base64
    Client->>UploadAPI: POST /api/upload-user-images
    Note over UploadAPI: route.ts: handlePOST
    UploadAPI->>DB: Create new person record
    DB-->>UploadAPI: Return personId
    loop For each image
        UploadAPI->>UploadAPI: Generate UUID for filename
        UploadAPI->>GCSUtil: Upload image (bucketName, o_{uuid}_{filename}, imageData)
        GCSUtil->>GCS: Store image in specified bucket
        GCS-->>GCSUtil: Confirm upload
        GCSUtil-->>UploadAPI: Return upload confirmation and URL
        UploadAPI->>DB: Store image metadata (originalUrl, bucket, fileName)
    end
    DB-->>UploadAPI: Confirm image metadata stored
    UploadAPI-->>Client: Return personId and uploaded image details
    Client->>Client: Store personId in localStorage
    Client->>Client: Redirect to review images page
    Client-->>User: Display success message
```

## Diagram Explanation

1. The user enters their personal information and uploads photos on the client-side.
2. The client validates the form data and converts the uploaded photos to Base64 format.
3. The client sends a POST request to `/api/upload-user-images` with the personal data and Base64 encoded images.
4. The `/api/upload-user-images` API (route.ts) handles the POST request:
   - It creates a new person record in the database and receives the `personId`.
   - For each uploaded image:
     - It generates a UUID for the filename.
     - It calls the GCS utility to upload the image, passing the bucket name, filename `o_{uuid}_{filename}`, and image data.
     - The GCS utility interacts with Google Cloud Storage to store the image in the specified bucket.
     - It stores the image metadata (including the `gcs_url`, `bucket`, and `fileName`) in the database.
5. The API returns the `personId` and details of the uploaded images to the client.
6. The client stores the `personId` in localStorage and redirects the user to the review images page.
7. The client displays a success message to the user.



