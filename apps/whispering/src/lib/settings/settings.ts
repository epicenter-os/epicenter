/**
 * @fileoverview Migration-free settings management system
 *
 * This module implements a robust settings system that eliminates the need for
 * version migrations. Instead of maintaining multiple schema versions and migration
 * functions, we use a progressive validation approach that:
 *
 * 1. Preserves valid settings from any previous version
 * 2. Silently discards invalid or unknown keys
 * 3. Applies defaults for missing required fields
 *
 * ## Design Decisions
 *
 * - **Flat key structure**: All settings use dot-notation keys (e.g., 'sound.playOn.manual-start')
 *   stored as a single-level object. This simplifies validation and merging.
 *
 * - **Schema with defaults**: Every field in the schema has a `.default()` value,
 *   ensuring we can always produce a valid settings object.
 *
 * - **Progressive validation**: When full validation fails, we attempt partial validation
 *   and finally key-by-key validation to recover as much valid data as possible.
 *
 * ## Benefits over versioned schemas
 *
 * - No migration code to maintain
 * - Automatic forward compatibility
 * - Graceful handling of corrupted settings
 * - Simpler codebase
 * - Easy to add/remove/rename settings
 */

import type { Command } from '$lib/commands';
import type { WhisperingSoundNames } from '$lib/constants/sounds';
import type { DeepgramModel } from '$lib/services/transcription/deepgram';
import type { ElevenLabsModel } from '$lib/services/transcription/elevenlabs';
import type { GroqModel } from '$lib/services/transcription/groq';
import type { OpenAIModel } from '$lib/services/transcription/openai';

import {
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	RECORDING_MODES,
} from '$lib/constants/audio';
import { CommandOrAlt, CommandOrControl } from '$lib/constants/keyboard';
import { SUPPORTED_LANGUAGES } from '$lib/constants/languages';
import { TRANSCRIPTION_SERVICE_IDS } from '$lib/constants/transcription';
import { ALWAYS_ON_TOP_VALUES } from '$lib/constants/ui';
import { asDeviceIdentifier } from '$lib/services/types';
import { z, type ZodBoolean, type ZodString } from 'zod';

/**
 * The main settings schema that defines all application settings.
 *
 * All settings are stored as a flat object with dot-notation keys for logical grouping.
 * Every field has a default value to ensure the application can always start with valid settings.
 *
 * ## Key naming conventions:
 * - `sound.playOn.*` - Sound effect toggles for various events
 * - `transcription.*` - Transcription service configuration
 * - `transformation.*` - Text transformation settings
 * - `recording.*` - Recording mode and device settings
 * - `shortcuts.*` - Keyboard shortcut mappings
 * - `apiKeys.*` - Service API keys
 * - `system.*` - System-level preferences
 * - `database.*` - Data retention policies
 *
 * @example
 * // Access a setting
 * const shouldPlaySound = settings.value['sound.playOn.manual-start'];
 *
 * // Update a setting
 * settings.value = {
 *   ...settings.value,
 *   'transcription.outputLanguage': 'en'
 * };
 */
