import type { MigrationConfig } from 'drizzle-orm/migrator';
import type { Adapter, CompatibleDB } from './adapter';
import type { VaultConfig } from './config';
import { readableSchemaInfo } from './strip';

export type ImportCounts = Record<string, number>;

export type ImportReport = {
	adapter: string;
	migrated: boolean;
	counts: ImportCounts;
	// Raw parsed payload for advanced callers; leave as unknown to avoid tight coupling
	parsed: unknown;
};

export type ImportSummary = {
	reports: ImportReport[];
	totalTables: number;
	totalRecords: number;
};

function countRecords(parsed: unknown): ImportCounts {
	const out: ImportCounts = {};
	if (parsed && typeof parsed === 'object') {
		for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
			out[k] = Array.isArray(v) ? v.length : 0;
		}
	}
	return out;
}

export class Vault<
	TDatabase extends CompatibleDB,
	TAdapters extends Adapter[],
> {
	readonly adapters: TAdapters;
	readonly db: TDatabase;
	readonly migrateFunc: (
		db: TDatabase,
		config: MigrationConfig,
	) => Promise<void>;

	constructor(config: VaultConfig<TDatabase, TAdapters>) {
		this.adapters = config.adapters;
		this.db = config.database;
		this.migrateFunc = config.migrateFunc;
	}

	/**
	 * Create and initialize the Vault. Runs migrations for selected adapters before returning.
	 */
	static async create<
		TDatabase extends CompatibleDB,
		TAdapters extends Adapter[],
	>(config: VaultConfig<TDatabase, TAdapters>) {
		const vault = new Vault(config);
		await vault.migrate();
		return vault;
	}

	/**
	 * Run migrations for the selected adapters (defaults to all).
	 * Uses adapter.drizzleConfig.out verbatim; resolution/existence is delegated to migrateFunc implementation.
	 */
	private async migrate() {
		// TODO something better than whatever this is
		const modulePath = import.meta.resolve('../adapters');
		const mod = (await import(modulePath)) as Record<string, unknown>;

		for (const adapter of this.adapters) {
			for (const func of Object.values(mod)) {
				if (typeof func !== 'function') continue;
				const a = func();
				this.adapters[0]?.schema[''];

				// TODO again, not amazing
				if (!a || typeof a === 'object' || !('id' in a) || a.id !== adapter.id)
					continue;

				await this.migrateFunc(this.db, {
					migrationsFolder: adapter.drizzleConfig.out ?? '',
					migrationsSchema: adapter.drizzleConfig.migrations?.schema ?? '',
					migrationsTable: adapter.drizzleConfig.migrations?.table ?? '',
				});
			}
		}
	}

	/**
	 * Parse a file/blob with each selected adapter and upsert into the database.
	 * Returns a summary with per-adapter counts.
	 */
	async importBlob(
		blob: Blob,
		adapterId: (TAdapters[number]['id'] & object) | string, // Allow any string but keep intellisense
	) {
		const reports: ImportReport[] = [];

		const adapter = this.adapters.find((a) => a.id === adapterId);
		if (!adapter) throw new Error(`Adapter not found: ${adapterId}`);

		// Parse the blob via the selected adapter
		const parsed = await adapter.parse(blob);
		// Validate the parsed data against the adapter's schema, throw if invalid
		const valid = adapter.validator.assert(parsed);
		// Insert the data into the database
		await adapter.upsert(this.db, valid);

		reports.push({
			adapter: adapter.name,
			migrated: true,
			counts: countRecords(parsed),
			parsed,
		});

		const totalTables = reports.reduce(
			(acc, r) => acc + Object.keys(r.counts).length,
			0,
		);
		const totalRecords = reports.reduce(
			(acc, r) => acc + Object.values(r.counts).reduce((a, b) => a + b, 0),
			0,
		);

		return { reports, totalTables, totalRecords };
	}

	getCurrentLayout(adapterId?: (TAdapters[number]['id'] & object) | string) {
		const schemas = [];

		for (const adapter of this.adapters) {
			if (adapterId && adapter.id !== adapterId) continue;

			const humanReadable = readableSchemaInfo(
				adapter.schema,
				// Adapter.metadata: table -> column -> description
				adapter.metadata,
			);
			schemas.push(humanReadable);
		}

		return schemas;
	}
}
