import { describe, expect, it } from 'vitest';
import { CryptoRandomSource } from './crypto-random-source';

describe('CryptoRandomSource', () => {
	it('RG02, RG21 — draws every digit from 0 to 9, and nothing else', () => {
		const random = new CryptoRandomSource();
		const seen = new Set<number>();

		for (let i = 0; i < 2_000; i++) seen.add(random.nextInt(10));

		expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
	});

	it('draws evenly: each digit within 10 % of its expected share', () => {
		const random = new CryptoRandomSource();
		const counts = Array.from({ length: 10 }, () => 0);

		for (let i = 0; i < 100_000; i++) counts[random.nextInt(10)]++;

		for (const count of counts) {
			expect(count).toBeGreaterThan(9_000);
			expect(count).toBeLessThan(11_000);
		}
	});

	it('refuses an empty range', () => {
		expect(() => new CryptoRandomSource().nextInt(0)).toThrow(RangeError);
	});
});
