import { neon } from '@neondatabase/serverless';
import { runBackup, type BackupBucket } from './backup';

/**
 * The backup Worker (CU19, ADR 0032), started by its scheduled task only: no web route, no
 * workers.dev address (attack surface). Deployed by the CI with its secret.
 */
interface Env {
	/** The database address with the read-only `backup_reader` role (ES11). */
	BACKUP_DATABASE_URL: string;
	/** The private R2 bucket, bound to the Worker: no R2 key (ADR 0032). */
	BACKUPS: BackupBucket;
}

export default {
	async scheduled(controller: { scheduledTime: number }, env: Env): Promise<void> {
		const sql = neon(env.BACKUP_DATABASE_URL);
		const result = await runBackup({
			query: (text, params) => sql.query(text, params),
			bucket: env.BACKUPS,
			now: new Date(controller.scheduledTime)
		});
		// Counts only, never the content of the database (ES10). A failure throws: the run is then
		// marked as failed in the history of the Worker, checked at each batch.
		console.log(`Backup ${result.key}: ${result.trials} trials, cursor ${result.last}`);
	}
};
