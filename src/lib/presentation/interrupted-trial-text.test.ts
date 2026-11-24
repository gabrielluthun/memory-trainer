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
				now,
				'fr'
			)
		).toEqual({
			title: "Que faire de l'essai d'hier soir ?",
			intro:
				"Numbers standard, commencé hier à 21:14. Il s'est arrêté pendant le rappel : onglet fermé, batterie vide ou plantage."
		});
	});

	it('names the part of the day, today or yesterday', () => {
		const title = (startedAt: Date) =>
			describeInterruptedTrial(
				{ startedAt, mode: 'standard', stoppedIn: 'recalling' },
				at(24, 23),
				'fr'
			).title;

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
			now,
			'fr'
		);

		expect(text.title).toBe("Que faire de l'essai du 19 nov. ?");
		expect(text.intro).toContain('commencé le 19 nov. à 21:05.');
	});

	it('RG15 — a custom trial says so', () => {
		expect(
			describeInterruptedTrial(
				{ startedAt: at(24, 9), mode: 'custom', stoppedIn: 'recalling' },
				now,
				'fr'
			).intro
		).toMatch(/^Numbers personnalisé, commencé aujourd'hui à 09:00\./);
	});

	it('RG24 — tells the phase it stopped in', () => {
		const intro = (stoppedIn: 'memorizing' | 'paused-before-recall' | 'recalling') =>
			describeInterruptedTrial({ startedAt: at(24, 9), mode: 'standard', stoppedIn }, now, 'fr')
				.intro;

		expect(intro('memorizing')).toContain("Il s'est arrêté pendant la mémorisation :");
		expect(intro('paused-before-recall')).toContain(
			"Il s'est arrêté pendant la pause avant le rappel :"
		);
	});
});

describe('describeInterruptedTrial — in English (US19)', () => {
	it('US19 CA1 — the mock-up in English', () => {
		expect(
			describeInterruptedTrial(
				{ startedAt: at(23, 21, 14), mode: 'standard', stoppedIn: 'recalling' },
				now,
				'en'
			)
		).toEqual({
			title: "What to do with yesterday evening's trial?",
			intro:
				'Standard Numbers, started yesterday at 21:14. It stopped during recall: tab closed, flat battery or crash.'
		});
	});

	it('US19 CA2 — an older custom trial, named by its English date', () => {
		const text = describeInterruptedTrial(
			{ startedAt: at(19, 21, 5), mode: 'custom', stoppedIn: 'memorizing' },
			now,
			'en'
		);

		expect(text.title).toBe('What to do with the trial of 19 Nov?');
		expect(text.intro).toBe(
			'Custom Numbers, started on 19 Nov at 21:05. It stopped during memorization: tab closed, flat battery or crash.'
		);
	});
});
