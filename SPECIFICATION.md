## 📖 PulseTrack Application Specification

### Overview

**PulseTrack** is a **local-first time tracking application** designed to help users monitor time spent on various activities, visualize progress toward goals, and maintain a detailed history of work sessions. All data is stored **locally in the browser using IndexedDB**, ensuring **privacy** and **offline availability**.

### Core Concepts

#### 1. Activities

Activities are the **primary entities** users track. They represent an action or goal the user wants to monitor.

| Attribute | Description | Examples |
| :--- | :--- | :--- |
| **Name** | Human-readable identifier | "Sleep", "Gym", "Coding" |
| **Goal** | Numeric target representing **hours** to be achieved | 8 hours, 10 hours |
| **Goal Scale** | The time period for the goal | Daily, Weekly, Monthly, Yearly |
| **Created At** | Timestamp of when the activity was created | |

#### 2. Sessions

Sessions represent specific **blocks of time logged** by the user. A session is a distinct event that can be associated with **multiple activities simultaneously**.

| Attribute | Description |
| :--- | :--- |
| **Name** | A short description of the session (e.g., "Morning Jog") |
| **Start Time** | Timestamp when the session began |
| **End Time** | Timestamp when the session ended |
| **Activities** | List of references to associated Activity IDs (Foreign Keys) |

#### 3. Time Scales

The application supports four time scale options for setting goals:

* **Daily**: Goals measured per 24-hour period.
* **Weekly**: Goals measured per 7-day period.
* **Monthly**: Goals measured per calendar month.
* **Yearly**: Goals measured per calendar year.

---

### Data Model

The application uses a relational model adapted for IndexedDB with two primary tables.

#### Database Schema

| Activities Table | Type | Description |
| :--- | :--- | :--- |
| **id** | number | Auto-incrementing primary key |
| **name** | string | Activity name |
| **goal** | number | Target hours for the goal |
| **goal\_scale** | string | Time scale: daily/weekly/monthly |
| **created\_at** | number | Timestamp (milliseconds since epoch) |

**Activities Table Indexes:** Primary: `id` (auto-increment); Indexed: `name`, `created_at`

| Sessions Table | Type | Description |
| :--- | :--- | :--- |
| **id** | number | Auto-incrementing primary key |
| **name** | string | User-defined name for the session |
| **start\_time** | number | Timestamp (milliseconds since epoch) |
| **end\_time** | number | Timestamp (milliseconds since epoch) |
| **activity\_ids** | array | Array of Activity IDs (Foreign Keys) |

**Sessions Table Indexes:** Primary: `id` (auto-increment); Indexed: `start_time`, `end_time`; Multi-entry index on `activity_ids`.

#### Relationships

* **Many-to-Many**: One Session can be associated with multiple Activities, and one Activity can be associated with many Sessions.
* **Referential Integrity**: When an **Activity is deleted**, its ID is removed from the `activity_ids` array of all associated sessions.

---

### Features and Functionality

#### 1. Activity Management

| Functionality | Details |
| :--- | :--- |
| **Create Activity** | User Input: Name (required), Goal hours (defaults to 0), Goal scale (defaults to "daily"). **Validation**: Name cannot be empty. |
| **View Activities** | Display: List of all activities sorted by **creation date**. |
| **Delete Activity** | **Action**: Deletes the Activity record AND removes its ID from the `activity_ids` array of all associated Sessions. |

#### 2. Session Management

| Functionality | Details |
| :--- | :--- |
| **Log Session** | User Input: Name, Start/End time, Activities (multi-select). **Validation**: End time > Start time; At least one Activity must be selected; Name cannot be empty. |
| **View Sessions** | **Display**: List of sessions, globally or filtered by Activity. **Sort Order**: Most recent first (`start_time` descending). Information includes Session Name, Full start datetime, **Duration** ("Xh Ym"), and associated Activity names (pills). |
| **Delete Session** | **Action**: Removes session record **completely**. |

#### 3. Data Visualization

* **Donut Chart (Per Activity)**:
    * **Purpose**: Visual representation of time spent vs. goal for a specific activity.
    * **Calculation**: Sum of durations of all sessions where `activity_ids` contains the current Activity ID.
    * **Multi-counting Principle**: A single session tagged with two activities contributes its **full duration** to the time tracked for *each* activity.

#### 4. Time Calculations

* **Duration Calculation**:
    * Process: $(end\_time - start\_time) / 1000$ (to get seconds) $\rightarrow$ convert to H:M.
    * Output Format: **"Xh Ym"** (e.g., "1h 30m").
* **Total Time Calculation (Per Activity)**:
    * Process: Sum all session durations for the sessions associated with the activity.
    * Precision: One decimal place.

#### 5. Default Data Seeding

The application runs a seeding system on mount if the database is empty.

* **Default Activities**: Sleep (8h daily), Gym (1h daily), Socializing (10h weekly).
* **Default Sessions (Examples)**: "Night's Rest" (8h, Activities: [Sleep]), "Evening Workout with Dave" (1.5h, Activities: [Gym, Socializing]).
* **Idempotency**: Checks if data exists before writing.

#### 6. Data Reset

* **Action**: **Truncate** Activities table, **Truncate** Sessions table, and **Re-run seed function**.
* **Result**: Returns the application to its initial state.

---

### User Interface

#### Layout Structure

| Panel | Contents |
| :--- | :--- |
| **Left Panel** (Activity List) | "Activities" Header, "Create Activity" button, List of Activities (clickable filters). |
| **Right Panel** (Main Content) | **Global View**: "Log Session" button, List of all recent sessions. **Activity Detail View**: Activity Name & Goal Stats, Donut Chart, "Log Session" button (pre-selects current activity), List of filtered sessions. |

#### Business Logic & Validation Rules

* **Validation Rules**: Session Name (Required, non-empty), Activity Selection (At least one must be selected), Time Integrity ($\text{End time} > \text{Start time}$).
* **Calculations (Multi-counting)**: If a user logs a 1-hour session for "Design" and "Meeting", it counts as 1 hour of Design work **and** 1 hour of Meeting work.

Would you like me to generate an example of the Donut Chart visualization based on the "Evening Workout with Dave" session?