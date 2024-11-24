<script lang="ts">
	import DonutChart from "$lib/donutChart.svelte";

	// let pulses = $state([
	// 	{"Dev time" : { a: 3, b: 2, c:0,}},
	// 	{"Sleep time" : { a: 7.5, b: .5, c: 2 }},
	// 	{"Lang time" : { a: 0, b: 2, c: 30 }},
	// 	{"Exer time" : { a: 9, b: 60, c: 30 }},
	// 	{"ML time" : { a: 9, b: 60, c: 30 }},
	// ])
	let pulses = $state(
		[
			{
				"title":"Dev time",
				"data": [
					{
						"label":"Time Spent",
						"value":9, 
						"color":"#262626", 
					},
					{
						"label":"Remaining Time",
						"value":6, 
						"color":"#a3a3a3", 

					}

				] 
			},
			{
				"title":"Sleep time",
				"data": [
					{
						"label":"Time Spent",
						"value":3, 
						"color":"#3730a3", 
					},
					{
						"label":"Remaining Time",
						"value":6, 
						"color":"#a5b4fc", 

					}

				] 
			},
			{
				"title":"Lang time",
				"data": [
					{
						"label":"Time Spent",
						"value":3, 
						"color":"#166534", 
					},
					{
						"label":"Remaining Time",
						"value":1, 
						"color":"#86efac", 

					}

				] 
			},
			{
				"title":"Exercise time",
				"data": [
					{
						"label":"Time Spent",
						"value":1, 
						"color":"#9a3412", 
					},
					{
						"label":"Remaining Time",
						"value":6, 
						"color":"#fdba74", 

					}

				] 
			},
			{
				"title":"ML time",
				"data": [
					{
						"label":"Time Spent",
						"value":4, 
						"color":"#075985", 
					},
					{
						"label":"Remaining Time",
						"value":6, 
						"color":"#7dd3fc", 

					}

				] 
			},
		]
	)

	function increment(pulse: { data: any[]; }): None {
		pulse.data.forEach(element => {
			if (element["label"] == "Time Spent"){
				element["value"] = element["value"] + 1
			}else{
				element["value"] = element["value"] - 1
			}
		});
	}

	function decrement(pulse: { data: any[]; }): None {
		pulse.data.forEach(element => {
			if (element["label"] == "Time Spent"){
				element["value"] = element["value"] - 1
			}else{
				element["value"] = element["value"] + 1
			}
		});
	}

</script>
<svelte:head>
	<title>Pulses</title>
	<meta name="description" content="Pulses" />
</svelte:head>

<div class="w-full p-1 border-2 border-rose-400">
	<h1>Current Pulses</h1>
	<div class="w-full p-1 border-2 border-purple-500 flex flex-wrap flex-row justify-around gap-10">
		{#each pulses as pulse}
			<DonutChart 
				bind:data={pulse.data}
				title={pulse.title} 
				onIncrement={()=>increment(pulse)} 
				onDecrement={()=>decrement(pulse)}>
			</DonutChart>
		{/each}
	</div>
</div>

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
