import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#07080a',
          color: '#f1f2f4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#0c0d10',
            border: '3px solid #ff1e2e',
            boxShadow: '6px 6px 0px #000, 6px 6px 0px #ff1e2e',
            padding: '24px',
            textAlign: 'left'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '2px solid rgba(255,30,46,0.3)',
              paddingBottom: '8px'
            }}>
              <span style={{ color: '#ff1e2e', fontWeight: 'bold', fontSize: '14px' }}>
                [ ⚠ L-OS SYSTEM RECOVERY ]
              </span>
              <span style={{ fontSize: '11px', color: '#888' }}>CODE: RUNTIME_FAULT</span>
            </div>
            <p style={{ fontSize: '13px', color: '#ff8899', marginBottom: '12px', fontWeight: 'bold' }}>
              {this.state.error?.toString() || 'Unknown UI Error'}
            </p>
            {this.state.errorInfo && (
              <pre style={{
                backgroundColor: '#000',
                padding: '12px',
                fontSize: '11px',
                color: '#aaa',
                overflowX: 'auto',
                maxHeight: '180px',
                border: '1px solid #333',
                marginBottom: '16px'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#ff1e2e',
                  color: '#000',
                  border: '2px solid #000',
                  boxShadow: '3px 3px 0px #fff',
                  fontWeight: 'bold',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              >
                [ RELOAD L ]
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  border: '2px solid #666',
                  boxShadow: '3px 3px 0px #ff1e2e',
                  fontWeight: 'bold',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              >
                [ RESET STATE & RELOAD ]
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
