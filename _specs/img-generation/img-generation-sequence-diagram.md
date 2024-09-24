```mermaid
sequenceDiagram
    participant User
    participant UI as Image Generation UI
    participant GetLoras as /api/get-lora-models
    participant GenImage as /api/generate-image
    participant DB as SQLite Database
    participant GCS as Google Cloud Storage
    participant Fal as Fal.ai API

    User->>UI: Open Image Generation Page
    UI->>GetLoras: GET /api/get-lora-models
    GetLoras->>DB: Fetch LoRA models from loras table
    DB-->>GetLoras: Return LoRA models data
    GetLoras-->>UI: Display LoRA models

    User->>UI: Select LoRA model
    User->>UI: Input prompt and parameters
    User->>UI: Click "Generate Image"
    UI->>GenImage: POST /api/generate-image
    GenImage->>DB: Fetch LoRA details by ID
    DB-->>GenImage: Return LoRA details
    GenImage->>GCS: Generate signed URL for LoRA file
    GCS-->>GenImage: Return signed URL
    GenImage->>Fal: Send generation request (signed URL, prompt, parameters)
    Fal-->>GenImage: Return generated image URLs
    GenImage->>GCS: Download images from Fal.ai
    GenImage->>GCS: Upload images to GCS bucket
    GCS-->>GenImage: Return GCS image URLs
    GenImage->>DB: Save image metadata
    DB-->>GenImage: Confirm save
    GenImage-->>UI: Return image URLs and metadata
    UI->>User: Display generated images

    User->>UI: View image history
    UI->>DB: Fetch user's generated images
    DB-->>UI: Return image data
    UI->>User: Display image history
```