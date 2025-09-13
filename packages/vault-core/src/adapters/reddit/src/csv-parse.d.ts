declare module 'csv-parse' {
	export type Options = {
		columns?: boolean | string[];
		bom?: boolean;
		skip_empty_lines?: boolean;
		relax_column_count?: boolean;
		trim?: boolean;
	};

	export function parse(
		input: string,
		options: Options,
		callback: (
			err: unknown | null,
			records: Record<string, string | undefined>[],
		) => void,
	): void;
}
