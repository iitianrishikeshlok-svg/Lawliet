import React from 'react';

/**
 * YouTubeBackground - Minimalist, Hardware-Accelerated Ambient YouTube Video Backdrop
 * - Plays specified YouTube video from exact timestamp (default: 40s)
 * - Zero player controls (no forward, pause, seek, or branding)
 * - Autoplay, loop, and full bleed 16:9 crop with zero letterboxing
 */
export default function YouTubeBackground({
  videoId = 'P2uypwLUfmE',
  startTime = 40,
  opacity = 0.45,
  className = '',
  overlayGradient = 'from-black/90 via-black/50 to-black/80',
}) {
  // YouTube embed URL with strict zero-controls parameters and exact start timestamp
  const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&start=${startTime}&loop=1&playlist=${videoId}&playsinline=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0`;

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 select-none bg-[#050608] ${className}`}
      aria-hidden="true"
    >
      {/* 16:9 Scaled Container that fills all viewports cleanly without black bars */}
      <div className="relative w-full h-full overflow-hidden pointer-events-none select-none">
        <iframe
          src={embedSrc}
          title="Ambient Background Video"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] min-w-[177.77vh] min-h-[56.25vw] scale-110 pointer-events-none border-0 select-none transition-opacity duration-1000"
          style={{
            opacity,
            filter: 'brightness(108%) contrast(110%) saturate(115%)',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          tabIndex={-1}
        />
      </div>

      {/* Atmospheric Vignette & Contrast Gradients */}
      {overlayGradient && (
        <div className={`absolute inset-0 bg-gradient-to-t ${overlayGradient} pointer-events-none`} />
      )}
    </div>
  );
}
