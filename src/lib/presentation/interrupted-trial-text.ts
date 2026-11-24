import type { Language } from '../domain/settings/settings';
import type { Mode, OngoingPhase } from '../domain/trial/trial';
import { m } from '../paraglide/messages';
import { daysBetween, formatTrialDate } from './format';

type PartOfDay = 'night' | 'morning' | 'afternoon' | 'evening';

/** Morning, afternoon, evening, or night before 5 am. */
function partOfDay(date: Date): PartOfDay {
	const hour = date.getHours();
	if (hour < 5) return 'night';
	if (hour < 12) return 'morning';
	if (hour < 18) return 'afternoon';
	return 'evening';
}

const todayTitles = {
	night: m.interrupted_title_today_night,
	morning: m.interrupted_title_today_morning,
	afternoon: m.interrupted_title_today_afternoon,
	evening: m.interrupted_title_today_evening
};
const yesterdayTitles = {
	night: m.interrupted_title_yesterday_night,
	morning: m.interrupted_title_yesterday_morning,
	afternoon: m.interrupted_title_yesterday_afternoon,
	evening: m.interrupted_title_yesterday_evening
};
const modes: Record<Mode, typeof m.interrupted_mode_standard> = {
	standard: m.interrupted_mode_standard,
	custom: m.interrupted_mode_custom
};
const phases: Record<OngoingPhase, typeof m.interrupted_phase_recalling> = {
	memorizing: m.interrupted_phase_memorizing,
	'paused-before-recall': m.interrupted_phase_paused_before_recall,
	recalling: m.interrupted_phase_recalling
};

/**
 * Title and intro of the window offering the three choices for an interrupted trial
 * (mock-up 09, CU06), in the device's time and the interface language (US19).
 */
export function describeInterruptedTrial(
	trial: { startedAt: Date; mode: Mode; stoppedIn: OngoingPhase },
	now: Date,
	language: Language
): { title: string; intro: string } {
	const locale = { locale: language };
	const { day, time } = formatTrialDate(trial.startedAt, now, language);
	const part = partOfDay(trial.startedAt);
	const days = daysBetween(trial.startedAt, now);
	const [title, started] =
		days === 0
			? [todayTitles[part]({}, locale), m.interrupted_started_today({}, locale)]
			: days === 1
				? [yesterdayTitles[part]({}, locale), m.interrupted_started_yesterday({}, locale)]
				: [
						m.interrupted_title_on({ date: day }, locale),
						m.interrupted_started_on({ date: day }, locale)
					];
	return {
		title,
		intro: m.interrupted_intro(
			{
				mode: modes[trial.mode]({}, locale),
				started,
				time,
				phase: phases[trial.stoppedIn]({}, locale)
			},
			locale
		)
	};
}
