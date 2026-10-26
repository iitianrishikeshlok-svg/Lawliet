========================================================================
L — Desktop AI Assistant: Background Video Assets
========================================================================

Place your local cinematic MP4 or WebM video file in this directory with the filename:
- l-intro.mp4 (Recommended: 1080p, H.264, muted or low-audio, looping)
- l-intro.webm (Alternative format)

Suggested theme:
- Atmospheric detective noir, rain on glass, shadows, subtle movement, or mysterious silhouette.

When `l-intro.mp4` is present in this folder, the L opening screen and web background
will automatically play it using a native HTML5 <video> element with 60FPS hardware acceleration.

If no file is present, L automatically falls back to its built-in procedural
cinematic rain & shadow canvas renderer or connected video stream.
