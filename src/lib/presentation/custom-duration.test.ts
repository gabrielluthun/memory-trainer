import { describe, expect, it } from 'vitest';
import { formatDurationField, parseDurationField, stepDown, stepUp } from './custom-duration';

describe('custom memorization time field (US09, mock-up 02)', () => {
	it('shows whole seconds as m:ss', () => {
		expect(formatDurationField(30)).toBe('0:30');
		expect(formatDurationField(65)).toBe('1:05');
		expect(formatDurationField(3_600)).toBe('60:00');
	});

	it('reads m:ss, or a number of seconds', () => {
		expect(parseDurationField('0:30')).toBe(30);
		expect(parseDurationField(' 2:05 ')).toBe(125);
		expect(parseDurationField('1:5')).toBe(65);
		expect(parseDurationField('90')).toBe(90);
		expect(parseDurationField('60:00')).toBe(3_600);
	});

	it.each(['', 'abc', '1:60', '1:2:3', '0:00', '0', '60:01', '-5', '1.5'])(
		'RG15 — refuses "%s": from 0:01 to 60:00',
		(text) => {
			expect(parseDurationField(text)).toBeNull();
		}
	);

	it('+ goes up by 5 s under 1 minute, 30 s up to 10 minutes, 1 minute beyond', () => {
		expect(stepUp(30)).toBe(35);
		expect(stepUp(55)).toBe(60);
		expect(stepUp(60)).toBe(90);
		expect(stepUp(570)).toBe(600);
		expect(stepUp(600)).toBe(660);
	});

	it('− goes down the same way', () => {
		expect(stepDown(35)).toBe(30);
		expect(stepDown(60)).toBe(55);
		expect(stepDown(90)).toBe(60);
		expect(stepDown(600)).toBe(570);
		expect(stepDown(660)).toBe(600);
	});

	it('a value typed between two steps goes to the next step', () => {
		expect(stepUp(37)).toBe(40);
		expect(stepDown(37)).toBe(35);
		expect(stepUp(100)).toBe(120);
		expect(stepDown(100)).toBe(90);
	});

	it('RG15 — stays between 0:01 and 60:00', () => {
		expect(stepDown(5)).toBe(1);
		expect(stepDown(1)).toBe(1);
		expect(stepUp(1)).toBe(5);
		expect(stepUp(3_600)).toBe(3_600);
		expect(stepUp(3_590)).toBe(3_600);
	});
});
