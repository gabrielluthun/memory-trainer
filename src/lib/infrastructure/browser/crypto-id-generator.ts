import type { IdGenerator } from '../../application/ports';

/** Trial identifiers created on the device (ES06). */
export class CryptoIdGenerator implements IdGenerator {
	next(): string {
		return crypto.randomUUID();
	}
}
