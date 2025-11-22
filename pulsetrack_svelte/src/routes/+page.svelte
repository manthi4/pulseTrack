<script lang="ts">
	import DonutChart from '$lib/donutChart.svelte';
	import { db, type Task, type Session } from '$lib/db';
	import { onMount } from 'svelte';

	let tasks: Task[] = $state([]);
	let selectedTask: Task | null = $state(null);
	let sessions: Session[] = $state([]);
	let newTaskName = $state('');
	let newTaskGoal = $state(0);
	let newTaskGoalScale = $state('daily');
	let loading = $state(true);
	let error = $state('');

	// Form state for new session
	let sessionStart = $state(new Date().toISOString().slice(0, 16));
	let sessionEnd = $state(new Date().toISOString().slice(0, 16));
	let sessionTags = $state('');

	// Chart data
	let chartData = $derived.by(() => {
		if (!selectedTask) return [];

		const totalSeconds = sessions.reduce((acc, s) => acc + (s.end_time - s.start_time) / 1000, 0);
		const totalHours = totalSeconds / 3600;

		if (selectedTask.goal > 0) {
			const remaining = Math.max(0, selectedTask.goal - totalHours);
			return [
				{ label: 'Time Spent', value: totalHours, color: '#3b82f6' }, // Blue
				{ label: 'Remaining', value: remaining, color: '#e5e7eb' } // Gray
			];
		}

		return [{ label: 'Time Spent', value: totalHours, color: '#3b82f6' }];
	});

	import { seedDatabase } from '$lib/seed';

	onMount(async () => {
		await seedDatabase();
		await loadTasks();
	});

	async function loadTasks() {
		try {
			tasks = await db.getAllTasks();
			loading = false;
		} catch (e: any) {
			error = e.message;
			loading = false;
		}
	}

	async function createTask() {
		if (!newTaskName.trim()) {
			error = 'Task name cannot be empty';
			return;
		}

		try {
			error = '';
			await db.createTask(newTaskName, newTaskGoal, newTaskGoalScale as any);
			await loadTasks();
			newTaskName = '';
			newTaskGoal = 0;
		} catch (e: any) {
			error = e.message;
		}
	}

	async function selectTask(task: Task) {
		selectedTask = task;
		await loadSessions(task.id!);
	}

	async function deleteSelectedTask() {
		if (!selectedTask?.id) return;

		try {
			error = '';
			await db.deleteTask(selectedTask.id);
			selectedTask = null;
			sessions = [];
			await loadTasks();
		} catch (e: any) {
			error = e.message;
		}
	}

	async function loadSessions(taskId: number) {
		try {
			error = '';
			sessions = await db.getTaskSessions(taskId);
		} catch (e: any) {
			error = e.message;
		}
	}

	async function addSession() {
		if (!selectedTask?.id) return;

		try {
			error = '';
			const start = new Date(sessionStart).getTime();
			const end = new Date(sessionEnd).getTime();

			if (end <= start) {
				error = 'End time must be after start time';
				return;
			}

			await db.addSession({
				task_id: selectedTask.id,
				start_time: start,
				end_time: end,
				tags: sessionTags
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t)
			});

			await loadSessions(selectedTask.id);

			// Reset form
			sessionStart = new Date().toISOString().slice(0, 16);
			sessionEnd = new Date().toISOString().slice(0, 16);
			sessionTags = '';
		} catch (e: any) {
			error = e.message;
		}
	}

	async function deleteSession(sessionId: number) {
		if (!selectedTask?.id) return;

		try {
			error = '';
			await db.deleteSession(sessionId);
			await loadSessions(selectedTask.id);
		} catch (e: any) {
			error = e.message;
		}
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}

	function calculateDuration(start: number, end: number): string {
		const duration = (end - start) / 1000; // Convert to seconds
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		return `${hours}h ${minutes}m`;
	}

	async function resetData() {
		if (!confirm('Are you sure you want to reset all data and reload dummy data?')) return;

		try {
			await db.tasks.clear();
			await db.sessions.clear();
			await seedDatabase();
			await loadTasks();
			selectedTask = null;
			sessions = [];
		} catch (e: any) {
			error = e.message;
		}
	}
</script>

<svelte:head>
	<title>PulseTrack</title>
	<meta name="description" content="Track your time with PulseTrack" />
</svelte:head>

