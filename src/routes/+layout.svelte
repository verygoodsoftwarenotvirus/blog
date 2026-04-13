<script>
	import '$lib/styles/variables.css';
	import '$lib/styles/reset.css';
	import '$lib/styles/global.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="site">
	<Header />
	<main class="content">
		{@render children()}
	</main>
	<Footer />
</div>
