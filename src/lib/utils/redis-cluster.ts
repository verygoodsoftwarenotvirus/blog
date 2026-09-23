// The slot math Redis Cluster actually does, reimplemented so the numbers in
// the post's animations are the real ones rather than plausible-looking props.
// Mirrors static/tools/redis-cluster-tag-picker.html, which stands alone.

export const TOTAL_SLOTS = 16384;

// CRC16, Redis's XMODEM variant (poly 0x1021, init 0x0000, no reflection).
// Generated from the polynomial to avoid a transcription error in a table.
const CRC16_TABLE = (() => {
	const table = new Uint16Array(256);
	for (let i = 0; i < 256; i++) {
		let crc = i << 8;
		for (let j = 0; j < 8; j++) {
			crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
		}
		table[i] = crc;
	}
	return table;
})();

export function crc16(s: string): number {
	let crc = 0;
	for (let i = 0; i < s.length; i++) {
		crc = ((crc << 8) ^ CRC16_TABLE[((crc >> 8) ^ s.charCodeAt(i)) & 0xff]) & 0xffff;
	}
	return crc;
}

// A key containing `{`, a later `}`, and at least one character between them
// hashes on that substring alone. Anything else hashes whole.
export function hashKey(key: string): string {
	const open = key.indexOf('{');
	if (open === -1) return key;

	const close = key.indexOf('}', open + 1);
	if (close === -1) return key;

	const tag = key.slice(open + 1, close);

	return tag.length > 0 ? tag : key;
}

export function keySlot(key: string): number {
	return crc16(hashKey(key)) % TOTAL_SLOTS;
}

export interface SlotRange {
	start: number;
	end: number;
}

// How redis-cli --cluster hands out slots: contiguous ranges, remainder spread
// over the first few nodes.
export function buildNodeRanges(nodeCount: number): SlotRange[] {
	const size = Math.floor(TOTAL_SLOTS / nodeCount);
	const remainder = TOTAL_SLOTS % nodeCount;

	const ranges: SlotRange[] = [];
	let start = 0;
	for (let i = 0; i < nodeCount; i++) {
		const width = size + (i < remainder ? 1 : 0);
		ranges.push({ start, end: start + width - 1 });
		start += width;
	}

	return ranges;
}

export function slotToNode(slot: number, ranges: SlotRange[]): number {
	// n is three, so a scan beats a binary search and reads better.
	for (let i = 0; i < ranges.length; i++) {
		if (slot <= ranges[i].end) return i;
	}

	return ranges.length - 1;
}

// Walk the integers, keeping the ones whose tag lands on a node that still has
// room. The cap only exists so a silly node count can't hang a render; callers
// get a short list back rather than an exception.
export function findAnchors(
	ranges: SlotRange[],
	perNode: number,
	template: (n: number) => string,
	limit = 100_000
): number[] {
	const wanted = ranges.length * perNode;
	const anchors: number[] = [];
	const filled = new Array<number>(ranges.length).fill(0);

	for (let n = 0; n < limit && anchors.length < wanted; n++) {
		const owner = slotToNode(keySlot(template(n)), ranges);
		if (filled[owner] >= perNode) continue;

		filled[owner]++;
		anchors.push(n);
	}

	return anchors;
}
