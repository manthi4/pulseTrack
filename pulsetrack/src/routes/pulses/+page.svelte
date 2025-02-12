<script lang="ts">
	import DonutChart from '$lib/donutChart.svelte';
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { onMount } from 'svelte';
	import type { Task, Session } from '$lib/db';

	/// Claude code start:
	let tasks: Task[] = $state([]);
	let selectedTask: string = $state(null);
	let sessions: Session[] = $state([]);
	let newTaskName = $state('');
	let loading = $state(true);
	let error = $state('');

	// Form state for new session
	let sessionStart =  new Date().toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
	let sessionEnd = new Date().toISOString().slice(0, 16);
	let sessionTags = '';

	onMount(async () => {
		try {
			tasks = await db.getAllTasks();
			loading = false;
		} catch (e) {
			error = e.message;
			loading = false;
		}
	});

	async function createTask() {
		if (!newTaskName.trim()) {
			error = 'Task name cannot be empty';
			return;
		}

		try {
			error = '';
			await db.createTaskTable(newTaskName);
			tasks = await db.getAllTasks();
			newTaskName = '';
		} catch (e) {
			error = e.message;
		}
	}

	async function deleteSelectedTask() {
		if (!selectedTask) return;

		try {
			error = '';
			await db.deleteTask(selectedTask);
			tasks = await db.getAllTasks();
			selectedTask = null;
			sessions = [];
		} catch (e) {
			error = e.message;
		}
	}

	async function loadSessions(taskName: string) {
		if (!taskName) return;

		try {
			error = '';
			selectedTask = taskName;
			sessions = await db.getTaskSessions(taskName);
		} catch (e) {
			error = e.message;
		}
	}

	async function addSession() {
		if (!selectedTask) return;

		try {
			error = '';
			const start = new Date(sessionStart).getTime();
			const end = new Date(sessionEnd).getTime();

			if (end <= start) {
				error = 'End time must be after start time';
				return;
			}

			await db.addSession(selectedTask, {
				start_time: start,
				end_time: end,
				tags: sessionTags
			});

			sessions = await db.getTaskSessions(selectedTask);

			// Reset form
			sessionStart = new Date().toISOString().slice(0, 16);
			sessionEnd = new Date().toISOString().slice(0, 16);
			sessionTags = '';
		} catch (e) {
			error = e.message;
		}
	}

	async function deleteSession(sessionId: number) {
		if (!selectedTask) return;

		try {
			error = '';
			await db.deleteSession(selectedTask, sessionId);
			sessions = await db.getTaskSessions(selectedTask);
		} catch (e) {
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
	/// Claude code end:

	let startTime = $state(0);
	let endTime = $state(10);
	async function addDevTime() {
		try {
			const id = await db.devTimes.add({
				start_time: startTime,
				end_time: endTime
			});
			console.log(`got id ${id}`);

			startTime = 0;
			endTime = 10;
		} catch (error) {
			console.log('Failed to add to db');
		}
	}

	let devTimeData = liveQuery(() => db.devTimes.toArray());

	let pulses = $state([
		{
			title: 'Dev time',
			data: [
				{
					label: 'Time Spent',
					value: 9,
					color: '#262626'
				},
				{
					label: 'Remaining Time',
					value: 6,
					color: '#a3a3a3'
				}
			]
		},
		{
			title: 'Sleep time',
			data: [
				{
					label: 'Time Spent',
					value: 3,
					color: '#3730a3'
				},
				{
					label: 'Remaining Time',
					value: 6,
					color: '#a5b4fc'
				}
			]
		},
		{
			title: 'Lang time',
			data: [
				{
					label: 'Time Spent',
					value: 3,
					color: '#166534'
				},
				{
					label: 'Remaining Time',
					value: 1,
					color: '#86efac'
				}
			]
		},
		{
			title: 'Exercise time',
			data: [
				{
					label: 'Time Spent',
					value: 1,
					color: '#9a3412'
				},
				{
					label: 'Remaining Time',
					value: 6,
					color: '#fdba74'
				}
			]
		},
		{
			title: 'ML time',
			data: [
				{
					label: 'Time Spent',
					value: 4,
					color: '#175985'
				},
				{
					label: 'Remaining Time',
					value: 6,
					color: '#7dd3fc'
				}
			]
		}
	]);

	function increment(pulse: { data: any[] }): None {
		pulse.data.forEach((element) => {
			if (element['label'] == 'Time Spent') {
				element['value'] = element['value'] + 1;
			} else {
				element['value'] = element['value'] - 1;
			}
		});
	}

	function decrement(pulse: { data: any[] }): None {
		pulse.data.forEach((element) => {
			if (element['label'] == 'Time Spent') {
				element['value'] = element['value'] - 1;
			} else {
				element['value'] = element['value'] + 1;
			}
		});
	}
</script>

<svelte:head>
	<title>Pulses</title>
	<meta name="description" content="Pulses" />
</svelte:head>

<div class="w-full border-2 border-rose-400 p-1">
	<h1>Current Pulses</h1>
	<div class="flex w-full flex-row flex-wrap justify-around gap-10 border-2 border-purple-500 p-1">
		{#each pulses as pulse}
			<DonutChart
				bind:data={pulse.data}
				title={pulse.title}
				onIncrement={() => increment(pulse)}
				onDecrement={() => decrement(pulse)}
			></DonutChart>
		{/each}
	</div>
	<h1>Add data</h1>
	<fieldset>
		<legend>Add new friend</legend>
		<label>
			start time:
			<input type="number" bind:value={startTime} />
		</label>
		<br />
		<label>
			Age:
			<input type="number" bind:value={endTime} />
		</label>
		<br />
		<button onclick={addDevTime}>Add time</button>
	</fieldset>
	<ul>
		{#if $devTimeData}
			{#each $devTimeData as devSession (devSession.id)}
				<li>{devSession.start_time}, {devSession.end_time}</li>
			{/each}
		{/if}
	</ul>
</div>

/// Claude code start:

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Time Tracking</h1>

	{#if error}
		<div class="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
			{error}
		</div>
	{/if}

	<!-- Create new task -->
	<div class="mb-6">
		<h2 class="mb-2 text-xl font-semibold">Create New Task</h2>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={newTaskName}
				placeholder="Enter task name"
				class="flex-1 rounded border p-2"
			/>
			<button
				onclick={createTask}
				class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
			>
				Create Task
			</button>
		</div>
	</div>

	<!-- Task list -->
	<div class="mb-6">
		<h2 class="mb-2 text-xl font-semibold">Tasks</h2>
		{#if loading}
			<p>Loading tasks...</p>
		{:else if tasks.length === 0}
			<p>No tasks created yet.</p>
		{:else}
			<div class="grid grid-cols-1 gap-2">
				{#each tasks as task}
					<button
						class="rounded border p-2 text-left {selectedTask === task.task_name
							? 'bg-blue-100'
							: 'hover:bg-gray-100'}"
						onclick={() => loadSessions(task.task_name)}
					>
						{task.task_name}
					</button>
				{/each}
			</div>
			{#if selectedTask}
				<button
					onclick={deleteSelectedTask}
					class="mt-2 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
				>
					Delete Selected Task
				</button>
			{/if}
		{/if}
	</div>

	<!-- Sessions -->
	{#if selectedTask}
		<div class="mb-6">
			<h2 class="mb-2 text-xl font-semibold">Add Session for {selectedTask}</h2>
			<div class="mb-4 grid grid-cols-1 gap-2">
				<div>
					<label class="mb-1 block text-sm font-medium">Start Time</label>
					<input
						type="datetime-local"
						bind:value={sessionStart}
						class="w-full rounded border p-2"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium">End Time</label>
					<input type="datetime-local" bind:value={sessionEnd} class="w-full rounded border p-2" />
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium">Tags (comma-separated)</label>
					<input
						type="text"
						bind:value={sessionTags}
						placeholder="work, meeting, etc."
						class="w-full rounded border p-2"
					/>
				</div>
				<button
					onclick={addSession}
					class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
				>
					Add Session
				</button>
			</div>

			<h2 class="mb-2 text-xl font-semibold">Sessions</h2>
			{#if sessions.length === 0}
				<p>No sessions recorded yet.</p>
			{:else}
				<div class="grid grid-cols-1 gap-2">
					{#each sessions as session}
						<div class="rounded border p-2">
							<div class="flex items-start justify-between">
								<div>
									<div>Start: {formatDate(session.start_time)}</div>
									<div>End: {formatDate(session.end_time)}</div>
									<div>Duration: {calculateDuration(session.start_time, session.end_time)}</div>
									{#if session.tags}
										<div>Tags: {session.tags}</div>
									{/if}
								</div>
								<button
									onclick={() => deleteSession(session.id)}
									class="text-red-500 hover:text-red-700"
								>
									Delete
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

/// Claude code end:

<style>
	/* span {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		font-size: 0.8em;
		width: 2.4em;
		height: 2.4em;
		background-color: white;
		box-sizing: border-box;
		border-radius: 2px;
		border-width: 2px;
		color: rgba(0, 0, 0, 0.7);
	}

	.missing {
		background: rgba(255, 255, 255, 0.5);
		color: rgba(0, 0, 0, 0.5);
	}

	.close {
		border-style: solid;
		border-color: var(--color-theme-2);
	}

	.exact {
		background: var(--color-theme-2);
		color: white;
	}

	.example {
		display: flex;
		justify-content: flex-start;
		margin: 1rem 0;
		gap: 0.2rem;
	}

	.example span {
		font-size: 1.4rem;
	}

	p span {
		position: relative;
		border-width: 1px;
		border-radius: 1px;
		font-size: 0.4em;
		transform: scale(2) translate(0, -10%);
		margin: 0 1em;
	} */
</style>
