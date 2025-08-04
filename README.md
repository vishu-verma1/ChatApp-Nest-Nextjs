# ChatApp Documentation

## Overview

ChatApp is a full-stack real-time messaging application built with NestJS (backend) and Next.js (frontend). The application provides a modern, responsive chat interface with features like real-time messaging, message status tracking, notifications, and more.

## System Architecture

### Tech Stack

#### Backend (chatapp-api)
- **Framework**: NestJS
- **Database**: MySQL with Sequelize ORM
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT (JSON Web Token)
- **API Documentation**: Swagger

#### Frontend (chatapp-ui)
- **Framework**: Next.js
- **UI Component Library**: Custom components with Tailwind CSS
- **State Management**: React hooks
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Communication**: Socket.IO client

## Features

- **User Authentication**: Sign up, sign in, and username validation
- **Real-time Messaging**: Instant message delivery with typing indicators
- **Message Status Tracking**: Delivered and seen receipts
- **File Sharing**: Image upload and sharing
- **Message Management**: Delete messages for yourself or everyone
- **User Presence**: Online/offline status and last seen timestamps
- **Notifications**: Real-time notifications for new messages
- **Responsive Design**: Mobile and desktop optimized interfaces

## Backend API Documentation

### Authentication Endpoints

#### Sign Up
- **Endpoint**: `POST /auth/sign-up`
- **Description**: Register a new user
- **Request Body**:
```json
{
  "username": "string (2-24 characters, alphanumeric or underscore)",
  "email": "valid email address",
  "password": "string (min 6 characters)"
}
```
- **Response**: User details with JWT access token

#### Sign In
- **Endpoint**: `POST /auth/sign-in`
- **Description**: Authenticate existing user
- **Request Body**:
```json
{
  "email": "valid email address",
  "password": "string (min 6 characters)"
}
```
- **Response**: User details with JWT access token

#### Username Validation
- **Endpoint**: `GET /auth/valid-username?username=<username>`
- **Description**: Check if a username is available
- **Response**: Availability status message

### User Endpoints

All user endpoints require authentication via JWT Bearer token.

#### Get User Profile
- **Endpoint**: `GET /user/profile`
- **Description**: Get current user profile information

#### Update User
- **Endpoint**: `PUT /user/update-user`
- **Description**: Update user profile information

#### Get Users List
- **Endpoint**: `GET /user/users-list`
- **Description**: Get list of all registered users

### Messages Endpoints

#### File Upload
- **Endpoint**: `POST /messages/upload`
- **Description**: Upload image file for chat
- **Form Data**: `file` (image file)
- **Response**: URL to the uploaded image

### Notification Endpoints

#### Get Notifications
- **Endpoint**: `GET /notification/:userId`
- **Description**: Get all notifications for a user

#### Mark Notification as Read
- **Endpoint**: `PATCH /notification/mark-as-read/:id`
- **Description**: Mark a notification as read

### WebSocket Events

#### Connection
- **Event**: Connection handshake with JWT authentication
- **Description**: Establishes authenticated socket connection

#### User Status
- **Events**: `activeUsers`
- **Description**: Broadcasts online users status

#### Chat Events
- **Events**: `openChatWindow`, `sendMessage`, `getChatHistory`, `typing`, `seenMessage`
- **Description**: Handle real-time chat functionality

#### Notification Events
- **Events**: `receiveNotification`, `notificationRead`
- **Description**: Handle real-time notifications

## Frontend Components

### Authentication Pages
- **Sign In (`/sign-in`)**: Email and password authentication
- **Sign Up (`/sign-up`)**: New user registration with username validation

### Main Chat Interface
- **User List**: Displays all available users with online status indicators
- **Chat Window**: Conversation view with message history and status indicators
- **Message Input**: Text area with typing indicators and file upload option
- **Notifications Panel**: Real-time notifications with read/unread status

### UI Components
- **Avatar**: User profile images with fallback for missing images
- **Button**: Custom styled buttons with various states
- **Form**: Form components with validation feedback
- **Input**: Text input fields with styling
- **Modal**: Image preview and message deletion confirmation modals
- **Skeleton**: Loading placeholders for content

### Context Providers
- **Socket Context**: Provides socket connection to components throughout the app
- **Authentication Context**: Manages user authentication state

### Utility Functions
- **getLastSeen**: Formats last seen timestamps into relative time
- **isAuthenticated**: HOC for protected route authentication
- **socketIO**: Socket connection management

## Data Models

