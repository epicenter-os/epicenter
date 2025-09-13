use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
#[serde(tag = "name", rename_all = "PascalCase")]
pub enum WhisperCppError {
    #[error("{message}")]
    AudioReadError { message: String },

    #[error("{message}")]
    ModelLoadError { message: String },

    #[error("{message}")]
    GpuError { message: String },

    #[error("{message}")]
    TranscriptionError { message: String },
}