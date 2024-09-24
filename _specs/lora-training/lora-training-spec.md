# LoRA Training Specification

## Overview
The LoRA (Low-Rank Adaptation) training process is a crucial component of the Costumes app, allowing users to create custom AI models based on their uploaded and preprocessed images. This specification outlines the functionality, user interactions, and data flow of the LoRA training process.

## Functionality Design

### 1. Shoot Selection
- Users can view a list of available shoots with preprocessed images.
- Each shoot displays the costume name and the number of preprocessed images.
- Users select a shoot to initiate the LoRA training process.

### 2. LoRA Training Initiation
- A "Train LoRA" button is provided for the selected shoot.
- Clicking this button triggers the LoRA training process.

### 3. Image and Caption Preparation
- The system creates a ZIP file containing:
  - Preprocessed image files
  - Corresponding caption files (in .txt format)

### 4. Google Cloud Storage (GCS) Integration
- The ZIP file is uploaded to a GCS bucket.
- A signed URL is generated for the uploaded ZIP file.

### 5. Fal.ai API Integration
- The system sends a request to the Fal.ai API with:
  - The signed URL of the ZIP file
  - The user-defined 'trigger' word
  - A flag indicating that the input is already preprocessed

### 6. LoRA Model Training
- Fal.ai processes the request and trains the LoRA model.
- The system monitors the training progress and logs updates.

### 7. Model File Handling
- Upon completion, Fal.ai provides URLs for:
  - The trained LoRA model file (safetensors format)
  - A configuration file (JSON format)
- These files are downloaded and then uploaded to a designated GCS bucket.

### 8. Database Update
- The system saves the LoRA model information to the database, including:
  - Person ID
  - GCS URL of the LoRA model file
  - Training timestamp
  - Service used (Fal.ai)
  - Model name and version

### 9. Cleanup
- Temporary files (e.g., the ZIP file) are deleted after successful processing.

## User Interactions
1. User selects a shoot from the available list.
2. User reviews the shoot details (costume name, image count).
3. User initiates LoRA training by clicking the "Train LoRA" button.
4. User waits for the training process to complete (progress updates are displayed).
5. User receives confirmation of successful training or error messages if issues occur.

## Error Handling
- The system provides error messages for various scenarios:
  - No preprocessed images found for the selected shoot
  - Failures in ZIP file creation, GCS upload, or Fal.ai API communication
  - Database update errors

## Data Flow
1. Preprocessed images and captions → ZIP file
2. ZIP file → Google Cloud Storage
3. GCS signed URL → Fal.ai API
4. Fal.ai API → Trained model files
5. Trained model files → Google Cloud Storage
6. Model metadata → Database

## Future Enhancements
- Allow users to customize training parameters
- Implement a gallery view of generated images using the trained LoRA model
- Add options for fine-tuning or retraining existing LoRA models

