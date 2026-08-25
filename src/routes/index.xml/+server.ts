import { getAllPosts } from '$lib/utils/posts';
import { SITE_URL } from '$lib/config';

export const prerender = true;

export async function GET() {
	const posts = await getAllPosts();

	const items = posts
		.map((post) => {
			const { title, date, path, description } = post.metadata;
			return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${SITE_URL}/posts/${path}/</link>
      <guid>${SITE_URL}/posts/${path}/</guid>
      <pubDate>${new Date(date).toUTCString()}</pubDate>
      ${description ? `<description>${escapeXml(description)}</description>` : ''}
    </item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Very Good Software, Not Virus</title>
    <link>${SITE_URL}</link>
    <description>a lowly software developer's blog</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/index.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
