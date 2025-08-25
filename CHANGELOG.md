# Changelog

All notable changes to FamilyToDo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-01-24

### Added
- **Task Attachments System**: Upload files (images, PDFs, documents) to tasks
- **Camera Integration**: Capture photos directly from the app with front/back camera switching
- **Comments System**: Threaded comments on tasks with real-time updates
- **Comment Attachments**: Add files to comments
- **Glass Morphism UI**: Modern frosted glass design with backdrop blur effects
- **Notification Bells**: Visual indicators for overdue tasks per person
- **Task Detail API**: Comprehensive task details endpoint with attachments
- **File Type Support**: Extended support for PDFs, Word docs, Excel, CSV files
- **Network Configuration**: Support for iPad access on local network
- **Camera Component**: CameraCapture.vue for native photo capture

### Changed
- **Settings Access**: Long press on eye button instead of filter bar area
- **UI Modernization**: Complete redesign with glass morphism effects
- **Dark Mode**: Enhanced with surface colors for better contrast
- **Button Styles**: Gradient primary buttons with rounded design
- **Modal Design**: Frosted glass backdrops with slide-up animations
- **Upload System**: Extended to handle multiple file types and larger files

### Fixed
- Database schema with proper indexes for new tables
- Upload routes to handle various file types correctly
- Settings access mechanism for better UX
- Memory leaks in socket connections
- Rate limiting for upload endpoints

### Security
- Added file type validation for uploads
- Implemented size limits for attachments (10MB)
- SQL injection prevention in comment queries
- XSS protection in comment rendering

## [1.1.0] - 2025-01-23

### Added
- **List View Mode**: New compact list view for displaying tasks in a single-line format
- **View Toggle Component**: Switch between card and list views with persistent preference
- **Progress Visualization**: Task cards now display visual progress bars that fill as due dates approach
  - Green (0-50% time elapsed)
  - Yellow (50-75% time elapsed)  
  - Red (75-100% time elapsed)
- **Days Remaining Badge**: Visual indicator showing days until task due date
- **Compact Filter Bar**: Minimalist filter design reducing screen space usage by 60%
- **localStorage Persistence**: View mode preference saved across sessions

### Changed
- **Dark Mode Button Position**: Moved from top-right to bottom-left corner for better accessibility
- **Show/Hide Completed Toggle**: Relocated from left filter area to right side next to view toggle
- **Filter Bar Height**: Reduced from ~150px to ~60px for more content visibility
- **Floating Action Buttons**: Simplified to single "Add Task" button (removed duplicate toggle)

### Fixed
- Vue template compilation errors in HomeView.vue
- List view not displaying due to incorrect v-if/v-else-if structure
- ViewToggle component not rendering due to template errors
- HMR (Hot Module Replacement) errors during development

### Improved
- Overall UI/UX with cleaner, more minimalist design
- Mobile responsiveness with compact components
- Visual feedback for task urgency and time management
- Code organization with new reusable components

## [1.0.0] - 2025-01-20

### Initial Release
- Core task management functionality
- Family member management with photo uploads
- Priority-based task organization (Urgent, Soon, Whenever)
- Category system with custom icons
- Real-time synchronization via WebSockets
- Dark mode support
- PWA capabilities for mobile installation
- Recurring tasks (daily, weekly, monthly)
- Long-press gesture for settings access
- SQLite database for data persistence
- Docker support for easy deployment