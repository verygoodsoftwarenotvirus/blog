<script>
	import { onMount } from 'svelte';

	let {
		title = '',
		date = '',
		author = '',
		tags = [],
		readingTime = 0,
		description = '',
		children
	} = $props();

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

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

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
