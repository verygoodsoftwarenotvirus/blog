export interface PostMetadata {
	title: string;
	date: string;
	author: string;
	slug: string;
	path: string;
	cover: string;
	tags: string[];
	draft: boolean;
	description: string;
	readingTime: number;
	detailZoom?: boolean;
	detailLevels?: number;
}

export interface Post {
	metadata: PostMetadata;
	default: ConstructorOfATypedSvelteComponent;
}

function estimateReadingTime(content: string): number {
	const words = content.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 200));
}

export async function getAllPosts(): Promise<Post[]> {
	const modules = {
		...import.meta.glob('/content/posts/**/*.md', { eager: true }),
		...(import.meta.env.DEV ? import.meta.glob('/content/drafts/**/*.md', { eager: true }) : {})
	};
	const rawModules = {
		...import.meta.glob('/content/posts/**/*.md', { eager: true, query: '?raw', import: 'default' }),
		...(import.meta.env.DEV
			? import.meta.glob('/content/drafts/**/*.md', { eager: true, query: '?raw', import: 'default' })
			: {})
	};
	const posts: Post[] = [];

	for (const [filepath, module] of Object.entries(modules)) {
		const mod = module as { metadata: Record<string, unknown>; default: ConstructorOfATypedSvelteComponent };
		// Drafts stay out of the index, feeds, and prerendered routes in a real
		// build, but stay listed under `vite dev` so they can be reviewed without
		// having to know their URL by heart.
		if (mod.metadata?.draft && !import.meta.env.DEV) continue;

		const relativePath = filepath
			.replace('/content/posts/', '')
			.replace('/content/drafts/', '')
			.replace('.md', '');
		const parts = relativePath.split('/');
		const slug = parts[parts.length - 1];

		const raw = (rawModules[filepath] as string) || '';
		// Strip frontmatter before counting words
		const content = raw.replace(/^---[\s\S]*?---/, '');

		const metadata = {
			...mod.metadata,
			path: relativePath,
			slug,
			readingTime: estimateReadingTime(content)
		} as PostMetadata;

		posts.push({ metadata, default: mod.default });
	}

	posts.sort(
		(a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime()
	);

	return posts;
}

export function getSlugMap(posts: Post[]): Record<string, string> {
	const map: Record<string, string> = {};
	for (const post of posts) {
		map[post.metadata.slug] = post.metadata.path;
	}
	return map;
}
