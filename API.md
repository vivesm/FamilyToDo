# FamilyToDo API Documentation

## Base URL
- Development: `http://localhost:4000/api`
- Production: `https://your-domain.com/api`

## Authentication
Currently, the API does not require authentication. Future versions may implement JWT or session-based auth.

## Rate Limiting
- General API: 100 requests per minute per IP
- Upload endpoints: 10 requests per minute per IP
- Create endpoints: 20 requests per minute per IP

## Response Format
All responses are in JSON format with the following structure:

### Success Response
```json
{
  "data": {}, // Response data
  "success": true
}
```

### Error Response
```json
{
  "error": "Error message",
  "success": false
}
```

## Endpoints

### Tasks

#### Get All Tasks
```http
GET /api/tasks
```

Query Parameters:
- `person_id` (optional): Filter by assigned person
- `category_id` (optional): Filter by category
- `priority` (optional): Filter by priority (1, 2, or 3)
- `completed` (optional): Filter by completion status (true/false)
- `include_deleted` (optional): Include soft-deleted tasks (true/false)

Response:
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "description": "Get milk, eggs, bread",
    "category_id": 1,
    "category_name": "Shopping",
    "category_icon": "🛒",
    "category_color": "#10B981",
    "priority": 1,
    "due_date": "2025-01-25T15:00:00Z",
    "recurring_pattern": null,
    "completed": false,
    "completed_at": null,
    "attachment_count": 2,
    "comment_count": 5,
    "assigned_people": [
      {
        "id": 1,
        "name": "John",
        "photo_url": "/uploads/john.jpg",
        "color": "#3B82F6"
      }
    ],
    "created_at": "2025-01-24T10:00:00Z",
    "updated_at": "2025-01-24T10:00:00Z"
  }
]
```

#### Get Task Details
```http
GET /api/tasks/:id/details
```

Response includes full task data plus attachments array.

#### Create Task
```http
POST /api/tasks
```

Request Body:
```json
{
  "title": "New task",
  "description": "Task description",
  "category_id": 1,
  "priority": 2,
  "due_date": "2025-01-25T15:00:00Z",
  "recurring_pattern": "weekly",
  "assigned_people": [1, 2]
}
```

#### Update Task
```http
PUT /api/tasks/:id
```

Request Body (partial update supported):
```json
{
  "title": "Updated title",
  "priority": 1
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
```

Performs soft delete. For recurring tasks, creates next occurrence.

#### Complete Task
```http
PUT /api/tasks/:id/complete
```

#### Uncomplete Task
```http
PUT /api/tasks/:id/uncomplete
```

#### Get Task Attachments
```http
GET /api/tasks/:id/attachments
```

Response:
```json
[
  {
    "id": 1,
    "task_id": 1,
    "filename": "uuid-filename.jpg",
    "original_name": "vacation-photo.jpg",
    "url": "/uploads/attachments/uuid-filename.jpg",
    "type": "image/jpeg",
    "size": 245632,
    "uploaded_by": 1,
    "uploaded_by_name": "John",
    "uploaded_by_photo": "/uploads/john.jpg",
    "uploaded_at": "2025-01-24T10:00:00Z"
  }
]
```

### Comments

#### Get Task Comments
```http
GET /api/comments/task/:taskId
```

Response:
```json
[
  {
    "id": 1,
    "task_id": 1,
    "person_id": 1,
    "person_name": "John",
    "person_photo": "/uploads/john.jpg",
    "person_color": "#3B82F6",
    "comment": "This is a comment",
    "attachment_count": 1,
    "attachments": [
      {
        "id": 1,
        "filename": "attachment.pdf",
        "url": "/uploads/attachments/attachment.pdf",
        "type": "application/pdf",
        "size": 102400
      }
    ],
    "created_at": "2025-01-24T10:00:00Z",
    "updated_at": "2025-01-24T10:00:00Z"
  }
]
```

#### Add Comment
```http
POST /api/comments/task/:taskId
```

Request Body:
```json
{
  "personId": 1,
  "comment": "This is a new comment"
}
```

#### Update Comment
```http
PUT /api/comments/:id
```

Request Body:
```json
{
  "comment": "Updated comment text"
}
```

#### Delete Comment
```http
DELETE /api/comments/:id
```

### People

#### Get All People
```http
GET /api/people
```

Response:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "photo_url": "/uploads/john.jpg",
    "color": "#3B82F6",
    "created_at": "2025-01-24T10:00:00Z",
    "updated_at": "2025-01-24T10:00:00Z"
  }
]
```

#### Create Person
```http
POST /api/people
```

Request Body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "color": "#EC4899"
}
```

#### Update Person
```http
PUT /api/people/:id
```

Request Body:
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com"
}
```

