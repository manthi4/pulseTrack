<script>
	import DonutChart from "$lib/donutChart.svelte";
</script>
<svelte:head>
	<title>Pulses</title>
	<meta name="description" content="Pulses" />
</svelte:head>

<div class="text-column">
	<h1>Current Pulses</h1>
	<div>
		<DonutChart data={{ a: 9, b: 20, c: 30 }}></DonutChart>
		<DonutChart data={{ a: 9, b: 20, c: 30 }}></DonutChart>
		<DonutChart data={{ a: 9, b: 20, c: 30 }}></DonutChart>
		<DonutChart data={{ a: 9, b: 20, c: 30 }}></DonutChart>
	</div>
</div>

<style>
	span {
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
	}
</style>
