/**
 * Time formats of the screens (mock-ups). Stopwatch times are truncated to the hundredth,
 * like a stopwatch, never rounded up (ENF01); countdowns count started seconds.
 */

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

function split(ms: number): { minutes: number; seconds: number; hundredths: number } {
	const totalHundredths = Math.floor(ms / 10);
	return {
		minutes: Math.floor(totalHundredths / 6_000),
		seconds: Math.floor(totalHundredths / 100) % 60,
		hundredths: totalHundredths % 100
	};
}

/** Result times: "48,52 s" under a minute, "3:21,07" from a minute (US01 CA4). */
export function formatDuration(ms: number): string {
	const { minutes, seconds, hundredths } = split(ms);
	return minutes === 0
		? `${seconds},${pad(hundredths)} s`
		: `${minutes}:${pad(seconds)},${pad(hundredths)}`;
}

/** Running stopwatch in the trial header: "0:41,23". */
export function formatClock(ms: number): string {
	const { minutes, seconds, hundredths } = split(ms);
	return `${minutes}:${pad(seconds)},${pad(hundredths)}`;
}

/** Time left, in started seconds: "3:12" (RG01). */
export function formatCountdown(ms: number): string {
	const totalSeconds = Math.ceil(Math.max(0, ms) / 1_000);
	return `${Math.floor(totalSeconds / 60)}:${pad(totalSeconds % 60)}`;
}
