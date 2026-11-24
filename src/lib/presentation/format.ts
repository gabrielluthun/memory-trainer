import type { Language } from '../domain/settings/settings';
import { date_today, date_yesterday } from '../paraglide/messages';

/**
 * Time formats of the screens (mock-ups). Stopwatch times are truncated to the hundredth,
 * like a stopwatch, never rounded up (ENF01); countdowns count started seconds.
 * Decimal separator and dates follow the interface language (US19 CA2).
 */

const decimal = (language: Language) => (language === 'fr' ? ',' : '.');

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
export function formatDuration(ms: number, language: Language): string {
	const { minutes, seconds, hundredths } = split(ms);
	const point = decimal(language);
	return minutes === 0
		? `${seconds}${point}${pad(hundredths)} s`
		: `${minutes}:${pad(seconds)}${point}${pad(hundredths)}`;
}

/** Running stopwatch in the trial header: "0:41,23". */
export function formatClock(ms: number, language: Language): string {
	const { minutes, seconds, hundredths } = split(ms);
	return `${minutes}:${pad(seconds)}${decimal(language)}${pad(hundredths)}`;
}

/** Time left, in started seconds: "3:12" (RG01). */
export function formatCountdown(ms: number): string {
	const totalSeconds = Math.ceil(Math.max(0, ms) / 1_000);
	return `${Math.floor(totalSeconds / 60)}:${pad(totalSeconds % 60)}`;
}

/** "19 nov." in French, "19 Nov" in English: the day first in both languages. */
const locales: Record<Language, string> = { fr: 'fr-FR', en: 'en-GB' };
const dayAndMonth = (language: Language) =>
	new Intl.DateTimeFormat(locales[language], { day: 'numeric', month: 'short' });
const dayMonthYear = (language: Language) =>
	new Intl.DateTimeFormat(locales[language], { day: 'numeric', month: 'short', year: 'numeric' });

/** Calendar days between two local dates, ignoring the time of day. */
export function daysBetween(earlier: Date, later: Date): number {
	const start = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
	const end = new Date(later.getFullYear(), later.getMonth(), later.getDate());
	return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Date of a trial in the history (mock-up 08), in the device's time: "Aujourd'hui", "Hier",
 * "19 nov.", or "19 nov. 2025" for an earlier year; the time apart, "21:14".
 */
export function formatTrialDate(
	date: Date,
	now: Date,
	language: Language
): { day: string; time: string } {
	const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
	const days = daysBetween(date, now);
	if (days === 0) return { day: date_today({}, { locale: language }), time };
	if (days === 1) return { day: date_yesterday({}, { locale: language }), time };
	const format = date.getFullYear() === now.getFullYear() ? dayAndMonth : dayMonthYear;
	return { day: format(language).format(date), time };
}
