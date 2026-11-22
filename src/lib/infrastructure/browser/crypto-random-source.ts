import type { RandomSource } from '../../domain/random';

/**
 * Draws with the browser's cryptographic generator (RG21). Rejection sampling keeps every value
 * equally likely: a plain modulo would favour the small values.
 */
export class CryptoRandomSource implements RandomSource {
	nextInt(maxExclusive: number): number {
		if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
			throw new RangeError(`maxExclusive must be a positive integer, got ${maxExclusive}`);
		}
		const range = 2 ** 32;
		const limit = range - (range % maxExclusive);
		const buffer = new Uint32Array(1);
		for (;;) {
			crypto.getRandomValues(buffer);
			if (buffer[0] < limit) return buffer[0] % maxExclusive;
		}
	}
}
