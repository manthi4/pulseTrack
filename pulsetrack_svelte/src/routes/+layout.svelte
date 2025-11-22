<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-slate-50 font-sans text-slate-900">
	<main>
		{@render children()}
	</main>
</div>

