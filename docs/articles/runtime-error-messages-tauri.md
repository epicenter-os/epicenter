# Runtime Error Messages in Tauri: Why I Defer to the Call Site

I was building error handling for WhisperCpp integration and hit an interesting decision: should error messages be static (defined in the error enum) or runtime (defined where the error occurs)?

I went with runtime messages. Here's why.

## The Pattern

In my Rust error definition:

```rust
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
#[serde(tag = "name", rename_all = "PascalCase")]
pub enum WhisperCppError {
    #[error("{message}")]
    FfmpegNotInstalled { message: String },
    
    #[error("{message}")]
    AudioReadError { message: String },
    
    #[error("{message}")]
    ModelLoadError { message: String },
}
```

Notice how every variant just passes through `{message}`. This might seem redundant at first. Why not define the messages statically like `#[error("FFmpeg is not installed")]`?

## The Call Site Has Context

Here's what happens at the error creation site:

```rust
// Static message would lose this context
.map_err(|e| WhisperCppError::AudioReadError {
    message: format!("Failed to create temp input file: {}", e),
})?;

// Different context, same error type
.map_err(|e| WhisperCppError::AudioReadError {
    message: format!("Failed to run ffmpeg: {}", e),
})?;

// Yet another context
.map_err(|e| WhisperCppError::AudioReadError {
    message: format!("FFmpeg conversion failed: {}", stderr),
})?;
```

Each `AudioReadError` happens in a different context. The call site knows exactly what failed and can include the underlying error details. A static message like "Audio read failed" would lose all this valuable debugging information.

## Serialization to TypeScript

The errors serialize cleanly for the frontend:

```json
{
  "name": "AudioReadError",
  "message": "Failed to create temp input file: Permission denied"
}
```

On the TypeScript side, I handle them with a discriminated union:

```typescript
const WhisperCppErrorType = type({
  name: "'AudioReadError' | 'FfmpegNotInstalled' | 'ModelLoadError'",
  message: 'string',
});

// Switch on the error type, use the message for details
switch (error.name) {
  case 'FfmpegNotInstalled':
    return WhisperingErr({
      title: '🛠️ FFmpeg Not Installed',
      description: error.message,  // Runtime message with full context
      action: { type: 'link', href: '/install-ffmpeg' },
    });
    
  case 'AudioReadError':
    return WhisperingErr({
      title: '🔊 Audio Read Error',
      description: error.message,  // Could be temp file, ffmpeg, or conversion issue
    });
}
```

## Why Not Static Messages?

I considered the traditional approach:

```rust
#[derive(Debug, Error)]
pub enum WhisperCppError {
    #[error("Failed to create temp input file")]
    TempInputFileCreation,
    
    #[error("Failed to run ffmpeg")]
    FfmpegExecutionError,
    
    #[error("FFmpeg conversion failed")]
    FfmpegConversionError,
    // ... dozens more specific variants
}
```

But this would mean:
1. Losing the underlying error details (unless I add a `source` field to every variant)
2. Creating dozens of variants for every possible failure point
3. Less useful error messages in the frontend

## The Trade-off

Yes, I lose some compile-time guarantees. The error messages aren't validated at compile time. But I gain:

1. **Rich context**: Every error includes exactly what went wrong
2. **Maintainability**: Five variants instead of fifty
3. **Debugging**: The frontend sees the actual underlying error, not a generic message
4. **Flexibility**: New error contexts don't require new enum variants

## Is `thiserror` Even Necessary?

With all variants using `#[error("{message}")]`, you might wonder if `thiserror` is overkill. It's not. It still:
- Implements `std::error::Error` automatically
- Provides `Display` implementation
- Keeps the door open for adding `#[source]` fields later
- Makes the intent clear: these are errors, not just data structs

## The Lesson

Sometimes the "right" pattern isn't the best pattern for your use case. In a Tauri app where errors cross the Rust-TypeScript boundary, runtime messages with categorized error types give you the best of both worlds: structured error handling in the frontend with rich debugging context from the backend.

The call site knows what went wrong. Let it tell you.