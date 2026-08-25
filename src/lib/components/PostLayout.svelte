<script lang="ts">
	import { onMount, setContext } from 'svelte';

	let {
		title = '',
		date = '',
		author = '',
		tags = [],
		readingTime = 0,
		description = '',
		detailLevels = 1,
		children
	} = $props();

	let pageZoomLevel = $state(1);

	setContext('detail-zoom-level', {
		get level() {
			return pageZoomLevel;
		},
		set level(v) {
			pageZoomLevel = v;
		}
	});

	function getLabel(level: number, total: number) {
		if (total <= 2) return level === 1 ? 'Brief' : 'Detailed';
		if (total === 3) return ['Brief', 'Standard', 'Detailed'][level - 1] || `Level ${level}`;
		if (total === 4)
			return ['Brief', 'Standard', 'Detailed', 'Maximum'][level - 1] || `Level ${level}`;
		return `Level ${level}`;
	}

	onMount(() => {
		if (document.querySelector('.bluesky-embed')) {
			if (!document.querySelector('script[src*="embed.bsky.app"]')) {
				const s = document.createElement('script');
				s.src = 'https://embed.bsky.app/static/embed.js';
				s.async = true;
				s.charset = 'utf-8';
				document.body.appendChild(s);
			}
		}

		if (document.querySelector('.twitter-tweet')) {
			if (!document.querySelector('script[src*="platform.twitter.com"]')) {
				const s = document.createElement('script');
				s.src = 'https://platform.twitter.com/widgets.js';
				s.async = true;
				document.body.appendChild(s);
			}
		}
	});

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

{#if detailLevels >= 2}
	<div class="page-detail-bar">
		<div class="page-detail-inner">
			<label class="detail-zoom-label" for="page-detail-slider">Detail</label>
			<input
				id="page-detail-slider"
				type="range"
				min="1"
				max={detailLevels}
				step="1"
				bind:value={pageZoomLevel}
				class="detail-zoom-slider"
			/>
			<span class="detail-zoom-value">{getLabel(pageZoomLevel, detailLevels)}</span>
		</div>
	</div>
{/if}

<article class="post">
	<header class="post-header">
		<h1 class="post-title">{title}</h1>
		<div class="post-meta">
			{#if date}
				<time datetime={date}>{formatDate(date)}</time>
			{/if}
			{#if author}
				<span class="separator">&middot;</span>
				<span class="post-author">{author}</span>
			{/if}
			{#if readingTime}
				<span class="separator">&middot;</span>
				<span>{readingTime} min read</span>
			{/if}
		</div>
		{#if tags?.length}
			<div class="post-tags">
				{#each tags as tag}
					<span class="tag">#{tag}</span>
				{/each}
			</div>
		{/if}
	</header>

	<div class="post-content">
		{@render children?.()}
	</div>
</article>
