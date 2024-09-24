# LoRA Training Specification

## Overview
LoRA (Low-Rank Adaptation) training will occur on a dedicated page within the Costumes app. This process allows users to create custom AI models based on their uploaded and preprocessed images.

## User Interface
1. The page will display a list of available shoots with preprocessed images and captions.
2. Upon selecting a shoot, the interface will show:
   - Preprocessed images on the left side
   - The total number of images on the right side
3. A "Train LoRA" button will be prominently displayed

## Training Process
When the user clicks "Train LoRA":

1. Image and Caption Preparation:
   - Create a zip file containing:
     - Preprocessed image files
     - Corresponding caption files (`.txt` format with matching filenames)

2. API Request:
   - Send a request to the fal.ai API with the following parameters:
     - Zip file containing images and captions
     - User-defined 'trigger' word
     - Set 'is_input_format_already_preprocessed' to true

3. Training:
   - The fal.ai service will process the request and train the LoRA model

4. Response:
   - Receive a response from fal.ai containing a download link for the trained LoRA model

## Logging and Debugging
- Log the entire API response to the console for testing and debugging purposes

## API Reference
For detailed API information, refer to: https://fal.ai/models/fal-ai/flux-lora-fast-training/api

## Implementation Notes
- Ensure proper error handling for API requests and file operations
- Implement a loading state during the training process
- Consider adding a progress indicator if the API provides real-time training status
- Store the LoRA model download link securely for later use in image generation

## Future Enhancements
- Allow users to customize training parameters
- Implement a gallery view of generated images using the trained LoRA model
- Add options for fine-tuning or retraining existing LoRA models

