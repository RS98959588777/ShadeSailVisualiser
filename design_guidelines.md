# Shade Sail Visualizer Design Guidelines

## Design Approach
**System-Based Approach**: Material Design with customizations for photo editing workflows
- Clean, functional interface prioritizing usability over visual flair
- Tool-focused design similar to Canva or Photoshop web interfaces
- Emphasis on precision controls and clear visual feedback

## Core Design Elements

### Color Palette
**Light Mode:**
- Primary: 220 85% 35% (professional blue)
- Surface: 210 20% 98% (off-white)
- Border: 220 15% 85% (light gray)

**Dark Mode:**
- Primary: 220 85% 55% (lighter blue)
- Surface: 220 15% 10% (dark gray)
- Border: 220 15% 25% (medium gray)

### Typography
- Primary: Inter (Google Fonts)
- Headings: 600 weight
- Body: 400 weight
- UI labels: 500 weight

### Layout System
Tailwind spacing primitives: 2, 4, 6, 8, 12, 16 units
- Tight spacing (p-2, m-2) for controls
- Standard spacing (p-4, m-4) for components
- Generous spacing (p-8, m-8) for sections

### Component Library

**Upload Zone**
- Large dashed border rectangle with upload icon
- Drag-and-drop visual feedback with color changes
- File format indicators (JPG/PNG)
- Error states for invalid files

**Canvas Workspace**
- Full-width container with dark background
- Image centered with subtle drop shadow
- Zoom controls in corner
- Grid overlay toggle option

**Control Panel**
- Collapsible sidebar (desktop) or bottom sheet (mobile)
- Organized tabs: Position, Size, Color, Effects
- Slider controls with numeric inputs
- Color swatches in grid layout
- Reset and undo buttons

**Shade Sail Colors**
Realistic fabric colors:
- Charcoal: 0 0% 25%
- Sand: 45 30% 75%
- Forest Green: 150 40% 30%
- Terracotta: 15 60% 45%
- Cream: 50 20% 90%
- Navy: 210 70% 25%

**Action Buttons**
- Primary CTA: "Download Mockup" (prominent)
- Secondary: "Reset", "Undo" (outline style)
- All buttons use blurred backgrounds when over images

**Navigation**
- Simple header with logo and minimal navigation
- Progress indicator showing upload → edit → download steps

## Layout Structure

**Desktop Layout:**
- Header (64px height)
- Main workspace with sidebar controls (300px width)
- Canvas area fills remaining space

**Mobile Layout:**
- Stacked layout with bottom control sheet
- Full-width canvas area
- Swipeable control panels

## Images
No hero image required - this is a utility application focused on the canvas workspace. The uploaded user photo becomes the primary visual element.

**Placeholder Graphics:**
- Upload zone: Simple cloud upload icon
- Empty state: Minimalist house outline illustration
- Loading states: Subtle progress indicators

## Accessibility
- High contrast ratios (4.5:1 minimum)
- Keyboard navigation for all controls
- Screen reader labels for canvas interactions
- Focus indicators on all interactive elements
- Dark mode support throughout

## Key Interactions
- Smooth canvas zoom/pan with momentum
- Precise drag handles for shade sail corners
- Real-time color preview on hover
- Instant visual feedback for all adjustments
- One-click download with progress indication