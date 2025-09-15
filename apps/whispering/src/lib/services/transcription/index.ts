import { DeepgramTranscriptionServiceLive } from './deepgram';
import { ElevenlabsTranscriptionServiceLive } from './elevenlabs';
import { GroqTranscriptionServiceLive } from './groq';
import { MistralTranscriptionServiceLive } from './mistral';
import { OpenaiTranscriptionServiceLive } from './openai';
import { SpeachesTranscriptionServiceLive } from './speaches';
import { WhisperCppTranscriptionServiceLive } from './whispercpp';

export {
	ElevenlabsTranscriptionServiceLive as elevenlabs,
	GroqTranscriptionServiceLive as groq,
	MistralTranscriptionServiceLive as mistral,
	OpenaiTranscriptionServiceLive as openai,
	SpeachesTranscriptionServiceLive as speaches,
	DeepgramTranscriptionServiceLive as deepgram,
	WhisperCppTranscriptionServiceLive as whispercpp,
};

export type { ElevenLabsTranscriptionService } from './elevenlabs';
export type { GroqTranscriptionService } from './groq';
export type { MistralTranscriptionService } from './mistral';
export type { OpenaiTranscriptionService } from './openai';
export type { SpeachesTranscriptionService } from './speaches';
export type { DeepgramTranscriptionService } from './deepgram';
export type { WhisperCppTranscriptionService } from './whispercpp';