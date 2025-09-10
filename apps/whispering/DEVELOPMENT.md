# Advanced Development Guide

**For basic setup and contributing guidelines:** See [CONTRIBUTING.md](../../CONTRIBUTING.md)

This guide covers GPU acceleration and advanced development topics for Whispering.

## Table of Contents

- [GPU Acceleration](#gpu-acceleration)
  - [macOS Metal](#macos-metal)
  - [Windows GPU Support](#windows-gpu-support)
  - [Linux GPU Support](#linux-gpu-support)
- [Troubleshooting](#troubleshooting)

## GPU Acceleration

GPU acceleration can significantly improve transcription performance but requires additional SDKs and configuration.

### macOS Metal

Metal acceleration provides GPU support on Apple Silicon and Intel Macs.

#### Prerequisites

- macOS 15.5 or later (required for Metal GPU acceleration)
- Apple Silicon Mac (M1/M2/M3/M4) or Intel Mac with Metal support
- Xcode Command Line Tools (not full Xcode - Command Line Tools are sufficient)

#### Verify Prerequisites

```bash
# Check if Metal is available on your Mac
system_profiler SPDisplaysDataType | grep "Metal"
# Expected output: Metal Support: Metal 3 (or similar)

# Check if Command Line Tools are installed
xcode-select -p
# Expected output: /Library/Developer/CommandLineTools

# If Command Line Tools are not installed:
xcode-select --install

# Verify Metal frameworks are available
ls /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/System/Library/Frameworks/ | grep Metal
# Expected output: Metal.framework, MetalKit.framework, etc.
```

#### Enable Metal (Automatic)

No manual configuration required! Simply use the Metal-specific commands:

```bash
# Metal development (requires --release flag for macOS compatibility)
bun dev:metal --release

# Production build with Metal
bun build:metal

# Regular CPU-only development (default)
bun dev
```

**How it works**: Metal GPU builds require the `--release` flag for proper macOS linking. The command automatically enables the Metal feature flag and sets the correct deployment target (15.5+). No Cargo.toml editing needed.

**Current Status**: Metal acceleration is disabled by default for maximum compatibility. All official releases use CPU-only builds.

### Windows GPU Support

Windows supports both CUDA (NVIDIA) and Vulkan acceleration.

#### CUDA (NVIDIA GPUs)

##### Prerequisites

- NVIDIA GPU with CUDA Compute Capability 3.5 or higher
- [CUDA Toolkit 11.8 or 12.x](https://developer.nvidia.com/cuda-downloads)
- Visual Studio 2019 or 2022

##### Verify CUDA Installation

```powershell
# Check CUDA version
nvcc --version

# Verify CUDA_PATH environment variable
echo %CUDA_PATH%

# List NVIDIA GPUs
nvidia-smi
```

##### Install CUDA Toolkit

1. Download CUDA Toolkit from [NVIDIA Developer](https://developer.nvidia.com/cuda-downloads)
2. Run installer with default options
3. Verify environment variables are set:
   - `CUDA_PATH` (e.g., `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.3`)
   - `CUDA_PATH_V12_3` (version-specific)

#### Vulkan (AMD/Intel/NVIDIA GPUs)

##### Prerequisites

- GPU with Vulkan support
- [Vulkan SDK](https://vulkan.lunarg.com/sdk/home)

##### Verify Vulkan Installation

```powershell
# Check Vulkan version
vulkaninfo --summary

# Verify VULKAN_SDK environment variable
echo %VULKAN_SDK%
```

##### Install Vulkan SDK

1. Download Vulkan SDK from [LunarG](https://vulkan.lunarg.com/sdk/home#windows)
2. Run installer
3. Verify `VULKAN_SDK` environment variable is set (e.g., `C:\VulkanSDK\1.3.275.0`)

#### Enable GPU Support (Automatic)

No manual configuration required! Simply use the GPU-specific commands:

```bash
# CUDA development (NVIDIA GPUs) - uses debug builds for faster compilation
bun dev:cuda

# Vulkan development (AMD/Intel/NVIDIA GPUs) - uses debug builds
bun dev:vulkan

# For release builds (better runtime performance):
bun dev:cuda --release
bun dev:vulkan --release

# Production builds
bun build:cuda
bun build:vulkan

# Regular CPU-only development (default)
bun dev
```

**How it works**: All GPU commands use debug builds by default for faster compilation. Add `--release` for better runtime performance. Note: Metal requires `--release` for macOS linking compatibility.

### Linux GPU Support

Linux supports CUDA, Vulkan, and ROCm (via HIP).

#### CUDA (NVIDIA GPUs)

##### Prerequisites

- NVIDIA GPU with CUDA support
- NVIDIA drivers (version 450.80.02 or later)
- CUDA Toolkit 11.8 or 12.x

##### Install CUDA

```bash
# Ubuntu/Debian
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update
sudo apt-get install cuda

# Fedora/RHEL
sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/fedora37/x86_64/cuda-fedora37.repo
sudo dnf install cuda
```

##### Verify CUDA Installation

```bash
# Check CUDA version
nvcc --version

# Verify CUDA libraries
ldconfig -p | grep cuda

# Check NVIDIA GPUs
nvidia-smi
```

#### Vulkan

##### Install Vulkan

```bash
# Ubuntu/Debian
sudo apt-get install vulkan-tools libvulkan-dev vulkan-validationlayers

# Fedora
sudo dnf install vulkan-tools vulkan-loader-devel vulkan-validation-layers

# Arch
sudo pacman -S vulkan-tools vulkan-headers vulkan-validation-layers
```

##### Verify Vulkan Installation

```bash
# Check Vulkan support
vulkaninfo --summary

# Test Vulkan rendering
vkcube
```

#### ROCm/HIP (AMD GPUs)

##### Prerequisites

- AMD GPU with ROCm support (check [ROCm documentation](https://docs.amd.com/en/latest/release/gpu_os_support.html))
- ROCm 5.0 or later

##### Install ROCm

```bash
# Ubuntu 22.04
wget https://repo.radeon.com/amdgpu-install/latest/ubuntu/jammy/amdgpu-install_6.0.60002-1_all.deb
sudo apt install ./amdgpu-install_6.0.60002-1_all.deb
sudo amdgpu-install --usecase=rocm
```

##### Verify ROCm Installation

```bash
# Check ROCm version
rocm-smi

# Verify HIP installation
hipconfig
```

#### Enable GPU Support (Automatic)

No manual configuration required! Simply use the GPU-specific commands:

```bash
# CUDA development (NVIDIA GPUs) - uses debug builds for faster compilation
bun dev:cuda

# Vulkan development (AMD/Intel/NVIDIA GPUs) - uses debug builds
bun dev:vulkan

# ROCm development (AMD GPUs via HIP) - uses debug builds
bun dev:rocm

# For release builds (better runtime performance):
bun dev:cuda --release
bun dev:vulkan --release
bun dev:rocm --release

# Production builds
bun build:cuda
bun build:vulkan
bun build:rocm

# Regular CPU-only development (default)
bun dev
```

**How it works**: All GPU commands use debug builds by default for faster compilation. Add `--release` for better runtime performance. Note: Metal requires `--release` for macOS linking compatibility.

## Troubleshooting

### Common Build Errors

#### Metal Linking Errors (macOS)

```
error: linking with `cc` failed
ld: symbol(s) not found for architecture arm64
```

or

```
Undefined symbols for architecture arm64:
  "___isPlatformVersionAtLeast", referenced from:
```

**Solutions**:

1. **Set deployment target and use release mode**:

   ```bash
   # Set deployment target to your macOS version (15.5+ required for Metal)
   MACOSX_DEPLOYMENT_TARGET=15.5 bun dev --release
   ```

2. **Ensure Command Line Tools are installed**:

   ```bash
   # Check if Command Line Tools are installed
   xcode-select -p
   # Should output: /Library/Developer/CommandLineTools

   # If not installed:
   xcode-select --install
   ```

3. **Use the correct deployment target**:

   ```bash
   # The dev:metal command handles this automatically, but if building manually:
   MACOSX_DEPLOYMENT_TARGET=15.5 bun build:metal
   ```

#### CUDA Not Found (Windows/Linux)

```
error: CUDA_PATH not found
```

**Solution**: Install CUDA Toolkit and ensure environment variables are set:

- Windows: Add `CUDA_PATH` to system environment variables
- Linux: Add to `.bashrc`: `export CUDA_PATH=/usr/local/cuda`

#### Vulkan SDK Not Found

```
error: VULKAN_SDK not found
```

**Solution**: Install Vulkan SDK and set environment variable:

- Windows: Installer should set automatically
- Linux: Add to `.bashrc`: `export VULKAN_SDK=/usr/local/vulkan`

#### Performance Not Improved with GPU

- Verify GPU is being utilized: Check GPU usage during transcription
- Ensure correct model size: Larger models benefit more from GPU acceleration
- Check thermal throttling: GPUs may throttle under sustained load

### Testing GPU Acceleration

To verify GPU acceleration is working:

1. **Monitor GPU Usage**:
   - macOS: Use Activity Monitor → Window → GPU History
   - Windows: Task Manager → Performance → GPU
   - Linux: `nvidia-smi` (NVIDIA), `radeontop` (AMD), or `intel_gpu_top` (Intel)

2. **Compare Performance**:

   ```bash
   # Build without GPU
   cargo build --release
   # Note transcription time for a test file

   # Build with GPU
   # (Edit Cargo.toml to enable GPU features)
   cargo build --release
   # Compare transcription time for the same file
   ```

3. **Check Logs**:
   Enable debug logging to see which backend is being used:
   ```bash
   RUST_LOG=debug cargo run
   ```

### Platform-Specific Notes

- **macOS**: Metal is only beneficial on Apple Silicon or recent Intel Macs
- **Windows**: CUDA typically provides better performance than Vulkan on NVIDIA GPUs
- **Linux**: hipBLAS support may require additional ROCm libraries

## Additional Resources

- [Whisper.cpp GPU Support](https://github.com/ggerganov/whisper.cpp#gpu-support)
- [CUDA Installation Guide](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/)
- [Vulkan Tutorial](https://vulkan-tutorial.com/)
- [Metal Programming Guide](https://developer.apple.com/metal/)
- [ROCm Documentation](https://docs.amd.com/)
