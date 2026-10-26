import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function browserProxyPlugin() {
  return {
    name: 'browser-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing target url');
            return;
          }

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept':
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
          });

          const finalUrl = response.url || targetUrl;

          // Strip restrictive headers that block iframes or trigger external tab navigation
          for (const [key, val] of response.headers.entries()) {
            const lower = key.toLowerCase();
            if (
              lower === 'x-frame-options' ||
              lower === 'content-security-policy' ||
              lower === 'content-security-policy-report-only' ||
              lower === 'cross-origin-opener-policy' ||
              lower === 'cross-origin-embedder-policy' ||
              lower === 'cross-origin-resource-policy' ||
              lower === 'frame-ancestors' ||
              lower === 'content-encoding' ||
              lower === 'content-length'
            ) {
              continue;
            }
            res.setHeader(key, val);
          }
          res.setHeader('Access-Control-Allow-Origin', '*');

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            let html = await response.text();

            // Client-side script injected into proxied HTML:
            // 1. Defeats frame-busting scripts (window.top !== window.self)
            // 2. Intercepts window.open() to keep navigation in the same frame
            // 3. Intercepts link clicks to route them through /api/proxy instead of opening a new tab
            const injectedScript = `
<script>
(function() {
  try {
    // Neutralize frame-busting
    Object.defineProperty(window, 'top', { get: function() { return window.self; } });
    Object.defineProperty(window, 'parent', { get: function() { return window.self; } });
  } catch(e) {}

  // Override window.open to keep in same frame
  window.open = function(url) {
    if (url) {
      try {
        var resolved = new URL(url, document.baseURI).href;
        window.parent.postMessage({ type: 'PROXY_NAVIGATED', url: resolved }, '*');
        window.location.href = '/api/proxy?url=' + encodeURIComponent(resolved);
      } catch(err) {
        window.location.href = url;
      }
    }
    return null;
  };

  // Intercept all link clicks so they never open in a new tab or bypass proxy
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (!a) return;
    
    // Remove target="_blank" or target="_top"
    var targetAttr = a.getAttribute('target');
    if (targetAttr === '_blank' || targetAttr === '_top') {
      a.removeAttribute('target');
    }

    var href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    try {
      var resolved = new URL(href, document.baseURI).href;
      if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PROXY_NAVIGATED', url: resolved }, '*');
        window.location.href = '/api/proxy?url=' + encodeURIComponent(resolved);
      }
    } catch(err) {}
  }, true);

  // Intercept GET form submissions
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || (form.method && form.method.toLowerCase() !== 'get')) return;
    try {
      e.preventDefault();
      var action = form.getAttribute('action') || '';
      var actionUrl = new URL(action, document.baseURI);
      var formData = new FormData(form);
      var params = new URLSearchParams(formData);
      var fullUrl = actionUrl.origin + actionUrl.pathname + '?' + params.toString();
      window.parent.postMessage({ type: 'PROXY_NAVIGATED', url: fullUrl }, '*');
      window.location.href = '/api/proxy?url=' + encodeURIComponent(fullUrl);
    } catch(err) {}
  }, true);

  // Notify parent of initial URL load
  try {
    window.parent.postMessage({ type: 'PROXY_NAVIGATED', url: ${JSON.stringify(finalUrl)} }, '*');
  } catch(e) {}
})();
</script>
`;

            const baseTag = `<base href="${finalUrl}">`;
            if (html.includes('<head>')) {
              html = html.replace('<head>', `<head>${baseTag}${injectedScript}`);
            } else {
              html = `${baseTag}${injectedScript}${html}`;
            }
            res.statusCode = response.status;
            res.end(html);
          } else {
            const buffer = await response.arrayBuffer();
            res.statusCode = response.status;
            res.end(Buffer.from(buffer));
          }
        } catch (err) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Proxy Notice</title><style>
            body { margin:0; background:#0b0c10; color:#e0e0e6; font-family:-apple-system,sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; text-align:center; padding:20px; box-sizing:border-box; }
            .card { background:rgba(255,255,255,0.03); border:1px solid rgba(244,63,94,0.3); border-radius:14px; padding:28px 24px; max-width:440px; box-shadow:0 10px 40px rgba(0,0,0,0.8); }
            h2 { color:#f43f5e; margin:0 0 10px 0; font-size:16px; letter-spacing:0.05em; text-transform:uppercase; font-family:monospace; }
            p { font-size:12px; color:#999; line-height:1.6; margin:0 0 18px 0; }
            a { display:inline-block; padding:9px 20px; background:#f43f5e; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:12px; transition:0.2s; box-shadow:0 0 15px rgba(244,63,94,0.4); }
            a:hover { background:#fb7185; }
          </style></head><body>
            <div class="card">
              <h2>🔒 Site Direct Embedding Notice</h2>
              <p>This web domain blocks being loaded inside embedded proxy frames (${err.message || 'Restricted by origin policy'}). You can open it directly in a new tab:</p>
              <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">Open "${targetUrl}" in New Tab →</a>
            </div>
          </body></html>`);
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'GEMINI_'],
  plugins: [react(), browserProxyPlugin()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''),
  },
});