export const settingsSchema = z.object({
	...({
		'sound.playOn.manual-cancel': z.boolean().default(true),
		'sound.playOn.manual-start': z.boolean().default(true),
		'sound.playOn.manual-stop': z.boolean().default(true),
		'sound.playOn.transcriptionComplete': z.boolean().default(true),
		'sound.playOn.transformationComplete': z.boolean().default(true),
		'sound.playOn.vad-capture': z.boolean().default(true),
		'sound.playOn.vad-start': z.boolean().default(true),
		'sound.playOn.vad-stop': z.boolean().default(true),
	} satisfies Record<
		`sound.playOn.${WhisperingSoundNames}`,
		z.ZodDefault<ZodBoolean>
	>),

	// Analytics settings
	'analytics.enabled': z.boolean().default(true),
	'apiKeys.anthropic': z.string().default(''),
	'apiKeys.deepgram': z.string().default(''),
	'apiKeys.elevenlabs': z.string().default(''),

	'apiKeys.google': z.string().default(''),

	'apiKeys.groq': z.string().default(''),
	'apiKeys.openai': z.string().default(''),

	'database.maxRecordingCount': z
		.string()
		.regex(/^\d+$/, 'Must be a number')
		.default('100'),
	'database.recordingRetentionStrategy': z
		.enum(['keep-forever', 'limit-count'])
		.default('keep-forever'),
	/**
	 * Recording backend to use in desktop app.
	 * - 'native': Uses Rust audio recording backend (CPAL)
	 * - 'browser': Uses browser MediaRecorder API even in desktop
	 */
	'recording.backend': z.enum(['native', 'browser']).default('browser'),

	// Desktop recording settings
	'recording.desktop.outputFolder': z.string().nullable().default(null), // null = use app data dir

	'recording.desktop.sampleRate': z
		.enum(['16000', '44100', '48000'])
		.default('16000'),

	/**
	 * Device identifier for manual recording.
	 * Can be either a desktop device identifier or navigator device ID.
	 * @see DeviceIdentifier
	 */
	'recording.manual.selectedDeviceId': z
		.string()
		.nullable()
		.transform((val) => (val ? asDeviceIdentifier(val) : null))
		.default(null),
	// Recording mode settings
	'recording.mode': z.enum(RECORDING_MODES).default('manual'),

	// Browser recording settings (used when browser backend is selected)
	'recording.navigator.bitrateKbps': z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),
	/**
	 * Device identifier for VAD recording.
	 * Always a navigator device ID due to the nature of VAD recording
	 * (it uses a MediaStream to track voice activity)
	 * @see DeviceIdentifier
	 */
	'recording.vad.selectedDeviceId': z
		.string()
		.nullable()
		.transform((val) => (val ? asDeviceIdentifier(val) : null))
		.default(null),
	'system.alwaysOnTop': z.enum(ALWAYS_ON_TOP_VALUES).default('Never'),
	'transcription.copyToClipboardOnSuccess': z.boolean().default(true),
	'transcription.deepgram.model': z
		.string()
		.transform((val) => val as DeepgramModel['name'] | (string & {}))
		.default('nova-3' satisfies DeepgramModel['name']),
	'transcription.elevenlabs.model': z
		.string()
		.transform((val) => val as ElevenLabsModel['name'] | (string & {}))
		.default('scribe_v1' satisfies ElevenLabsModel['name']),

	'transcription.favoriteLanguages': z
		.array(z.enum(SUPPORTED_LANGUAGES))
		.min(1)
		.max(3)
		.default(['en', 'ja', 'zh'])
		.refine((langs) => new Set(langs).size === langs.length, {
			message: 'Favorite languages must be unique',
		}),
	'transcription.groq.model': z
		.string()
		.transform((val) => val as GroqModel['name'] | (string & {}))
		.default('whisper-large-v3-turbo' satisfies GroqModel['name']),
	'transcription.languageToggleMode': z
		.enum(['cycle', 'direct'])
		.default('cycle'),
	// Service-specific settings
	'transcription.openai.model': z
		.string()
		.transform((val) => val as OpenAIModel['name'] | (string & {}))
		.default('gpt-4o-mini-transcribe' satisfies OpenAIModel['name']),
	// Shared settings in transcription
	'transcription.outputLanguage': z.enum(SUPPORTED_LANGUAGES).default('auto'),
	'transcription.prompt': z.string().default(''),
	'transcription.selectedTranscriptionService': z
		.enum(TRANSCRIPTION_SERVICE_IDS)
		.default('whispercpp'),
	'transcription.speaches.baseUrl': z.string().default('http://localhost:8000'),

	'transcription.speaches.modelId': z
		.string()
		.default('Systran/faster-distil-whisper-small.en'),

	'transcription.temperature': z.string().default('0.0'),
	'transcription.whispercpp.modelPath': z.string().default(''),
	'transcription.whispercpp.useGpu': z.boolean().default(true),
	'transcription.writeToCursorOnSuccess': z.boolean().default(true),
	'transformation.copyToClipboardOnSuccess': z.boolean().default(true),
	'transformation.writeToCursorOnSuccess': z.boolean().default(false),

	'transformations.selectedTransformationId': z
		.string()
		.nullable()
		.default(null),

	...({
		'shortcuts.local.cancelManualRecording': z.string().nullable().default('c'),
		'shortcuts.local.pushToTalk': z.string().nullable().default('p'),
		'shortcuts.local.setOutputLanguageSlot1': z.string().nullable().default(null),
		'shortcuts.local.setOutputLanguageSlot2': z.string().nullable().default(null),
		'shortcuts.local.setOutputLanguageSlot3': z.string().nullable().default(null),
		'shortcuts.local.startManualRecording': z.string().nullable().default(null),
		'shortcuts.local.startVadRecording': z.string().nullable().default(null),
		'shortcuts.local.stopManualRecording': z.string().nullable().default(null),
		'shortcuts.local.stopVadRecording': z.string().nullable().default(null),
		'shortcuts.local.toggleManualRecording': z.string().nullable().default(' '),
		'shortcuts.local.toggleOutputLanguage': z.string().nullable().default(null),
		'shortcuts.local.toggleVadRecording': z.string().nullable().default('v'),
	} satisfies Record<
		`shortcuts.local.${Command['id']}`,
		z.ZodDefault<z.ZodNullable<ZodString>>
	>),

	...({
		'shortcuts.global.cancelManualRecording': z
			.string()
			.nullable()
			.default(`${CommandOrControl}+Shift+'`),
		'shortcuts.global.pushToTalk': z
			.string()
			.nullable()
			.default(`${CommandOrAlt}+Shift+D`),
		'shortcuts.global.setOutputLanguageSlot1': z.string().nullable().default('Shift+F1'),
		'shortcuts.global.setOutputLanguageSlot2': z.string().nullable().default('Shift+F2'),
		'shortcuts.global.setOutputLanguageSlot3': z.string().nullable().default('Shift+F3'),
		'shortcuts.global.startManualRecording': z
			.string()
			.nullable()
			.default(null),
		'shortcuts.global.startVadRecording': z.string().nullable().default(null),
		'shortcuts.global.stopManualRecording': z.string().nullable().default(null),
		'shortcuts.global.stopVadRecording': z.string().nullable().default(null),
		'shortcuts.global.toggleManualRecording': z
			.string()
			.nullable()
			.default(`${CommandOrControl}+Shift+;`),
		'shortcuts.global.toggleOutputLanguage': z.string().nullable().default(null),
		'shortcuts.global.toggleVadRecording': z.string().nullable().default(null),
	} satisfies Record<
		`shortcuts.global.${Command['id']}`,
		z.ZodDefault<z.ZodNullable<ZodString>>
	>),
});

