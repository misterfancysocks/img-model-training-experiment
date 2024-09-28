# Google Cloud Storage (GCS) Specification

## Overview
The GCS module handles interactions with Google Cloud Storage, including uploading files, generating signed URLs, and parsing storage paths or URLs.

## Functionality

### Uploading Files
- **Upload Process**:
  - Accepts file data and metadata.
  - Saves files to the specified GCS bucket.
  - Generates a consistent naming convention with prefixes (`o_` for originals, `c_` for cropped).

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
  - `bucketName: string` - Name of the GCS bucket.
  - `fileName: string` - Desired name for the file in GCS.
  - `fileBuffer: Buffer` - File data.
  - `contentType: string` - MIME type of the file.
- **Returns**: `Promise<void>`

### `generateSignedUrl`
- **Description**: Generates a signed URL for accessing a file.
- **Parameters**:
  - `fileIdentifier: string` - Either a full GCS URL or a `bucket/path` string.
  - `options?: { expiration?: number }` - Optional settings for the URL.
- **Returns**: `Promise<string>`

### `parseGcsPath`
- **Description**: Parses a GCS path or URL into bucket and file path.
- **Parameters**:
  - `input: string` - GCS URL or `bucket/path` string.
- **Returns**: `{ bucket: string; path: string }`

## Expected Inputs and Outputs

- **Inputs**:
  - File data for uploads.
  - GCS paths or URLs for generating signed URLs.

- **Outputs**:
  - Confirmation of successful uploads.
  - Signed URLs for secure file access.

## Dependencies

- **Libraries**:
  - `@google-cloud/storage` for interacting with GCS.
  - `dotenv` for environment variable management.

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