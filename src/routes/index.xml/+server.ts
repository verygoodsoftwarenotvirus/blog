import { getAllPosts } from '$lib/utils/posts';

export const prerender = true;

export async function GET() {
	const posts = await getAllPosts();
	const siteUrl = 'https://blog.verygoodsoftwarenotvirus.ru';

	const items = posts
		.map((post) => {
			const { title, date, path, description } = post.metadata;
			return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${siteUrl}/posts/${path}/</link>
      <guid>${siteUrl}/posts/${path}/</guid>
      <pubDate>${new Date(date).toUTCString()}</pubDate>
      ${description ? `<description>${escapeXml(description)}</description>` : ''}
    </item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Very Good Software, Not Virus</title>
    <link>${siteUrl}</link>
    <description>a lowly software developer's blog</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/index.xml" rel="self" type="application/rss+xml"/>
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
