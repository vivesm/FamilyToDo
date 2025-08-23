# Product Requirements Document (PRD)
## FamilyToDo - Visual Task Management for iPad

### Executive Summary
FamilyToDo is a visual, touch-optimized task management web application designed specifically for iPad use in family environments. The app emphasizes visual communication over text, using photos, colors, and icons to make task management intuitive for all family members regardless of age or reading ability.

### Problem Statement
Existing todo apps are text-heavy, require complex account setups, and aren't optimized for shared family use on a wall-mounted iPad. Families need a simple, visual way to manage tasks that works for both adults and children without requiring individual logins or complex navigation.

### Target Users
- **Primary**: Families with children (ages 5+) using a shared iPad
- **Secondary**: Multi-generational households
- **Use Case**: Wall-mounted or kitchen counter iPad serving as family command center

### Core Requirements

#### 1. Visual Person Assignment
- **Photo-based identification**: Each family member represented by their photo
- **No text names required**: Visual recognition only
- **Quick assignment**: Tap photo to assign/filter tasks
- **Multi-person tasks**: Support assigning to multiple people

#### 2. No Authentication
- **Zero login**: Direct access via Tailscale VPN
- **No user accounts**: Single shared interface
- **Instant access**: Open app and immediately usable
- **Privacy by design**: Self-hosted on family VPS

#### 3. Visual Priority System
- **Color coding**:
  - 🔴 Red border/glow = Urgent (today)
  - 🟡 Yellow border/glow = Soon (this week)
  - 🟢 Green border/glow = Whenever
- **No priority text labels**
- **Visual sorting**: Urgent tasks float to top

#### 4. Category Icons
- **Pre-defined categories**:
  - 🛒 Shopping
  - 🏠 Home/Chores
  - 📚 Homework/School
  - 🏃 Activities/Sports
  - 💊 Health/Medicine
  - 🎮 Fun/Recreation
  - ➕ Custom categories
- **Icon-only display**: No category text on cards

#### 5. Task Features
- **Due dates**: Visual calendar picker
- **Recurring tasks**: Daily/Weekly/Monthly with icons
- **Reminders**: Visual + audio alerts
- **Completion**: Satisfying animation/sound
- **Task notes**: Optional, hidden by default

#### 6. Google Calendar Integration
- **Two-way sync**: Tasks ↔️ Calendar events
- **Family calendar**: Sync to shared Google Calendar
- **Remote updates**: Add tasks via Google Calendar from anywhere
- **Color mapping**: Priority colors match calendar
- **Smart sync**: Only sync incomplete tasks

#### 7. Motion Detection Alert
- **Camera monitoring**: Uses iPad front camera
- **Movement trigger**: Flash screen when someone walks by
- **Smart alerts**: Show urgent/overdue tasks
- **Privacy mode**: Can disable camera
- **Customizable sensitivity**: Adjust detection threshold

### User Interface Requirements

#### Layout
```
┌────────────────────────────────────────────┐
│  [👤Dad] [👤Mom] [👤Kid1] [👤Kid2] [👥All] │ <- Person filter (photos)
├────────────────────────────────────────────┤
│  [🛒] [🏠] [📚] [🏃] [💊] [🎮] [All]      │ <- Category filter (icons)
├────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐           │
│ │ 🛒 Buy Milk │ │ 🏠 Clean    │           │ <- Task cards
│ │ [👤Dad]     │ │ [👤Kid1]    │           │    (large, touchable)
│ │ 🔴 Today 5pm│ │ 🟡 Thursday │           │
│ └─────────────┘ └─────────────┘           │
│                                            │
│ ┌─────────────┐ ┌─────────────┐           │
│ │ 📚 Math HW  │ │ 🏃 Soccer   │           │
│ │ [👤Kid2]    │ │ [👤Kid1]    │           │
│ │ 🟡 Tomorrow │ │ 🟢 Saturday │           │
│ └─────────────┘ └─────────────┘           │
└────────────────────────────────────────────┘
│          [➕ Add Task]                     │ <- Big add button
└────────────────────────────────────────────┘
```

#### Design Principles
- **Touch-first**: Minimum 44x44pt touch targets
- **High contrast**: Clear visibility from distance
- **Large text**: Minimum 16pt, preferably 20pt+
- **Animations**: Smooth, satisfying feedback
- **Sound effects**: Optional completion sounds
- **Dark mode**: Auto-switch based on time

### Technical Requirements

#### Frontend
- **Framework**: Vue.js 3 or React
- **Styling**: Tailwind CSS
- **PWA**: Installable, offline-capable
- **Responsive**: Optimized for iPad (1024x768 minimum)
- **Touch gestures**: Swipe to complete, drag to reorder
- **Camera API**: getUserMedia for motion detection

