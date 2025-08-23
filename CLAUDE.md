# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FamilyToDo - A visual, family-oriented task management application with priority-based organization and real-time collaboration.

## Tech Stack

### Frontend
- **Vue 3** (Composition API with `<script setup>`)
- **Vite** for development and building
- **Pinia** for state management
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time updates

### Backend
- **Node.js** with Express
- **SQLite** with better-sqlite3
- **Socket.io** for WebSocket connections
- **Multer** for file uploads
- **Sharp** for image processing

## Development Setup

```bash
# Install all dependencies
make install

# Start development servers (frontend + backend)
make dev

# Or run individually:
make dev-frontend  # Frontend only on http://localhost:5173
make dev-backend   # Backend only on http://localhost:3001
```

## Key Commands

```bash
# Development
make dev            # Start both servers concurrently
make dev-frontend   # Start frontend dev server
make dev-backend    # Start backend dev server

# Installation
make install        # Install all dependencies
make clean          # Remove node_modules

# Docker
make docker-build   # Build Docker image
make docker-run     # Run Docker container
make docker-stop    # Stop Docker container

# Database
make db-reset       # Reset database to initial state
```

## Architecture Overview

### Frontend Structure
```
frontend/src/
├── components/          # Reusable Vue components
│   ├── CompactFilterBar.vue   # Minimalist filter bar (people + categories)
│   ├── TaskCard.vue           # Card view with progress visualization
│   ├── TaskListItem.vue       # List view item component
│   ├── ViewToggle.vue         # Card/List view toggle
│   └── AddTaskModal.vue       # Task creation/editing modal
├── views/              # Page components
│   ├── HomeView.vue           # Main task view
│   ├── SettingsView.vue       # Settings and family management
│   └── PeopleView.vue         # People management
├── stores/             # Pinia stores
│   ├── taskStore.js          # Task state management
│   ├── peopleStore.js        # People state management
│   └── categoryStore.js      # Category state management
├── composables/        # Vue composables
│   ├── useDarkMode.js        # Dark mode toggle logic
│   └── useLongPress.js       # Long press gesture detection
└── services/           # API and WebSocket services
    ├── api.js                # HTTP API client
    └── socket.js             # WebSocket client
```

### Backend Structure
```
backend/src/
├── routes/            # API endpoints
│   ├── tasks.js             # Task CRUD operations
│   ├── people.js            # People management
│   ├── categories.js        # Category management
│   └── upload.js            # Image upload handling
├── db/                # Database
│   └── database.js          # SQLite connection and queries
└── utils/             # Utilities
    ├── initDb.js            # Database initialization
    └── socketEmitter.js     # WebSocket event emitter
```

## Component Guidelines

### Vue Components
- Use Composition API with `<script setup>`
- Props should be defined with `defineProps()`
- Emits should be defined with `defineEmits()`
- Use Tailwind classes for styling
- Keep templates clean and readable

### State Management
- Use Pinia stores for global state
- Keep component state local when possible
- Use computed properties for derived state
- Actions should handle API calls and WebSocket events

### Styling
- Use Tailwind CSS utility classes
- Dark mode support via `dark:` prefix
- Responsive design with `sm:`, `md:`, `lg:` prefixes
- Custom colors defined in tailwind.config.js

## Recent Updates (v1.1.0)

### New Components
1. **CompactFilterBar.vue** - Minimalist filter bar reducing screen space by 60%
2. **TaskListItem.vue** - Compact single-line task display for list view
3. **ViewToggle.vue** - Toggle between card and list views

### New Features
- Dual view modes (Card/List) with localStorage persistence
- Visual progress bars on task cards showing time until due
- Color-coded progress indicators (green → yellow → red)
- Days remaining badges on tasks
- Relocated UI controls for better UX

### UI/UX Improvements
- Filter bar height reduced from ~150px to ~60px
- Dark mode button moved to bottom-left
- Show/hide completed toggle moved next to view toggle
- Removed duplicate floating action buttons

## Important Notes

### Performance Considerations
- Use `v-if` vs `v-show` appropriately
- Lazy load large components
- Optimize image uploads with Sharp
- Use WebSocket for real-time updates efficiently

### Security
- Input validation on both frontend and backend
- File upload restrictions (images only, size limits)
- SQL injection prevention with parameterized queries
- XSS protection with proper data sanitization

### Code Style
- Use async/await over promises
- Consistent error handling patterns
- Meaningful variable and function names
- Comment complex logic
- Keep functions small and focused

### Testing
- Unit tests for stores and utilities
- Component testing with Vitest
- E2E testing for critical user flows
- API endpoint testing

### Database Schema
```sql
-- People table
CREATE TABLE people (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table  
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id INTEGER,
  priority INTEGER DEFAULT 3,
  due_date DATETIME,
  recurring_pattern TEXT,
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Task assignments junction table
CREATE TABLE task_assignments (
  task_id INTEGER,
  person_id INTEGER,
  PRIMARY KEY (task_id, person_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);
```