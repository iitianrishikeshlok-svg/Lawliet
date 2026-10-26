import React, { useState, useEffect, useCallback } from 'react';
import FloatingIcon from './components/FloatingIcon';
import ActionMenu from './components/ActionMenu';
import Header from './components/Header';
import NavigationDock from './components/NavigationDock';
import ChatHUD from './components/ChatHUD';
import SnipTab from './components/tabs/SnipTab';
import ScreenWatchTab from './components/tabs/ScreenWatchTab';
import CameraTab from './components/tabs/CameraTab';
import BrowserTab from './components/tabs/BrowserTab';
import HistoryTab from './components/tabs/HistoryTab';
import SettingsTab from './components/tabs/SettingsTab';
import SnippingOverlay from './components/canvas/SnippingOverlay';
import OpeningScreen from './components/OpeningScreen';
import DraggableWebIcon from './components/DraggableWebIcon';
import { THEMES, ACCENT_COLORS, applyTheme } from './themes/themeConfig';
import { queryGemini } from './services/gemini';
import { storageService } from './services/storage';
import { audio } from './common/AudioEngine';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const windowMode = urlParams.get('mode') || ''; // 'icon', 'action-menu', 'assistant', 'browser', 'sniper'

  // Application & Window State
  const [activeTab, setActiveTab] = useState('chat');
  const [themeId, setThemeId] = useState('graphite');
  const [accentId, setAccentId] = useState('cobalt');
  const [iconState, setIconState] = useState('visible'); // 'visible' | 'hidden' | 'disabled'
  const [iconSize, setIconSize] = useState(52);
  const [iconOpacity, setIconOpacity] = useState(0.95);
  const [iconShadow, setIconShadow] = useState('subtle');
  const [iconBackground, setIconBackground] = useState('graphite');
  const [dockingEnabled, setDockingEnabled] = useState(true);
  const [firstRunHintSeen, setFirstRunHintSeen] = useState(false);

  // Standalone browser fallback state (when not in electron)
  const [isInitialized, setIsInitialized] = useState(false);
  const [standaloneExpanded, setStandaloneExpanded] = useState(false);
  const [standaloneActionMenuOpen, setStandaloneActionMenuOpen] = useState(false);

  // Assistant HUD State
  const [thinkingLevel, setThinkingLevel] = useState(2);
  const [isPinned, setIsPinned] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // AI & Vision State
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [isThinking, setIsThinking] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [lastLatency, setLastLatency] = useState(null);

  // Media Attachments & Snipping
  const [attachedImage, setAttachedImage] = useState(null);
  const [lastSnipUrl, setLastSnipUrl] = useState(null);
  const [screenBufferData, setScreenBufferData] = useState(null);

  // Chat message stream
  const [messages, setMessages] = useState([]);

  // Load persistent configurations on mount
  useEffect(() => {
    async function loadConfig() {
      const envKey =
        (typeof import.meta !== 'undefined' &&
          (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY)) ||
        (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
        '';
      const savedTheme = await storageService.get('theme', 'graphite');
      const savedAccent = await storageService.get('accent', 'cobalt');
      const savedKey = await storageService.get('apiKey', envKey);
      const savedAudio = await storageService.get('audioFeedback', true);
      const savedLevel = await storageService.get('thinkingLevel', 2);
      const savedModel = await storageService.get('model', 'gemini-3.5-flash');
      const savedSize = await storageService.get('iconSize', 52);
      const savedOpacity = await storageService.get('iconOpacity', 0.95);
      const savedShadow = await storageService.get('iconShadow', 'subtle');
      const savedBg = await storageService.get('iconBackground', 'graphite');
      const savedDock = await storageService.get('dockingEnabled', true);
      const savedState = await storageService.get('iconState', 'visible');
      const savedHint = await storageService.get('firstRunHintSeen', false);

      setThemeId(savedTheme);
      setAccentId(savedAccent);
      setSelectedModel(savedModel);
      setApiKey(savedKey || envKey);
      setAudioEnabled(savedAudio);
      setThinkingLevel(savedLevel);
      setIconSize(savedSize);
      setIconOpacity(savedOpacity);
      setIconShadow(savedShadow);
      setIconBackground(savedBg);
      setDockingEnabled(savedDock);
      setIconState(savedState);
      setFirstRunHintSeen(savedHint);

      applyTheme(savedTheme, savedAccent);
      audio.setEnabled(savedAudio);
    }
    loadConfig();
  }, []);

  // Listen to IPC events from Electron
  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanupTheme = window.electronAPI.onThemeChanged?.((payload) => {
      const nextTheme = typeof payload === 'string' ? payload : payload.themeId;
      const nextAccent = payload?.accentId || 'cobalt';
      setThemeId(nextTheme);
      setAccentId(nextAccent);
      applyTheme(nextTheme, nextAccent);
    });

    const cleanupState = window.electronAPI.onAppStateChanged?.((state) => {
      if (state.iconState) setIconState(state.iconState);
      if (state.iconSize) setIconSize(state.iconSize);
      if (state.iconOpacity) setIconOpacity(state.iconOpacity);
      if (state.iconShadow) setIconShadow(state.iconShadow);
      if (state.iconBackground) setIconBackground(state.iconBackground);
    });

    const cleanupAction = window.electronAPI.onOpenActionRequested?.((action) => {
      if (action.tab) setActiveTab(action.tab);
      if (action.attachment) setAttachedImage(action.attachment);
    });

    const cleanupSnip = window.electronAPI.onSnipCaptured?.((dataUrl) => {
      setAttachedImage(dataUrl);
      setLastSnipUrl(dataUrl);
      setActiveTab('chat');
      audio.playSuccess();
    });

    const cleanupBuffer = window.electronAPI.onScreenBufferReady?.((data) => {
      setScreenBufferData(data.bufferUrl);
    });

    return () => {
      cleanupTheme?.();
      cleanupState?.();
      cleanupAction?.();
      cleanupSnip?.();
      cleanupBuffer?.();
    };
  }, []);

  // Global Keyboard Shortcuts inside the window
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        if (window.electronAPI?.toggleIcon) {
          window.electronAPI.toggleIcon();
        } else {
          if (!isInitialized) {
            setIsInitialized(true);
            setStandaloneExpanded(true);
          } else {
            setStandaloneExpanded((prev) => !prev);
          }
        }
      }
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleTriggerSnip();
      }
      if (e.key === 'Escape') {
        if (window.electronAPI?.closeAssistant) {
          window.electronAPI.closeAssistant();
        } else {
          setStandaloneExpanded(false);
          setStandaloneActionMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeTheme = applyTheme(themeId, accentId);

  // Theme & Accent change handlers
  const handleThemeChange = (newThemeId) => {
    setThemeId(newThemeId);
    applyTheme(newThemeId, accentId);
    storageService.set('theme', newThemeId);
  };

  const handleAccentChange = (newAccentId) => {
    setAccentId(newAccentId);
    applyTheme(themeId, newAccentId);
    storageService.set('accent', newAccentId);
  };

  // Icon Preference Handlers
  const handleIconSizeChange = (size) => {
    setIconSize(size);
    storageService.set('iconSize', size);
  };

  const handleIconOpacityChange = (opacity) => {
    setIconOpacity(opacity);
    storageService.set('iconOpacity', opacity);
    window.electronAPI?.setWindowOpacity?.(opacity);
  };

  const handleIconShadowChange = (shadow) => {
    setIconShadow(shadow);
    storageService.set('iconShadow', shadow);
  };

  const handleIconBackgroundChange = (bg) => {
    setIconBackground(bg);
    storageService.set('iconBackground', bg);
  };

  const handleIconStateChange = (state) => {
    setIconState(state);
    storageService.set('iconState', state);
    window.electronAPI?.setIconState?.(state);
  };

  const handleTogglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    window.electronAPI?.setAlwaysOnTop?.(next);
  };

  // Action Menu Selection
  const handleSelectAction = (actionId) => {
    audio.playClick();
    if (window.electronAPI) {
      if (actionId === 'chat') window.electronAPI.openAssistant('chat');
      else if (actionId === 'snip') window.electronAPI.triggerSnip();
      else if (actionId === 'draw') window.electronAPI.triggerSnip();
      else if (actionId === 'camera') window.electronAPI.openAssistant('camera');
      else if (actionId === 'browser') window.electronAPI.openBrowser();
      else if (actionId === 'history') window.electronAPI.openAssistant('history');
      else if (actionId === 'settings') window.electronAPI.openAssistant('settings');
      window.electronAPI.closeActionMenu();
    } else {
      // Standalone browser mode
      setStandaloneActionMenuOpen(false);
      if (actionId === 'snip') handleTriggerSnip();
      else {
        setActiveTab(actionId === 'draw' ? 'snip' : actionId);
        setStandaloneExpanded(true);
      }
    }
  };

  // Screen Snip Trigger
  const handleTriggerSnip = async () => {
    if (window.electronAPI?.triggerSnip) {
      await window.electronAPI.triggerSnip();
    } else {
      const frame = await handleCaptureScreenFrame();
      if (frame) {
        setScreenBufferData(frame);
      }
    }
  };

  const handleCaptureScreenFrame = useCallback(async () => {
    if (window.electronAPI?.captureScreenFrame) {
      try {
        return await window.electronAPI.captureScreenFrame();
      } catch (err) {
        console.warn('[App] Capture error:', err);
      }
    }
    // Browser getDisplayMedia fallback
    if (navigator?.mediaDevices?.getDisplayMedia) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach((track) => track.stop());
        return canvas.toDataURL('image/jpeg', 0.85);
      } catch (err) {
        console.warn('[App] Web capture error:', err);
      }
    }
    return null;
  }, []);

  // Send message to Gemini
  const handleSendMessage = async (promptText, imageAttachment = null) => {
    const userMsg = {
      role: 'user',
      text: promptText,
      imageDataUrl: imageAttachment,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setAttachedImage(null);

    try {
      const response = await queryGemini({
        prompt: promptText,
        imageDataUrl: imageAttachment,
        thinkingLevel,
        apiKey,
        model: selectedModel,
      });

      setLastLatency(response.latency);
      audio.playSuccess();

      const assistantMsg = {
        role: 'assistant',
        text: response.text,
        thought: response.thought,
        latency: response.latency,
        thinkingLevel: response.thinkingLevel,
        model: response.model,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Save to History Vault
      await storageService.saveHistoryItem({
        id: `log-${Date.now()}`,
        prompt: promptText,
        response: response.text,
        imageDataUrl: imageAttachment,
        thinkingLevel,
        latency: response.latency,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[App] Generation error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **[L-OS Diagnostic Alert]**: ${err?.message || 'Failed to process request.'}\n\n*Tip: Check that a valid Gemini API key is configured in the **Settings** tab.*`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendToChat = (imageDataUrl, defaultPrompt) => {
    setAttachedImage(imageDataUrl);
    setActiveTab('chat');
    if (defaultPrompt) {
      handleSendMessage(defaultPrompt, imageDataUrl);
    }
  };

  // ----------------------------------------------------------------------
  // DEDICATED WINDOW MODE RENDERING
  // ----------------------------------------------------------------------

  // 1. Sniper Overlay Window Mode
  if (windowMode === 'sniper' || screenBufferData) {
    return (
      <SnippingOverlay
        bufferUrl={screenBufferData}
        theme={activeTheme}
        onFinishSnip={(croppedDataUrl) => {
          if (window.electronAPI?.sendSnipResult) {
            window.electronAPI.sendSnipResult(croppedDataUrl);
          } else {
            setScreenBufferData(null);
            handleSendToChat(croppedDataUrl, 'Analyze this cropped region in detail.');
          }
        }}
        onCancel={() => {
          if (window.electronAPI?.cancelSnipOverlay) {
            window.electronAPI.cancelSnipOverlay();
          }
          setScreenBufferData(null);
        }}
      />
    );
  }

  // 2. Floating Icon Window Mode
  if (windowMode === 'icon') {
    return (
      <FloatingIcon
        theme={activeTheme}
        iconSize={iconSize}
        iconOpacity={iconOpacity}
        iconShadow={iconShadow}
        iconBackground={iconBackground}
        isThinking={isThinking}
        isWatching={isWatching}
        firstRunHintSeen={firstRunHintSeen}
        onDismissHint={() => {
          setFirstRunHintSeen(true);
          storageService.set('firstRunHintSeen', true);
        }}
      />
    );
  }

  // 3. Action Menu Popup Window Mode
  if (windowMode === 'action-menu') {
    return (
      <div className="w-full h-full p-2 flex items-center justify-center bg-transparent">
        <ActionMenu
          theme={activeTheme}
          onSelectAction={handleSelectAction}
          onClose={() => window.electronAPI?.closeActionMenu?.()}
        />
      </div>
    );
  }

  // 4. Dedicated Browser Window Mode
  if (windowMode === 'browser') {
    return (
      <div className="w-full h-full flex flex-col utility-panel rounded-xl overflow-hidden shadow-2xl">
        <div className="draggable flex items-center justify-between px-3 py-2 bg-[#121316] border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xs text-white">L Mini Browser</span>
          </div>
          <button
            onClick={() => window.electronAPI?.closeBrowser?.()}
            className="non-draggable text-white/50 hover:text-white p-1 rounded"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 w-full overflow-hidden">
          <BrowserTab onSendToChat={handleSendToChat} theme={activeTheme} />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 5. OPENING SCREEN & STANDALONE WEB MODE (When not in electron)
  // ----------------------------------------------------------------------

  // A. First Launch: Full-Screen Cinematic Opening Screen with Real HTML5 Video
  if (!window.electronAPI && !isInitialized) {
    return (
      <OpeningScreen
        onInitialize={() => {
          setIsInitialized(true);
          setStandaloneExpanded(true);
        }}
        theme={activeTheme}
      />
    );
  }

  // B. Initialized, but Assistant Closed: Persistent Floating Draggable L Icon on Desktop
  if (!window.electronAPI && isInitialized && !standaloneExpanded) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#07080a] select-none">
        {/* Real Native Video Backdrop */}
        <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 select-none overflow-hidden bg-black">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40 select-none pointer-events-none"
            style={{
              filter: 'brightness(110%) contrast(110%) saturate(105%)',
            }}
          >
            <source src="/videos/l-intro.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/80 pointer-events-none" />
        </div>

        {/* Persistent Floating Draggable L Icon Widget with Circular Action Layout */}
        <DraggableWebIcon
          theme={activeTheme}
          iconSize={iconSize}
          iconOpacity={iconOpacity}
          iconShadow={iconShadow}
          iconBackground={iconBackground}
          isThinking={isThinking}
          isWatching={isWatching}
          selectedModel={selectedModel}
          onSelectModel={(m) => {
            setSelectedModel(m);
            storageService.set('model', m);
          }}
          thinkingLevel={thinkingLevel}
          onThinkingLevelChange={(lvl) => {
            setThinkingLevel(lvl);
            storageService.set('thinkingLevel', lvl);
          }}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setStandaloneExpanded(true);
          }}
          onTriggerSnip={handleTriggerSnip}
          onExpand={() => setStandaloneExpanded(true)}
          onReopenIntro={() => {
            setIsInitialized(false);
            setStandaloneExpanded(false);
          }}
          initialRadialOpen={true}
        />
      </div>
    );
  }

  // C. Render Full Assistant Productivity Panel
  return (
    <div className="relative w-full h-screen min-h-screen overflow-hidden flex flex-col font-sans text-xs text-[#f1f2f4]">
      {/* Real Background Video (Native Hardware-Accelerated Local Video) */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 select-none bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none select-none"
          style={{
            filter: 'brightness(110%) contrast(110%) saturate(105%)',
          }}
        >
          <source src="/videos/l-intro.mp4" type="video/mp4" />
        </video>
        {/* Subtle Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/75 pointer-events-none" />
      </div>

      <div
        className="w-full h-screen min-h-screen flex flex-col flex-1 overflow-hidden relative bg-[#07080b]/95 backdrop-blur-xl border-t-0 border-b-0 sm:border-[3px] border-black shadow-[0_0_0_2px_#ff1e2e]"
      >
      {/* Refined Header with Mode Selector and Close Button */}
      <Header
        thinkingLevel={thinkingLevel}
        onThinkingLevelChange={(lvl) => {
          setThinkingLevel(lvl);
          storageService.set('thinkingLevel', lvl);
        }}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
        onFloatPiP={() => {
          setStandaloneExpanded(false);
          audio.playExpand();
        }}
        onClose={() => {
          if (window.electronAPI?.closeAssistant) {
            window.electronAPI.closeAssistant();
          } else {
            setStandaloneExpanded(false);
          }
        }}
        lastLatency={lastLatency}
        theme={activeTheme}
      />

      {/* Navigation Dock */}
      <NavigationDock
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={activeTheme}
      />

      {/* Active Tab Viewport — Full Fit */}
      <main className="flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col relative bg-transparent">
        {activeTab === 'chat' && (
          <ChatHUD
            messages={messages}
            onSendMessage={handleSendMessage}
            onCancelGeneration={() => setIsThinking(false)}
            isThinking={isThinking}
            thinkingLevel={thinkingLevel}
            attachedImage={attachedImage}
            onAttachImage={(dataUrl) => setAttachedImage(dataUrl)}
            onClearAttachedImage={() => setAttachedImage(null)}
            onTriggerSnip={handleTriggerSnip}
            onClearChat={() => setMessages([])}
            theme={activeTheme}
          />
        )}

        {activeTab === 'snip' && (
          <SnipTab
            lastSnipUrl={lastSnipUrl}
            onTriggerScreenSnip={handleTriggerSnip}
            onSendToChat={handleSendToChat}
            onAttachImage={(dataUrl) => setAttachedImage(dataUrl)}
            theme={activeTheme}
          />
        )}

        {activeTab === 'watch' && (
          <ScreenWatchTab
            isWatching={isWatching}
            onToggleWatch={setIsWatching}
            onCaptureFrame={handleCaptureScreenFrame}
            onSendToChat={handleSendToChat}
            theme={activeTheme}
          />
        )}

        {activeTab === 'camera' && (
          <CameraTab
            onSendToChat={handleSendToChat}
            theme={activeTheme}
          />
        )}

        {activeTab === 'browser' && (
          <BrowserTab
            onSendToChat={handleSendToChat}
            theme={activeTheme}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            onRestoreChat={(item) => {
              setMessages((prev) => [
                ...prev,
                { role: 'user', text: item.prompt, imageDataUrl: item.imageDataUrl },
                { role: 'assistant', text: item.response, latency: item.latency, thinkingLevel: item.thinkingLevel },
              ]);
              setActiveTab('chat');
            }}
            theme={activeTheme}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            currentThemeId={themeId}
            onThemeSelect={handleThemeChange}
            currentAccentId={accentId}
            onAccentSelect={handleAccentChange}
            iconState={iconState}
            onIconStateChange={handleIconStateChange}
            iconSize={iconSize}
            onIconSizeChange={handleIconSizeChange}
            iconOpacity={iconOpacity}
            onIconOpacityChange={handleIconOpacityChange}
            iconShadow={iconShadow}
            onIconShadowChange={handleIconShadowChange}
            iconBackground={iconBackground}
            onIconBackgroundChange={handleIconBackgroundChange}
            dockingEnabled={dockingEnabled}
            onToggleDocking={(val) => {
              setDockingEnabled(val);
              storageService.set('dockingEnabled', val);
            }}
            apiKey={apiKey}
            onSaveApiKey={(key) => {
              setApiKey(key);
              storageService.set('apiKey', key);
            }}
            selectedModel={selectedModel}
            onSelectModel={(m) => {
              setSelectedModel(m);
              storageService.set('model', m);
            }}
            audioEnabled={audioEnabled}
            onToggleAudio={(val) => {
              setAudioEnabled(val);
              storageService.set('audioFeedback', val);
            }}
            theme={activeTheme}
          />
        )}
      </main>
    </div>
  </div>
  );
}