/**
 * The TypeScript type for validated settings, inferred from the Zod schema.
 * This is the source of truth for all settings throughout the application.
 *
 * @see settingsSchema - The Zod schema that defines this type
 */
export type Settings = z.infer<typeof settingsSchema>;

/**
 * Get default settings by parsing an empty object, which will use all the .default() values
 * defined in the schema.
 *
 * @returns A complete settings object with all default values
 *
 * @example
 * // Get fresh default settings
 * const defaults = getDefaultSettings();
 * console.log(defaults['transcription.outputLanguage']); // 'auto'
 * console.log(defaults['sound.playOn.manual-start']); // true
 *
 * @example
 * // Reset a specific setting to default
 * const defaults = getDefaultSettings();
 * settings.value = {
 *   ...settings.value,
 *   'transcription.temperature': defaults['transcription.temperature']
 * };
 */
export function getDefaultSettings(): Settings {
	const result = settingsSchema.parse({});
	return result;
}

/**
 * Parses and validates stored settings using a three-tier progressive validation strategy.
 * This function ensures we always return valid settings, preserving as much user data as possible
 * while gracefully handling corrupted, outdated, or partial settings.
 *
 * ## Validation Strategy:
 *
 * 1. **Full validation** - Try to parse the entire stored value as-is
 * 2. **Partial validation** - If full validation fails, validate against a partial schema
 *    and merge valid keys with defaults
 * 3. **Key-by-key validation** - As a last resort, validate each key individually,
 *    keeping only valid key-value pairs
 *
 * @param storedValue - The raw value from storage (usually from localStorage)
 * @returns A valid Settings object, guaranteed to match the current schema
 *
 * @example
 * // Case 1: Valid settings pass through unchanged
 * const stored = { 'sound.playOn.manual-start': false, ...otherValidSettings };
 * const result = parseStoredSettings(stored);
 * console.log(result['sound.playOn.manual-start']); // false
 *
 * @example
 * // Case 2: Partially valid settings merge with defaults
 * const stored = {
 *   'sound.playOn.manual-start': false,  // valid
 *   'obsolete.setting': 'value',          // invalid - will be discarded
 *   // missing required settings will use defaults
 * };
 * const result = parseStoredSettings(stored);
 * console.log(result['sound.playOn.manual-start']); // false (preserved)
 * console.log(result['transcription.outputLanguage']); // 'auto' (default)
 *
 * @example
 * // Case 3: Individual values that fail validation use defaults
 * const stored = {
 *   'transcription.temperature': 'invalid', // wrong type
 *   'sound.playOn.manual-start': false,     // valid
 * };
 * const result = parseStoredSettings(stored);
 * console.log(result['transcription.temperature']); // '0.0' (default)
 * console.log(result['sound.playOn.manual-start']); // false (preserved)
 *
 * @example
 * // Case 4: Non-object input returns complete defaults
 * const result1 = parseStoredSettings(null);
 * const result2 = parseStoredSettings('corrupted');
 * const result3 = parseStoredSettings(undefined);
 * // All return getDefaultSettings()
 */
