<script lang="ts">
	import { Button } from '@repo/ui/button';
	import * as Card from '@repo/ui/card';
	import * as Tabs from '@repo/ui/tabs';
	import { Badge } from '@repo/ui/badge';
	import { Input } from '@repo/ui/input';
	import { Link } from '@repo/ui/link';
	import {
		Download,
		CheckIcon,
		Paperclip,
		LoaderCircle,
		X,
	} from '@lucide/svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { settings } from '$lib/stores/settings.svelte';
	import { appDataDir, join } from '@tauri-apps/api/path';
	import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
	import { fetch } from '@tauri-apps/plugin-http';
	import { SvelteSet } from 'svelte/reactivity';
	import { extractErrorMessage } from 'wellcrafted/error';

	// Pre-built models configuration
	const WHISPER_MODELS = [
		{
			id: 'tiny',
			name: 'Tiny',
			description: 'Fastest, basic accuracy',
			size: '78 MB',
			sizeBytes: 77_700_000,
			url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
			filename: 'ggml-tiny.bin',
		},
		{
			id: 'small',
			name: 'Small',
			description: 'Fast, good accuracy',
			size: '488 MB',
			sizeBytes: 488_000_000,
			url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
			filename: 'ggml-small.bin',
		},
		{
			id: 'medium',
			name: 'Medium',
			description: 'Balanced speed & accuracy',
			size: '1.5 GB',
			sizeBytes: 1_530_000_000,
			url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
			filename: 'ggml-medium.bin',
		},
		{
			id: 'large-v3-turbo',
			name: 'Large v3 Turbo',
			description: 'Best accuracy, slower',
			size: '1.6 GB',
			sizeBytes: 1_620_000_000,
			url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin',
			filename: 'ggml-large-v3-turbo.bin',
		},
	];

	// Component state
	let downloadProgress = $state<{ [key: string]: number }>({});
	let downloadingModels = new SvelteSet<string>();

	/**
	 * Gets the default directory where the app downloads Whisper models.
	 * This is not the only place models can be loaded from - users can browse
	 * for models anywhere on their filesystem. This is just the default location
	 * where the app stores downloaded models.
	 * @returns Path to the app's whisper-models directory (e.g., ~/Library/Application Support/com.epicenter.whispering/whisper-models)
	 */
	async function getDefaultModelsDownloadDirectory(): Promise<string> {
		const appDir = await appDataDir();
		return await join(appDir, 'whisper-models');
	}

	/**
	 * Creates the default models download directory if it doesn't exist.
	 * This ensures the directory is available before attempting to download models.
	 */
	async function ensureDefaultModelsDirectory(): Promise<void> {
		const modelsDir = await getDefaultModelsDownloadDirectory();
		const dirExists = await exists(modelsDir);
		if (!dirExists) {
			await mkdir(modelsDir, { recursive: true });
		}
	}

	/**
	 * Constructs the full path to a model file within the default download directory.
	 * @param filename - The model filename (e.g., 'ggml-tiny.bin')
	 * @returns Full path to the model file in the default download directory
	 */
	async function getDefaultModelPath(filename: string): Promise<string> {
		const modelsDir = await getDefaultModelsDownloadDirectory();
		return await join(modelsDir, filename);
	}

	// Query to check which models are downloaded
	const downloadedModelsQuery = createQuery(() => ({
		queryKey: ['whisperModels', 'downloaded'],
		queryFn: async () => {
			if (!window.__TAURI_INTERNALS__) return [];

			const downloaded: string[] = [];
			for (const model of WHISPER_MODELS) {
				const modelPath = await getDefaultModelPath(model.filename);
				if (await exists(modelPath)) {
					downloaded.push(model.id);
				}
			}
			return downloaded;
		},
		staleTime: 5000,
		enabled: !!window.__TAURI_INTERNALS__,
	}));

	const downloadedModels = $derived(new Set(downloadedModelsQuery.data || []));

	// Download model function
	async function downloadModel(modelId: string) {
		const model = WHISPER_MODELS.find((m) => m.id === modelId);
		if (!model || downloadingModels.has(modelId)) return;

		downloadingModels.add(modelId);
		downloadProgress[modelId] = 0;

		try {
			await ensureDefaultModelsDirectory();
			const modelPath = await getDefaultModelPath(model.filename);

			// Check if already exists
			if (await exists(modelPath)) {
				settings.updateKey('transcription.whispercpp.modelPath', modelPath);
				toast.success('Model already downloaded and activated');
				await downloadedModelsQuery.refetch();
				return;
			}

			// Download the model
			const response = await fetch(model.url);
			if (!response.ok) {
				throw new Error(`Failed to download: ${response.status}`);
			}

			const contentLength = response.headers.get('content-length');
			const totalBytes = contentLength
				? Number.parseInt(contentLength, 10)
				: model.sizeBytes;

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('Failed to read response body');
			}

			const chunks: Uint8Array[] = [];
			let downloadedBytes = 0;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				chunks.push(value);
				downloadedBytes += value.length;
				downloadProgress[modelId] = Math.round(
					(downloadedBytes / totalBytes) * 100,
				);
			}

			// Combine chunks and save
			const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
			const fileContent = new Uint8Array(totalLength);
			let position = 0;
			for (const chunk of chunks) {
				fileContent.set(chunk, position);
				position += chunk.length;
			}

			await writeFile(modelPath, fileContent);

			// Update settings and refresh
			settings.updateKey('transcription.whispercpp.modelPath', modelPath);
			toast.success('Model downloaded and activated successfully');
			await downloadedModelsQuery.refetch();
		} catch (error) {
			console.error('Download failed:', error);
			toast.error('Failed to download model', {
				description: extractErrorMessage(error),
			});
		} finally {
			downloadingModels.delete(modelId);
			delete downloadProgress[modelId];
		}
	}

	// Activate an already downloaded model
	async function activateModel(modelId: string) {
		const model = WHISPER_MODELS.find((m) => m.id === modelId);
		if (!model) return;

		const modelPath = await getDefaultModelPath(model.filename);
		settings.updateKey('transcription.whispercpp.modelPath', modelPath);
		toast.success(`${model.name} model activated`);
		downloadedModelsQuery.refetch();
	}

	// Handle manual file selection
	async function selectManualModel() {
		if (!window.__TAURI_INTERNALS__) return;

		const { open } = await import('@tauri-apps/plugin-dialog');
		const selected = await open({
			multiple: false,
			filters: [
				{
					name: 'Whisper Models',
					extensions: ['bin', 'gguf', 'ggml'],
				},
			],
			title: 'Select Whisper Model File',
		});

		if (selected) {
			settings.updateKey('transcription.whispercpp.modelPath', selected);
			toast.success('Model selected');
			await modelFileQuery.refetch();
		}
	}

	// Get current active model - properly reactive to settings changes
	const activeModelId = $derived.by(() => {
		const currentModelPath =
			settings.value['transcription.whispercpp.modelPath'];
		if (!currentModelPath) return null;

		for (const model of WHISPER_MODELS) {
			if (currentModelPath.endsWith(model.filename)) {
				return model.id;
			}
		}
		return 'custom';
	});

	// Query to check if the manual model file exists
	const modelFileQuery = createQuery(() => ({
		queryKey: [
			'modelFileExists',
			settings.value['transcription.whispercpp.modelPath'],
		],
		queryFn: async () => {
			const modelPath = settings.value['transcription.whispercpp.modelPath'];
			if (!modelPath || !window.__TAURI_INTERNALS__) return null;
			return await exists(modelPath);
		},
		enabled:
			!!settings.value['transcription.whispercpp.modelPath'] &&
			!!window.__TAURI_INTERNALS__,
		staleTime: 5000,
	}));
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Whisper Model</Card.Title>
		<Card.Description>
			Select a pre-built model or browse for your own. Models run locally for
			private, offline transcription.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<Tabs.Root value="prebuilt">
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="prebuilt">Pre-built Models</Tabs.Trigger>
				<Tabs.Trigger value="manual">Manual Selection</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="prebuilt" class="space-y-4">
				<div class="grid gap-3">
					{#each WHISPER_MODELS as model}
						{@const isActive = activeModelId === model.id}
						{@const isDownloaded = downloadedModels.has(model.id)}
						{@const isDownloading = downloadingModels.has(model.id)}
						{@const progress = downloadProgress[model.id] || 0}

						<div
							class="flex items-center gap-3 p-3 rounded-lg border {isActive
								? 'border-primary bg-primary/5'
								: ''}"
						>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<span class="font-medium">{model.name}</span>
									{#if isActive}
										<Badge variant="default" class="text-xs">Active</Badge>
									{:else if isDownloaded}
										<Badge variant="secondary" class="text-xs">Downloaded</Badge
										>
									{/if}
								</div>
								<div class="text-sm text-muted-foreground">
									{model.description}
								</div>
								<div class="text-xs text-muted-foreground mt-1">
									{model.size}
								</div>
							</div>

							<div class="flex items-center gap-2">
								{#if isDownloading}
									<div class="flex items-center gap-2 min-w-[120px]">
										<LoaderCircle class="size-4 animate-spin" />
										<span class="text-sm font-medium">{progress}%</span>
									</div>
								{:else if isDownloaded}
									{#if !isActive}
										<Button
											size="sm"
											variant="outline"
											onclick={() => activateModel(model.id)}
										>
											Activate
										</Button>
									{:else}
										<Button size="sm" variant="default" disabled>
											<CheckIcon class="size-4 mr-1" />
											Activated
										</Button>
									{/if}
								{:else}
									<Button
										size="sm"
										variant="outline"
										onclick={() => downloadModel(model.id)}
									>
										<Download class="size-4 mr-2" />
										Download
									</Button>
								{/if}
							</div>
						</div>

						{#if isDownloading}
							<div class="w-full bg-secondary rounded-full h-1.5 -mt-2">
								<div
									class="bg-primary h-1.5 rounded-full transition-all duration-300"
									style="width: {progress}%"
								></div>
							</div>
						{/if}
					{/each}
				</div>
			</Tabs.Content>

			<Tabs.Content value="manual" class="space-y-4">
				<div class="space-y-4">
					<!-- Instructions -->
					<div>
						<p class="text-sm font-medium mb-2">
							<span class="text-muted-foreground">Step 1:</span> Download a Whisper
							model
						</p>
						<ul class="ml-6 mt-2 space-y-2 text-sm text-muted-foreground">
							<li class="list-disc">
								Visit the <Link
									href="https://huggingface.co/ggerganov/whisper.cpp/tree/main"
									target="_blank"
									rel="noopener noreferrer"
									class="underline"
								>
									model repository
								</Link>
							</li>
							<li class="list-disc">
								Download any model file (e.g., ggml-base.en.bin for
								English-only)
							</li>
							<li class="list-disc">
								Quantized models (q5_0, q8_0) offer smaller sizes with minimal
								quality loss
							</li>
						</ul>
					</div>

					<!-- Step 2: Select model -->
					<div>
						<p class="text-sm font-medium mb-2">
							<span class="text-muted-foreground">Step 2:</span> Select the model
							file
						</p>
						<div class="flex items-center gap-2">
							<Input
								id="whispercpp-model-path"
								type="text"
								value={settings.value['transcription.whispercpp.modelPath'] ||
									''}
								readonly
								placeholder="No model selected"
								class="flex-1"
							/>
							{#if settings.value['transcription.whispercpp.modelPath']}
								<Button
									variant="outline"
									size="icon"
									onclick={() => {
										settings.updateKey(
											'transcription.whispercpp.modelPath',
											'',
										);
										toast.success('Model path cleared');
									}}
									title="Clear model path"
								>
									<X class="size-4" />
								</Button>
							{/if}
							<Button
								variant="outline"
								size="icon"
								onclick={selectManualModel}
								title="Browse for model file"
							>
								<Paperclip class="size-4" />
							</Button>
						</div>
						{#if settings.value['transcription.whispercpp.modelPath']}
							{#if modelFileQuery.isPending}
								<p class="text-xs text-muted-foreground mt-1">
									Checking model file...
								</p>
							{:else if modelFileQuery.data === false}
								<p class="text-xs text-destructive mt-1">
									⚠️ Model file not found: {settings.value[
										'transcription.whispercpp.modelPath'
									]
										.split('/')
										.pop()}
								</p>
							{:else if modelFileQuery.data === true}
								<p class="text-xs text-green-600 dark:text-green-400 mt-1">
									✓ Model: {settings.value['transcription.whispercpp.modelPath']
										.split('/')
										.pop()}
								</p>
							{:else}
								<p class="text-xs text-muted-foreground mt-1">
									Model: {settings.value['transcription.whispercpp.modelPath']
										.split('/')
										.pop()}
								</p>
							{/if}
						{/if}
					</div>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</Card.Content>
</Card.Root>
