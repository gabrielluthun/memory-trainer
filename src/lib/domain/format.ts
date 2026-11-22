/** Number of items and durations of a trial (RG01, RG15). */
export interface Format {
	readonly itemCount: number;
	readonly memorizationMs: number;
	readonly recallMs: number;
}
