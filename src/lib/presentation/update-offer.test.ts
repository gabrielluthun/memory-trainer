import { describe, expect, it } from 'vitest';
import { canReload, showsUpdateCard } from './update-offer';

describe('update offer — never during a trial (deployment, section 5)', () => {
	it('the card shows on the home, history, result and settings screens', () => {
		for (const routeId of ['/', '/history', '/history/[id]', '/settings']) {
			expect(showsUpdateCard({ routeId, phase: undefined })).toBe(true);
		}
		expect(showsUpdateCard({ routeId: '/trial', phase: 'completed' })).toBe(true);
	});

	it('no card on the launch screen, nor during any phase of a trial', () => {
		expect(showsUpdateCard({ routeId: '/train/numbers', phase: undefined })).toBe(false);
		for (const phase of [
			'paused-before-memorization',
			'memorizing',
			'paused-before-recall',
			'recalling',
			'pending-decision'
		]) {
			expect(showsUpdateCard({ routeId: '/trial', phase })).toBe(false);
		}
	});

	it('a version installed elsewhere reloads the page only once no trial runs', () => {
		expect(canReload(undefined)).toBe(true);
		expect(canReload('completed')).toBe(true);
		expect(canReload('recalling')).toBe(false);
		expect(canReload('pending-decision')).toBe(false);
	});
});
