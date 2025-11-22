# PulseTrack

PulseTrack is a local-first time tracking application built with SvelteKit. It allows users to track time spent on various tasks, visualize their data, and manage their sessions entirely within the browser using IndexedDB.

## Features

- **Task Management**: Create and delete custom tasks dynamically.
- **Session Tracking**: Log time sessions with precise start and end times.
- **Tagging**: Add tags to sessions for better categorization.
- **Visualization**: View time distribution using interactive Donut charts.
- **Local-First**: All data is stored locally in your browser using IndexedDB (via Dexie.js), ensuring privacy and offline availability.
- **Dynamic Schema**: The application uses a dynamic database schema where each task gets its own table.

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Charts**: Custom SVG Donut Chart component (D3.js dependency present in root, but custom implementation used).
- **UI Components**: [Bits UI](https://www.bits-ui.com/)

## Project Structure

- `src/routes/pulses`: Contains the main application logic and UI.
  - `+page.svelte`: The primary dashboard for managing tasks and sessions.
- `src/lib/db.ts`: Database configuration and abstraction layer using Dexie.js. Handles dynamic table creation for tasks.
- `src/lib/donutChart.svelte`: Reusable component for visualizing time data.
- `src/routes/+page.svelte`: Landing page (currently default SvelteKit welcome).

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm, pnpm, or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd pulsetrack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Building for Production

To create a production build:

```bash
npm run build
```

You can preview the production build with:

```bash
npm run preview
```
