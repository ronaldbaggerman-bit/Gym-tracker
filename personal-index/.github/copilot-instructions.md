# AI Coding Agent Instructions for Personal Index Project

## Project Overview
This is a personal productivity dashboard web application with three main modules:
- **Actielijst** (Task List): Manages tasks, to-dos, and deadlines with project categorization
- **Werknemerplanning** (Employee Planning): Handles employee scheduling, leave management, and occupancy tracking
- **Besluitenpagina** (Decisions Page): Tracks important decisions, options documentation, and decision-making progress

The app uses browser localStorage for data persistence with no server backend. All data is stored locally in the user's browser.

## Architecture & Data Flow
- **Multi-page structure**: Each module has dedicated HTML, CSS, and JS files (e.g., `actielijst.html`, `actielijst-styles.css`, `actielijst-script.js`)
- **Shared data**: Projects array is shared across all modules via localStorage key `'projects'`
- **Module-specific data**:
  - Tasks: `'tasks'` (array of task objects)
  - Decisions: `'decisions'` (array of decision objects)  
  - Employee planning: `'workplanning_employees'` and `'workplanning_leaves'`
- **Data flow**: Load from localStorage on page load → Modify in memory → Save to localStorage on changes

## Key Data Structures

### Task Object (from actielijst)
```javascript
{
  id: string,           // Unique identifier (timestamp)
  title: string,        // Task title
  description: string,  // Optional description
  project: string,      // Associated project name
  status: string,       // 'todo' | 'in-progress' | 'blocked' | 'review' | 'done'
  priority: string,     // 'low' | 'medium' | 'high'
  deadline: string,     // ISO date string
  startDate: string,    // ISO date string
  endDate: string,      // ISO date string
  assignedTo: string,   // Assignee name
  tags: array,          // Array of tag strings
  completed: boolean,   // Completion status
  createdAt: string,    // ISO timestamp
  log: array,           // Activity log entries
  comments: array       // Comment objects
}
```

### Decision Object (from besluitenpagina)
```javascript
{
  id: string,
  title: string,
  description: string,
  project: string,
  status: string,       // 'pending' | 'approved' | 'rejected' | 'implemented'
  options: array,       // Decision options
  chosenOption: string,
  deadline: string,
  createdAt: string
}
```

## Development Workflow
- **No build process**: Open HTML files directly in browser
- **Testing**: Manual testing in browser, refresh to see changes
- **Data persistence**: All changes saved to localStorage automatically
- **Cross-module consistency**: Projects must be kept in sync across `'projects'` localStorage key

## Code Patterns & Conventions

### Language & Localization
- **Primary language**: Dutch (nl) - all user-facing text in Dutch
- **Code comments**: Mix of Dutch and English
- **Variable names**: English for technical terms, Dutch for domain concepts

### Styling Patterns
- **CSS Variables**: Extensive use of CSS custom properties in `:root` for theming
- **Dark theme**: Professional dark color scheme with gradients
- **Component classes**: Consistent naming (e.g., `.btn`, `.modal`, `.stat-card`)
- **Responsive design**: Mobile-first approach with flexbox/grid layouts

### JavaScript Patterns
- **Global state**: Module-level variables for data arrays (e.g., `let tasks = []`)
- **Event handling**: Direct onclick attributes in HTML, event listeners in JS
- **Data loading**: `loadData()` function called on window load
- **Data saving**: `saveData()` function called after mutations
- **DOM manipulation**: Direct innerHTML updates for rendering
- **Modal patterns**: CSS-based modal overlays with `.active` class toggle

### File Organization
- **Common styles**: `common-styles.css` shared across all pages
- **Page-specific styles**: Each page has its own `-styles.css` file
- **Script structure**: Event handlers, data functions, render functions, utility functions

## Critical Integration Points
- **Project management**: Changes to projects array must update all modules
- **Data export/import**: JSON format with specific key filtering (see `exportAllData()` in `index-script.js`)
- **Cross-page navigation**: Simple `window.location.href` navigation
- **Shared components**: Modal dialogs, form handling patterns consistent across modules

## Common Modification Patterns
- **Adding new fields**: Update both creation forms and rendering logic
- **New status values**: Update filter dropdowns, status displays, and validation
- **Styling changes**: Modify CSS variables in `common-styles.css` for theme consistency
- **New pages**: Follow existing pattern: `name.html`, `name-styles.css`, `name-script.js`

## Example Code Patterns

### Loading Data Pattern
```javascript
function loadTasks() {
    const stored = localStorage.getItem('tasks');
    tasks = stored ? JSON.parse(stored) : [];
    renderTasks();
}
```

### Saving Data Pattern
```javascript
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateStats();
}
```

### Rendering Pattern
```javascript
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = tasks.map(task => `
        <div class="task-card">
            <div class="task-title">${task.title}</div>
            <!-- more rendering -->
        </div>
    `).join('');
}
```

## Quality Assurance
- **Data integrity**: Always validate localStorage JSON parsing
- **UI consistency**: Use existing CSS classes and patterns
- **Cross-browser**: Test in modern browsers (Chrome, Firefox, Edge)
- **Performance**: Minimize DOM updates, use efficient selectors</content>
<parameter name="filePath">c:\Users\Baggerman\Projecten\personal-index\.github\copilot-instructions.md