import { db, type Task, type Session, type TimeScale } from './db';

export async function seedDatabase() {
    const tasksToCreate: { name: string; goal: number; goal_scale: TimeScale }[] = [
        { name: 'Sleep', goal: 8, goal_scale: 'daily' },
        { name: 'Gym', goal: 1, goal_scale: 'daily' },
        { name: 'Socializing', goal: 10, goal_scale: 'weekly' }
    ];

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    for (const taskData of tasksToCreate) {
        // Check if task exists
        let task = await db.tasks.where('name').equals(taskData.name).first();
        let taskId: number;

        if (!task) {
            taskId = await db.createTask(taskData.name, taskData.goal, taskData.goal_scale);
            console.log(`Created task: ${taskData.name}`);
        } else {
            taskId = task.id!;
            console.log(`Task already exists: ${taskData.name}`);
        }

        // Check if sessions exist for this task
        const sessionCount = await db.sessions.where('task_id').equals(taskId).count();
        if (sessionCount > 0) {
            console.log(`Skipping session generation for ${taskData.name}, data already exists.`);
            continue; // Already has data, skip to avoid duplicates
        }

        // Generate dummy sessions for the last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(now.getTime() - i * oneDay);
            let start: Date;
            let end: Date;
            let tags: string[] = [];

            if (taskData.name === 'Sleep') {
                // Sleep: 11 PM to 7 AM (approx)
                // Add some variance
                const wakeUpHour = 6 + Math.random() * 2; // 6am to 8am
                const sleepDuration = 7 + Math.random() * 2; // 7 to 9 hours

                end = new Date(date);
                end.setHours(Math.floor(wakeUpHour), Math.floor((wakeUpHour % 1) * 60), 0, 0);

                start = new Date(end);
                start.setTime(end.getTime() - sleepDuration * 60 * 60 * 1000);

                tags = ['rest', 'recharge'];
            } else if (taskData.name === 'Gym') {
                // Gym: 6 PM (approx)
                // Skip random days (e.g., 20% chance)
                if (Math.random() < 0.2) continue;

                const startHour = 17 + Math.random() * 2; // 5pm to 7pm
                start = new Date(date);
                start.setHours(Math.floor(startHour), Math.floor((startHour % 1) * 60), 0, 0);

                const duration = 0.75 + Math.random() * 0.75; // 45m to 1.5h
                end = new Date(start);
                end.setTime(start.getTime() + duration * 60 * 60 * 1000);

                tags = ['workout', 'health'];
            } else if (taskData.name === 'Socializing') {
                // Socializing: Fri/Sat evenings or random lunch
                const day = date.getDay(); // 0 = Sun, 6 = Sat

                if (day === 5 || day === 6) { // Fri or Sat
                    const startHour = 19 + Math.random() * 2; // 7pm to 9pm
                    start = new Date(date);
                    start.setHours(Math.floor(startHour), Math.floor((startHour % 1) * 60), 0, 0);

                    const duration = 2 + Math.random() * 2; // 2 to 4 hours
                    end = new Date(start);
                    end.setTime(start.getTime() + duration * 60 * 60 * 1000);
                    tags = ['friends', 'fun'];
                } else if (Math.random() < 0.3) { // Random weekday lunch/coffee
                    const startHour = 12 + Math.random(); // 12pm to 1pm
                    start = new Date(date);
                    start.setHours(Math.floor(startHour), Math.floor((startHour % 1) * 60), 0, 0);

                    const duration = 0.5 + Math.random() * 0.5; // 30m to 1h
                    end = new Date(start);
                    end.setTime(start.getTime() + duration * 60 * 60 * 1000);
                    tags = ['coffee', 'break'];
                } else {
                    continue;
                }
            } else {
                continue;
            }

            await db.addSession({
                task_id: taskId,
                start_time: start.getTime(),
                end_time: end.getTime(),
                tags: tags
            });
            console.log(`Added session for ${taskData.name} on ${date.toDateString()}`);
        }
    }

    console.log('Database seeded with default tasks and dummy data.');
}