<div class="container mx-auto max-w-5xl p-6">
	<header class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-slate-800">PulseTrack</h1>
		<button
			onclick={resetData}
			class="rounded-md bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-300"
		>
			Reset Demo Data
		</button>
	</header>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
			{error}
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Left Sidebar: Task List -->
		<div class="lg:col-span-1">
			<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-slate-800">Tasks</h2>

				<!-- Create Task Form -->
				<div class="mb-6 space-y-3">
					<input
						type="text"
						bind:value={newTaskName}
						placeholder="New task name..."
						class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
					<div class="flex gap-2">
						<input
							type="number"
							bind:value={newTaskGoal}
							placeholder="Goal (hrs)"
							min="0"
							class="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						<select
							bind:value={newTaskGoalScale}
							class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="daily">Daily</option>
							<option value="weekly">Weekly</option>
							<option value="monthly">Monthly</option>
						</select>
					</div>
					<button
						onclick={createTask}
						class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						Create Task
					</button>
				</div>

				<!-- Task List -->
				<div class="space-y-2">
					{#if loading}
						<p class="text-sm text-slate-500">Loading tasks...</p>
					{:else if tasks.length === 0}
						<p class="text-sm text-slate-500">No tasks yet.</p>
					{:else}
						{#each tasks as task}
							<button
								class="w-full rounded-lg px-4 py-3 text-left transition-colors {selectedTask?.id ===
								task.id
									? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
									: 'bg-slate-50 text-slate-700 hover:bg-slate-100'}"
								onclick={() => selectTask(task)}
							>
								<div class="font-medium">{task.name}</div>
								{#if task.goal > 0}
									<div class="text-xs opacity-75">Goal: {task.goal}h / {task.goal_scale}</div>
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- Main Content: Task Details -->
		<div class="lg:col-span-2">
			{#if selectedTask}
				<div class="space-y-6">
					<!-- Header & Stats -->
					<div
						class="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row"
					>
						<div class="flex-1">
							<div class="flex items-start justify-between">
								<div>
									<h2 class="text-2xl font-bold text-slate-800">{selectedTask.name}</h2>
									<p class="text-sm text-slate-500">
										Created {new Date(selectedTask.created_at).toLocaleDateString()}
									</p>
								</div>
								<button
									onclick={deleteSelectedTask}
									class="rounded-md text-sm text-red-600 hover:text-red-800 hover:underline"
								>
									Delete Task
								</button>
							</div>

							<div class="mt-6">
								<h3 class="mb-3 text-lg font-semibold text-slate-700">Add Session</h3>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label for="session-start" class="mb-1 block text-xs font-medium text-slate-500"
											>Start</label
										>
										<input
											id="session-start"
											type="datetime-local"
											bind:value={sessionStart}
											class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
										/>
									</div>
									<div>
										<label for="session-end" class="mb-1 block text-xs font-medium text-slate-500"
											>End</label
										>
										<input
											id="session-end"
											type="datetime-local"
											bind:value={sessionEnd}
											class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
										/>
									</div>
									<div class="sm:col-span-2">
										<label for="session-tags" class="mb-1 block text-xs font-medium text-slate-500"
											>Tags</label
										>
										<input
											id="session-tags"
											type="text"
											bind:value={sessionTags}
											placeholder="work, deep-focus"
											class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
										/>
									</div>
									<div class="sm:col-span-2">
										<button
											onclick={addSession}
											class="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
										>
											Log Session
										</button>
									</div>
								</div>
							</div>
						</div>

						<!-- Chart -->
						<div
							class="flex flex-col items-center justify-center border-t pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0"
						>
							<DonutChart data={chartData} title="" width={200} height={200} thickness={0.2} />
							<div class="mt-2 text-center">
								<div class="text-2xl font-bold text-slate-800">
									{chartData[0]?.value.toFixed(1)}h
								</div>
								<div class="text-xs text-slate-500">Total Time</div>
							</div>
						</div>
					</div>

					<!-- Session History -->
					<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
						<h3 class="mb-4 text-lg font-semibold text-slate-700">History</h3>
						{#if sessions.length === 0}
							<p class="text-sm text-slate-500">No sessions recorded yet.</p>
						{:else}
							<div class="divide-y divide-slate-100">
								{#each sessions.sort((a, b) => b.start_time - a.start_time) as session}
									<div class="flex items-center justify-between py-3">
										<div>
											<div class="font-medium text-slate-800">
												{formatDate(session.start_time)} - {new Date(
													session.end_time
												).toLocaleTimeString()}
											</div>
											<div class="flex items-center gap-2 text-sm text-slate-500">
												<span>{calculateDuration(session.start_time, session.end_time)}</span>
												{#if session.tags && session.tags.length > 0}
													<span class="text-slate-300">•</span>
													<div class="flex gap-1">
														{#each session.tags as tag}
															<span
																class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
															>
																{tag}
															</span>
														{/each}
													</div>
												{/if}
											</div>
										</div>
										<button
											onclick={() => deleteSession(session.id!)}
											class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
											title="Delete session"
											aria-label="Delete session"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
													d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
												/></svg
											>
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<div
					class="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500"
				>
					<p class="text-lg">Select a task to view details</p>
					<p class="text-sm">or create a new one to get started</p>
				</div>
			{/if}
		</div>
	</div>
</div>
