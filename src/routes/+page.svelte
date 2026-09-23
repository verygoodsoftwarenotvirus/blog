<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Very Good Software, Not Virus</title>
</svelte:head>

<div class="post-list">
	{#each data.posts as post}
		<article class="post-entry">
			<h2>
				<a href="/posts/{post.path}/">{post.title}</a>
				{#if post.draft}<span class="draft-badge">draft</span>{/if}
			</h2>
			<div class="post-entry-meta">
				<time datetime={post.date}>
					{new Date(post.date).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</time>
				{#if post.readingTime}
					<span class="separator">&middot;</span>
					<span>{post.readingTime} min read</span>
				{/if}
			</div>
			{#if post.description}
				<p class="post-entry-description">{post.description}</p>
			{/if}
			{#if post.tags?.length}
				<div class="post-entry-tags">
					{#each post.tags as tag}
						<span class="tag">#{tag}</span>
					{/each}
				</div>
			{/if}
		</article>
	{/each}
</div>
