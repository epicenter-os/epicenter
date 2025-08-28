import { WhisperingErr, type WhisperingError } from '$lib/result';
import * as services from '$lib/services';
import type { Recording } from '$lib/services/db';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, type Result, partitionResults } from 'wellcrafted/result';
import { defineMutation, queryClient } from './_client';
import { notify } from './notify';
import { recordings } from './recordings';
import { rpc } from './';

const transcriptionKeys = {
	isTranscribing: ['transcription', 'isTranscribing'] as const,
} as const;

export const transcription = {
	isCurrentlyTranscribing() {
		return (
			queryClient.isMutating({
				mutationKey: transcriptionKeys.isTranscribing,
			}) > 0
		);
	},
	transcribeRecording: defineMutation({
		mutationKey: transcriptionKeys.isTranscribing,
		resultMutationFn: async (
			recording: Recording,
		): Promise<Result<string, WhisperingError>> => {
			if (!recording.blob) {
				return WhisperingErr({
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to transcribe.",
				});
			}
			const { error: setRecordingTranscribingError } =
				await recordings.updateRecording.execute({
					...recording,
					transcriptionStatus: 'TRANSCRIBING',
				});
			if (setRecordingTranscribingError) {
				notify.warning.execute({
					title:
						'⚠️ Unable to set recording transcription status to transcribing',
					description: 'Continuing with the transcription process...',
					action: {
						type: 'more-details',
						error: setRecordingTranscribingError,
					},
				});
			}
			const { data: transcribedText, error: transcribeError } =
				await transcribeBlob(recording.blob);
			if (transcribeError) {
				const { error: setRecordingTranscribingError } =
					await recordings.updateRecording.execute({
						...recording,
						transcriptionStatus: 'FAILED',
					});
				if (setRecordingTranscribingError) {
					notify.warning.execute({
						title: '⚠️ Unable to update recording after transcription',
						description:
							"Transcription failed but unable to update recording's transcription status in database",
						action: {
							type: 'more-details',
							error: setRecordingTranscribingError,
						},
					});
				}
				return Err(transcribeError);
			}

			const { error: setRecordingTranscribedTextError } =
				await recordings.updateRecording.execute({
					...recording,
					transcribedText,
					transcriptionStatus: 'DONE',
				});
			if (setRecordingTranscribedTextError) {
				notify.warning.execute({
					title: '⚠️ Unable to update recording after transcription',
					description:
						"Transcription completed but unable to update recording's transcribed text and status in database",
					action: {
						type: 'more-details',
						error: setRecordingTranscribedTextError,
					},
				});
			}
			return Ok(transcribedText);
		},
	}),

	transcribeRecordings: defineMutation({
		mutationKey: transcriptionKeys.isTranscribing,
		resultMutationFn: async (recordings: Recording[]) => {
			const results = await Promise.all(
				recordings.map(async (recording) => {
					if (!recording.blob) {
						return WhisperingErr({
							title: '⚠️ Recording blob not found',
							description: "Your recording doesn't have a blob to transcribe.",
						});
					}
					return await transcribeBlob(recording.blob);
				}),
			);
			const partitionedResults = partitionResults(results);
			return Ok(partitionedResults);
		},
	}),
};

async function transcribeBlob(
	blob: Blob,
): Promise<Result<string, WhisperingError>> {
	const selectedService =
		settings.value['transcription.selectedTranscriptionService'];

	// Log transcription request
	const startTime = Date.now();
	console.log('🎙️ Starting transcription with:', {
		provider: selectedService,
		blobSize: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
		hasBlob: !!blob,
	});
	
	rpc.analytics.logEvent.execute({
		type: 'transcription_requested',
		provider: selectedService,
	});

	const transcriptionResult: Result<string, WhisperingError> =
		await (async () => {
			switch (selectedService) {
				case 'OpenAI':
					// Use native HTTP client if custom endpoint is configured (bypasses CORS)
					if (settings.value['apiEndpoints.openai']) {
						return await services.transcriptions.nativeOpenai.transcribe(blob, {
							outputLanguage: settings.value['transcription.outputLanguage'],
							prompt: settings.value['transcription.prompt'],
							temperature: settings.value['transcription.temperature'],
							apiKey: settings.value['apiKeys.openai'],
							modelName: settings.value['transcription.openai.model'],
							baseURL: settings.value['apiEndpoints.openai'],
						});
					} else {
						// Use regular OpenAI SDK for official endpoint
						return await services.transcriptions.openai.transcribe(blob, {
							outputLanguage: settings.value['transcription.outputLanguage'],
							prompt: settings.value['transcription.prompt'],
							temperature: settings.value['transcription.temperature'],
							apiKey: settings.value['apiKeys.openai'],
							modelName: settings.value['transcription.openai.model'],
						});
					}
				case 'Groq':
					return await services.transcriptions.groq.transcribe(blob, {
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
						apiKey: settings.value['apiKeys.groq'],
						modelName: settings.value['transcription.groq.model'],
						...(settings.value['apiEndpoints.groq'] && {
							baseURL: settings.value['apiEndpoints.groq'],
						}),
					});
				case 'speaches':
					return await services.transcriptions.speaches.transcribe(blob, {
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
						modelId: settings.value['transcription.speaches.modelId'],
						baseUrl: settings.value['transcription.speaches.baseUrl'],
					});
				case 'ElevenLabs':
					return await services.transcriptions.elevenlabs.transcribe(blob, {
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
						apiKey: settings.value['apiKeys.elevenlabs'],
						modelName: settings.value['transcription.elevenlabs.model'],
					});
				case 'Deepgram':
					return await services.transcriptions.deepgram.transcribe(blob, {
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
						apiKey: settings.value['apiKeys.deepgram'],
						modelName: settings.value['transcription.deepgram.model'],
					});
				case 'whispercpp':
					return await services.transcriptions.whispercpp.transcribe(blob, {
						outputLanguage: settings.value['transcription.outputLanguage'],
						prompt: settings.value['transcription.prompt'],
						temperature: settings.value['transcription.temperature'],
						modelPath: settings.value['transcription.whispercpp.modelPath'],
						useGpu: settings.value['transcription.whispercpp.useGpu'],
					});
				default:
					return WhisperingErr({
						title: '⚠️ No transcription service selected',
						description: 'Please select a transcription service in settings.',
					});
			}
		})();

	// Log transcription result
	const duration = Date.now() - startTime;
	if (transcriptionResult.error) {
		console.error('❌ Transcription failed:', {
			provider: selectedService,
			duration: `${duration}ms`,
			error: transcriptionResult.error,
		});
		rpc.analytics.logEvent.execute({
			type: 'transcription_failed',
			provider: selectedService,
			error_title: transcriptionResult.error.title,
			error_description: transcriptionResult.error.description,
		});
	} else {
		console.log('✅ Transcription completed:', {
			provider: selectedService,
			duration: `${duration}ms`,
			textLength: transcriptionResult.data.length,
		});
		rpc.analytics.logEvent.execute({
			type: 'transcription_completed',
			provider: selectedService,
			duration,
		});
	}

	return transcriptionResult;
}
