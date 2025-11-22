<script lang="ts">
	import * as d3 from 'd3';

	interface ChartData {
		label: string;
		value: number;
		color: string;
	}

	let {
		title = '',
		data = [] as ChartData[],
		width = 300,
		height = 300,
		margin = 10,
		thickness = 0.3
	} = $props();

	// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
	let radius = Math.min(width, height) / 2 - margin;

	// Compute the position of each group on the pie:
	const pie = d3
		.pie<ChartData>()
		.padAngle(.03)
		.sort(null) // Do not sort group by size
		.value((d) => d.value);
		
	const data_ready = $derived(pie(data));

	// The arc generator
	const arc = d3
		.arc<d3.PieArcDatum<ChartData>>()
		.innerRadius(radius * (1 - thickness)) // This is the size of the donut hole
		.outerRadius(radius);
</script>

<div class="relative flex flex-col items-center">
	{#if title}
		<h3 class="mb-2 text-lg font-semibold text-slate-700">{title}</h3>
	{/if}
	
	<svg
		{width}
		{height}
		viewBox="{-width / 2}, {-height / 2}, {width}, {height}"
		style:max-width="100%"
		style:height="auto"
	>
		<g class="chart-inner">
			{#each data_ready as slice}
				<path d={arc(slice)} fill={slice.data.color} />
			{/each}
		</g>
	</svg>
</div>
