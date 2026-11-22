/** Source of randomness for the draws (RG21). Implemented with crypto in the infrastructure. */
export interface RandomSource {
	/** Integer in [0, maxExclusive). */
	nextInt(maxExclusive: number): number;
}
