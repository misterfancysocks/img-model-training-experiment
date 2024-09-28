# Google Cloud Storage (GCS) Specification

## Overview
The GCS module handles interactions with Google Cloud Storage, including uploading files, generating signed URLs, and parsing storage paths or URLs.

## Functionality

### Uploading Files
- **Upload Process**:
  - Accepts file data, metadata, and full file name (including any prefixes).
  - Saves files to the specified GCS bucket.
  - Returns the full GCS URL of the uploaded file.

### Generating Signed URLs
- **Purpose**:
  - Provides secure, time-limited access to stored files for viewing or downloading.

- **Process**:
  - Accepts a file path or fully qualified URL.
  - Parses the input to extract bucket name and file path.
  - Generates a signed URL using GCS utilities.
  - Returns the signed URL to the requester.

### Parsing Storage Paths and URLs
- **Input Formats**:
  - Fully qualified GCS URLs (e.g., `https://storage.googleapis.com/bucket-name/path/to/file.jpg`)
  - Bucket and path combinations (e.g., `bucket-name/path/to/file.jpg`)

- **Parsing Logic**:
  - Detects the format of the input.
  - Extracts the bucket name and file path accordingly.
  - Validates the extracted components.

## API Methods

### `uploadFile`
- **Description**: Uploads a file to GCS.
- **Parameters**:
  - `bucket: Bucket` - The GCS bucket instance.
  - `fileName: string` - Full name for the file in GCS (including any prefixes).
  - `fileBuffer: Buffer` - File data.
  - `contentType: string` - MIME type of the file.
- **Returns**: `Promise<string>` - The full GCS URL of the uploaded file.

### `generateSignedUrl`
- **Description**: Generates a signed URL for accessing a file.
- **Parameters**:
  - `bucket: Bucket` - The GCS bucket instance.
  - `fileName: string` - The name of the file in the bucket.
  - `action: 'read' | 'write'` - The action for the signed URL.
  - `expiresInMs: number` - Time in milliseconds until the signed URL expires.
- **Returns**: `Promise<string>` - The generated signed URL.

### `parseGcsPath`
- **Description**: Parses a GCS path or URL into bucket and file path.
- **Parameters**:
  - `urlOrPath: string` - GCS URL or `bucket/path` string.
- **Returns**: `{ bucketName: string; fileName: string }`

## Expected Inputs and Outputs

- **Inputs**:
  - File data for uploads.
  - GCS paths or URLs for generating signed URLs.

- **Outputs**:
  - Confirmation of successful uploads with full GCS URLs.
  - Signed URLs for secure file access.

## Dependencies

- **Libraries**:
  - `@google-cloud/storage` for interacting with GCS.
  - Environment variables for GCS configuration.

## Error Handling

- **Upload Errors**:
  - Handle network issues or permission errors during file uploads.
  - Validate file types and sizes before uploading.

- **Signed URL Errors**:
  - Ensure input paths or URLs are valid.
  - Handle scenarios where the file does not exist.

## Security Considerations

- **Access Control**:
  - Restrict permissions for uploading and accessing files.
  - Ensure signed URLs have appropriate expiration times.

- **Input Validation**:
  - Sanitize and validate all inputs to prevent injection attacks.
  - Limit the types and sizes of files that can be uploaded.

---