# ChatApp API Documentation

This document provides an overview of the available API endpoints for the ChatApp backend.

---

## Authentication

### Sign Up

**Endpoint:**  
`POST /auth/sign-up`

**Payload:**
```json
{
  "username": "string (2-24 characters, alphanumeric or underscore)",
  "email": "valid email address",
  "password": "string (min 6 characters)"
}
```

**Response (Success, HTTP 201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "isActive": true,
    "lastseen": null
  },
  "access_token": "JWT token string"
}
```

### Sign In

**Endpoint:**  
`POST /auth/sign-in`

**Payload:**
```json
{
  "email": "valid email address",
  "password": "string (min 6 characters)"
}
```

**Response (Success, HTTP 201):**
```json
{
  "message": "User logged in successfully",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "isActive": true,
    "lastseen": null
  },
  "access_token": "JWT token string"
}
```

### Validate Username

**Endpoint:**  
`GET /auth/valid-username?username=<username>`

**Response Example:**
- If unique:
  ```json
  {
    "success": true,
    "message": "Username is available and unique"
  }
  ```
- If taken:
  ```json
  {
    "success": false,
    "message": "Username is already taken"
  }
  ```

---

## User Endpoints

All user endpoints require a valid JWT in the `Authorization` header (Bearer token).

### Get User Profile

**Endpoint:**  
`GET /user/profile`

**Response:**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "isActive": true,
  "lastseen": "Date or null"
}
```

### Update User

**Endpoint:**  
`PUT /user/update-user`

**Payload:** (any combination of update fields)
```json
{
  "username": "optional new username",
  "email": "optional new email",
  "password": "optional new password (min 6 characters)"
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid",
    "username": "updated string",
    "email": "updated string",
    "isActive": true,
    "lastseen": "Date or null"
  }
}
```

### Users List

**Endpoint:**  
`GET /user/users-list`

**Response:**
```json
{
  "message": "List of registered users",
  "users": [
    {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "isActive": boolean,
      "lastseen": "Date or null"
    },
    ...
  ]
}
```

---

## Chat Endpoints

All chat endpoints require authentication via JWT and also require the socket connection for real-time messages.

### Get Chat History

Using websocket:  
Client emits `getChatHistory` with payload:
```json
{
  "senderId": "current user id",
  "receiverId": "other user id"
}
```
The server responds with the chat history between the two users.

### Send Message

Using websocket:  
Client emits `sendMessage` with payload:
```json
{
  "senderId": "current user id",
  "receiverId": "other user id",
  "content": "message content",
  "tempId": "temporary id string"
}
```
Server processes the message and broadcasts appropriate status updates and notifications.

---

## Messages Endpoints

### File Upload

**Endpoint:**  
`POST /messages/upload`

**Form-data:**  
`file`: The file to be uploaded

**Response:**
```json
{
  "imageUrl": "http://localhost:3000/uploads/<filename>"
}
```

---

## Notifications

### Get Notifications

**Endpoint:**  
`GET /notification/:userId`

**Response:**  
List of notifications for the given user.

### Mark Notification As Read

**Endpoint:**  
`PATCH /notification/mark-as-read/:id`

**Response:**  
The result of updating the notification status.

---

## General Notes

- All endpoints that require authentication expect a header:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- The API uses MySQL as its database.
- The endpoints respond with standard HTTP status codes for success, client errors, and server errors.
- Real-time chat communication is handled via websocket events (`sendMessage`, `chatHistory`, `typing`, etc.).

For further details, refer to the code in [chatapp-api/src](chatapp-api/src).

---

Happy coding!