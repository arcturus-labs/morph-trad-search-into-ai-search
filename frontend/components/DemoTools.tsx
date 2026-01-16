'use client'

import { useRouter, usePathname } from 'next/navigation'

interface DemoToolsProps {
  params: Array<[string, string]>;
  showExampleQueries: boolean;
  onToggleExampleQueries: () => void;
  exampleQueriesRef: React.RefObject<HTMLDivElement>;
  exampleQueries: string[];
  onExampleQueryClick: (query: string) => void;
}

export default function DemoTools({ 
  params, 
  showExampleQueries,
  onToggleExampleQueries,
  exampleQueriesRef,
  exampleQueries,
  onExampleQueryClick
}: DemoToolsProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Filter out 'page' and 'q' parameters
  const filteredParams = params.filter(([key]) => key !== 'page' && key !== 'q');
  
  const handleClearPage = () => {
    window.location.replace(pathname)
  }

  return (
    <div id="demo-tools" style={{
      width: '100%',
      backgroundColor: '#f8f9fa',
      padding: '10px 0',
      borderBottom: '1px solid #dee2e6',
      fontSize: '11px',
      fontFamily: 'monospace'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        {/* Title and Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          flexShrink: 0
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#495057',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            paddingTop: '2px'
          }}>
            Demo Tools
          </span>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <button
              onClick={() => router.push('/traditional')}
              title="Traditional search"
              type="button"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                height: 'auto',
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                backgroundColor: pathname === '/traditional' ? '#bee5eb' : '#e8f4f8',
                border: '1px solid #bee5eb',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#0c5460',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                transition: 'background-color 0.2s ease',
                boxShadow: 'none',
                fontWeight: pathname === '/traditional' ? '600' : '400'
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/traditional') {
                  e.currentTarget.style.backgroundColor = '#d1ecf1'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/traditional') {
                  e.currentTarget.style.backgroundColor = '#e8f4f8'
                }
              }}
            >
              Traditional
            </button>
            <button
              onClick={() => router.push('/beginner_ai')}
              title="Beginner AI search"
              type="button"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                height: 'auto',
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                backgroundColor: pathname === '/beginner_ai' ? '#bee5eb' : '#e8f4f8',
                border: '1px solid #bee5eb',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#0c5460',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                transition: 'background-color 0.2s ease',
                boxShadow: 'none',
                fontWeight: pathname === '/beginner_ai' ? '600' : '400'
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/beginner_ai') {
                  e.currentTarget.style.backgroundColor = '#d1ecf1'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/beginner_ai') {
                  e.currentTarget.style.backgroundColor = '#e8f4f8'
                }
              }}
            >
              Beginner
            </button>
            <button
              onClick={() => router.push('/intermediate_ai')}
              title="Intermediate AI search"
              type="button"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                height: 'auto',
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                backgroundColor: pathname === '/intermediate_ai' ? '#bee5eb' : '#e8f4f8',
                border: '1px solid #bee5eb',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#0c5460',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                transition: 'background-color 0.2s ease',
                boxShadow: 'none',
                fontWeight: pathname === '/intermediate_ai' ? '600' : '400'
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/intermediate_ai') {
                  e.currentTarget.style.backgroundColor = '#d1ecf1'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/intermediate_ai') {
                  e.currentTarget.style.backgroundColor = '#e8f4f8'
                }
              }}
            >
              Intermediate
            </button>
            <button
              onClick={() => router.push('/advanced_ai')}
              title="Advanced AI search"
              type="button"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                height: 'auto',
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                backgroundColor: pathname === '/advanced_ai' ? '#bee5eb' : '#e8f4f8',
                border: '1px solid #bee5eb',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#0c5460',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                transition: 'background-color 0.2s ease',
                boxShadow: 'none',
                fontWeight: pathname === '/advanced_ai' ? '600' : '400'
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/advanced_ai') {
                  e.currentTarget.style.backgroundColor = '#d1ecf1'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/advanced_ai') {
                  e.currentTarget.style.backgroundColor = '#e8f4f8'
                }
              }}
            >
              Advanced
            </button>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div className="hint-button-container" ref={exampleQueriesRef}>
              <button
                className="hint-button"
                onClick={onToggleExampleQueries}
                title="Show example queries"
                type="button"
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  height: 'auto',
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  backgroundColor: '#e8f4f8',
                  border: '1px solid #bee5eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#0c5460',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  transition: 'background-color 0.2s ease',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d1ecf1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e8f4f8'
                }}
              >
                example queries
              </button>
              {showExampleQueries && (
                <div className="example-queries-dropdown">
                  <div className="example-queries-header">Example Queries</div>
                  <div className="example-queries-list">
                    {exampleQueries.map((exampleQuery, index) => (
                      <button
                        key={index}
                        className="example-query-item"
                        onClick={() => onExampleQueryClick(exampleQuery)}
                        type="button"
                      >
                        {exampleQuery}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleClearPage}
              title="Clear all parameters and reload page"
              type="button"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                height: 'auto',
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                backgroundColor: '#e8f4f8',
                border: '1px solid #bee5eb',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#0c5460',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                transition: 'background-color 0.2s ease',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d1ecf1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e8f4f8'
              }}
            >
              clear page
            </button>
          </div>
        </div>

        {/* Parameters List */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: '4px',
          border: '1px solid #e9ecef',
          minHeight: '24px'
        }}>
          <div style={{
            padding: '6px 12px',
            borderBottom: '1px solid #e9ecef',
            backgroundColor: '#f8f9fa',
            fontSize: '10px',
            fontWeight: '600',
            color: '#495057',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Current Query Interpretation
          </div>
          <div style={{
            padding: '8px 12px'
          }}>
            {filteredParams.length > 0 ? (
              filteredParams.map(([key, value]) => (
                <div key={key} style={{ marginBottom: '2px' }}>
                  <strong>{key}:</strong> {value}
                </div>
              ))
            ) : (
              <div style={{ color: '#999' }}>No URL parameters</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
