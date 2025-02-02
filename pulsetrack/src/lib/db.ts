import Dexie, { type Table } from 'dexie';

// Define the time scale type
type TimeScale = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Define interfaces
interface Task {
    id?: number;
    task_name: string;
    table_name: string;
    goal: number;
    goal_scale: TimeScale;
}

interface Session {
    id?: number;
    start_time: number;
    end_time: number;
    tags: string;
}

class TimeTrackingDatabase extends Dexie {
    all_tasks!: Table<Task>;
    [key: string]: Table | any;  // Allow dynamic table properties

    constructor() {
        super('TimeTrackingDatabase');

        // Initialize schemas object to track all table schemas
        this.schemas = {
          all_tasks: '++id, task_name, table_name, goal, goal_scale'
        };

        // Define the initial schema for all_tasks
        this.version(1).stores(this.schemas);

        // Handle subsequent versions and existing tables
        this.initializeExistingTables();
    }

    private async initializeExistingTables(): Promise<void> {
        try {
            // Open the database
            await this.open();

            // Get all existing tasks
            const tasks = await this.all_tasks.toArray();

            // Add each task's table to the schemas
            tasks.forEach(task => {
                this.schemas[task.table_name] = '++id, start_time, end_time, tags';
            });

            // If there are existing tasks, update the schema
            if (tasks.length > 0) {
                await this.updateSchema();
            }

            const loadedVerno = await new Dexie("TimeTrackingDatabase").open().then((db) => {
              db.close();
              return db.verno
            });
          await this.updateSchema(loadedVerno);
        } catch (error) {
            console.error('Error initializing existing tables:', error);
            throw error;
        }
    }


    // Used when adding/deleting a task type
    private async updateSchema(version = 0): Promise<void> {
        // Close current database instance
        await this.close();
        // Create new version with current schemas
        let newVersion = this.verno + 1;
        if (version !== 0){
          newVersion = version + 1;
        }
        this.version(newVersion).stores(this.schemas);
        
        // Reopen database with new schema
        await this.open();
    }

    // Method to list all available tasks
    async getAllTasks(): Promise<Task[]> {
        return await this.all_tasks.toArray();
    }

    // Method to create a new task-specific table
    async createTaskTable(taskName: string): Promise<void> {
      const tableName = `${taskName}_table`;
      
      // Check if table already exists
      const existingTask = await this.all_tasks.where('table_name').equals(tableName).first();
      if (existingTask) {
          throw new Error(`Task "${taskName}" already exists`);
      }

      // Add new table schema
      this.schemas[tableName] = '++id, start_time, end_time, tags';

      await this.updateSchema();
      
      // Add the task to all_tasks
      await this.all_tasks.add({
          task_name: taskName,
          table_name: tableName,
          goal: 0, // Default goal
          goal_scale: 'daily' as TimeScale // Default scale
      });
  }

    // Method to get a task-specific table
    getTaskTable(taskName: string): Table<Session> {
        const tableName = `${taskName}_table`;
        return this[tableName];
    }

    // Method to delete a task and its associated table
    async deleteTask(taskName: string): Promise<void> {
      const tableName = `${taskName}_table`;
      
      // Check if task exists
      const existingTask = await this.all_tasks.where('task_name').equals(taskName).first();
      if (!existingTask) {
          throw new Error(`Task "${taskName}" does not exist`);
      }

      try {
          // Delete all data from the task-specific table
          const taskTable = this.getTaskTable(taskName);
          await taskTable.clear();

          // Delete from all_tasks
          await this.all_tasks.where('task_name').equals(taskName).delete();

          // Remove table schema
          delete this.schemas[tableName];

          // Set the table schema to null to properly delete it
          const deleteSchema = { ...this.schemas };
          deleteSchema[tableName] = null;

          // Close current database instance
          await this.close();
          
          // Create new version that removes the table
          const newVersion = this.verno + 1;
          this.version(newVersion).stores(deleteSchema);
          
          // Reopen database with new schema
          await this.open();

      } catch (error) {
          // If something goes wrong, try to reopen the database
          await this.open();
          throw error;
      }
  }

    // Method to add a new session to a task
    async addSession(taskName: string, session: Omit<Session, 'id'>): Promise<number> {
        const table = this.getTaskTable(taskName);
        if (!table) {
            throw new Error(`Task "${taskName}" does not exist`);
        }
        return await table.add(session);
    }

    // Method to delete a session from a task
    async deleteSession(taskName: string, sessionId: number): Promise<void> {
        const table = this.getTaskTable(taskName);
        if (!table) {
            throw new Error(`Task "${taskName}" does not exist`);
        }
        await table.delete(sessionId);
    }

    // Method to get all sessions for a task
    async getTaskSessions(taskName: string): Promise<Session[]> {
        const table = this.getTaskTable(taskName);
        if (!table) {
            throw new Error(`Task "${taskName}" does not exist`);
        }
        return await table.toArray();
    }

    // Method to get sessions within a date range
    async getSessionsInRange(taskName: string, startDate: Date, endDate: Date): Promise<Session[]> {
        const table = this.getTaskTable(taskName);
        if (!table) {
            throw new Error(`Task "${taskName}" does not exist`);
        }
        
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        
        return await table
            .where('start_time')
            .between(startTime, endTime, true, true)
            .toArray();
    }
}

// Create and export database instance
export const db = new TimeTrackingDatabase();