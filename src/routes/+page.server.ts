import { getAllPosts } from '$lib/utils/posts';

export async function load() {
	const posts = await getAllPosts();
	return {
		posts: posts.map((p) => ({
			title: p.metadata.title,
			date: p.metadata.date,
			slug: p.metadata.slug,
			path: p.metadata.path,
			tags: p.metadata.tags,
			description: p.metadata.description,
			readingTime: p.metadata.readingTime
		}))
	};
}
