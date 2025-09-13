import OpenAI from 'openai';
import { Err, Ok, tryAsync } from 'wellcrafted/result';
import type { CompletionService } from './types';
import { CompletionServiceErr } from './types';

export function createOpenAiCompletionService(): CompletionService {
	return {
		async complete({ apiKey, model, systemPrompt, userPrompt }) {
			const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
			// Call OpenAI API
			const { data: completion, error: openaiApiError } = await tryAsync({
				try: () =>
					client.chat.completions.create({
						model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: userPrompt },
						],
					}),
				catch: (error) => {
					// Check if it's NOT an OpenAI API error
					if (!(error instanceof OpenAI.APIError)) {
						// This is an unexpected error type
						throw error;
					}
					// Return the error directly
					return Err(error);
				},
			});

			if (openaiApiError) {
				// Error handling follows https://www.npmjs.com/package/openai#error-handling
				const { status, name, message, error } = openaiApiError;

				// 400 - BadRequestError
				if (status === 400) {
					return CompletionServiceErr({
						message:
							message ??
							`Invalid request to OpenAI API. ${error?.message ?? ''}`.trim(),
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 401 - AuthenticationError
				if (status === 401) {
					return CompletionServiceErr({
						message:
							message ??
							'Your API key appears to be invalid or expired. Please update your API key in settings.',
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 403 - PermissionDeniedError
				if (status === 403) {
					return CompletionServiceErr({
						message:
							message ??
							"Your account doesn't have access to this model or feature.",
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 404 - NotFoundError
				if (status === 404) {
					return CompletionServiceErr({
						message:
							message ??
							'The requested model was not found. Please check the model name.',
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 422 - UnprocessableEntityError
				if (status === 422) {
					return CompletionServiceErr({
						message:
							message ??
							'The request was valid but the server cannot process it. Please check your parameters.',
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// 429 - RateLimitError
				if (status === 429) {
					return CompletionServiceErr({
						message: message ?? 'Too many requests. Please try again later.',
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// >=500 - InternalServerError
				if (status && status >= 500) {
					return CompletionServiceErr({
						message:
							message ??
							`The OpenAI service is temporarily unavailable (Error ${status}). Please try again in a few minutes.`,
						context: { status, name },
						cause: openaiApiError,
					});
				}

				// Handle APIConnectionError (no status code)
				if (!status && name === 'APIConnectionError') {
					return CompletionServiceErr({
						message:
							message ??
							'Unable to connect to the OpenAI service. This could be a network issue or temporary service interruption.',
						context: { name },
						cause: openaiApiError,
					});
				}

				// Catch-all for unexpected errors
				return CompletionServiceErr({
					message: message ?? 'An unexpected error occurred. Please try again.',
					context: { status, name },
					cause: openaiApiError,
				});
			}

			// Extract the response text
			const responseText = completion.choices[0]?.message?.content;
			if (!responseText) {
				return CompletionServiceErr({
					message: 'OpenAI API returned an empty response',
					context: { model, completion },
					cause: undefined,
				});
			}

			return Ok(responseText);
		},
	};
}

export type OpenaiCompletionService = ReturnType<
	typeof createOpenAiCompletionService
>;

export const OpenaiCompletionServiceLive = createOpenAiCompletionService();