#### Delete Person
```http
DELETE /api/people/:id
```

### Categories

#### Get All Categories
```http
GET /api/categories
```

Response:
```json
[
  {
    "id": 1,
    "name": "Shopping",
    "icon": "🛒",
    "color": "#10B981",
    "sort_order": 1,
    "created_at": "2025-01-24T10:00:00Z"
  }
]
```

#### Create Category
```http
POST /api/categories
```

Request Body:
```json
{
  "name": "Work",
  "icon": "💼",
  "color": "#3B82F6",
  "sort_order": 2
}
```

#### Update Category
```http
PUT /api/categories/:id
```

#### Delete Category
```http
DELETE /api/categories/:id
```

### File Uploads

#### Upload Profile Image
```http
POST /api/upload/image
```

Request: `multipart/form-data`
- `image`: Image file (JPEG, PNG, GIF, WebP)
- Max size: 5MB

Response:
```json
{
  "success": true,
  "url": "/uploads/uuid-filename.webp",
  "filename": "uuid-filename.webp"
}
```

#### Upload Task Attachment
```http
POST /api/upload/task/:taskId/attachment
```

Request: `multipart/form-data`
- `file`: File (images, PDF, Word, Excel, CSV, TXT)
- `uploadedBy` (optional): Person ID
- Max size: 10MB

Response:
```json
{
  "success": true,
  "attachment": {
    "id": 1,
    "url": "/uploads/attachments/uuid-filename.pdf",
    "filename": "uuid-filename.pdf",
    "originalName": "document.pdf",
    "type": "application/pdf",
    "size": 245632
  }
}
```

#### Upload Comment Attachment
```http
POST /api/upload/comment/:commentId/attachment
```

Request: `multipart/form-data`
- `file`: File (same types as task attachment)
- Max size: 10MB

#### Upload Camera Photo
```http
POST /api/upload/camera
```

Request Body:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "taskId": 1,
  "uploadedBy": 1
}
```

Response:
```json
{
  "success": true,
  "attachment": {
    "id": 1,
    "url": "/uploads/camera/camera_uuid.jpg",
    "filename": "camera_uuid.jpg",
    "type": "image/jpeg"
  }
}
```

#### Delete Attachment
```http
DELETE /api/upload/attachment/:id
```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:4000');
socket.emit('join-family');
```

### Task Events
- `task-created` - New task created
- `task-updated` - Task updated
- `task-deleted` - Task deleted
- `task-completed` - Task marked complete
- `task-uncompleted` - Task marked incomplete

### Person Events
- `person-created` - Person added
- `person-updated` - Person updated
- `person-deleted` - Person removed

### Category Events
- `category-created` - Category added
- `category-updated` - Category updated
- `category-deleted` - Category removed

### Comment Events
- `task:comment:added` - Comment added to task
- `task:comment:updated` - Comment updated
- `task:comment:deleted` - Comment deleted

Event Data Format:
```json
{
  "type": "task-updated",
  "data": {
    "id": 1,
    "title": "Updated task",
    // ... full task data
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 413 | Payload Too Large - File size exceeds limit |
| 415 | Unsupported Media Type - File type not allowed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## File Type Support

### Images
- JPEG/JPG
- PNG
- GIF
- WebP

### Documents
- PDF
- DOC/DOCX (Word)
- XLS/XLSX (Excel)
- CSV
- TXT

## Limits

- Max file size (profile photos): 5MB
- Max file size (attachments): 10MB
- Max attachments per task: 10
- Max comment length: 5000 characters
- Max task title length: 255 characters
- Max task description length: 5000 characters

## CORS Configuration

Development:
```
Origin: http://localhost:5173
```

Production (example):
```
Origin: https://familytodo.yourdomain.com
```

For iPad/local network access:
```
Origin: http://192.168.1.*:5173
Origin: http://familytodo.local:5173
```