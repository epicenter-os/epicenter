# Whispering Architecture Deep Dive

Whispering uses a clean three-layer architecture that achieves **extensive code sharing** between the desktop app (Tauri) and web app. This is possible because of how we handle platform differences and separate business logic from UI concerns.

**Quick Navigation:** [Service Layer](#service-layer---pure-business-logic--platform-abstraction) | [Query Layer](#query-layer---adding-reactivity-and-state-management) | [Error Handling](#error-handling-with-wellcrafted)

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  UI Layer   │ --> │  Query Layer│ --> │ Service Layer│
│ (Svelte 5)  │     │ (TanStack)  │     │   (Pure)     │
└─────────────┘     └─────────────┘     └──────────────┘
      ↑                    │
      └────────────────────┘
         Reactive Updates
```

## Service Layer - Pure Business Logic + Platform Abstraction

The service layer contains all business logic as **pure functions** with zero UI dependencies. Services don't know about reactive Svelte variables, user settings, or UI state—they only accept explicit parameters and return `Result<T, E>` types for consistent error handling.

The key innovation is **build-time platform detection**. Services automatically choose the right implementation based on the target platform:

```typescript
// Platform abstraction happens at build time
export const ClipboardServiceLive = window.__TAURI_INTERNALS__
  ? createClipboardServiceDesktop() // Uses Tauri clipboard APIs
  : createClipboardServiceWeb();     // Uses browser clipboard APIs

// Same interface, different implementations
export const NotificationServiceLive = window.__TAURI_INTERNALS__
  ? createNotificationServiceDesktop() // Native OS notifications
  : createNotificationServiceWeb();     // Browser notifications
```

This design enables **97% code sharing** between desktop and web versions. The vast majority of the application logic is platform-agnostic, with only the thin service implementation layer varying between platforms. Services are incredibly **testable** (just pass mock parameters), **reusable** (work identically anywhere), and **maintainable** (no hidden dependencies).

### Measuring Code Sharing

To calculate the actual code sharing percentage, I analyzed the codebase:

```bash
# Count total lines of code in the app
find src -name "*.ts" -o -name "*.svelte" -o -name "*.js" | \
  grep -v node_modules | xargs wc -l
# Result: 22,824 lines total

# Count platform-specific implementation code
find src/lib/services -name "*desktop.ts" -o -name "*web.ts" | \
  xargs wc -l
# Result: 685 lines (3%)

# Code sharing calculation
# Shared code: 22,824 - 685 = 22,139 lines (97%)
```

This minimal platform-specific code demonstrates how the architecture maximizes code reuse while maintaining native performance on each platform.

**→ Learn more:** [Services README](./src/lib/services/README.md) | [Constants Organization](./src/lib/constants/README.md)

## Query Layer - Adding Reactivity and State Management

The query layer is where reactivity gets injected on top of pure services. It wraps service functions with TanStack Query and handles two key responsibilities:

**Runtime Dependency Injection** - Dynamically switching service implementations based on user settings:

```typescript
// From transcription query layer
async function transcribeBlob(blob: Blob) {
  const selectedService = settings.value['transcription.selectedTranscriptionService'];

  switch (selectedService) {
    case 'OpenAI':
      return services.transcriptions.openai.transcribe(blob, {
        apiKey: settings.value['apiKeys.openai'],
        model: settings.value['transcription.openai.model'],
      });
    case 'Groq':
      return services.transcriptions.groq.transcribe(blob, {
        apiKey: settings.value['apiKeys.groq'], 
        model: settings.value['transcription.groq.model'],
      });
  }
}
```

**Optimistic Updates** - Using the TanStack Query client to manipulate the cache for optimistic UI. By updating the cache, reactivity automatically kicks in and the UI reflects these changes, giving you instant optimistic updates.

It's often unclear where exactly you should mutate the cache with the query client—sometimes at the component level, sometimes elsewhere. By having this dedicated query layer, it becomes very clear: we co-locate three key things in one place: (1) the service call, (2) runtime settings injection based on reactive variables, and (3) cache manipulation (also reactive). This creates a layer that bridges reactivity with services in an intuitive way. It also cleans up our components significantly because we have a consistent place to put this logic—now developers know that all cache manipulation lives in the query folder, making it clear where to find and add this type of functionality:

```typescript
// From recordings mutations
createRecording: defineMutation({
  resultMutationFn: async (recording: Recording) => {
    const { data, error } = await services.db.createRecording(recording);
    if (error) return Err(error);

    // Optimistically update cache - UI updates instantly
    queryClient.setQueryData(['recordings'], (oldData) => {
      if (!oldData) return [recording];
      return [...oldData, recording];
    });

    return Ok(data);
  },
})
```

This design keeps all reactive state management isolated in the query layer, allowing services to remain pure and platform-agnostic while the UI gets dynamic behavior and instant updates. 

**→ Learn more:** [Query README](./src/lib/query/README.md) | [RPC Pattern Guide](./src/lib/query/README.md#rpc-pattern)

## Error Transformation

The query layer also transforms service-specific errors into `WhisperingError` types that integrate seamlessly with the toast notification system. This happens inside `resultMutationFn` or `resultQueryFn`, creating a clean boundary between business logic errors and UI presentation:

```typescript
// Service returns domain-specific error
const { data, error: serviceError } = await services.recorder.startRecording(...);

if (serviceError) {
  // Query layer transforms to UI-friendly WhisperingError
  return Err(WhisperingError({
    title: '❌ Failed to start recording',
    description: serviceError.message,  // Preserve detailed message
    action: { type: 'more-details', error: serviceError }
  }));
}
```

## Error Handling with WellCrafted

Whispering uses [WellCrafted](https://github.com/wellcrafted-dev/wellcrafted), a lightweight TypeScript library I created to bring Rust-inspired error handling to JavaScript. I built WellCrafted after using the [effect-ts library](https://github.com/Effect-TS/effect) when it first came out in 2023—I was very excited about the concepts but found it too verbose. WellCrafted distills my takeaways from effect-ts and makes them better by leaning into more native JavaScript syntax, making it perfect for this use case. Unlike traditional try-catch blocks that hide errors, WellCrafted makes all potential failures explicit in function signatures using the `Result<T, E>` pattern.

`wellcrafted` ensures robust error handling across the entire codebase, from service layer functions to UI components, while maintaining excellent developer experience with TypeScript's control flow analysis.

## Architecture Patterns

- **Service Layer**: Platform-agnostic business logic with Result types
- **Query Layer**: Reactive data management with caching
- **RPC Pattern**: Unified API interface (`rpc.recordings.getAllRecordings`)
- **Dependency Injection**: Clean separation of concerns

## Key Architectural Decisions

1. **Pure Functions Over Classes**: Services are functions, not classes, making them easier to test and compose
2. **Explicit Error Handling**: Every function that can fail returns a Result type
3. **Platform Abstraction at Build Time**: Platform detection happens once, not at runtime
4. **Three Clear Layers**: Each layer has a specific responsibility with clear boundaries
5. **TypeScript Throughout**: Full type safety from services to UI components