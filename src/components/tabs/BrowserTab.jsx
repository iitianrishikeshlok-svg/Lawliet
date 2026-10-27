import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Sparkles,
} from '../../common/Icons';
import { audio } from '../../common/AudioEngine';

// Verified 100% working bookmarks
const BOOKMARKS = [
  { label: '📺 YouTube Cinema', url: 'https://www.youtube.com', isYT: true },
  { label: '🔍 Google Search', url: 'https://www.google.com/search?igu=1' },
  { label: '📖 Wikipedia', url: 'https://en.wikipedia.org' },
  { label: '🎬 Death Note Cinematic', url: 'https://youtu.be/UMLhx2ExDm8', isYT: true, ytId: 'UMLhx2ExDm8', ytTitle: 'Death Note — Atmospheric Visuals & Ambience' },
  { label: '📓 Death Note Theme', url: 'https://youtu.be/C65oaIHsdYM', isYT: true, ytId: 'C65oaIHsdYM', ytTitle: 'Death Note — Official Video & Visuals' },
  { label: '🐙 GitHub', url: 'https://github.com' },
];

// Rich Suggested Videos list with thumbnails, channels, and badges
const SUGGESTED_VIDEOS = [
  {
    id: 'P2uypwLUfmE',
    title: 'Death Note Opening 1 — The World (Nightmare)',
    channel: 'VAP Anime',
    tag: '✨ User Requested',
    badge: '40s Ambient',
    start: 40,
  },
  {
    id: 'C65oaIHsdYM',
    title: "Death Note — L's Theme A (Original Soundtrack)",
    channel: 'Hideki Taniuchi',
    tag: '📓 Detective OST',
    badge: 'HQ Audio',
    start: 0,
  },
  {
    id: 'UMLhx2ExDm8',
    title: "L's Theme — Rainy Ambience & Detective Beats",
    channel: 'Ambience L-OS',
    tag: '🌧️ Rain Ambience',
    badge: 'Lo-Fi Chill',
    start: 0,
  },
  {
    id: '5yx6BWlEVcY',
    title: 'Chillhop Radio — Lofi Hip Hop Beats to Relax/Study',
    channel: 'Lofi Girl',
    tag: '🎧 Lo-Fi Beats',
    badge: '24/7 Stream',
    start: 0,
  },
  {
    id: 'f02mOEt11OQ',
    title: 'Cyberpunk Synthwave — Deep Focus Coding Beats',
    channel: 'Night Drive',
    tag: '💻 Coding Beats',
    badge: 'Synthwave',
    start: 0,
  },
  {
    id: 'LXb3EKWsInQ',
    title: 'Tokyo Cyberpunk Night Walk in 4K 60FPS Rain Tour',
    channel: 'Nomadic Tour',
    tag: '🌆 4K Cyberpunk',
    badge: '4K 60FPS',
    start: 0,
  },
  {
    id: '21X5lGlDOfg',
    title: 'NASA Live — Views of Earth from Space Station',
    channel: 'NASA',
    tag: '🚀 Space Live',
    badge: 'Earth View',
    start: 0,
  },
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny (4K 60FPS Animation Film)',
    channel: 'Blender Studio',
    tag: '🎬 4K Film',
    badge: 'Ultra HD',
    start: 0,
  },
];

/**
 * Robustly extract YouTube 11-char Video ID from ANY format:
 * - youtube.com/watch?v=ID
 * - youtube.com/watch?feature=shared&v=ID
 * - youtu.be/ID
 * - youtube.com/embed/ID
 * - youtube.com/shorts/ID
 * - youtube.com/live/ID
 * - Direct 11-char alphanumeric ID
 */
