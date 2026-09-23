<script lang="ts">
	import { setContext } from 'svelte';

	let { levels = 3, children } = $props();

	let zoomLevel = $state(Math.min(2, levels));

	setContext('detail-zoom-level', {
		get level() {
			return zoomLevel;
		},
		set level(v) {
			zoomLevel = v;
		}
	});

	function getLabel(level: number, total: number) {
		if (total <= 2) return level === 1 ? 'Brief' : 'Detailed';
		if (total === 3) return ['Brief', 'Standard', 'Detailed'][level - 1] || `Level ${level}`;
		return ['Brief', 'Standard', 'Detailed', 'Maximum'][level - 1] || `Level ${level}`;
	}
</script>

<div class="detail-zoom-controls">
	<label class="detail-zoom-label" for="detail-slider">Detail</label>
	<input
		id="detail-slider"
		type="range"
		min="1"
		max={levels}
		step="1"
		bind:value={zoomLevel}
		class="detail-zoom-slider"
	/>
	<span class="detail-zoom-value">{getLabel(zoomLevel, levels)}</span>
</div>

{@render children?.()}
