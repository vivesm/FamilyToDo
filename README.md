# FamilyToDo

A visual, family-oriented task management application with priority-based organization and real-time collaboration.

## Features

### Core Functionality
- **Visual Task Management**: Organize tasks with visual priority indicators (🔴 Urgent, 🟡 Soon, 🟢 Whenever)
- **Family Collaboration**: Assign tasks to family members with profile photos
- **Real-time Updates**: WebSocket-powered instant synchronization across all devices
- **Recurring Tasks**: Set up daily, weekly, or monthly recurring tasks
- **Categories**: Organize tasks with custom categories and icons

### UI/UX Features
- **Dual View Modes**: 
  - **Card View**: Visual cards with progress bars showing time until due
  - **List View**: Compact, information-dense list display
- **Minimalist Design**: Clean, uncluttered interface with compact filters
- **Dark Mode**: Toggle between light and dark themes
- **Progress Visualization**: Cards display visual progress bars that fill as due dates approach
- **Smart Filtering**: Filter by person, category, or view all tasks
- **Show/Hide Completed**: Toggle visibility of completed tasks

### Mobile Features
- **PWA Support**: Install as a native app on mobile devices
- **Touch Gestures**: Long-press anywhere to access settings
- **Responsive Design**: Optimized for all screen sizes

## Tech Stack

### Frontend
- **Vue 3** with Composition API
- **Vite** for fast development and building
- **Pinia** for state management
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time updates

### Backend
- **Node.js** with Express
- **SQLite** database with better-sqlite3
- **Socket.io** for WebSocket connections
- **Multer** for file uploads
- **Sharp** for image processing

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Make (optional, for using Makefile commands)

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/FamilyToDo.git
cd FamilyToDo
```

2. Install dependencies and start the development server:
```bash
make install
make dev
```

Or manually:
```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies  
cd frontend
npm install
cd ..

# Start both servers
npm run dev --prefix backend &
npm run dev --prefix frontend
```

3. Open your browser to `http://localhost:5173`

## Docker Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

### Using Dockerfile
```bash
docker build -t familytodo .
docker run -p 3001:3001 -p 5173:5173 familytodo
```

## Project Structure

```
FamilyToDo/
├── frontend/               # Vue.js frontend application
│   ├── src/
│   │   ├── components/    # Reusable Vue components
│   │   │   ├── CompactFilterBar.vue  # Minimalist filter bar
│   │   │   ├── TaskCard.vue          # Card view component
│   │   │   ├── TaskListItem.vue      # List view component
│   │   │   ├── ViewToggle.vue        # View mode toggle
│   │   │   └── AddTaskModal.vue      # Task creation/editing
│   │   ├── views/         # Page components
│   │   ├── stores/        # Pinia stores
│   │   ├── composables/   # Vue composables
│   │   └── services/      # API and WebSocket services
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── db/           # Database configuration
│   │   └── utils/        # Utility functions
│   └── uploads/          # User uploaded images
└── data/                 # SQLite database files
```

## Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/familytodo.db
UPLOAD_DIR=./uploads
```

### Caddy (Production)
The included `Caddyfile` provides HTTPS configuration for production deployment.

## Usage

### Creating Tasks
1. Click the blue "+" button to create a new task
2. Enter task details:
   - Title (required)
   - Priority level (Urgent/Soon/Whenever)
   - Category (optional)
   - Assign to family members
   - Due date and time
   - Recurring pattern
   - Description

### Managing Family Members
1. Long-press anywhere or navigate to Settings
2. Add family members with:
   - Name
   - Photo (optional)
   - Color theme

### View Modes
- **Card View**: Visual cards with progress indicators
- **List View**: Compact single-line display
- Toggle between views using the button in the top-right corner

### Filtering
- Click on a person's avatar to see only their tasks
- Click on a category icon to filter by category
- Click "All" to see all tasks
- Use the eye icon to show/hide completed tasks

## API Documentation

### Endpoints

#### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PUT /api/tasks/:id/complete` - Toggle task completion

#### People
- `GET /api/people` - Get all people
- `POST /api/people` - Create a person
- `DELETE /api/people/:id` - Delete a person

#### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a category
- `DELETE /api/categories/:id` - Delete a category

#### Uploads
- `POST /api/upload` - Upload an image

### WebSocket Events
- `taskCreated` - New task created
- `taskUpdated` - Task updated
- `taskDeleted` - Task deleted
- `personCreated` - Person added
- `personDeleted` - Person removed
- `categoryCreated` - Category added
- `categoryDeleted` - Category removed

## Development

### Available Scripts

```bash
# Development
make dev          # Start both frontend and backend
make dev-backend  # Start backend only
make dev-frontend # Start frontend only

# Installation
make install      # Install all dependencies
make clean        # Clean node_modules

# Docker
make docker-build # Build Docker image
make docker-run   # Run Docker container
make docker-stop  # Stop Docker container

# Database
make db-reset     # Reset database to initial state
```

### Testing
```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests  
cd backend && npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons from Emoji Unicode
- UI components inspired by modern task management apps
- Built with Vue.js and Node.js ecosystems

## Support

For issues, questions, or suggestions, please open an issue on GitHub.