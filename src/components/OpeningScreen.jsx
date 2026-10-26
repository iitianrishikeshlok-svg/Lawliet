import React, { useState, useEffect, useRef } from 'react';
import { audio } from '../common/AudioEngine';

/**
 * OpeningScreen — Fullscreen Maximalist Cyber-Gothic Entrance for L.
 *
 * Requirements fulfilled:
 * 1. Background Video Autoplay: Uses 100% native local video (/videos/l-intro.mp4).
 *    Zero YouTube iframes, zero external dependencies, ZERO pause/forward/backward controls.
 * 2. Background Sound: Native local audio (/videos/l-bg-audio.m4a).
 *    Muted by default to comply with browser policy. Plays instantly on clicking Sound button.
 *    Mutes automatically when clicking on L logo to initialize!
 * 3. Realistic 3D Death Note Book: Authentic hardcover physical book with 3D perspective,
 *    leather grain shell, stacked paper edge thickness, curved spine crease, crimson satin ribbon,
 *    aged ruled paper, authentic gothic rules, and glowing Ryuk eyes. Not a flat rectangular box!
 * 4. Maximalist UI: Cyber-gothic detective command telemetry, real-time clock, animated 5-band EQ
 *    visualizer, ornate corner brackets, multi-layer solid drop shadows, and high-density diagnostic data.
 */
