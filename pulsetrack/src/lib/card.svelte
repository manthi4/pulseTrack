<script>
    let {children, color = "bg-slate-500"} = $props();
    // "bg-teal-700" is also good
</script>

<div class="border-2 border-green-600 p-1 flex-auto flex-col  justify-items-center {color} hover:bg-slate-600 rounded-lg max-w-xs">
    {@render children()}
</div>