# Halloween Costume Generator - Design Specification

## 1. Color Palette

### Primary Colors
- Orange: #FF6B00 (Used for primary buttons, accents)
- Black: #000000 (Used for backgrounds, text)
- White: #FFFFFF (Used for text on dark backgrounds, card backgrounds)

### Secondary Colors
- Dark Orange: #CC5500 (Used for hover states, secondary buttons)
- Light Orange: #FFA366 (Used for highlights, subtle accents)
- Gray: #808080 (Used for disabled states, secondary text)

### Accent Colors
- Purple: #8A2BE2 (Used sparingly for special highlights)
- Green: #00FF00 (Used for success states, generate buttons)
- Red: #FF0000 (Used for error states, delete buttons)

## 2. Typography

### Font Family
- Primary: 'Inter', sans-serif

### Font Sizes
- Heading 1: 36px (2.25rem)
- Heading 2: 30px (1.875rem)
- Heading 3: 24px (1.5rem)
- Body Text: 16px (1rem)
- Small Text: 14px (0.875rem)

### Font Weights
- Regular: 400
- Medium: 500
- Bold: 700

### Line Heights
- Headings: 1.2
- Body Text: 1.5

## 3. Spacing

Use a consistent spacing scale based on 4px increments:
- 4px (0.25rem)
- 8px (0.5rem)
- 16px (1rem)
- 24px (1.5rem)
- 32px (2rem)
- 48px (3rem)
- 64px (4rem)

## 4. Layout

- Use a 12-column grid system for responsive layouts
- Maximum content width: 100% of viewport width
- Gutters: 24px (1.5rem)
- Padding: 16px (1rem) on smaller screens, 24px (1.5rem) on larger screens

## 5. Components

### Buttons
- Height: 40px (2.5rem)
- Padding: 8px 16px (0.5rem 1rem)
- Border Radius: 4px (0.25rem)
- Text: Uppercase, Bold

#### Button Types
1. Primary: Orange background, white text
2. Secondary: Transparent background, orange border, orange text
3. Destructive: Red background, white text
4. Ghost: Transparent background, white text (on dark backgrounds)

### Cards
- Background: White (on dark backgrounds) or Dark Orange (on light backgrounds)
- Border Radius: 8px (0.5rem)
- Padding: 24px (1.5rem)
- Box Shadow: 0 4px 6px rgba(0, 0, 0, 0.1)

### Input Fields
- Height: 40px (2.5rem)
- Padding: 8px 12px (0.5rem 0.75rem)
- Border: 1px solid #808080
- Border Radius: 4px (0.25rem)
- Focus State: 2px solid orange border

### Icons
- Use Lucide React icons consistently throughout the application
- Size: 24px (1.5rem) for standard icons, 16px (1rem) for small icons

## 6. Animations and Transitions

- Use Framer Motion for component animations
- Default transition: 0.2s ease-in-out
- Hover transitions: 0.1s ease-in-out
- Page transitions: 0.3s ease-in-out

## 7. Responsive Design

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px and above

Use responsive design techniques:
- Fluid typography
- Flexible layouts that expand to fill the available space
- Use viewport units (vw, vh) for sizing to ensure content fits the screen
- Stack elements vertically on mobile
- Hide non-essential elements on smaller screens
- Implement a responsive container class that expands to fill the screen width while maintaining readable line lengths on larger screens

## 9. Specific Component Guidelines

### Header
- Fixed position at the top of the page
- Height: 64px (4rem)
- Background: Dark Orange (#CC5500)
- Logo: White Ghost icon (from Lucide React) + "halloweencostu.me" text

### Footer
- Background: Dark Orange (#CC5500)
- Padding: 48px 24px (3rem 1.5rem)
- Links: White text, underline on hover

### Dashboard
- Full-width layout that adapts to screen size
- Sidebar width: 250px on larger screens, collapsible on smaller screens
- Sidebar background: Very Dark Orange (#993D00)
- Main content area: Dark gradient background (from #FF6B00 to #000000), expanding to fill available space

### Shoot Cards
- Display in a responsive grid that adjusts based on screen size:
  - 1 column on mobile
  - 2 columns on tablet
  - 3 or more columns on desktop, expanding to fill available space
- Cards should grow to fill available horizontal space
- Use CSS Grid or Flexbox for flexible, gap-based layouts

## 10. Loading States

- Use skeleton loaders for content that's being fetched
- Implement a global loading indicator for page transitions
- Button loading state: Replace text with a spinner, maintain button width

## 11. Error Handling

- Display error messages in a toast notification
- Error color: Red (#FF0000)
- Provide clear, actionable error messages

## 12. Modals and Dialogs

- Background overlay: Semi-transparent black (rgba(0, 0, 0, 0.5))
- Modal background: White
- Border Radius: 8px (0.5rem)
- Max Width: 500px for standard modals, 800px for large modals

## 13. Forms

- Group related fields together
- Use inline validation where possible
- Clearly mark required fields
- Provide helpful placeholder text and labels

## 14. Halloween-Specific Elements

- Use spooky icons and illustrations where appropriate (e.g., ghosts, pumpkins, bats)
- Implement subtle "spooky" animations (e.g., floating ghosts, flickering lights) for visual interest
- Consider using a "film grain" or texture overlay to enhance the Halloween atmosphere

## 15. Fullscreen and Expanded Layouts

- Implement a fullscreen mode for image generation and viewing
- Use CSS Grid for main layout to allow easy expansion of content areas
- Utilize `min-height: 100vh` for full-height layouts
- For scrollable content, use `max-height: 100vh` with overflow-y: auto
- Consider using CSS Custom Properties (variables) for dynamic sizing and spacing
