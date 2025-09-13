import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractErrorMessage } from 'wellcrafted/error';
import { Err, Ok, tryAsync } from 'wellcrafted/result';
import type { CompletionService } from './types';
import { CompletionServiceErr } from './types';

export function createGoogleCompletionService(): CompletionService {
	return {
		complete: async ({
			apiKey,
			model: modelName,
			systemPrompt,
			userPrompt,
		}) => {
			const combinedPrompt = `${systemPrompt}\n${userPrompt}`;
			const { data: completion, error: completionError } = await tryAsync({
				try: async () => {
					const genAI = new GoogleGenerativeAI(apiKey);

					const model = genAI.getGenerativeModel({
						model: modelName,
						// TODO: Add temperature to step settings
						generationConfig: { temperature: 0 },
					});
					const { response } = await model.generateContent(combinedPrompt);
					return response.text();
				},
				catch: (error) =>
					CompletionServiceErr({
						message: `Google API Error: ${extractErrorMessage(error)}`,
						context: { model: modelName, systemPrompt, userPrompt },
						cause: error,
					}),
			});

			if (completionError) return Err(completionError);

			if (!completion) {
				return CompletionServiceErr({
					message: 'Google API returned an empty response',
					context: { model: modelName, systemPrompt, userPrompt },
					cause: completionError,
				});
			}

			return Ok(completion);
		},
	};
}

export type GoogleCompletionService = ReturnType<
	typeof createGoogleCompletionService
>;

export const GoogleCompletionServiceLive = createGoogleCompletionService();
