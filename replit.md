# Shade Sail Visualizer

## Overview

A React-based web application that allows users to upload photos of their outdoor spaces and visualize shade sails in different colors, shapes, and positions before making a purchase. The application provides an intuitive photo editing interface similar to Canva or Photoshop, where users can drag, resize, rotate, and customize shade sails on their uploaded images.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application follows a component-based React architecture with TypeScript:

- **Main Component**: `ShadeSailVisualizer` serves as the primary orchestrator, managing state for uploaded images, selected colors, shapes, and canvas interactions
- **Canvas System**: Uses Fabric.js for interactive image editing capabilities, allowing users to manipulate shade sail objects directly on the canvas
- **Component Library**: Built with shadcn/ui components providing a consistent Material Design-inspired interface
- **State Management**: React hooks for local state management, with TanStack Query for server-side state and caching
- **Routing**: Uses Wouter for lightweight client-side routing

### UI Design System
Implements a system-based design approach focused on functionality:

- **Styling**: Tailwind CSS with custom design tokens for consistent spacing, colors, and typography
- **Theme Support**: Light and dark mode support with CSS custom properties
- **Component Structure**: Modular components for upload zones, canvas workspace, control panels, and color palettes
- **Typography**: Inter font family with defined weight hierarchy (400, 500, 600)
- **Layout**: Responsive design with mobile-first approach using Tailwind breakpoints

### Canvas and Image Processing
The core functionality revolves around interactive image editing:

- **Fabric.js Integration**: Handles canvas operations, object manipulation, and rendering
- **Shape Generation**: Supports multiple shade sail shapes (triangle, square, rectangle) with dynamic creation
- **Image Upload**: Drag-and-drop file handling with validation for JPG/PNG formats
- **Export Functionality**: Canvas-to-image conversion for downloading final visualizations
- **Real-time Updates**: Live preview of color, opacity, and rotation changes

### Backend Architecture
Minimal Express.js server setup designed for potential expansion:

- **Server Framework**: Express.js with TypeScript
- **Development Tools**: Vite integration for hot module replacement and development server
- **Session Management**: PostgreSQL session store configuration (connect-pg-simple)
- **Storage Interface**: Abstracted storage layer with in-memory implementation, designed for easy database integration

### Data Layer
Currently uses in-memory storage with database-ready architecture:

- **ORM**: Drizzle ORM configured for PostgreSQL with migration support
- **Schema**: User management schema defined with Zod validation
- **Database Config**: PostgreSQL connection setup via environment variables
- **Migration System**: Drizzle-kit for schema migrations and database management

## External Dependencies

### Core Framework Dependencies
- **React 18**: Main UI framework with modern hooks and concurrent features
- **TypeScript**: Type safety and development experience enhancement
- **Vite**: Build tool and development server with fast HMR
- **Express.js**: Backend server framework

### Canvas and Graphics
- **Fabric.js**: Interactive canvas library for image manipulation and object handling
- **React Dropzone**: File upload handling with drag-and-drop support

### UI Component Libraries
- **Radix UI**: Headless component primitives for accessibility-compliant UI elements
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

### State Management and Data Fetching
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Runtime type validation and schema definition

### Database and ORM
- **Drizzle ORM**: Type-safe database ORM for PostgreSQL
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **connect-pg-simple**: PostgreSQL session store for Express

### Development and Build Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Development tooling for Replit environment

### Utility Libraries
- **class-variance-authority**: Utility for creating variant-based component APIs
- **clsx**: Conditional className utility
- **date-fns**: Date manipulation library
- **cmdk**: Command palette component