### User Model
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "password": "string (hashed)",
  "isActive": "boolean",
  "lastseen": "Date"
}
```

### Message Model
```json
{
  "id": "uuid",
  "content": "string (encrypted)",
  "iv": "string (encryption initialization vector)",
  "senderId": "uuid",
  "receiverId": "uuid",
  "isDeleted": "boolean",
  "deletedForEveryone": "boolean",
  "deletedForSender": "boolean",
  "deletedForReceiver": "boolean",
  "isSeen": "boolean",
  "isDelivered": "boolean",
  "imageUrl": "string (optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Notification Model
```json
{
  "id": "uuid",
  "content": "string",
  "isRead": "boolean",
  "senderId": "uuid",
  "receiverId": "uuid",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Security Features

- Password hashing
- JWT authentication for API and WebSocket connections
- Message content encryption
- CORS protection
- Input validation with Zod schemas

## Deployment Requirements

### Backend
- Node.js environment
- MySQL database
- Environment variables:
  - `PORT`: Server port (default: 3000)
  - `JWT_SECRET`: Secret key for JWT
  - `DATABASE_URL`: MySQL connection string
  - Additional environment variables in `envSample`

### Frontend
- Node.js environment
- Environment variables:
  - `NEXT_PUBLIC_BASE_API_URL`: Backend API URL
  - `NEXT_PUBLIC_SOCKET_URL`: WebSocket server URL
  - Additional environment variables in `envSample`

## Getting Started

### Backend Setup
1. Navigate to `/chatapp-api`
2. Copy `envSample` to `.env` and configure variables
3. Install dependencies: `npm install`
4. Run database migrations: `npx sequelize-cli db:migrate`
5. Start the server: `npm run start:dev`

### Frontend Setup
1. Navigate to `/chatapp-ui`
2. Copy `envSample` to `.env.local` and configure variables
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

## WebSocket Communication Flow

1. **Connection**: Client connects with JWT token for authentication
2. **User Status**: Server broadcasts active user status to all clients
3. **Messaging**:
   - Client emits `sendMessage` event with message content
   - Server processes message, saves to database, and emits to recipient
   - Server updates message status (delivered, seen)
   - Client listens for message events and updates UI accordingly
4. **Notifications**:
   - Server emits notification events for new messages
   - Client displays notifications and allows marking as read

## Frontend Implementation Details

### State Management

The frontend uses React's useState and useEffect hooks for state management:

```json
{
  "user": "Current logged-in user",
  "receiverUser": "Selected chat recipient",
  "messages": "Array of messages for current conversation",
  "activeUsers": "List of currently online users",
  "notifications": "User's notifications",
  "typingUsers": "Users currently typing"
}
```

### Key Components

1. **ConversationComponent**: Handles message display, sending, and status updates
   - Manages typing indicators
   - Handles message deletion
   - Shows message status (delivered/seen)

2. **Authentication Flow**:
   - Form validation with Zod schemas
   - JWT storage in localStorage
   - Protected routes with HOC pattern

3. **Responsive Design**:
   - Mobile-first approach with adaptive layouts
   - UI optimizations for different screen sizes
   - Touch-friendly controls for mobile users

## Message Status Workflow

1. Message sent by sender (pending)
2. Message saved in database
3. Message delivered to recipient (if online)
4. Message seen by recipient (when chat window is open)
5. Status updates sent to original sender

## Project Structure

### Backend (chatapp-api)

```
chatapp-api/
├── config/                 # Configuration files
│   └── config.json         # Database configuration
├── migrations/             # Sequelize database migrations
├── seeders/                # Database seed data
├── src/
│   ├── app.module.ts       # Main application module
│   ├── main.ts             # Application entry point
│   ├── auth/               # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── guard/          # JWT and local auth guards
│   │   └── strategy/       # Authentication strategies
│   ├── chat/               # Chat functionality
│   │   ├── chat.controller.ts
│   │   ├── chat.gateway.ts # WebSocket gateway
│   │   ├── chat.module.ts
│   │   └── chat.service.ts
│   ├── common/             # Common utilities and decorators
│   ├── dtos/               # Data transfer objects
│   ├── messages/           # Message handling
│   │   ├── messages.controller.ts
│   │   ├── messages.module.ts
│   │   ├── messages.service.ts
│   │   └── models/         # Database models
│   ├── notification/       # Notification handling
│   │   ├── notification.controller.ts
│   │   ├── notification.module.ts
│   │   ├── notification.service.ts
│   │   └── models/         # Database models
│   ├── schemas/            # Validation schemas
│   └── user/               # User management
│       ├── user.controller.ts
│       ├── user.gateway.ts
│       ├── user.module.ts
│       ├── user.service.ts
│       └── models/         # Database models
├── test/                   # End-to-end tests
└── uploads/                # Uploaded files storage
```

### Frontend (chatapp-ui)

```
chatapp-ui/
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/         # Authentication routes
│   │   │   ├── sign-in/    # Login page
│   │   │   ├── sign-up/    # Registration page
│   │   │   └── isAuth.tsx  # Auth HOC for protected routes
│   │   ├── chat/           # Main chat page
│   │   ├── context/        # React contexts
│   │   │   └── SocketContext.tsx
│   │   ├── error.tsx       # Error handling
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # App layout
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   ├── chat-components/# Chat-specific components
│   │   │   ├── ConversationComponent.tsx
│   │   │   ├── DeleteMesageComponent.tsx
│   │   │   └── ImageModal.tsx
│   │   ├── loaders/        # Loading indicators
│   │   └── ui/             # Reusable UI components
│   │       ├── avatar.tsx
│   │       ├── button.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       └── ...
│   ├── lib/                # Utility libraries
│   ├── schemas/            # Form validation schemas
│   └── utils/              # Utility functions
│       ├── getLastSeen.ts
│       ├── isAuthenticated.ts
│       └── socketIO.ts
└── next.config.ts          # Next.js configuration
```

## Future Enhancements

- Group chat functionality
- Message reactions and replies
- Voice and video calling
- End-to-end encryption
- Message search functionality
- User profile customization
- Offline message queueing
- Read receipts with timestamps
- Multi-device synchronization
