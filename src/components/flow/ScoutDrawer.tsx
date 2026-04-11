import React, { useState } from 'react';

interface ScoutResult {
  id: string | null;
  url: string;
  title: string;
  status: 'scraped' | 'cached' | 'error';
  preview: string;
}

interface ScoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScoutDrawer({ isOpen, onClose }: ScoutDrawerProps) {
  const [urls, setUrls] = useState('https://partiful.com\nhttps://doodle.com\nhttps://when2meet.com\nhttps://eventbrite.com');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScoutResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScout = async () => {
    if (!urls.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const urlList = urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const response = await fetch('/api/scout/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: urlList }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scout pages');
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scraped': return '#86efac';
      case 'cached': return '#60a5fa';
      case 'error': return '#fca5a5';
      default: return '#9ca3af';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scraped': return '🆕';
      case 'cached': return '📋';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '450px',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderLeft: 'none',
      zIndex: 1000,
      padding: '1.5rem',
      overflowY: 'auto',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease-in-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: 'white',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🕵️ Scout the Market
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '0.25rem',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          ×
        </button>
      </div>

      {/* Description */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '0.5rem'
      }}>
        <p style={{
          color: '#93c5fd',
          fontSize: '0.875rem',
          margin: 0,
          lineHeight: '1.5'
        }}>
          Enter competitor URLs to analyze their content and positioning. This will help ground your differentiation strategy with real market data.
        </p>
      </div>

      {/* URL Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          color: '#d1d5db',
          fontSize: '0.875rem',
          fontWeight: '500',
          marginBottom: '0.5rem'
        }}>
          Competitor URLs (one per line)
        </label>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="https://partiful.com&#10;https://doodle.com&#10;https://when2meet.com"
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '0.75rem',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '0.5rem',
            color: 'white',
            fontSize: '0.875rem',
            resize: 'vertical',
            fontFamily: 'monospace'
          }}
          disabled={isLoading}
        />
      </div>

      {/* Scout Button */}
      <button
        onClick={handleScout}
        disabled={!urls.trim() || isLoading}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          background: isLoading || !urls.trim() 
            ? 'linear-gradient(to right, #4b5563, #6b7280)' 
            : 'linear-gradient(to right, #9333ea, #2563eb)',
          color: 'white',
          fontWeight: '600',
          borderRadius: '0.5rem',
          border: 'none',
          cursor: isLoading || !urls.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {isLoading ? (
          <>
            <div style={{ 
              width: '1rem', 
              height: '1rem', 
              border: '2px solid rgba(255,255,255,0.3)', 
              borderTop: '2px solid white', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} className="spinner"></div>
            <span>Scouting...</span>
          </>
        ) : (
          <>
            <span>🔍</span>
            <span>Scout Market</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '0.5rem',
          color: '#fca5a5',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📊 Scout Results ({results.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((result, index) => (
              <div key={index} style={{
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    margin: 0,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {result.title}
                  </h4>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: getStatusColor(result.status),
                    marginLeft: '0.5rem'
                  }}>
                    {getStatusIcon(result.status)}
                    {result.status}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: '0.5rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {result.url}
                </div>
                
                <div style={{
                  fontSize: '0.75rem',
                  color: '#d1d5db',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {result.preview}
                </div>
                
                {result.id && result.status !== 'error' && (
                  <button
                    onClick={() => {
                      // TODO: Open detailed view or attach to node
                      console.log('View details for:', result.id);
                    }}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.25rem',
                      color: '#60a5fa',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
        borderRadius: '0.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '1rem' }}>💡</span>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#fbbf24',
            margin: 0
          }}>
            How it works
          </h4>
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#fbbf24',
          lineHeight: '1.4'
        }}>
          • Scrapes competitor pages using headless browser<br/>
          • Extracts clean text content using Readability<br/>
          • Takes screenshots for visual reference<br/>
          • Caches results for 24 hours to avoid re-scraping<br/>
          • Only allows whitelisted domains for security
        </div>
      </div>
    </div>
  );
}
