import type { Mode, OngoingPhase } from '../domain/trial/trial';
import { formatTrialDate } from './format';

const phases: Record<OngoingPhase, string> = {
	memorizing: 'la mémorisation',
	'paused-before-recall': 'la pause avant le rappel',
	recalling: 'le rappel'
};

const modes: Record<Mode, string> = { standard: 'standard', custom: 'personnalisé' };

/** "matin", "après-midi", "soir", or "nuit" before 5 am. */
function partOfDay(date: Date): 'nuit' | 'matin' | 'après-midi' | 'soir' {
	const hour = date.getHours();
	if (hour < 5) return 'nuit';
	if (hour < 12) return 'matin';
	if (hour < 18) return 'après-midi';
	return 'soir';
}

const today = {
	nuit: 'de cette nuit',
	matin: 'de ce matin',
	'après-midi': 'de cet après-midi',
	soir: 'de ce soir'
};
const yesterday = {
	nuit: "d'hier",
	matin: "d'hier matin",
	'après-midi': "d'hier après-midi",
	soir: "d'hier soir"
};

/**
 * Title and intro of the window offering the three choices for an interrupted trial
 * (mock-up 09, CU06), in the device's time.
 */
export function describeInterruptedTrial(
	trial: { startedAt: Date; mode: Mode; stoppedIn: OngoingPhase },
	now: Date
): { title: string; intro: string } {
	const { day, time } = formatTrialDate(trial.startedAt, now);
	const part = partOfDay(trial.startedAt);
	const [when, started] =
		day === "Aujourd'hui"
			? [today[part], "aujourd'hui"]
			: day === 'Hier'
				? [yesterday[part], 'hier']
				: [`du ${day}`, `le ${day}`];
	return {
		title: `Que faire de l'essai ${when} ?`,
		intro:
			`Numbers ${modes[trial.mode]}, commencé ${started} à ${time}. ` +
			`Il s'est arrêté pendant ${phases[trial.stoppedIn]} : onglet fermé, batterie vide ou plantage.`
	};
}
