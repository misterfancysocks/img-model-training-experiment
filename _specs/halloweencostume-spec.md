# Application Overview

## Purpose

- The Halloween Costume application allows users to generate images of themselves or their children in various Halloween costumes using AI technology.

## Service Provided to Users

- **Personalized Profiles**: Users create profiles for each person they want to generate costumes for, providing details like name, birthdate, gender, ethnicity, and costume interests.
- **Image Upload and Processing**: During profile creation, users are required to upload photos, which are processed using AI to remove backgrounds and generate captions.
- **Review Uploaded Photos**: Users have the option to review and manage their uploaded photos before proceeding.
- **AI-Generated Costumes**: The application generates images of the users in Halloween costumes based on their inputs.
- **Dynamic Costume Generation**: Users can input new costume ideas at any time and generate additional images on-the-fly.
- **Image Carousel Interface**: A user-friendly interface where users can view and download their generated images individually.

## Monetization

- **Credit-Based System**: The application uses a credit system where users purchase credits to generate images.
- **Pricing Packages**: Various packages are available on the Pricing page, offering different amounts of credits at different price points.
- **Payment Processing**: All payments are securely processed through Stripe.
- **Credit Consumption**: Credits are deducted from the user’s account when new images are generated.

---

# Process Flow

## General Process Flow for Users

### Common Components

#### Header/Navigation

- [ ] A consistent header/navigation bar present on all pages
  - [ ] Includes logo and branding
  - [ ] Provides navigation links to key pages:
    - [ ] Home
    - [ ] Pricing
    - [ ] How it Works
    - [ ] Dashboard (when logged in)
  - [ ] Displays user account menu when logged in:
    - [ ] Account Settings
    - [ ] Logout

#### Footer

- [ ] A consistent footer present on all pages
  - [ ] Contains links to:
    - [ ] Terms and Conditions
    - [ ] Privacy Policy
    - [ ] Contact Information
    - [ ] FAQ
  - [ ] Includes company information and copyright notice

## Pages [pages]

### Landing Page

- [x] `page.tsx` (landing page)
  - [x] Display main features
  - [x] Include "Try it Now" button
  - [x] Provide navigation to other pages

### Pricing

- [ ] `pricing/page.tsx`
  - [ ] Display available packages
  - [ ] Show credit amounts and prices
  - [ ] Include "Try it Now" button
  - [ ] Highlight any promotions or discounts

### How it Works

- [ ] `how-it-works/page.tsx`
  - [ ] Explain the costume generation process step-by-step
  - [ ] Showcase example transformations
  - [ ] Include testimonials or user reviews

### Authentication

- [ ] Use **Clerk** for authentication
  - [ ] Implement sign-up functionality
  - [ ] Implement sign-in functionality
  - [ ] Enable password reset
  - [ ] Support social logins (optional)

### Dashboard

- [ ] `dashboard/page.tsx`
  - [ ] Display user's current credits
  - [ ] Show recent activities
  - [ ] Provide quick links to common actions (e.g., "Create New Profile")
  - [ ] List profiles and generated images

### Person Profiles

- [ ] `profiles/page.tsx`
  - [ ] Display list of person profiles
  - [ ] Allow users to create new person profiles
  - [ ] Edit or delete existing profiles

### KYC and Payment

- [ ] `payment/page.tsx`
  - [ ] Integrate **Stripe** for payments
  - [ ] Collect necessary customer information
  - [ ] Display package options
  - [ ] Process payment and update credits
  - [ ] Provide receipt and confirmation

### Profile Setup with Photo Upload

- [ ] `profiles/new/page.tsx`
  - [ ] Allow users to create a new person profile
  - [ ] Require users to upload photos during profile creation
    - [ ] Implement image upload functionality
    - [ ] Provide guidelines for optimal images
  - [ ] Enter subject information:
    - [ ] Name
    - [ ] Birthdate
    - [ ] Gender
    - [ ] Ethnicity
    - [ ] Costumes of interest
  - [ ] Provide option to 'Review Uploaded Photos' after upload

### Review Uploaded Photos

- [ ] `profiles/review-photos/page.tsx`
  - [ ] Display uploaded photos
  - [ ] Allow users to crop and rotate images
  - [ ] Allow users to remove or replace photos
  - [ ] Confirm selection of images for processing
  - [ ] Submit images for model generation

### Image Carousel and Costume Input

- [ ] `image-carousel/page.tsx`
  - [ ] Display generated images in a grid or carousel
  - [ ] Provide a text input field for users to enter new costume ideas
  - [ ] Include a button to generate new costumes
  - [ ] Update images in real-time as new costumes are generated
  - [ ] Allow users to download images individually

### Notifications

