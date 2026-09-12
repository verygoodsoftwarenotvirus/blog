import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

/**
 * Keeps unpublished posts out of production bundles.
 *
 * `draft: true` in frontmatter is not a confidentiality control: it filters a
 * post out of listings and routing at runtime, but Vite has already compiled
 * every globbed markdown file into the JS bundle by then, so the full text
 * ships to the bucket and is readable by anyone who opens a chunk. Guarding
 * the glob with `import.meta.env.DEV` does not help either -- the eager glob
 * emits real static imports that survive tree-shaking.
 *
 * So we cut it at the source: during `vite build`, anything under
 * content/drafts/ loads as an empty file. The dev server is untouched, so
 * drafts still render locally.
 */
function excludeDraftsFromProduction(): Plugin {
	return {
		name: 'exclude-drafts-from-production',
		apply: 'build',
		enforce: 'pre',
		load(id) {
			if (!id.includes('/content/drafts/')) return null;
			// `?raw` consumers import the markdown source as a string, so they
			// need a real default export; mdsvex is happy with an empty file.
			return id.includes('?raw') ? 'export default "";' : '';
		}
	};
}

export default defineConfig({
	plugins: [excludeDraftsFromProduction(), sveltekit()]
});
