<script>
	import { getContext } from 'svelte';

	let { level, children } = $props();

	const zoom = getContext('detail-zoom-level');
</script>

{#if (zoom?.level ?? 1) === level}
	<span class="detail-replace">
		{@render children?.()}
	</span>
{/if}