- [ ] `notifications/page.tsx`
  - [ ] Display in-app notifications
  - [ ] Show history of notifications
  - [ ] Allow users to mark notifications as read

### Account Settings

- [ ] `settings/page.tsx`
  - [ ] Edit profile information
  - [ ] Change password
  - [ ] Manage notification preferences
  - [ ] View purchase history
  - [ ] Delete account

### FAQ and Support

- [ ] `faq/page.tsx`
  - [ ] Provide answers to frequently asked questions

- [ ] `support/page.tsx`
  - [ ] Allow users to contact support
  - [ ] Include support ticket submission and tracking

### Terms and Privacy

- [ ] `terms/page.tsx`
  - [ ] Display terms and conditions

- [ ] `privacy/page.tsx`
  - [ ] Display privacy policy

### Error Pages

- [ ] `404/page.tsx`
  - [ ] Custom 404 error page with navigation options

- [ ] `500/page.tsx`
  - [ ] Custom 500 error page with support contact

## User Flow

### New Users

1. [ ] **User lands on the homepage**
   - [ ] User explores features and benefits
2. [ ] **User selects "Try it Now" from the landing page**
   - [ ] If user is not signed in, they are redirected to the sign-up page
3. [ ] **User is shown the "How it Works & Pricing" page**
   - [ ] User reviews the process and available packages
4. [ ] **User signs up or logs in (using Clerk)**
   - [ ] User provides necessary authentication details
5. [ ] **User is directed to the payment page**
   - [ ] User selects a package
   - [ ] User provides payment information
   - [ ] User accepts terms and conditions
6. [ ] **Once payment is processed, credits are added to the user's account**
   - [ ] User receives a payment confirmation email
7. [ ] **User is directed to the dashboard**
   - [ ] Overview of account and credits
   - [ ] Quick access to create a new profile
8. [ ] **User navigates to "Person Profiles" to create a new profile**
   - [ ] User is required to upload photos during profile creation
     - [ ] User uploads photos
     - [ ] Guidelines for optimal images are provided
   - [ ] User enters subject information:
     - [ ] Name
     - [ ] Birthdate
     - [ ] Gender
     - [ ] Ethnicity
     - [ ] Costumes of interest
9. [ ] **User proceeds to 'Review Uploaded Photos'**
   - [ ] User is directed to the review photos page
   - [ ] User crops and rotates images
   - [ ] User removes or replaces any undesired photos
   - [ ] User confirms selection of images for processing
10. [ ] **User confirms submission**
    - [ ] System validates inputs and images
11. [ ] **System processes images in the background**
    - [ ] Background removal using Fal.ai API
    - [ ] Image captioning using Anthropic Claude LLM
12. [ ] **User receives an email notification when the initial images are ready**
    - [ ] Email contains a link to the image carousel page
13. [ ] **User clicks the link and is directed to the image carousel page**
    - [ ] Displays generated images in a grid or carousel
    - [ ] Provides a text input field for entering new costume ideas
    - [ ] Includes a button to generate new costumes
14. [ ] **User enters new costume ideas and generates more images**
    - [ ] User inputs costume ideas in the text field
    - [ ] Clicks the button to generate new costumes
    - [ ] New images are generated and displayed in real-time
15. [ ] **User views and manages images in the image carousel**
    - [ ] Downloads images individually
16. [ ] **User's credits are updated based on usage**
    - [ ] User can purchase additional credits if needed

### Existing Users

1. [ ] **User logs in to their account**
2. [ ] **User is directed to the dashboard**
   - [ ] Sees current credits and recent activities
3. [ ] **User navigates to "Person Profiles"**
   - [ ] Selects an existing profile or creates a new one
4. [ ] **If creating a new profile, user goes through profile setup and uploads photos**
   - [ ] Photo upload is required during profile creation
5. [ ] **User proceeds to 'Review Uploaded Photos'**
   - [ ] User reviews and manages their uploaded photos
6. [ ] **System processes any new images in the background**
7. [ ] **User receives an email notification when initial images are ready**
   - [ ] Email contains a link to the image carousel page
8. [ ] **User accesses the image carousel page**
   - [ ] Views generated images
   - [ ] Enters new costume ideas
9. [ ] **System generates new images based on user input**
   - [ ] New images appear in the carousel/grid
10. [ ] **User manages images in the image carousel**
    - [ ] Downloads images individually
11. [ ] **User's credits are updated based on new activity**

## Technical Process Flow

1. **User Data Collection**

   - [ ] Collect subject information and photos during profile creation:
     - [ ] Name, birthdate, gender, ethnicity
     - [ ] Initial costume interests
     - [ ] Uploaded photos
   - [ ] User proceeds to review and manage uploaded photos

2. **Photo Review and Selection**

   - [ ] Users can crop, rotate, and manage their uploaded photos
   - [ ] Users confirm the selection of images for processing

