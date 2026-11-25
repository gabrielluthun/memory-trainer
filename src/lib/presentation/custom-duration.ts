/**
 * The memorization time field of the custom mode (mock-up 02, ADR 0028): whole seconds, shown
 * as m:ss, from 0:01 to 60:00 (RG15, data dictionary), with − and + buttons.
 */

const MIN_S = 1;
const MAX_S = 3_600;

const clamp = (seconds: number) => Math.min(MAX_S, Math.max(MIN_S, seconds));

export function formatDurationField(seconds: number): string {
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** "m:ss" or a number of seconds ("90"); null if unreadable or out of bounds. */
export function parseDurationField(text: string): number | null {
	const match = /^(?:(\d{1,2}):(\d{1,2})|(\d{1,4}))$/.exec(text.trim());
	if (!match) return null;
	const [, minutes, seconds, onlySeconds] = match;
	if (seconds !== undefined && Number(seconds) > 59) return null;
	const total =
		onlySeconds !== undefined ? Number(onlySeconds) : Number(minutes) * 60 + Number(seconds);
	return total >= MIN_S && total <= MAX_S ? total : null;
}

/** 5 s under 1 minute, 30 s up to 10 minutes, 1 minute beyond. */
const stepAbove = (seconds: number) => (seconds < 60 ? 5 : seconds < 600 ? 30 : 60);
const stepBelow = (seconds: number) => (seconds <= 60 ? 5 : seconds <= 600 ? 30 : 60);

/** + : the next step up, so a value typed between two steps lands on a step. */
export function stepUp(seconds: number): number {
	const step = stepAbove(seconds);
	return clamp(Math.floor(seconds / step) * step + step);
}

/** − : the next step down. */
export function stepDown(seconds: number): number {
	const step = stepBelow(seconds);
	return clamp(Math.ceil(seconds / step) * step - step);
}
