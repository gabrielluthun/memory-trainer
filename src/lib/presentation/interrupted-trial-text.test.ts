import { describe, expect, it } from 'vitest';
import { describeInterruptedTrial } from './interrupted-trial-text';

// Dates in the device's time, as on screen.
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 10, day, hours, minutes);
const now = at(24, 9, 30);

describe('describeInterruptedTrial — window of mock-up 09', () => {
	it('US10 CA6 — the mock-up: yesterday evening, stopped during recall', () => {
		expect(
			describeInterruptedTrial(
				{ startedAt: at(23, 21, 14), mode: 'standard', stoppedIn: 'recalling' },
				now
			)
		).toEqual({
			title: "Que faire de l'essai d'hier soir ?",
			intro:
				"Numbers standard, commencé hier à 21:14. Il s'est arrêté pendant le rappel : onglet fermé, batterie vide ou plantage."
		});
	});

	it('names the part of the day, today or yesterday', () => {
		const title = (startedAt: Date) =>
			describeInterruptedTrial({ startedAt, mode: 'standard', stoppedIn: 'recalling' }, at(24, 23))
				.title;

		expect(title(at(24, 8))).toBe("Que faire de l'essai de ce matin ?");
		expect(title(at(24, 14))).toBe("Que faire de l'essai de cet après-midi ?");
		expect(title(at(24, 19))).toBe("Que faire de l'essai de ce soir ?");
		expect(title(at(24, 2))).toBe("Que faire de l'essai de cette nuit ?");
		expect(title(at(23, 8))).toBe("Que faire de l'essai d'hier matin ?");
		expect(title(at(23, 14))).toBe("Que faire de l'essai d'hier après-midi ?");
		expect(title(at(23, 2))).toBe("Que faire de l'essai d'hier ?");
	});

	it('an older trial is named by its date', () => {
		const text = describeInterruptedTrial(
			{ startedAt: at(19, 21, 5), mode: 'standard', stoppedIn: 'recalling' },
			now
		);

		expect(text.title).toBe("Que faire de l'essai du 19 nov. ?");
		expect(text.intro).toContain('commencé le 19 nov. à 21:05.');
	});

	it('RG15 — a custom trial says so', () => {
		expect(
			describeInterruptedTrial(
				{ startedAt: at(24, 9), mode: 'custom', stoppedIn: 'recalling' },
				now
			).intro
		).toMatch(/^Numbers personnalisé, commencé aujourd'hui à 09:00\./);
	});

	it('RG24 — tells the phase it stopped in', () => {
		const intro = (stoppedIn: 'memorizing' | 'paused-before-recall' | 'recalling') =>
			describeInterruptedTrial({ startedAt: at(24, 9), mode: 'standard', stoppedIn }, now).intro;

		expect(intro('memorizing')).toContain("Il s'est arrêté pendant la mémorisation :");
		expect(intro('paused-before-recall')).toContain(
			"Il s'est arrêté pendant la pause avant le rappel :"
		);
	});
});
