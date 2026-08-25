import { error } from '@sveltejs/kit';
import { getAllPosts } from '$lib/utils/posts';
import { detectDetailLevels } from '$lib/utils/detail-levels';

export const prerender = true;

export async function entries() {
	const posts = await getAllPosts();
	return posts.map((p) => {
		const [year, month, day, slug] = p.metadata.path.split('/');
		return { year, month, day, slug };
	});
}

export async function load({ params }) {
	const { year, month, day, slug } = params;

	try {
		const post = await import(
			`../../../../../../../content/posts/${year}/${month}/${day}/${slug}.md`
		);
		const raw = await import(
			`../../../../../../../content/posts/${year}/${month}/${day}/${slug}.md?raw`
		);
		const posts = await getAllPosts();
		const path = `${year}/${month}/${day}/${slug}`;
		const match = posts.find((p) => p.metadata.path === path);
		return {
			content: post.default,
			metadata: {
				...post.metadata,
				readingTime: match?.metadata.readingTime,
				detailLevels: detectDetailLevels(raw.default)
			}
		};
	} catch {
		throw error(404, 'Post not found');
	}
}
