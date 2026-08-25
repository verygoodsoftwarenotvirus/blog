<script lang="ts">
	import PostLayout from '$lib/components/PostLayout.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.metadata.title} - Very Good Software, Not Virus</title>
	{#if data.metadata.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
</svelte:head>

<PostLayout {...data.metadata}>
	<data.content />
</PostLayout>