#### Backend
- **Runtime**: Node.js + Express
- **Database**: SQLite (simple, no setup)
- **API**: RESTful + WebSocket (Socket.io)
- **Calendar**: Google Calendar API v3
- **File storage**: Local for photos

#### Infrastructure
- **Container**: Docker
- **Proxy**: Caddy (HTTPS)
- **VPN**: Tailscale only access
- **Deployment**: Single VPS
- **Backup**: Daily SQLite backup

### Data Model

```sql
-- People
CREATE TABLE people (
  id INTEGER PRIMARY KEY,
  name TEXT,
  photo_url TEXT,
  color TEXT,
  created_at DATETIME
);

-- Categories
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER
);

-- Tasks
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id INTEGER,
  priority INTEGER, -- 1=urgent, 2=soon, 3=whenever
  due_date DATETIME,
  recurring_pattern TEXT, -- daily, weekly, monthly
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  google_event_id TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Task Assignments
CREATE TABLE task_assignments (
  task_id INTEGER,
  person_id INTEGER,
  PRIMARY KEY (task_id, person_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (person_id) REFERENCES people(id)
);
```

### API Endpoints

```javascript
// People
GET    /api/people          // List all people
POST   /api/people          // Add person
PUT    /api/people/:id      // Update person
DELETE /api/people/:id      // Remove person

// Tasks
GET    /api/tasks           // List tasks (with filters)
POST   /api/tasks           // Create task
PUT    /api/tasks/:id       // Update task
DELETE /api/tasks/:id       // Delete task
POST   /api/tasks/:id/complete   // Mark complete
POST   /api/tasks/:id/uncomplete // Mark incomplete

// Categories
GET    /api/categories      // List categories
POST   /api/categories      // Add category

// Calendar
POST   /api/calendar/sync   // Trigger sync
GET    /api/calendar/auth   // OAuth flow
POST   /api/calendar/webhook // Calendar changes

// Motion Detection
GET    /api/motion/status   // Camera status
POST   /api/motion/toggle   // Enable/disable
PUT    /api/motion/sensitivity // Adjust threshold
```

### Security Requirements
- **VPN-only access**: Tailscale required
- **No public exposure**: Bind to Tailscale interface only
- **Photo privacy**: Store locally, not in cloud
- **Calendar OAuth**: Secure token storage
- **XSS prevention**: Sanitize all inputs
- **CORS**: Restrict to Tailscale network

### Performance Requirements
- **Load time**: <2 seconds on iPad
- **Interaction**: <100ms response to touch
- **Sync**: Background sync every 5 minutes
- **Offline**: Full functionality without internet
- **Camera**: <5% CPU for motion detection

### Success Metrics
- **Adoption**: All family members using within 1 week
- **Task completion**: 80%+ tasks marked complete
- **Daily active use**: App opened 5+ times per day
- **Task creation**: 10+ tasks created per week
- **Zero login issues**: No authentication problems

### Future Enhancements (Phase 2)
- Voice input ("Hey Siri, add milk to shopping")
- Reward system for kids (points, badges)
- Task templates for common chores
- Family dashboard with statistics
- Apple Watch companion app
- Natural language due dates
- Photo attachments to tasks
- Location-based reminders

### Development Phases

#### Phase 1: MVP (Week 1-2)
- Basic task CRUD
- Person management with photos
- Visual priority system
- Category icons
- SQLite database

#### Phase 2: Core Features (Week 3-4)
- Due dates and recurring tasks
- Drag-and-drop assignment
- Touch gestures
- PWA configuration
- Docker deployment

#### Phase 3: Integration (Week 5-6)
- Google Calendar sync
- Motion detection
- Real-time updates
- Reminder system
- Tailscale setup

#### Phase 4: Polish (Week 7-8)
- Animations and sounds
- Dark mode
- Performance optimization
- Testing on actual iPad
- Family onboarding

### Acceptance Criteria
- [ ] Tasks can be created with photo assignment
- [ ] Visual priority clearly distinguishable
- [ ] Categories shown as icons only
- [ ] Touch targets ≥44pt
- [ ] Google Calendar sync working
- [ ] Motion detection triggers alerts
- [ ] Works offline
- [ ] Accessible via Tailscale only
- [ ] <2 second load time
- [ ] No text required for basic operations

### Risk Mitigation
- **Risk**: Camera API not available
  - **Mitigation**: Graceful degradation, motion detection optional
- **Risk**: Google Calendar rate limits
  - **Mitigation**: Batch updates, exponential backoff
- **Risk**: Kids accidentally deleting tasks
  - **Mitigation**: Soft delete, undo functionality
- **Risk**: Photo storage space
  - **Mitigation**: Compress images, limit to 5 people

### Appendix: Design Inspiration
- Apple Reminders (simplicity)
- Todoist (task management)
- Any.do (visual design)
- Cozi (family focus)
- Pinterest (visual cards)
- iOS Control Center (touch targets)