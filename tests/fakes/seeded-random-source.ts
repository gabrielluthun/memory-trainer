/**
 * Test double for the RandomSource interface (class diagram, Infrastructure section).
 * Same seed, same sequence: draws (RG21) are reproducible in tests. Not for production use.
 * Algorithm: mulberry32, a small 32-bit generator.
 */
export class SeededRandomSource {
	#state: number;

	constructor(seed: number) {
		this.#state = seed >>> 0;
	}

	/** Integer in [0, maxExclusive). */
	nextInt(maxExclusive: number): number {
		if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
			throw new RangeError(`maxExclusive must be a positive integer, got ${maxExclusive}`);
		}
		return Math.floor(this.#nextFloat() * maxExclusive);
	}

	#nextFloat(): number {
		this.#state = (this.#state + 0x6d2b79f5) >>> 0;
		let t = this.#state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
	}
}