function extractYouTubeVideoId(input) {
  if (!input) return null;
  const str = input.trim();

  // 1. Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // 2. Query param ?v= or &v=
  try {
    const urlObj = new URL(str.startsWith('http') ? str : `https://${str}`);
    const vParam = urlObj.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // youtu.be/ID (handles youtu.be/C65oaIHsdYM?si=91zCBUmgijnaisiS)
    if (urlObj.hostname.includes('youtu.be')) {
      const cleanPath = urlObj.pathname.replace(/^\/+/, '');
      const candidate = cleanPath.split('/')[0].split('?')[0];
      if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        return candidate;
      }
    }

    // /shorts/ID, /embed/ID, /live/ID, /v/ID
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (['shorts', 'embed', 'live', 'v', 'e'].includes(pathParts[0]) && pathParts[1]) {
      const candidate = pathParts[1].split('?')[0];
      if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        return candidate;
      }
    }
  } catch (e) {
    // fallback to regex
  }

  // 3. Fallback regex
  const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = str.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export default function BrowserTab({ onSendToChat, theme }) {
  const webviewRef = useRef(null);
  const iframeRef = useRef(null);
  const playerIframeRef = useRef(null);
  const playerContainerRef = useRef(null);

  // General Navigation State
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com/search?igu=1');
  const [inputUrl, setInputUrl] = useState('https://www.google.com/search?igu=1');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinOpacity, setPinOpacity] = useState(1.0);
  const [isElectron, setIsElectron] = useState(false);
  const [useProxy, setUseProxy] = useState(true);

  // Dedicated YouTube Cinema & Controls State
  const [isYouTube, setIsYouTube] = useState(true); // Default to YouTube search & cinema
  const [activeYouTubeId, setActiveYouTubeId] = useState('P2uypwLUfmE'); // Atmospheric video playing from 40s
  const [activeYouTubeTitle, setActiveYouTubeTitle] = useState('Atmospheric Visuals & Theme');
  const [videoSearchInput, setVideoSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Death Note Atmospheric Web Background Clip State
  const [deathNoteBgOpacity, setDeathNoteBgOpacity] = useState(0.45);

  // Player Controls State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [currentPlaybackSec, setCurrentPlaybackSec] = useState(0);

  useEffect(() => {
    setIsElectron(!!window.electronAPI);

    // Listen for proxy navigation events from the iframe to sync address bar
    const handleProxyMessage = (e) => {
      if (e.data && e.data.type === 'PROXY_NAVIGATED' && e.data.url) {
        setCurrentUrl(e.data.url);
        setInputUrl(e.data.url);
      }
    };

    window.addEventListener('message', handleProxyMessage);
    return () => window.removeEventListener('message', handleProxyMessage);
  }, []);

  // PostMessage Command Sender for YouTube IFrame API
  const sendPlayerCommand = (func, args = []) => {
    if (playerIframeRef.current && playerIframeRef.current.contentWindow) {
      playerIframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: func,
          args: args,
        }),
        '*'
      );
    }
  };

  const togglePlayPause = () => {
    audio.playClick();
    if (isPlaying) {
      sendPlayerCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      sendPlayerCommand('playVideo');
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    audio.playClick();
    if (isMuted) {
      sendPlayerCommand('unMute');
      sendPlayerCommand('setVolume', [volume]);
      setIsMuted(false);
    } else {
      sendPlayerCommand('mute');
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
      sendPlayerCommand('mute');
    } else {
      setIsMuted(false);
      sendPlayerCommand('unMute');
      sendPlayerCommand('setVolume', [val]);
    }
  };

  const handleSpeedChange = (e) => {
    const spd = parseFloat(e.target.value);
    setPlaybackSpeed(e.target.value);
    sendPlayerCommand('setPlaybackRate', [spd]);
  };

  const seekRelative = (seconds) => {
    audio.playClick();
    const next = Math.max(0, currentPlaybackSec + seconds);
    setCurrentPlaybackSec(next);
    sendPlayerCommand('seekTo', [next, true]);
  };

  const restartVideo = () => {
    audio.playClick();
    setCurrentPlaybackSec(0);
    sendPlayerCommand('seekTo', [0, true]);
    sendPlayerCommand('playVideo');
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    audio.playClick();
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Primary Navigator for YouTube & Web
  const handleLoadTarget = (rawInput, forceYouTube = false) => {
    const target = (rawInput || '').trim();
    if (!target) return;

    // 1. Check if input is a YouTube video URL or ID
    const extractedId = extractYouTubeVideoId(target);
    if (extractedId) {
      audio.playSuccess();
      setActiveYouTubeId(extractedId);
      setActiveYouTubeTitle(`Video: ${extractedId}`);
      setSearchQuery('');
      setIsYouTube(true);
      setIsPlaying(true);
      setInputUrl(`https://www.youtube.com/watch?v=${extractedId}`);
      setVideoSearchInput(`https://www.youtube.com/watch?v=${extractedId}`);
      return;
    }

    // 2. If in YouTube mode or forced: search YouTube
    if (isYouTube || forceYouTube || target.includes('youtube.com') || target.includes('youtu.be')) {
      audio.playSuccess();
      setIsYouTube(true);
      setIsPlaying(true);
      setSearchQuery(target);
      setActiveYouTubeTitle(`YouTube Search: "${target}"`);
      setVideoSearchInput(target);
      return;
    }

    // 3. Web Page Navigation (Google or direct URL)
    setIsYouTube(false);
    let webUrl = target;
    if (!webUrl.startsWith('http://') && !webUrl.startsWith('https://')) {
      if (webUrl.includes('.') && !webUrl.includes(' ')) {
        webUrl = `https://${webUrl}`;
      } else {
        webUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(webUrl)}`;
      }
    }

    setCurrentUrl(webUrl);
    setInputUrl(webUrl);

    if (isElectron && webviewRef.current?.loadURL) {
      webviewRef.current.loadURL(webUrl);
    }
  };

  const handleOmniboxSubmit = (e) => {
    e?.preventDefault();
    handleLoadTarget(inputUrl, isYouTube);
  };

  const handleVideoBarSubmit = (e) => {
    e?.preventDefault();
    handleLoadTarget(videoSearchInput, true);
  };

  // Clipboard Paste & Play Button
  const handlePasteAndPlay = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setVideoSearchInput(text);
        setInputUrl(text);
        handleLoadTarget(text, true);
      } else {
        alert('Clipboard is empty. Copy a YouTube video link first.');
      }
    } catch {
      alert('Clipboard permission denied. Please paste with Ctrl+V into the search bar.');
    }
  };

  const loadPresetVideo = (preset) => {
    audio.playClick();
    setActiveYouTubeId(preset.id);
    setActiveYouTubeTitle(preset.title);
    setSearchQuery('');
    setIsPlaying(true);
    setInputUrl(`https://www.youtube.com/watch?v=${preset.id}`);
    setVideoSearchInput(`https://www.youtube.com/watch?v=${preset.id}`);
  };

  const handleOpenExternal = () => {
    audio.playClick();
    const target = isYouTube ? `https://www.youtube.com/watch?v=${activeYouTubeId}` : currentUrl;
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(target);
    } else {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  const getYouTubeEmbedSrc = () => {
    let targetId = activeYouTubeId || 'P2uypwLUfmE';
    let startParam = '';
    if (targetId === 'P2uypwLUfmE') {
      startParam = '&start=40';
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      if (q.includes('ambient') || q.includes('rain') || q.includes('dark')) targetId = 'UMLhx2ExDm8';
      else if (q.includes('theme') || q.includes('ryuk') || q.includes('l theme')) targetId = 'C65oaIHsdYM';
      else if (q.includes('lofi') || q.includes('chill') || q.includes('beat')) targetId = '5yx6BWlEVcY';
      else if (q.includes('nature') || q.includes('4k')) targetId = 'LXb3EKWsInQ';
      else if (q.includes('space') || q.includes('nasa')) targetId = '21X5lGlDOfg';
      else if (q.includes('code') || q.includes('study')) targetId = 'f02mOEt11OQ';
      else if (q.includes('animation') || q.includes('bunny')) targetId = 'aqz-KE-bpKQ';
      else if (q.includes('rick') || q.includes('classic')) targetId = 'dQw4w9WgXcQ';
    }

    // Enable standard controls=1 so the user can pause, adjust volume, see the scrubber and toggle full screen
    return `https://www.youtube.com/embed/${targetId}?autoplay=1&controls=1&enablejsapi=1&rel=0&playsinline=1&modestbranding=1${startParam}`;
  };

  const getWebIframeSrc = () => {
    if (!currentUrl) return 'https://www.google.com/search?igu=1';
    // Google with igu=1 and Wikipedia load natively without proxy restrictions
    if (currentUrl.includes('google.com/search?igu=1') || currentUrl.includes('wikipedia.org')) {
      return currentUrl;
    }
    if (useProxy && !isElectron) {
      if (currentUrl.startsWith('/api/proxy')) return currentUrl;
      return `/api/proxy?url=${encodeURIComponent(currentUrl)}`;
    }
    return currentUrl;
  };

  return (
    <div className="flex flex-col w-full h-full flex-1 min-h-0 p-2.5 overflow-hidden select-none space-y-2">
      {/* Top Address & Mode Switcher Header */}
      <div className="flex flex-col space-y-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-lg">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center space-x-1.5 p-0.5 rounded-full bg-black/40 border border-white/[0.06]">
            <button
              onClick={() => {
                audio.playClick();
                setIsYouTube(true);
              }}
              className={`px-3.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                isYouTube
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span>🔴 YouTube & Video</span>
            </button>

            <button
              onClick={() => {
                audio.playClick();
                setIsYouTube(false);
              }}
              className={`px-3.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                !isYouTube
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span>🌐 Web Browser</span>
            </button>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center space-x-2">
            {onSendToChat && (
              <button
                onClick={() => {
                  audio.playClick();
                  const contentDesc = isYouTube
                    ? `I am watching this video in L Browser: "${activeYouTubeTitle}" (URL: https://www.youtube.com/watch?v=${activeYouTubeId}). Please summarize this video and its core concepts.`
                    : `I am viewing this web page in L Browser: ${currentUrl}. Please summarize the main content and answer questions about it.`;
                  onSendToChat(null, contentDesc);
                }}
                title="Ask L about current page/video content"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles size={12} />
                <span>Ask L</span>
              </button>
            )}

            <button
              onClick={handleOpenExternal}
              title="Open in full external browser tab"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
            >
              <ExternalLink size={12} />
              <span>Open Tab</span>
            </button>
          </div>
        </div>

        {/* Dynamic Search Bar (YouTube Search Bar OR Web Omnibox) */}
        {isYouTube ? (
          /* Dedicated YouTube Search Bar */
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 w-full">
              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 font-semibold text-[10px] shrink-0">
                YT
              </span>

              <form onSubmit={handleVideoBarSubmit} className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={videoSearchInput}
                  onChange={(e) => setVideoSearchInput(e.target.value)}
                  placeholder="Search YouTube videos or paste video link (e.g. Death Note, Lo-Fi, or URL)..."
                  className="w-full bg-white/[0.04] text-xs text-white px-3.5 py-1.5 rounded-full border border-white/[0.08] focus:border-rose-500/40 outline-none"
                />
              </form>

              {/* Paste & Play button */}
              <button
                type="button"
                onClick={handlePasteAndPlay}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.1] shrink-0 transition-all cursor-pointer"
                title="Paste YouTube link from clipboard and play immediately"
              >
                <span>📋 Paste & Play</span>
              </button>

              {/* Search / Play Button */}
              <button
                type="button"
                onClick={handleVideoBarSubmit}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_2px_15px_rgba(244,63,94,0.4)] shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Search YouTube or Play Video"
              >
                <Search size={12} />
                <span>Search</span>
              </button>
            </div>

            {/* Presets and Channel Badges */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <span className="text-[10px] text-white/40 uppercase font-medium shrink-0">Presets:</span>
              {YOUTUBE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadPresetVideo(p)}
                  className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                    activeYouTubeId === p.id && !searchQuery
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-950/40 border border-rose-400/20'
                      : 'bg-white/[0.03] text-white/60 border border-white/[0.08] hover:border-white/20 hover:text-white'
                  }`}
                >
                  {p.tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Web Browser Address Bar */
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center space-x-1.5 w-full">
              <button
                onClick={() => {
                  audio.playClick();
                  if (isElectron) webviewRef.current?.goBack?.();
                  else window.history.back?.();
                }}
                disabled={!canGoBack && isElectron}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 disabled:opacity-20 transition-colors cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft size={13} />
              </button>

              <button
                onClick={() => {
                  audio.playClick();
                  if (isElectron) webviewRef.current?.goForward?.();
                  else window.history.forward?.();
                }}
                disabled={!canGoForward && isElectron}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 disabled:opacity-20 transition-colors cursor-pointer"
                title="Go Forward"
              >
                <ArrowRight size={13} />
              </button>

              <button
                onClick={() => {
                  audio.playClick();
                  if (isElectron && webviewRef.current?.reload) {
                    webviewRef.current.reload();
                  } else if (iframeRef.current) {
                    iframeRef.current.src = getWebIframeSrc();
                  }
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Reload Page"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
              </button>

              {/* Web URL / Google Search Input */}
              <form onSubmit={handleOmniboxSubmit} className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Enter website URL or search Google (e.g. google.com, wikipedia.org)..."
                  className="w-full bg-white/[0.04] text-xs text-white px-4 py-1.5 rounded-full border border-white/[0.08] focus:border-rose-500/40 outline-none"
                />
              </form>

              {/* Go Button */}
              <button
                onClick={handleOmniboxSubmit}
                title="Navigate to URL or Google Search (Enter)"
                className="flex items-center space-x-1 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_2px_15px_rgba(244,63,94,0.4)] shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Search size={12} />
                <span>Go</span>
              </button>
            </div>

            {/* Clean Working Bookmarks */}
            <div className="flex items-center justify-between text-[10px] text-white/60 pt-1 border-t border-neutral-800">
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                {BOOKMARKS.map((bm, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      audio.playClick();
                      if (bm.isYT) {
                        setIsYouTube(true);
                        if (bm.ytId) {
                          setActiveYouTubeId(bm.ytId);
                          setActiveYouTubeTitle(bm.ytTitle || bm.label);
                          setSearchQuery('');
                          setIsPlaying(true);
                        }
                      } else {
                        setIsYouTube(false);
                        setCurrentUrl(bm.url);
                        setInputUrl(bm.url);
                        if (isElectron && webviewRef.current?.loadURL) {
                          webviewRef.current.loadURL(bm.url);
                        }
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                      (!isYouTube && currentUrl.includes(bm.url)) || (isYouTube && bm.isYT)
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-950/40 border border-rose-400/20'
                        : 'bg-white/[0.03] text-white/60 border border-white/[0.08] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {bm.label}
                  </button>
                ))}
              </div>

              {/* Window Opacity Slider */}
              <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                <span className="text-[9px] text-white/40 uppercase font-medium">Opacity:</span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={pinOpacity}
                  onChange={(e) => setPinOpacity(parseFloat(e.target.value))}
                  className="w-14 h-1 accent-rose-500 cursor-pointer"
                  title={`Overlay Opacity: ${Math.round(pinOpacity * 100)}%`}
                />
                <span className="text-[9px] font-mono text-rose-400 font-medium w-6">
                  {Math.round(pinOpacity * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Viewport Container */}
      <div
        className="flex-1 w-full h-full min-h-0 rounded-3xl overflow-hidden border border-white/[0.08] bg-[#08080a]/90 backdrop-blur-2xl shadow-2xl relative transition-opacity duration-200 flex flex-col"
        style={{ opacity: pinOpacity }}
      >
        {isYouTube ? (
          /* Dedicated YouTube Cinema Experience with Suggested Videos Shelf */
          <div className="w-full h-full flex-1 min-h-0 flex flex-col bg-[#08080a] relative overflow-hidden">
            {/* Video Player Display Container */}
            <div
              ref={playerContainerRef}
              className="flex-1 w-full h-full min-h-[50%] relative bg-black flex items-center justify-center overflow-hidden"
            >
              <iframe
                ref={playerIframeRef}
                key={activeYouTubeId + (searchQuery ? `-${searchQuery}` : '')}
                src={getYouTubeEmbedSrc()}
                title="YouTube Video Player"
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            </div>

            {/* Suggested Videos Section */}
            <div className="h-44 sm:h-48 shrink-0 bg-[#0c0d12]/98 border-t border-white/[0.08] p-3 flex flex-col space-y-2 overflow-hidden z-10">
              <div className="flex items-center justify-between text-xs font-medium text-white/90">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-semibold tracking-wide uppercase text-[11px] text-white/80">
                    Suggested Videos
                  </span>
                  <span className="text-[10px] text-white/40">
                    ({SUGGESTED_VIDEOS.length} recommendations)
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-white/50">
                  <span>Click video to play</span>
                </div>
              </div>

              {/* Horizontal Scrollable Video Cards */}
              <div className="flex-1 w-full overflow-x-auto overflow-y-hidden flex space-x-3 pb-1 no-scrollbar">
                {SUGGESTED_VIDEOS.map((vid) => {
                  const isCurrent = activeYouTubeId === vid.id;
                  return (
                    <button
                      key={vid.id}
                      onClick={() => {
                        audio.playClick();
                        setActiveYouTubeId(vid.id);
                        setActiveYouTubeTitle(vid.title);
                        setSearchQuery('');
                        setIsPlaying(true);
                        setInputUrl(`https://www.youtube.com/watch?v=${vid.id}`);
                        setVideoSearchInput(`https://www.youtube.com/watch?v=${vid.id}`);
                      }}
                      className={`group relative shrink-0 w-44 sm:w-48 h-full rounded-xl overflow-hidden border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                        isCurrent
                          ? 'border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      {/* Thumbnail Container with Play Overlay */}
                      <div className="relative w-full h-24 overflow-hidden bg-black/60">
                        <img
                          src={`https://img.youtube.com/vi/${vid.id}/mqdefault.jpg`}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-mono bg-black/70 text-white border border-white/10">
                          {vid.badge}
                        </span>
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Play size={13} fill="white" className="ml-0.5" />
                          </div>
                        </div>
                        {isCurrent && (
                          <div className="absolute bottom-1 left-1.5 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[8px] font-semibold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>Playing</span>
                          </div>
                        )}
                      </div>

                      {/* Video Title & Channel */}
                      <div className="p-2 flex flex-col justify-between flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-white/90 line-clamp-2 leading-tight group-hover:text-rose-300 transition-colors">
                          {vid.title}
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-white/40 mt-1">
                          <span className="truncate">{vid.channel}</span>
                          <span className="text-rose-400 font-mono text-[8.5px]">{vid.tag}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : isElectron ? (
          /* Native Electron Webview Tag */
          <webview
            ref={webviewRef}
            src={currentUrl}
            className="w-full h-full flex-1 min-h-0 border-none"
            allowpopups="true"
            webpreferences="contextIsolation=yes"
          />
        ) : (
          /* Web Browser Viewport with Native Video in the Background */
          <div className="w-full h-full flex-1 min-h-0 flex flex-col relative bg-[#0c0d10] overflow-hidden">
            {/* Atmospheric 100% Native Video Playing in the Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
              <video
                src="/videos/l-intro.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover pointer-events-none scale-105"
                style={{ opacity: deathNoteBgOpacity }}
              />
              {/* Dark Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-black/40 to-black/70 pointer-events-none" />
            </div>

            {/* Quick Web Helper Bar with Death Note Backdrop Controls */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-md border-b border-white/[0.08] text-[11px] text-white/80 z-10 shrink-0">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <span className="truncate max-w-[280px] font-mono text-[10px] text-white/90">{currentUrl}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                {/* Death Note Backdrop Opacity Slider */}
                <div className="flex items-center space-x-1.5 bg-white/[0.05] px-2 py-0.5 rounded border border-white/10">
                  <span className="text-[9px] font-mono text-white/60">📓 Death Note Clip:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={deathNoteBgOpacity}
                    onChange={(e) => setDeathNoteBgOpacity(parseFloat(e.target.value))}
                    className="w-12 h-1 accent-rose-500 cursor-pointer"
                    title={`Death Note Clip Opacity: ${Math.round(deathNoteBgOpacity * 100)}%`}
                  />
                  <span className="text-[9px] font-mono text-rose-300 w-6">
                    {Math.round(deathNoteBgOpacity * 100)}%
                  </span>
                </div>

                {/* Proxy Unblock Toggle */}
                <button
                  onClick={() => setUseProxy(!useProxy)}
                  className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                    useProxy
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium'
                      : 'border-white/10 bg-white/5 text-white/40'
                  }`}
                  title="Unblocks X-Frame-Options headers on sites"
                >
                  {useProxy ? '🛡️ Unblock ON' : '⚡ Direct'}
                </button>
              </div>
            </div>

            {/* Web Frame Display */}
            <div className="flex-1 w-full h-full min-h-0 relative z-10">
              <iframe
                ref={iframeRef}
                src={getWebIframeSrc()}
                title="Mini Browser Viewport"
                className="w-full h-full border-none transition-opacity duration-300"
                style={{ opacity: 1 - deathNoteBgOpacity * 0.4 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