export default function OpeningScreen({ onInitialize, theme }) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [copiedPhoneLink, setCopiedPhoneLink] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [telemetryTick, setTelemetryTick] = useState(0);

  // Awakening & Death Note 3D book sequence state
  const [isOpeningBook, setIsOpeningBook] = useState(false);
  const [animStage, setAnimStage] = useState(0); // 0: idle, 1: book open, 2: reading rules, 3: flash transition

  const videoRef = useRef(null);
  const bgAudioRef = useRef(null);
  const canvasRef = useRef(null);
  const bgAtmosphereCanvasRef = useRef(null);

  // Local Wi-Fi Network Address for Phone Access
  const PHONE_NETWORK_URL = 'http://172.21.16.52:5173';

  // Live Maximalist Clock & Telemetry Fluctuations
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${hrs}:${mins}:${secs}`);
      setTelemetryTick((prev) => (prev + 1) % 100);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Ensure native video autoplays smoothly
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: muted play is always allowed
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch((err) => console.warn('Video play deferred:', err));
        }
      });
    }
  }, []);

  // Sound Toggle: Direct native audio controls (No YouTube iframe)
  const toggleSound = (e) => {
    e?.stopPropagation();
    audio.playClick();
    if (isAudioMuted) {
      if (bgAudioRef.current) {
        bgAudioRef.current.volume = 1.0;
        bgAudioRef.current
          .play()
          .then(() => {
            setIsAudioMuted(false);
          })
          .catch((err) => {
            console.warn('Audio play blocked:', err);
          });
      }
    } else {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        setIsAudioMuted(true);
      }
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
  // Atmospheric Canvas: Dark Mist & Subtle Red Lightning Flashes
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
      grad.addColorStop(0, 'rgba(16, 10, 20, 0.45)');
      grad.addColorStop(0.5, 'rgba(8, 6, 12, 0.75)');
      grad.addColorStop(1, 'rgba(3, 4, 7, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (Math.sin(t * 1.8) > 0.988) {
        ctx.fillStyle = 'rgba(255, 30, 46, 0.07)';
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

    const PARTICLE_COUNT = 45;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: h + Math.random() * 80,
      size: Math.random() * 3.5 + 1.2,
      speedY: Math.random() * 1.5 + 0.8,
      speedX: (Math.random() - 0.5) * 1.2,
      opacity: Math.random() * 0.75 + 0.25,
      decay: Math.random() * 0.0025 + 0.001,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.035 + 0.015,
      isEmber: Math.random() > 0.35,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
    }));

    const renderParticles = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * 0.85 + p.speedX;
        p.opacity -= p.decay;
        p.rotation += p.rotSpeed;

        if (p.y < -30 || p.opacity <= 0.05) {
          p.x = w * 0.5 + (Math.random() - 0.5) * (w * 0.8);
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
          rad.addColorStop(0, `rgba(255, 245, 180, ${p.opacity})`);
          rad.addColorStop(0.4, `rgba(255, 40, 50, ${p.opacity * 0.85})`);
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
  // Logo Click: Mute background audio immediately + Trigger 3D Death Note Book
  // --------------------------------------------------------------------------
  const handleLogoClick = () => {
    if (isOpeningBook) return;

    // 1. MUST MUTE background video audio immediately when clicking icon
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      setIsAudioMuted(true);
    }

    // 2. Play synthesized Ryuk theme bells and authentic Death Note chime
    audio.playRyukTheme();
    audio.playLaser();

    // 3. Trigger 3D Physical Death Note book opening sequence (NO logo shown over book)
    setIsOpeningBook(true);
    setAnimStage(1);

    // Timeline duration (~5.0 seconds):
    // Stage 1 (0ms - 1200ms): 3D Death Note book uncurls and rises with page thickness
    const t1 = setTimeout(() => {
      setAnimStage(2); // Rules fully displayed
    }, 1200);

    // Stage 2 (1200ms - 4400ms): Rules visible, user reads
    const t2 = setTimeout(() => {
      setAnimStage(3); // Cinematic white/crimson flash
    }, 4400);

    // Final Stage (5000ms): Open Main Desktop Assistant
    const tFinal = setTimeout(() => {
      onInitialize?.();
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tFinal);
    };
  };

  return (
    <div
      className={`relative w-screen h-screen h-[100dvh] overflow-hidden flex items-center justify-center bg-[#050608] select-none touch-manipulation ${
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
      {/* LAYER 1: NATIVE BACKGROUND VIDEO (ZERO YOUTUBE CONTROLS)         */}
      {/* Guaranteed instant 60fps hardware-accelerated playback           */}
      {/* ================================================================ */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none bg-black">
        <video
          ref={videoRef}
          src="/videos/l-intro.mp4"
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-95' : 'opacity-80'
          }`}
          style={{
            filter: 'brightness(112%) contrast(110%) saturate(108%)',
          }}
          onCanPlay={() => setVideoLoaded(true)}
          onError={(e) => {
            console.warn('Local video fallback active:', e);
            setVideoLoaded(true);
          }}
        />

        {/* Pure Native Background Audio Track */}
        <audio
          ref={bgAudioRef}
          src="/videos/l-bg-audio.m4a"
          loop
          preload="auto"
        />
      </div>

      {/* ================================================================ */}
      {/* LAYER 2: CINEMATIC VIGNETTE & CONTRAST GRADIENT                  */}
      {/* ================================================================ */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none z-10" />
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(circle at center, transparent 30%, rgba(4, 5, 8, 0.45) 70%, rgba(2, 3, 5, 0.88) 100%)',
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
      {/* LAYER 4: MAXIMALIST CYBER-GOTHIC TOP COMMAND TELEMETRY DOCK      */}
      {/* ================================================================ */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2.5 bg-black/85 backdrop-blur-md border-b-2 border-[#ff1e2e] shadow-[0_4px_15px_rgba(255,30,46,0.3)] pointer-events-auto">
        {/* Left: Phone Bridge Diagnostic Pill */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={copyPhoneUrl}
            className="brutal-btn rounded-none text-[10px] sm:text-xs px-3 py-1.5 border-2 border-[#ff1e2e] bg-black text-white font-mono font-black tracking-wider shadow-[3px_3px_0px_#ff1e2e] hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center space-x-1.5"
            title="Click to copy Wi-Fi address for opening on phone"
          >
            <span className="text-xs">📱</span>
            <span className="font-mono text-[10px] sm:text-[11px] font-bold">
              {copiedPhoneLink ? '[ ✓ COPIED LINK ]' : '[ PHONE: 172.21.16.52:5173 ]'}
            </span>
          </button>

          {/* Detective Protocol Telemetry Marker (Hidden on small mobile) */}
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 bg-[#0b0c10] border border-neutral-800 text-[10px] font-mono text-stone-300">
            <span className="w-1.5 h-1.5 bg-rose-500 animate-pulse" />
            <span className="text-[#ff4b5c] font-black">L-OS</span>
            <span className="text-stone-500">|</span>
            <span className="text-stone-400">BUS: 96kHz</span>
            <span className="text-stone-500">|</span>
            <span className="text-emerald-400">ENCRYPTED</span>
          </div>
        </div>

        {/* Center: Live Real-Time Telemetry Clock */}
        <div className="hidden lg:flex items-center space-x-3 px-4 py-1 bg-black border-2 border-stone-800 text-[11px] font-mono font-black shadow-[2px_2px_0px_#ff1e2e]">
          <span className="text-rose-500">✦ [ KIRA INVESTIGATION ARCHIVE ]</span>
          <span className="text-white tracking-widest">{currentTimeStr || '11:28:00'}</span>
          <span className="text-amber-400 font-bold">UTC+05:30</span>
        </div>

        {/* Right: Sound Station with Live 5-Band Equalizer Visualizer */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleSound}
            className="brutal-btn rounded-none text-[10px] sm:text-xs px-3.5 py-1.5 border-2 border-[#ff1e2e] bg-black text-white font-mono font-black tracking-wider shadow-[3px_3px_0px_#ff1e2e] hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center space-x-2"
            title={isAudioMuted ? 'Click to enable audio' : 'Audio active (Click to mute)'}
          >
            <span
              className={`w-2.5 h-2.5 rounded-none transition-colors ${
                isAudioMuted
                  ? 'bg-amber-400'
                  : 'bg-rose-500 animate-pulse shadow-[0_0_8px_#ff1e2e]'
              }`}
            />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-wide font-bold">
              {isAudioMuted ? '[ 🔇 SOUND: MUTED ]' : '[ 🔊 SOUND: ON ]'}
            </span>

            {/* Live 5-Band Animated Equalizer Visualizer */}
            {!isAudioMuted ? (
              <div className="flex items-end space-x-0.5 h-3 ml-1">
                <span className="w-1 bg-[#ff1e2e] eq-bar-1" />
                <span className="w-1 bg-[#ff1e2e] eq-bar-2" />
                <span className="w-1 bg-[#ff1e2e] eq-bar-3" />
                <span className="w-1 bg-[#ff1e2e] eq-bar-4" />
                <span className="w-1 bg-[#ff1e2e] eq-bar-5" />
              </div>
            ) : (
              <span className="text-[9px] font-mono text-amber-400 font-bold tracking-tight">
                (UNMUTE)
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ================================================================ */}
      {/* LAYER 5: MAXIMALIST CYBER-GOTHIC CORNER ACCENT BRACKETS          */}
      {/* ================================================================ */}
      <div className="absolute top-14 left-4 pointer-events-none hidden sm:flex flex-col text-[10px] font-mono text-stone-500 space-y-1">
        <span className="text-[#ff1e2e] font-black">┌ [ NODE_ID // 0x4C_LAWLIET ]</span>
        <span>• SECTOR: KANTO_METROPOLITAN</span>
        <span>• SYNC: 99.8% // SHINIGAMI LINK</span>
      </div>
      <div className="absolute top-14 right-4 pointer-events-none hidden sm:flex flex-col text-[10px] font-mono text-stone-500 text-right space-y-1">
        <span className="text-[#ff1e2e] font-black">[ THREAT_LEVEL // OMEGA ] ┐</span>
        <span>• KIRA SUSPECTS: DETECTED</span>
        <span>• ACCESS_KEY: VERIFIED</span>
      </div>
      <div className="absolute bottom-4 left-4 pointer-events-none hidden sm:flex flex-col text-[10px] font-mono text-stone-500 space-y-1">
        <span>• LATENCY: 12ms // HARDWARE ACCEL</span>
        <span className="text-[#ff1e2e] font-black">└ [ PROTOCOL_EXEC // READY ]</span>
      </div>
      <div className="absolute bottom-4 right-4 pointer-events-none hidden sm:flex flex-col text-[10px] font-mono text-stone-500 text-right space-y-1">
        <span>• RYUK THEME: SYNTHESIZED 432Hz</span>
        <span className="text-[#ff1e2e] font-black">[ SECURE CHANNEL // ACTIVE ] ┘</span>
      </div>

      {/* ================================================================ */}
      {/* LAYER 6: CENTERPIECE LOGO & AUTHENTIC 3D DEATH NOTE BOOK         */}
      {/* ================================================================ */}
      <div className="relative z-20 flex flex-col items-center justify-center space-y-4 text-center px-4 max-w-3xl w-full">
        {/* Dynamic Status / Protocol Badge */}
        <div className="brutal-badge rounded-none border-2 border-[#ff1e2e] bg-black text-white px-4 py-1.5 font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-widest shadow-[3px_3px_0px_#000,3px_3px_0px_#ff1e2e] z-30 max-w-[92vw]">
          <span
            className={`w-2 h-2 rounded-none shrink-0 ${
              isOpeningBook
                ? 'bg-rose-500 animate-ping shadow-[0_0_8px_#ff1e2e]'
                : 'animate-pulse shadow-[0_0_6px_#ff1e2e]'
            }`}
            style={{ backgroundColor: isOpeningBook ? '#f43f5e' : (theme?.accent || '#e11d48') }}
          />
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-white/95 font-semibold truncate">
            {!isOpeningBook && '[ L-OS // DETECTIVE ASSISTANT READY ]'}
            {animStage === 1 && '[ 📖 3D DEATH NOTE OPENING // SOUND MUTED... ]'}
            {animStage >= 2 && '[ ⚡ "THE HUMAN WHOSE NAME IS WRITTEN..." // 100% ]'}
          </span>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* STATE A: USER'S RED TRIANGLE L LOGO                            */}
        {/* (NO pause/forward/backward controls anywhere on this page!)    */}
        {/* -------------------------------------------------------------- */}
        {!isOpeningBook ? (
          <button
            onClick={handleLogoClick}
            className="group relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none z-20 max-corner-brackets p-3"
            title="Click L to open Death Note and initialize Assistant"
            aria-label="Click L to initialize Assistant"
          >
            {/* Ambient Crimson Glow behind the Triangle Logo */}
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-75 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(255, 30, 46, 0.6) 0%, rgba(180, 10, 30, 0.4) 45%, transparent 75%)',
                transform: 'scale(1.25)',
              }}
            />

            {/* Logo Container: User's New Geometric Red Triangle Logo */}
            <div className="relative w-56 h-64 sm:w-68 sm:h-76 md:w-80 md:h-92 max-w-[85vw] max-h-[50vh] flex items-center justify-center drop-shadow-[0_0_30px_rgba(255,30,46,0.45)]">
              <img
                src="/l-triangle-logo.svg"
                alt="L Red Triangle Geometric Logo"
                className="w-full h-full object-contain pointer-events-none select-none transition-all duration-300 group-hover:scale-102"
                style={{ mixBlendMode: 'screen', background: 'transparent' }}
              />
            </div>
          </button>
        ) : (
          /* ------------------------------------------------------------ */
          /* STATE B: AUTHENTIC 3D PHYSICAL DEATH NOTE BOOK SPREAD        */
          /* (Realistic physical hardcover, spine crease, stacked pages,  */
          /* crimson ribbon bookmark, authentic aged ruled parchment)     */
          /* (NO LOGO SHOWN OVER THE BOOK — AS EXPLICITLY REQUESTED)      */
          /* ------------------------------------------------------------ */
          <div className="deathnote-3d-wrapper relative w-full max-w-xl sm:max-w-2xl lg:max-w-3xl flex flex-col items-center justify-center py-2">
            {/* Glowing Ryuk Red Eyes in Swirling Shadow Mist */}
            <div className="absolute -top-16 sm:-top-20 z-10 flex items-center space-x-20 sm:space-x-28 pointer-events-none animate-ryuk-eyes opacity-95">
              <div
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                style={{
                  background: 'radial-gradient(circle, #ffffff 15%, #ff0033 60%, #990000 100%)',
                  boxShadow: '0 0 24px 10px rgba(255, 0, 40, 0.95), 0 0 50px 18px rgba(255, 50, 0, 0.7)',
                }}
              />
              <div
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                style={{
                  background: 'radial-gradient(circle, #ffffff 15%, #ff0033 60%, #990000 100%)',
                  boxShadow: '0 0 24px 10px rgba(255, 0, 40, 0.95), 0 0 50px 18px rgba(255, 50, 0, 0.7)',
                }}
              />
            </div>

            {/* ---------------------------------------------------------- */}
            {/* PHYSICAL HARDCOVER BOOK CASE                               */}
            {/* Leather texture with outer book overhang & metal corners   */}
            {/* ---------------------------------------------------------- */}
            <div
              className="animate-realistic-book relative w-full rounded-sm p-2 sm:p-3"
              style={{
                background: 'linear-gradient(135deg, #0e0d12 0%, #050406 50%, #15121b 100%)',
                border: '3px solid #ff1e2e',
                boxShadow:
                  '0 30px 80px rgba(0, 0, 0, 0.98), 0 0 0 2px #000000, 6px 6px 0px #ff1e2e, 0 0 40px rgba(255, 30, 46, 0.35)',
              }}
            >
              {/* Ornate Gothic Metal Corner Brackets */}
              <div className="absolute top-1 left-1.5 text-rose-500 font-mono text-base font-black select-none pointer-events-none">
                ┌
              </div>
              <div className="absolute top-1 right-1.5 text-rose-500 font-mono text-base font-black select-none pointer-events-none">
                ┐
              </div>
              <div className="absolute bottom-1 left-1.5 text-rose-500 font-mono text-base font-black select-none pointer-events-none">
                └
              </div>
              <div className="absolute bottom-1 right-1.5 text-rose-500 font-mono text-base font-black select-none pointer-events-none">
                ┘
              </div>

              {/* Physical Crimson Satin Ribbon Bookmark Draping from Top Spine */}
              <div
                className="deathnote-bookmark-ribbon absolute -top-3 left-1/2 -translate-x-1/2 w-4 sm:w-5 h-full max-h-[105%] z-30 pointer-events-none opacity-95"
                style={{
                  filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.8))',
                }}
              />

              {/* Central Spine Binding Crease */}
              <div className="book-spine-crease absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 z-25 pointer-events-none opacity-90" />

              {/* -------------------------------------------------------- */}
              {/* TWO-PAGE OPEN SPREAD                                     */}
              {/* Left & Right Pages with realistic curved spine shading   */}
              {/* -------------------------------------------------------- */}
              <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 gap-0 overflow-hidden">
                {/* ---------------- LEFT PAGE ---------------- */}
                <div
                  className="deathnote-ruled-paper book-edge-thickness-left relative p-5 sm:p-7 text-left flex flex-col justify-between space-y-4 border-b sm:border-b-0 sm:border-r border-stone-800"
                  style={{
                    boxShadow:
                      'inset -20px 0 25px -10px rgba(0,0,0,0.85), inset 6px 0 15px -4px rgba(0,0,0,0.6)',
                  }}
                >
                  <div>
                    {/* Authentic Embossed Silver DEATH NOTE Title */}
                    <div
                      className="font-monogram text-center text-2xl sm:text-3xl font-black tracking-[0.28em] text-stone-100 drop-shadow-[0_2px_12px_rgba(255,255,255,0.45)] pb-2.5 border-b-2 border-red-600/50"
                      style={{
                        fontFamily: "'Cinzel Decorative', Georgia, serif",
                      }}
                    >
                      DEATH NOTE
                    </div>
                    <div className="text-center font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-red-500 font-black mt-1.5">
                      — HOW TO USE IT : I —
                    </div>
                  </div>

                  {/* Fully Legible Rules on Left Page */}
                  <div className="font-mono text-[10px] sm:text-[11.5px] text-stone-200 leading-relaxed space-y-2.5">
                    <p className="flex items-start space-x-2">
                      <span className="text-red-500 font-black text-sm leading-none">•</span>
                      <span>
                        The human whose name is written in this note <strong className="text-red-400 font-black">shall die</strong>.
                      </span>
                    </p>
                    <p className="flex items-start space-x-2">
                      <span className="text-red-500 font-black text-sm leading-none">•</span>
                      <span className="text-stone-300">
                        This note will not take effect unless the writer has the person's face in their mind when writing their name.
                      </span>
                    </p>
                    <p className="flex items-start space-x-2 text-stone-400 text-[9.5px] sm:text-[10px]">
                      <span className="text-red-500 font-black text-sm leading-none">•</span>
                      <span>
                        Therefore, people sharing the same name will not be affected simultaneously.
                      </span>
                    </p>
                  </div>

                  {/* Left Bottom Seal: Shinigami Realm */}
                  <div className="pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-[9px] font-mono text-stone-500">
                    <span className="text-red-500 font-black tracking-widest">[ PAGE 01 ]</span>
                    <span className="tracking-widest text-stone-400 font-bold">SHINIGAMI REALM // 死神界</span>
                  </div>
                </div>

                {/* ---------------- RIGHT PAGE ---------------- */}
                <div
                  className="deathnote-ruled-paper book-edge-thickness-right relative p-5 sm:p-7 text-left flex flex-col justify-between space-y-4"
                  style={{
                    boxShadow:
                      'inset 20px 0 25px -10px rgba(0,0,0,0.85), inset -6px 0 15px -4px rgba(0,0,0,0.6)',
                  }}
                >
                  <div>
                    <div className="text-center font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-red-500 font-black pb-2.5 border-b-2 border-red-600/50">
                      — HOW TO USE IT : II —
                    </div>
                  </div>

                  {/* Fully Legible Rules on Right Page */}
                  <div className="font-mono text-[10px] sm:text-[11.5px] text-stone-200 leading-relaxed space-y-2.5">
                    <p className="flex items-start space-x-2">
                      <span className="text-red-500 font-black text-sm leading-none">•</span>
                      <span>
                        If the cause of death is written within <strong className="text-amber-400 font-black">40 seconds</strong> of writing the name, it will happen.
                      </span>
                    </p>
                    <p className="flex items-start space-x-2">
                      <span className="text-red-500 font-black text-sm leading-none">•</span>
                      <span className="text-stone-300">
                        If the cause of death is not specified, the person will simply die of a <strong className="text-rose-400 font-bold">heart attack</strong>.
                      </span>
                    </p>
                    <p className="flex items-start space-x-2 text-stone-400 text-[9.5px] sm:text-[10px]">
                      <span className="text-red-500 font-black text-sm leading-none">•</span>
                      <span>
                        After writing the cause of death, details of the death should be written in the next 6 minutes and 40 seconds.
                      </span>
                    </p>
                  </div>

                  {/* Right Bottom Seal: L Status */}
                  <div className="pt-2.5 border-t border-stone-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-monogram text-2xl font-black text-rose-500 drop-shadow-[0_0_8px_rgba(255,30,46,0.6)]">
                        L
                      </span>
                      <span className="font-mono text-[9px] text-stone-300 font-bold tracking-wider">
                        IDENTITY VERIFIED
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-red-400 font-black tracking-widest animate-pulse">
                      ACCESS 100%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Primary Instruction & Subtitle */}
        <div className="flex flex-col items-center space-y-2.5 z-30 w-full">
          <button
            onClick={handleLogoClick}
            disabled={isOpeningBook}
            className={`brutal-btn text-xs sm:text-sm uppercase tracking-[0.2em] font-mono font-black transition-all cursor-pointer flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-none border-2 border-[#ff1e2e] bg-black text-white w-auto max-w-[90vw] ${
              isOpeningBook
                ? 'shadow-[2px_2px_0px_#ff1e2e] bg-[#1a0004]'
                : 'shadow-[6px_6px_0px_#ff1e2e] hover:shadow-[8px_8px_0px_#ffffff] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#ff1e2e]'
            }`}
          >
            {isOpeningBook ? (
              <>
                <span className="w-2.5 h-2.5 rounded-none bg-rose-500 animate-ping shadow-[0_0_10px_#ff1e2e] shrink-0" />
                <span className="font-mono text-rose-200 tracking-wider text-[11px] sm:text-xs font-bold">
                  [ 📖 DEATH NOTE OPENED // INITIALIZING ASSISTANT... ]
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

          <p className="text-[10px] sm:text-[11px] text-white/55 tracking-wider font-mono uppercase font-black">
            [ PERSONAL DESKTOP AI ASSISTANT // DEATH NOTE SYSTEM ]
          </p>

          {/* Awakening Progress Bar */}
          {isOpeningBook && (
            <div className="w-60 sm:w-72 h-2.5 bg-black rounded-none overflow-hidden border-2 border-[#ff1e2e] shadow-[3px_3px_0px_#000] mt-1">
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
      {/* LAYER 7: CINEMATIC FLASH ON TRANSITION                           */}
      {/* ================================================================ */}
      {animStage === 3 && (
        <div
          className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255, 255, 255, 0.6) 0%, rgba(225, 29, 72, 0.4) 50%, rgba(0, 0, 0, 0.95) 100%)',
          }}
        />
      )}
    </div>
  );
}
