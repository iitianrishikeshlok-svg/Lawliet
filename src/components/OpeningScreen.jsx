import React, { useState, useEffect, useRef } from 'react';
import { audio } from '../common/AudioEngine';

/**
 * OpeningScreen — Fullscreen cinematic Death Note entrance for L.
 * Optimized for both Desktop and Mobile Phone devices.
 *
 * Requirements:
 * 1. Immediate Autoplay: Background video plays instantly the moment the user enters the web.
 * 2. New Logo: Red inverted triangle with dotted inner border, top wave crest, and central L with underline.
 * 3. Book Opening Sound: Plays Death Note - Ryuk's Theme A (0zYw5IuEUZ0).
 * 4. No Logo during Book Opening: When Death Note opens, the logo is NOT shown—only the authentic,
 *    dark cinematic open book with crystal-clear, fully readable rules and Shinigami ambience.
 */
export default function OpeningScreen({ onInitialize, theme }) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [copiedPhoneLink, setCopiedPhoneLink] = useState(false);

  // Awakening & Death Note book opening sequence state
  const [isOpeningBook, setIsOpeningBook] = useState(false);
  const [animStage, setAnimStage] = useState(0); // 0: idle, 1: book open & sound, 2: reading rules, 3: transition

  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const ryukIframeRef = useRef(null);
  const canvasRef = useRef(null);
  const bgAtmosphereCanvasRef = useRef(null);

  // Local Wi-Fi Network Address for Phone Access
  const PHONE_NETWORK_URL = 'http://172.21.16.52:5173';

  // Check reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Send postMessage commands to YouTube IFrame API
  const sendPlayerCommand = (iframe, func, args = []) => {
    try {
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: func,
            args: args,
          }),
          '*'
        );
      }
    } catch {
      // ignore
    }
  };

  const unmuteBgAudio = () => {
    if (window._lBgPlayer?.unMute) {
      window._lBgPlayer.unMute();
      window._lBgPlayer.setVolume(100);
      window._lBgPlayer.playVideo();
    }
    sendPlayerCommand(iframeRef.current, 'unMute');
    sendPlayerCommand(iframeRef.current, 'setVolume', [100]);
    sendPlayerCommand(iframeRef.current, 'playVideo');
    setIsAudioMuted(false);
  };

  const muteBgAudio = () => {
    if (window._lBgPlayer?.mute) {
      window._lBgPlayer.mute();
    }
    sendPlayerCommand(iframeRef.current, 'mute');
    setIsAudioMuted(true);
  };

  const toggleSound = (e) => {
    e?.stopPropagation();
    audio.playClick();
    if (isAudioMuted) {
      unmuteBgAudio();
    } else {
      muteBgAudio();
    }
  };

  const copyPhoneUrl = (e) => {
    e?.stopPropagation();
    audio.playClick();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(PHONE_NETWORK_URL);
      setCopiedPhoneLink(true);
      setTimeout(() => setCopiedPhoneLink(false), 2500);
    }
  };

  // --------------------------------------------------------------------------
  // Instant Guaranteed Autoplay on Web Entry & Persistent Loop
  // (Zero Click Required — Autoplays Muted Instantly According to Browser Spec)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let player = null;
    let isMounted = true;

    // Direct postMessage kickstart (immediate execution at 0ms)
    const triggerPlay = () => {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'mute', args: [] }),
            '*'
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        }
      } catch {}
    };

    triggerPlay();
    const t1 = setTimeout(triggerPlay, 100);
    const t2 = setTimeout(triggerPlay, 350);
    const t3 = setTimeout(triggerPlay, 800);
    const t4 = setTimeout(triggerPlay, 1800);

    // Initialize YouTube IFrame API to control playback and suppress pause states
    const setupYTPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      try {
        player = new window.YT.Player('bg-youtube-iframe', {
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              event.target.mute();
              event.target.playVideo();
              setVideoLoaded(true);
              setTimeout(() => {
                if (isMounted) event.target.playVideo();
              }, 400);
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              // 1 = playing, 2 = paused, 0 = ended, -1 = unstarted
              if (event.data === 1) {
                setVideoLoaded(true);
              } else if (event.data === 2 || event.data === 0 || event.data === -1) {
                // If paused or ended, auto-resume playback instantly
                event.target.mute();
                event.target.playVideo();
              }
            },
          },
        });
        window._lBgPlayer = player;
      } catch (e) {
        console.warn('[YT Player setup error]:', e);
      }
    };

    if (window.YT && window.YT.Player) {
      setupYTPlayer();
    } else {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        setupYTPlayer();
      };
    }

    // Keep-alive heartbeat: guarantees video keeps looping and never stays paused
    const heartbeat = setInterval(() => {
      if (window._lBgPlayer?.getPlayerState) {
        const state = window._lBgPlayer.getPlayerState();
        if (state !== 1 && state !== 3) {
          window._lBgPlayer.mute();
          window._lBgPlayer.playVideo();
        }
      } else {
        triggerPlay();
      }
    }, 2000);

    // Listen to postMessage events from YouTube
    const handleYtMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && (data.event === 'onReady' || data.event === 'initialDelivery')) {
          triggerPlay();
          setVideoLoaded(true);
        }
        if (data && (data.event === 'onStateChange' || data.info === 2 || data.info === 0)) {
          triggerPlay();
        }
      } catch {}
    };
    window.addEventListener('message', handleYtMessage);

    // First user gesture triggers audio unlock
    const handleFirstGesture = () => {
      triggerPlay();
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(heartbeat);
      window.removeEventListener('message', handleYtMessage);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  // --------------------------------------------------------------------------
  // Atmospheric Canvas: Dark Mist & Subtle Lighting (Guarantees zero-blank bg)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = bgAtmosphereCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    let t = 0;
    const renderAtmosphere = () => {
      t += 0.015;
      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 60, w * 0.5, h * 0.5, w * 0.7);
      grad.addColorStop(0, 'rgba(18, 12, 22, 0.45)');
      grad.addColorStop(0.5, 'rgba(10, 8, 14, 0.75)');
      grad.addColorStop(1, 'rgba(4, 5, 8, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (Math.sin(t * 1.8) > 0.985) {
        ctx.fillStyle = 'rgba(180, 20, 60, 0.08)';
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(renderAtmosphere);
    };
    renderAtmosphere();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // --------------------------------------------------------------------------
  // Dynamic Burning Embers & Shinigami Feathers Canvas
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const PARTICLE_COUNT = 40;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: h + Math.random() * 80,
      size: Math.random() * 3.4 + 1.2,
      speedY: Math.random() * 1.4 + 0.7,
      speedX: (Math.random() - 0.5) * 1.0,
      opacity: Math.random() * 0.7 + 0.3,
      decay: Math.random() * 0.0025 + 0.001,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.035 + 0.015,
      isEmber: Math.random() > 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
    }));

    const renderParticles = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * 0.8 + p.speedX;
        p.opacity -= p.decay;
        p.rotation += p.rotSpeed;

        if (p.y < -30 || p.opacity <= 0.05) {
          p.x = w * 0.5 + (Math.random() - 0.5) * (w * 0.75);
          p.y = h + 20;
          p.opacity = Math.random() * 0.75 + 0.25;
          p.sway = Math.random() * Math.PI * 2;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.isEmber) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
          rad.addColorStop(0, `rgba(255, 240, 160, ${p.opacity})`);
          rad.addColorStop(0.4, `rgba(255, 50, 40, ${p.opacity * 0.85})`);
          rad.addColorStop(1, 'rgba(225, 20, 60, 0)');
          ctx.fillStyle = rad;
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(18, 14, 18, ${p.opacity * 0.85})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.8, p.size * 0.7, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(renderParticles);
    };
    renderParticles();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [prefersReducedMotion]);

  // --------------------------------------------------------------------------
  // Logo Click: Ryuk's Theme A (0zYw5IuEUZ0) + Death Note Opening (NO LOGO OVER BOOK)
  // --------------------------------------------------------------------------
  const handleLogoClick = () => {
    if (isOpeningBook) return;

    // Explicitly mute background video so only Ryuk's Theme A and Death Note sound effects play
    muteBgAudio();

    // 1. Play Death Note - Ryuk's Theme A (0zYw5IuEUZ0) via hidden iframe
    sendPlayerCommand(ryukIframeRef.current, 'unMute');
    sendPlayerCommand(ryukIframeRef.current, 'setVolume', [100]);
    sendPlayerCommand(ryukIframeRef.current, 'playVideo');

    // 2. Synthesize eerie Ryuk Theme A bells and cathedral bells
    audio.playRyukTheme();

    // 3. Trigger 3D Death Note book opening sequence (NO logo shown over book)
    setIsOpeningBook(true);
    setAnimStage(1);

    // Timeline duration (~5.0 seconds):
    // Stage 1 (0ms - 1200ms): Death Note book spreads open in the shadows
    const t1 = setTimeout(() => {
      setAnimStage(2); // Reading rules, Ryuk's Theme A playing
    }, 1200);

    // Stage 2 (1200ms - 4200ms): Rules fully visible, user reads
    const t2 = setTimeout(() => {
      setAnimStage(3); // Cinematic flash flare
    }, 4200);

    // Final Stage (4800ms): Open Main Desktop Assistant
    const tFinal = setTimeout(() => {
      sendPlayerCommand(ryukIframeRef.current, 'pauseVideo');
      onInitialize?.();
    }, 4800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tFinal);
    };
  };

  return (
    <div
      className={`relative w-screen h-screen h-[100dvh] overflow-hidden flex items-center justify-center bg-[#07080a] select-none touch-manipulation ${
        isOpeningBook ? 'animate-screen-rumble' : ''
      }`}
    >
      {/* ================================================================ */}
      {/* LAYER 0: CONTINUOUS GOTHIC MIST & THUNDER ATMOSPHERIC CANVAS     */}
      {/* ================================================================ */}
      <canvas
        ref={bgAtmosphereCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* ================================================================ */}
      {/* LAYER 1: YOUTUBE BACKGROUND VIDEO (GUARANTEED ZERO-CLICK AUTOPLAY)*/}
      {/* ================================================================ */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none bg-black">
        {/* Crisp static high-res poster frame to cover any initial loading transition */}
        <div
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 pointer-events-none ${
            videoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            backgroundImage: "url('https://img.youtube.com/vi/UMLhx2ExDm8/hqdefault.jpg')",
            filter: 'brightness(115%) contrast(108%) saturate(108%)',
          }}
        />

        <div
          className="absolute pointer-events-none select-none transition-all duration-700"
          style={{
            top: '50%',
            left: '50%',
            width: '180vw',
            height: '180vh',
            minWidth: '200vh',
            minHeight: '62vw',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* 
            autoplay=1&mute=1 guarantees browsers execute autoplay immediately on web entry!
            controls=0 and scale cropping guarantees zero YouTube controls or pause icons show.
          */}
          <iframe
            id="bg-youtube-iframe"
            ref={iframeRef}
            src={`https://www.youtube.com/embed/UMLhx2ExDm8?autoplay=1&mute=1&controls=0&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&loop=1&playlist=UMLhx2ExDm8&enablejsapi=1&origin=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.origin : ''
            )}`}
            title="Death Note Cinematic Background Video"
            className="w-full h-full object-cover pointer-events-none select-none opacity-95 transition-all duration-700"
            style={{
              filter: 'brightness(118%) contrast(108%) saturate(108%)',
              pointerEvents: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            tabIndex={-1}
          />
        </div>

        {/* Local HTML5 Video Fallback */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-95 z-10' : 'opacity-0 pointer-events-none'
          }`}
          onError={() => setVideoLoaded(false)}
          onCanPlay={() => setVideoLoaded(true)}
        >
          <source src="/videos/l-intro.mp4" type="video/mp4" />
          <source src="/videos/l-intro.webm" type="video/webm" />
        </video>
      </div>

      {/* ================================================================ */}
      {/* HIDDEN RYUK'S THEME A AUDIO PLAYER (0zYw5IuEUZ0)                 */}
      {/* ================================================================ */}
      <div className="absolute w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
        <iframe
          ref={ryukIframeRef}
          src="https://www.youtube-nocookie.com/embed/0zYw5IuEUZ0?enablejsapi=1&autoplay=0&controls=0"
          title="Death Note - Ryuk's Theme A"
          allow="autoplay"
          tabIndex={-1}
        />
      </div>

      {/* ================================================================ */}
      {/* LAYER 2: LIGHTENED CINEMATIC VIGNETTE                            */}
      {/* ================================================================ */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none z-10" />
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(circle at center, transparent 35%, rgba(5, 6, 8, 0.40) 75%, rgba(3, 4, 6, 0.85) 100%)',
        }}
      />

      {/* ================================================================ */}
      {/* LAYER 3: DRIFTING BURNING EMBERS & SHINIGAMI ASH CANVAS          */}
      {/* ================================================================ */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-15"
      />

      {/* ================================================================ */}
      {/* TOP BAR: PHONE ACCESS HELPER & SOUND TOGGLE PILL                 */}
      {/* ================================================================ */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        <button
          type="button"
          onClick={copyPhoneUrl}
          className="brutal-btn rounded-none text-[10px] sm:text-xs px-3.5 py-1.5 border-2 border-[#ff1e2e] bg-black text-white font-mono font-bold tracking-wider shadow-[3px_3px_0px_#ff1e2e] hover:shadow-[4px_4px_0px_#ff1e2e] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#ff1e2e] cursor-pointer"
          title="Click to copy Wi-Fi address for opening on phone"
        >
          <span className="text-[11px] sm:text-xs">📱</span>
          <span className="font-mono text-[10px] sm:text-[11px] tracking-tight font-bold">
            {copiedPhoneLink ? '[ ✓ COPIED LINK ]' : '[ PHONE: 172.21.16.52:5173 ]'}
          </span>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          className="brutal-btn rounded-none text-[10px] sm:text-xs px-3.5 py-1.5 border-2 border-[#ff1e2e] bg-black text-white font-mono font-bold tracking-wider shadow-[3px_3px_0px_#ff1e2e] hover:shadow-[4px_4px_0px_#ff1e2e] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#ff1e2e] cursor-pointer"
          title={isAudioMuted ? 'Click to enable audio' : 'Audio active (Click to mute)'}
        >
          <span
            className={`w-2 h-2 rounded-none transition-colors ${
              isAudioMuted ? 'bg-amber-400' : 'bg-rose-500 animate-pulse shadow-[0_0_6px_#ff1e2e]'
            }`}
          />
          <span className="font-mono text-[10px] sm:text-[11px] tracking-wide font-bold">
            {isAudioMuted ? '[ 🔇 SOUND: MUTED (CLICK TO UNMUTE) ]' : '[ 🔊 SOUND: ON ]'}
          </span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* LAYER 4: CENTERPIECE LOGO & DEATH NOTE BOOK SPREAD               */}
      {/* ================================================================ */}
      <div className="relative z-20 flex flex-col items-center justify-center space-y-5 text-center px-4 max-w-2xl w-full">
        {/* Dynamic Status / Protocol Badge */}
        <div className="brutal-badge rounded-none border-2 border-[#ff1e2e] bg-black text-white px-4 py-1.5 font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-widest shadow-[3px_3px_0px_#000,3px_3px_0px_#ff1e2e] z-30 max-w-[92vw]">
          <span
            className={`w-2 h-2 rounded-none shrink-0 ${
              isOpeningBook ? 'bg-rose-500 animate-ping shadow-[0_0_8px_#ff1e2e]' : 'animate-pulse shadow-[0_0_6px_#ff1e2e]'
            }`}
            style={{ backgroundColor: isOpeningBook ? '#f43f5e' : (theme?.accent || '#e11d48') }}
          />
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-white/95 font-semibold truncate">
            {!isOpeningBook && '[ L-OS // DETECTIVE ASSISTANT READY ]'}
            {animStage === 1 && '[ 📖 DEATH NOTE OPENING // RYUK\'S THEME A... ]'}
            {animStage >= 2 && '[ ⚡ "THE HUMAN WHOSE NAME IS WRITTEN..." // 100% ]'}
          </span>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* STATE A: USER'S NEW RED TRIANGLE L LOGO                        */}
        {/* (Inverted triangle, dotted border, top wave crest, central L)  */}
        {/* -------------------------------------------------------------- */}
        {!isOpeningBook ? (
          <button
            onClick={handleLogoClick}
            className="group relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none z-20"
            title="Click L to open Death Note and initialize Assistant"
            aria-label="Click L to initialize Assistant"
          >
            {/* Ambient Crimson Glow behind the Triangle Logo */}
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-75 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(255, 30, 46, 0.55) 0%, rgba(180, 10, 30, 0.35) 45%, transparent 75%)',
                transform: 'scale(1.25)',
              }}
            />

            {/* Logo Container: User's New Geometric Red Triangle Logo */}
            <div className="relative w-56 h-64 sm:w-68 sm:h-76 md:w-80 md:h-92 max-w-[85vw] max-h-[50vh] flex items-center justify-center drop-shadow-[0_0_25px_rgba(255,30,46,0.35)]">
              {/* Crisp Vector Replica with Image Fallback */}
              <img
                src="/l-triangle-logo.svg"
                alt="L Red Triangle Geometric Logo"
                className="w-full h-full object-contain pointer-events-none select-none transition-all duration-300 group-hover:scale-102"
                style={{ mixBlendMode: 'screen', background: 'transparent' }}
                onError={(e) => {
                  e.target.src = '/l-triangle-logo.svg';
                }}
              />
            </div>
          </button>
        ) : (
          /* ------------------------------------------------------------ */
          /* STATE B: DEATH NOTE BOOK OPENING SPREAD                      */
          /* (NO LOGO SHOWN OVER THE BOOK — AS EXPLICITLY REQUESTED)      */
          /* (Upright, crystal-clear, fully readable rules)               */
          /* ------------------------------------------------------------ */
          <div className="relative w-full max-w-xl sm:max-w-2xl flex flex-col items-center justify-center animate-book-spread">
            {/* Glowing Ryuk Red Eyes in Background Mist */}
            <div className="absolute -top-14 sm:-top-16 z-0 flex items-center space-x-16 sm:space-x-24 pointer-events-none animate-ryuk-eyes opacity-90">
              <div
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full"
                style={{
                  background: 'radial-gradient(circle, #ffffff 15%, #ff0033 60%, #990000 100%)',
                  boxShadow: '0 0 20px 8px rgba(255, 0, 40, 0.9), 0 0 45px 15px rgba(255, 50, 0, 0.6)',
                }}
              />
              <div
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full"
                style={{
                  background: 'radial-gradient(circle, #ffffff 15%, #ff0033 60%, #990000 100%)',
                  boxShadow: '0 0 20px 8px rgba(255, 0, 40, 0.9), 0 0 45px 15px rgba(255, 50, 0, 0.6)',
                }}
              />
            </div>

            {/* ---------------------------------------------------------- */}
            {/* AUTHENTIC DEATH NOTE OPEN SPREAD (Left & Right Pages)       */}
            {/* Zero inversion — Upright, razor-sharp, readable rules      */}
            {/* ---------------------------------------------------------- */}
            <div
              className="relative w-full rounded-none bg-[#0a0a0c] border-[3px] border-[#ff1e2e] shadow-[6px_6px_0px_#000,6px_6px_0px_#ff1e2e] overflow-hidden z-20"
            >
              {/* Dark Leather & Aged Parchment Atmosphere */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, #fbf3d5 0%, #302618 65%, #0d0a06 100%)',
                }}
              />

              {/* Two-Page Spread Container */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-800/80 p-5 sm:p-7 text-left gap-4 sm:gap-6">
                {/* ---------------- LEFT PAGE ---------------- */}
                <div className="flex flex-col justify-between space-y-3 sm:space-y-4 pr-0 sm:pr-2">
                  <div>
                    {/* Authentic Embossed Silver DEATH NOTE Title (100% Upright & Legible) */}
                    <div
                      className="font-monogram text-center text-xl sm:text-2xl font-black tracking-[0.25em] text-stone-100 drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)] pb-2 border-b border-red-600/40"
                      style={{
                        fontFamily: "'Cinzel Decorative', Georgia, serif",
                      }}
                    >
                      DEATH NOTE
                    </div>
                    <div className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-red-500 font-bold mt-1">
                      — HOW TO USE IT : I —
                    </div>
                  </div>

                  {/* Fully Readable Rules on Left Page */}
                  <div className="font-mono text-[10px] sm:text-[11px] text-stone-200 leading-relaxed space-y-2">
                    <p className="flex items-start space-x-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span>
                        The human whose name is written in this note <strong className="text-red-400 font-bold">shall die</strong>.
                      </span>
                    </p>
                    <p className="flex items-start space-x-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span className="text-stone-300">
                        This note will not take effect unless the writer has the person's face in their mind when writing their name.
                      </span>
                    </p>
                    <p className="flex items-start space-x-1.5 text-stone-400 text-[9px] sm:text-[10px]">
                      <span className="text-red-400 font-bold">•</span>
                      <span>
                        Therefore, people sharing the same name will not be affected simultaneously.
                      </span>
                    </p>
                  </div>

                  {/* Left Bottom Seal */}
                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[9px] font-mono text-stone-500">
                    <span className="text-red-500/80 font-bold">PAGE 01</span>
                    <span className="tracking-widest">SHINIGAMI REALM</span>
                  </div>
                </div>

                {/* ---------------- RIGHT PAGE ---------------- */}
                <div className="flex flex-col justify-between space-y-3 sm:space-y-4 pl-0 sm:pl-2 pt-3 sm:pt-0">
                  <div>
                    <div className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-red-500 font-bold pb-2 border-b border-red-600/40">
                      — HOW TO USE IT : II —
                    </div>
                  </div>

                  {/* Fully Readable Rules on Right Page */}
                  <div className="font-mono text-[10px] sm:text-[11px] text-stone-200 leading-relaxed space-y-2">
                    <p className="flex items-start space-x-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span>
                        If the cause of death is written within <strong className="text-amber-400 font-bold">40 seconds</strong> of writing the name, it will happen.
                      </span>
                    </p>
                    <p className="flex items-start space-x-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span className="text-stone-300">
                        If the cause of death is not specified, the person will simply die of a <strong className="text-rose-400 font-semibold">heart attack</strong>.
                      </span>
                    </p>
                    <p className="flex items-start space-x-1.5 text-stone-400 text-[9px] sm:text-[10px]">
                      <span className="text-red-400 font-bold">•</span>
                      <span>
                        After writing the cause of death, details should be written in the next 6 minutes and 40 seconds.
                      </span>
                    </p>
                  </div>

                  {/* Right Bottom Seal: L Status */}
                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-monogram text-2xl font-black text-rose-500 drop-shadow">
                        L
                      </span>
                      <span className="font-mono text-[9px] text-stone-400 tracking-wider">
                        IDENTITY VERIFIED
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-red-400/90 font-bold tracking-widest animate-pulse">
                      ACCESS 100%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Primary Instruction & Subtitle */}
        <div className="flex flex-col items-center space-y-2 z-30 w-full">
          <button
            onClick={handleLogoClick}
            disabled={isOpeningBook}
            className={`brutal-btn text-xs sm:text-sm uppercase tracking-[0.2em] font-mono font-black transition-all cursor-pointer flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-none border-2 border-[#ff1e2e] bg-black text-white w-auto max-w-[90vw] ${
              isOpeningBook
                ? 'shadow-[2px_2px_0px_#ff1e2e] bg-[#1a0004]'
                : 'shadow-[5px_5px_0px_#ff1e2e] hover:shadow-[7px_7px_0px_#ff1e2e] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#ff1e2e]'
            }`}
          >
            {isOpeningBook ? (
              <>
                <span className="w-2.5 h-2.5 rounded-none bg-rose-500 animate-ping shadow-[0_0_10px_#ff1e2e] shrink-0" />
                <span className="font-mono text-rose-200 tracking-wider text-[11px] sm:text-xs font-bold">
                  [ 📖 DEATH NOTE OPENED // INITIALIZING... ]
                </span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-none bg-rose-500 animate-pulse shadow-[0_0_8px_#ff1e2e] shrink-0" />
                <span className="font-mono text-xs sm:text-sm font-black tracking-[0.2em] text-white">
                  [ █ CLICK <strong className="text-rose-400 font-black text-sm sm:text-base underline underline-offset-4 decoration-rose-500">L</strong> TO INITIALIZE ► ]
                </span>
              </>
            )}
          </button>

          <p className="text-[10px] sm:text-[11px] text-white/50 tracking-wider font-mono uppercase font-bold">
            [ PERSONAL DESKTOP AI ASSISTANT // DEATH NOTE SYSTEM ]
          </p>

          {/* Awakening Progress Bar */}
          {isOpeningBook && (
            <div className="w-56 sm:w-64 h-2 bg-black rounded-none overflow-hidden border-2 border-[#ff1e2e] shadow-[2px_2px_0px_#000] mt-1">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-rose-400 to-amber-300 transition-all duration-700 ease-out"
                style={{
                  width:
                    animStage === 1
                      ? '35%'
                      : animStage === 2
                      ? '75%'
                      : '100%',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* LAYER 5: CINEMATIC FLASH ON TRANSITION                           */}
      {/* ================================================================ */}
      {animStage === 3 && (
        <div
          className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0%, rgba(225, 29, 72, 0.35) 50%, rgba(0, 0, 0, 0.9) 100%)',
          }}
        />
      )}
    </div>
  );
}