3. **Pre-processing**

   - [ ] Background removal using Fal.ai API
   - [ ] Image captioning using Anthropic Claude LLM

4. **Model Training**

   - [ ] Generate LoRA in Flux with processed images and captions
   - [ ] Store trained model associated with the user

5. **Initial Image Generation**

   - [ ] Generate initial images using the trained model
   - [ ] Store generated images

6. **Email Notification**

   - [ ] Send email to user with link to the image carousel page

7. **Dynamic Image Generation**

   - [ ] Accept new costume inputs from the user on the image carousel page
   - [ ] Generate additional images on-the-fly as the user inputs new ideas
   - [ ] Update the carousel/grid with new images in real-time

8. **Delivery and User Interaction**

   - [ ] Allow individual downloads of images
   - [ ] Update credits based on usage

## Components and Tech Stack

### Frontend

- **Frameworks and Libraries**
  - [ ] **Next.js 14**: React framework for building the web application
  - [ ] **TypeScript**: For static type checking
  - [ ] **Tailwind CSS**: Utility-first CSS framework for styling
  - [ ] **shadcn/ui components**: Pre-built components for consistent UI
  - [ ] **Framer Motion**: For animations and transitions
  - [ ] **Clerk**: Authentication and user management
  - [ ] **Stripe**: Payment processing

- **UI/UX**
  - [ ] Responsive design for various screen sizes
  - [ ] Consistent styling using Tailwind CSS and shadcn/ui components
  - [ ] Smooth animations with Framer Motion

### Backend

- **Server-Side**
  - [ ] **Next.js API Routes**: For server-side functionality and API endpoints
  - [ ] **TypeScript**: For type safety in backend code

- **Database**
  - [ ] **Supabase**: PostgreSQL database and real-time data synchronization
    - [ ] User data management
    - [ ] Profiles and images storage
    - [ ] Credits and transactions

- **Third-party APIs and Services**
  - [ ] **Fal.ai API**: For background removal, LoRA generation, and image generation
  - [ ] **Anthropic Claude LLM**: For image captioning and future content moderation
  - [ ] **Stripe**: For payment processing
  - [ ] **Clerk**: For authentication and user management
  - [ ] **Email Service**: For sending transactional emails

### Infrastructure

- [ ] **Vercel**: Hosting platform for deploying the application (frontend and backend)
- [ ] **GCP Storage**: Google Cloud Platform storage for images and models
- [ ] **Cloudflare DNS**: DNS management
- [ ] **Namecheap**: Domain registration and management

## Admin Pages

### Admin Dashboard

- [ ] `admin/dashboard/page.tsx`
  - [ ] View overall system statistics
  - [ ] Monitor active users and models
  - [ ] Manage site settings

### User Management

- [ ] `admin/users/page.tsx`
  - [ ] List all users
  - [ ] View and edit user details
  - [ ] Manage user credits and permissions

### Model Management

- [ ] `admin/models/page.tsx`
  - [ ] View all models
  - [ ] Monitor model usage and performance
  - [ ] Resolve issues or rerun processes

### Support Tickets

- [ ] `admin/support/page.tsx`
  - [ ] View support tickets
  - [ ] Assign tickets to support staff
  - [ ] Respond to user inquiries

## Additional Considerations

- **Security**
  - [ ] Implement SSL encryption
  - [ ] Secure user data and images
  - [ ] Regular security audits

- **Compliance**
  - [ ] GDPR compliance for user data (as applicable)
  - [ ] COPPA compliance if handling children's data

- **Scalability**
  - [ ] Optimize image processing pipelines
  - [ ] Plan for scaling backend services

- **Performance**
  - [ ] Implement caching strategies
  - [ ] Optimize frontend performance

---

By modifying the documentation, we've integrated the requirement for users to upload photos during the **Profile Setup** phase. The photo upload is now a mandatory step on the same page where users enter the 'person' details. After uploading photos, users are provided with the option to **'Review Uploaded Photos'** before proceeding.

Key changes include:

- **Profile Setup with Photo Upload**: The `profiles/new/page.tsx` now requires users to upload photos as part of the profile creation process.
- **Review Uploaded Photos**: Added a new page `profiles/review-photos/page.tsx` where users can review, crop, rotate, and manage their uploaded photos before submission.
- **User Flow Adjustments**: Steps 8 and 9 in the **New Users** flow have been updated to reflect the new process, combining profile creation and photo upload, followed by photo review.
- **Technical Process Flow**: Adjusted to include photo review and selection as a distinct step after data collection.

This ensures that users are fully engaged in the photo upload process during profile creation and have the opportunity to review and manage their photos before the system processes them for AI model training and image generation.