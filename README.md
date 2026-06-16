# Forth

A task management system with two modes: Create Mode for organizing tasks in nested containers, and Execution Mode for prioritizing and executing tasks across all containers.

## Features

### Create Mode
- **Nested Containers**: Create containers that can contain tasks or other containers (unlimited nesting)
- **Visual Hierarchy**: Clear indentation and folder icons show the container structure
- **Task Management**: Add tasks to any container with checkboxes to mark completion
- **Easy Organization**: Add containers and tasks with inline forms

### Execution Mode
- **Unified View**: See all tasks from all containers in a single prioritized list
- **Priority Management**: Reorder tasks using up/down controls to set priorities
- **Container Context**: Each task shows which container it belongs to
- **Filtering**: Toggle visibility of completed tasks

## Technology Stack

- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **LocalStorage** for data persistence
- **Lucide React** for icons

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## GitHub Pages Deployment

This project is configured to deploy automatically to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Enable GitHub Pages**:
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"

2. **Configure Base Path** (if needed):
   - If your repository name is different from `forth`, update the base path in `vite.config.ts`
   - Change `/forth/` to match your repository name
   - Or set the `VITE_BASE_PATH` environment variable in your GitHub Actions workflow

3. **Deploy**:
   - Push to the `main` branch
   - The GitHub Actions workflow will automatically build and deploy your site
   - Your site will be available at `https://jovianx.github.io/forth/`

### Manual Deployment

If you prefer to deploy manually:

```bash
npm run build
# Then upload the contents of the 'dist' folder to your GitHub Pages branch
```

## Usage

1. **Create Mode**: Switch to Create Mode to organize your tasks
   - Click "Add Container" to create a new container
   - Click "Add Task" within a container to add tasks
   - Use checkboxes to mark tasks as complete
   - Delete containers or tasks by hovering and clicking the trash icon

2. **Execution Mode**: Switch to Execution Mode to prioritize and execute
   - All tasks from all containers are shown in a single list
   - Use the up/down arrows to change task priority
   - Tasks are sorted by priority (highest first)
   - Toggle "Show completed tasks" to filter completed items

## Data Storage

All data is stored locally in your browser's LocalStorage. Your tasks and containers persist between sessions automatically.

## Project Structure

```
src/
├── components/
│   ├── ModeSwitcher.tsx          # Mode toggle component
│   ├── create-mode/               # Create Mode components
│   ├── execution-mode/            # Execution Mode components
│   └── shared/                    # Shared components
├── context/
│   └── TaskContext.tsx            # Global state management
├── hooks/
│   └── useLocalStorage.ts         # LocalStorage sync hook
├── types/
│   └── index.ts                   # TypeScript types
└── utils/
    ├── storage.ts                 # Storage utilities
    └── taskUtils.ts               # Task manipulation utilities
```

## License

MIT
