<script>
	import * as d3 from 'd3';
	import Card from './card.svelte';
	import { Button } from '$lib/components/ui/button';

	let {
		title = 'Dev time',
		data = $bindable(),
		onIncrement,
		onDecrement,
		width = 300,
		height = 300,
		margin = 10,
		thickness = 0.3
		//  chosenScheme = d3.schemeBlues,
	} = $props();
	// These do work, but as of now (nov 2024) svelte throws warning if you try
	// to do it this way. so we pass in the mutators from the parent
	// let onIncrement={()=>data["a"]=data["a"]+1}
	// let onDecrement={()=>data["a"]=data["a"]-1}

	// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
	let radius = Math.min(width, height) / 2 - margin;


	// Compute the position of each group on the pie:
	const pie = d3
		.pie()
		.padAngle(.03)
		.sort(null) // Do not sort group by size
		.value((d) => d[1]['value']);
	const data_ready = $derived(pie(Object.entries(data)));


	// The arc generator
	const arc = d3
		.arc()
		.innerRadius(radius * (1 - thickness)) // This is the size of the donut hole
		.outerRadius(radius);

	// Another arc that won't be drawn. Just for labels positioning
	// const outerArc = d3
	//   .arc()
	//   .innerRadius(radius * 0.9)
	//   .outerRadius(radius * 0.9);
</script>

<Card>
	<h3 class="border-2 border-green-500 text-3xl font-semibold text-slate-300">{title}</h3>
	<svg
		{width}
		{height}
		viewBox="{-width / 2}, {-height / 2}, {width}, {height}"
		class="border-2 border-rose-700"
		style:max-width="100%"
		style:height="auto"
	>
		<g class="chart-inner">
			{#each data_ready as slice}
				<path d={arc(slice)} fill={slice.data[1]['color']} stroke="white" />
			{/each}
		</g>
	</svg>
	<div class="flex w-full justify-evenly border-2 border-green-500">
		<Button on:click={onIncrement}>+</Button>
		<Button on:click={onDecrement}>-</Button>
	</div>
</Card>

<style>
	:global(body) {
		margin: 40;
	}
</style>
