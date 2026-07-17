<script>
	import { getContext } from 'svelte';

	let { min, children } = $props();

	const zoom = getContext('detail-zoom-level');
</script>

{#if (zoom?.level ?? 1) >= min}
	<span class="detail-add">
		{@render children?.()}
	</span>
{/if}
