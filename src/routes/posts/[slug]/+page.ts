import { redirect } from '@sveltejs/kit';
import { getAllPosts, getSlugMap } from '$lib/utils/posts';

export const prerender = true;

export async function entries() {
	const posts = await getAllPosts();
	return posts.map((p) => ({ slug: p.metadata.slug }));
}

export async function load({ params }) {
	const posts = await getAllPosts();
	const slugMap = getSlugMap(posts);
	const fullPath = slugMap[params.slug];

	if (fullPath) {
		throw redirect(301, `/posts/${fullPath}/`);
	}

	throw redirect(301, '/');
}
