export function detectDetailLevels(raw: string): number {
	const stripped = raw
		.replace(/```[\s\S]*?```/g, '')
		.replace(/`[^`]*`/g, '')
		.replace(/<DetailZoom[\s\S]*?<\/DetailZoom>/g, '');

	let max = 0;
	const dRe = /<D\s+[^>]*level=\{(\d+)\}/g;
	const eRe = /<Extra\s+[^>]*min=\{(\d+)\}/g;
	let m: RegExpExecArray | null;
	while ((m = dRe.exec(stripped))) max = Math.max(max, Number(m[1]));
	while ((m = eRe.exec(stripped))) max = Math.max(max, Number(m[1]));
	return max < 2 ? 1 : max;
}
