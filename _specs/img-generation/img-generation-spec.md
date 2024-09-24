# Image Generation System Overview with fal.ai API Integration

Locations:
- GCP_LORA_TRAINING_ZIP_BUCKET_NAME=halloween-costume-loras-training-zip
- GCP_USER_IMG_UPLOAD_BUCKET_NAME=halloween-costume-images
- GCP_USER_IMG_GENERATED_BUCKET_NAME=halloween-costume-generated-images


## Overview

This document outlines the design and implementation plan for an image generation system using the fal.ai `flux-lora` model. The system generates images based on user inputs and LoRA models stored in a Google Cloud Platform (GCP) bucket. The LoRA models will be accessed via **signed URLs**, ensuring secure and temporary access for the fal.ai API.

## Inputs

- **Prompt** *(to be developed, currently not implemented)*:
  - **Trigger Word** (used in place of the person's name)
  - **Age**
  - **Gender**
  - **Costume**
  - **Type of Shot**
  - **Background**

- **LoRA URL**:
  - Located in a GCP bucket named `halloween-costume-loras`
  - Each LoRA file is stored in a folder named after the `personid`
  - **Accessed via a signed URL**

- **Data from Database**:
  - **Existing LoRA Models**:
    - Retrieved from the `loras` table in the database
    - Select the most recent LoRA model based on `personid`

## Outputs

- **Generated Images**:
  - Quantity: **4 images** per call
  - Resolution: **768x1024 pixels**

## Process Overview

1. **Prompt Construction**:
   - Assemble the prompt using the provided inputs:
     - Trigger word
     - Age
     - Gender
     - Costume
     - Type of shot
     - Background
   - Example Prompt:
     ```
     A [type of shot] of a [age]-year-old [gender] dressed as a [costume] with a [background] background, [trigger word].
     ```

2. **LoRA Model Retrieval**:
   - Fetch the most recent LoRA model associated with the `personid` from the database.
   - The LoRA file is stored in the GCP bucket `halloween-costume-loras` under the folder named after the `personid`.

3. **LoRA File Accessibility via Signed URL**:
   - Generate a **signed URL** for the LoRA file in the GCP bucket.
     - The signed URL provides temporary, secure access to the file.
     - It expires after a specified duration, enhancing security.
   - Use the signed URL as the `path` in the `loras` parameter when making the API call to fal.ai.

4. **Image Generation Using fal.ai API**:
   - Utilize the `fal-ai/flux-lora` model for image generation.
   - Install the fal.ai client:
     ```bash
     npm install --save @fal-ai/serverless-client
     ```
   - Set up your API key as an environment variable:
     ```bash
     export FAL_KEY="YOUR_API_KEY"
     ```
   - Authenticate using the API key in your application code.

5. **API Request Parameters**:
   - **Input Schema**:
     - `prompt`: The constructed prompt.
     - `image_size`: Set to match 768x1024 resolution.
       - Since `768x1024` is a portrait orientation, choose `portrait_4_3` or specify custom dimensions if supported.
     - `num_inference_steps`: Default is 28 (adjust as needed).
     - `guidance_scale`: Default is 3.5 (adjust as needed).
     - `num_images`: Set to **4**.
     - `loras`: Include the LoRA model **signed URL** and weight.
       ```json
       "loras": [
         {
           "path": "SIGNED_URL_TO_LORA_FILE",
           "scale": 1.0
         }
       ]
       ```
     - `output_format`: Set to `"jpeg"` or `"png"` as required.

6. **Making the API Call**:
   - Use the fal.ai client to submit the image generation request:
     ```javascript
     import * as fal from "@fal-ai/serverless-client";

     const result = await fal.subscribe("fal-ai/flux-lora", {
       input: {
         prompt: "Your constructed prompt here",
         image_size: "portrait_4_3",
         num_inference_steps: 28,
         guidance_scale: 3.5,
         num_images: 4,
         loras: [
           {
             path: "SIGNED_URL_TO_LORA_FILE",
             scale: 1.0
           }
         ],
         output_format: "jpeg"
       },
       logs: true,
       onQueueUpdate: (update) => {
         if (update.status === "IN_PROGRESS") {
           update.logs.map((log) => log.message).forEach(console.log);
         }
       },
     });
     ```
   - Handle the response to retrieve the generated images.

7. **Response Handling**:
   - The API returns an object containing the generated images and other metadata.
   - Extract the image URLs and ensure they meet the required specifications.

## Testing Approach

- **Manual Prompt Creation**:
  - Craft sample prompts incorporating all necessary elements.

- **Endpoint Development**:
  - Create an API endpoint that accepts the prompt parameters and `personid`.
  - Implement logic to retrieve the LoRA model, generate a signed URL, and interact with the fal.ai API.

- **Test Execution**:
  - Verify that the system generates 4 images of size 768x1024 pixels.
  - Check that the images align with the input parameters and prompt.

---

# Missing Components and Considerations

1. **Prompt Implementation**:
   - **Action Required**: Develop a dynamic method to construct prompts based on input parameters.
   - **Consideration**: Ensure the prompt effectively guides the image generation to produce desired results.

2. **LoRA File Accessibility via Signed URLs**:
   - **Action Required**:
     - Implement functionality to generate signed URLs for LoRA files stored in the GCP bucket.
     - Ensure that the signed URLs have an appropriate expiration time.
   - **Consideration**:
     - Signed URLs provide secure, temporary access without making the files publicly accessible.
     - Handle URL expiration appropriately to prevent access issues during the API call.

3. **API Key Management**:
   - **Action Required**: Securely store and manage the `FAL_KEY`.
   - **Consideration**: Do not expose the API key in client-side code; use server-side storage and retrieval.

4. **Error Handling and Validation**:
   - **Action Required**: Implement robust error handling for API requests and responses.
   - **Consideration**: Handle cases where the signed URL has expired or is invalid.

5. **Input Validation**:
   - **Action Required**: Validate all input parameters before constructing the prompt and making API calls.
   - **Consideration**: Ensure that inputs like `age`, `gender`, and `costume` are within acceptable ranges and formats.

6. **Security Measures**:
   - **Action Required**: Protect sensitive data, including user information and LoRA files.
   - **Consideration**: Use authentication and authorization mechanisms for API endpoints.

7. **Scalability and Performance**:
   - **Action Required**: Optimize the system to handle multiple simultaneous requests.
   - **Consideration**: Implement asynchronous processing and consider rate limiting.

8. **Logging and Monitoring**:
   - **Action Required**: Implement logging for API requests, responses, and system events.
   - **Consideration**: Use logs to monitor performance and troubleshoot issues.

9. **Testing**:
   - **Action Required**: Develop comprehensive test cases covering various scenarios.
   - **Consideration**: Include tests for signed URL generation and expiration handling.

10. **Documentation**:
    - **Action Required**: Document the API endpoints, input parameters, and expected outputs.
    - **Consideration**: Provide clear instructions for setting up and using the system.

11. **Deployment Strategy**:
    - **Action Required**: Plan for deployment, including environment setup and dependency management.
    - **Consideration**: Use environment variables for configuration and ensure all dependencies are installed.

12. **Compliance and Legal Considerations**:
    - **Action Required**: Ensure compliance with fal.ai's terms of service and any relevant data protection regulations.
    - **Consideration**: Address privacy concerns, especially when handling personal data.

13. **Performance Optimization**:
    - **Action Required**: Monitor and optimize the performance of image generation.
    - **Consideration**: Adjust API parameters like `num_inference_steps` and `guidance_scale` for optimal results.

14. **Fallback Mechanisms**:
    - **Action Required**: Define fallback options if image generation fails.
    - **Consideration**: Provide meaningful error messages or alternative solutions to the user.

15. **Version Control and CI/CD**:
    - **Action Required**: Implement version control using Git or similar tools.
    - **Consideration**: Set up continuous integration and deployment pipelines for automated testing and deployment.

16. **User Interface (Optional)**:
    - **Action Required**: If applicable, develop a user interface for input collection and image display.
    - **Consideration**: Ensure the UI is intuitive and responsive.

17. **Security Auditing**:
    - **Action Required**: Conduct security audits to identify potential vulnerabilities.
    - **Consideration**: Regularly update dependencies and monitor for security advisories.

18. **Data Backup and Recovery**:
    - **Action Required**: Implement data backup procedures for the database and GCP storage.
    - **Consideration**: Plan for disaster recovery scenarios.

19. **Compliance with fal.ai API Usage Limits**:
    - **Action Required**: Be aware of any rate limits or usage restrictions imposed by fal.ai.
    - **Consideration**: Implement rate limiting or queuing mechanisms as needed.

20. **Future Scalability**:
    - **Action Required**: Design the system with scalability in mind for future growth.
    - **Consideration**: Use cloud services and scalable architectures.

---

# Implementation Plan with fal.ai API Integration

## Step 1: Environment Setup

- **Install fal.ai Client**:
  ```bash
  npm install --save @fal-ai/serverless-client
  ```
- **Set Up API Key**:
  - Obtain your `FAL_KEY` from fal.ai.
  - Set it as an environment variable in your server environment.
    ```bash
    export FAL_KEY="YOUR_API_KEY"
    ```
- **Install Other Dependencies**:
  - Install any other required packages (e.g., Express for API endpoints, GCP SDK for signed URLs).

## Step 2: Database Integration

- **Retrieve LoRA Models**:
  - Connect to the database and access the `loras` table.
  - Implement a function to fetch the most recent LoRA model for a given `personid`.

## Step 3: GCP Bucket Access and Signed URL Generation

- **Set Up GCP Credentials**:
  - Ensure your application has the necessary permissions to access the GCP bucket and generate signed URLs.
  - Use a service account with appropriate permissions.

- **Implement Signed URL Generation**:
  - Use the Google Cloud Storage client library to generate signed URLs for LoRA files.
    ```javascript
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();

    function generateSignedUrl(bucketName, fileName) {
      const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      };

      const [url] = await storage
        .bucket(bucketName)
        .file(fileName)
        .getSignedUrl(options);

      return url;
    }
    ```
  - **Consideration**:
    - Set an expiration time that is sufficient for the fal.ai API to access the file but short enough to minimize security risks.

## Step 4: Prompt Construction

- **Develop Prompt Template**:
  - Create a function to assemble the prompt using input parameters.
    ```javascript
    function constructPrompt({ triggerWord, age, gender, costume, shotType, background }) {
      return `${shotType} of a ${age}-year-old ${gender} dressed as ${costume} with a ${background} background, ${triggerWord}`;
    }
    ```
- **Handle Special Cases**:
  - Ensure that optional parameters are handled gracefully.

## Step 5: API Endpoint Development

- **Create an API Endpoint**:
  - Use Express or another framework to create an endpoint that accepts input parameters.
    ```javascript
    app.post('/generate-images', async (req, res) => {
      const { personid, age, gender, costume, shotType, background } = req.body;

      // Implement the logic here
    });
    ```
- **Endpoint Logic**:
  - **Retrieve the LoRA Model**:
    - Fetch the most recent LoRA model for the given `personid`.
  - **Generate Signed URL**:
    - Use the LoRA file's path to generate a signed URL.
  - **Construct the Prompt**:
    - Use the input parameters to construct the prompt.
  - **Call the fal.ai API**:
    - Make the API call using the signed URL and constructed prompt.
  - **Handle the Response**:
    - Return the generated images or an appropriate error message.

## Step 6: fal.ai API Integration

- **Configure fal.ai Client**:
  - Import and configure the fal.ai client in your application code.
- **Make the API Call**:
  - Use the `subscribe` method to make synchronous API calls.
    ```javascript
    const result = await fal.subscribe('fal-ai/flux-lora', {
      input: {
        prompt: constructedPrompt,
        image_size: 'portrait_4_3',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 4,
        loras: [
          {
            path: signedUrl,
            scale: 1.0,
          },
        ],
        output_format: 'jpeg',
      },
    });
    ```
- **Error Handling**:
  - Implement try-catch blocks to handle exceptions.
  - Check for errors in the API response.

## Step 7: Testing

- **Unit Tests**:
  - Write tests for each function (e.g., prompt construction, LoRA retrieval, signed URL generation).
- **Integration Tests**:
  - Test the entire flow from input to image generation.
  - Use mock data for testing.
- **Expiration Handling**:
  - Test the behavior when the signed URL expires to ensure proper error handling.
- **Performance Tests**:
  - Measure the time taken for API calls and image generation.

## Step 8: Deployment

- **Environment Configuration**:
  - Set up environment variables on the server (e.g., `FAL_KEY`, GCP credentials).
  - Ensure all dependencies are installed.
- **Deployment Pipeline**:
  - Use CI/CD tools to automate deployment.
  - Test in a staging environment before production.

## Step 9: Monitoring and Maintenance

- **Logging**:
  - Implement logging for requests, responses, errors, and signed URL generation.
  - Store logs securely.
- **Monitoring**:
  - Use monitoring tools to track system performance.
- **Updates**:
  - Keep dependencies up to date.
  - Monitor fal.ai for any API changes.

## Step 10: Security and Compliance

- **Security Audits**:
  - Regularly review code and dependencies for security vulnerabilities.
- **Data Protection**:
  - Ensure that any personal data is handled in compliance with relevant regulations.
- **API Key Protection**:
  - Securely manage API keys and GCP credentials.

---

By incorporating the use of **signed URLs** for LoRA file access, we enhance the security of the system while maintaining the necessary functionality. This approach allows us to provide temporary, secure access to the LoRA files required by the fal.ai API without exposing the files publicly.

By following this implementation plan and addressing the considerations listed, the image generation system will be well-prepared for development, testing, and deployment, ensuring a robust, secure, and efficient solution.