export function parseStoredSettings(storedValue: unknown): Settings {
	// Migrate old settings keys to new ones
	if (typeof storedValue === 'object' && storedValue !== null) {
		const migrated = { ...storedValue } as Record<string, unknown>;

		// Migrate clipboard settings to new names
		if ('transcription.clipboard.copyOnSuccess' in migrated) {
			migrated['transcription.copyToClipboardOnSuccess'] =
				migrated['transcription.clipboard.copyOnSuccess'];
			delete migrated['transcription.clipboard.copyOnSuccess'];
		}
		if ('transcription.clipboard.pasteOnSuccess' in migrated) {
			migrated['transcription.writeToCursorOnSuccess'] =
				migrated['transcription.clipboard.pasteOnSuccess'];
			delete migrated['transcription.clipboard.pasteOnSuccess'];
		}
		if ('transformation.clipboard.copyOnSuccess' in migrated) {
			migrated['transformation.copyToClipboardOnSuccess'] =
				migrated['transformation.clipboard.copyOnSuccess'];
			delete migrated['transformation.clipboard.copyOnSuccess'];
		}
		if ('transformation.clipboard.pasteOnSuccess' in migrated) {
			migrated['transformation.writeToCursorOnSuccess'] =
				migrated['transformation.clipboard.pasteOnSuccess'];
			delete migrated['transformation.clipboard.pasteOnSuccess'];
		}

		storedValue = migrated;
	}

	// First, try to parse the entire value
	const fullResult = settingsSchema.safeParse(storedValue);
	if (fullResult.success) {
		return fullResult.data;
	}

	// If it's not an object, return defaults
	if (typeof storedValue !== 'object' || storedValue === null) {
		return getDefaultSettings();
	}

	// Create a partial schema where all keys are optional
	// This allows us to validate incomplete settings objects
	const partialSchema = settingsSchema.partial();

	// Try parsing with the partial schema
	const partialResult = partialSchema.safeParse(storedValue);

	if (partialResult.success) {
		// The partial object is valid, now merge with defaults
		// This ensures all required keys exist
		const mergedSettings = {
			...getDefaultSettings(),
			...partialResult.data,
		};

		// Validate the merged result with the full schema
		// This step ensures the merged object is complete and valid
		const finalResult = settingsSchema.safeParse(mergedSettings);
		if (finalResult.success) {
			return finalResult.data;
		}
	}

	// If even partial validation fails, try key-by-key validation
	// This handles cases where individual values might be invalid
	const validatedSettings: Record<string, unknown> = {};

	// Since settings are flat (one layer deep), we can iterate through stored keys
	for (const [key, value] of Object.entries(
		storedValue as Record<string, unknown>,
	)) {
		// Create a test object with just this key
		// This isolates validation to prevent one bad value from invalidating others
		const testObject = { [key]: value };
		const testResult = partialSchema.safeParse(testObject);

		if (testResult.success && key in testResult.data) {
			// This key-value pair is valid, keep it
			validatedSettings[key] = value;
		}
		// Invalid keys are silently discarded
		// This includes unknown keys from old versions or corrupted values
	}

	// Merge validated keys with defaults
	// Defaults fill in any missing required fields
	const finalSettings = {
		...getDefaultSettings(),
		...validatedSettings,
	};

	// Do one final validation to ensure the result is valid
	// This should always succeed given our approach, but we check to be safe
	const result = settingsSchema.safeParse(finalSettings);
	if (result.success) {
		return result.data;
	}

	// If all else fails, return defaults
	// This ensures the app always has valid settings to work with
	return getDefaultSettings();
}
