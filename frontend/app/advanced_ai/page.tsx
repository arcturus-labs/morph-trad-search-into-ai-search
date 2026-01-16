'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import FacetsSidebar from '@/components/FacetsSidebar'
import ResultsHeader from '@/components/ResultsHeader'
import PropertyCard from '@/components/PropertyCard'
import DemoTools from '@/components/DemoTools'
import { searchProperties, sendChatMessage, SearchResponse, Facets, InterpretedQuery } from '@/lib/api'
import { EXAMPLE_QUERIES } from '@/lib/constants'
import { toTitleCase } from '@/lib/searchUtils'
import { useParsedSearchParams } from '@/lib/useSearchParams'
import { useFacetHandlers } from '@/lib/useFacetHandlers'
import styles from './advanced_ai.module.css'

function SearchPage() {
  const searchParams = useSearchParams()
  
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [facets, setFacets] = useState<Facets | null>(null)
  const [interpretedQuery, setInterpretedQuery] = useState<InterpretedQuery | null>(null)
  const [originalQuery, setOriginalQuery] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExampleQueries, setShowExampleQueries] = useState(false)
  const isUpdatingURLFromInterpretation = useRef(false)
  const exampleQueriesRef = useRef<HTMLDivElement>(null)
  const previousQueryParams = useRef<{ q: string | null; title: string | null; description: string | null } | null>(null)
  const pendingQueryRef = useRef<string | null>(null)

  // Chat state
  const [chatHistory, setChatHistory] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatSidebarRef = useRef<HTMLElement>(null)
  const chatHistoryRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  console.log('='.repeat(60))
  console.log('🔍 AdvancedAISearchPage Component Rendered')
  console.log('='.repeat(60))
  
  // Use shared hooks for URL params and facet handlers
  const {
    qParam,
    titleParam,
    descriptionParam,
    selectedPropertyTypes,
    selectedBedrooms,
    minPrice,
    maxPrice,
    minSqft,
    maxSqft,
    selectedPriceRanges,
    selectedSqftRanges,
    sort,
    page,
  } = useParsedSearchParams()
  
  const {
    updateURL,
    handlePropertyTypeChange,
    handleBedroomChange,
    handlePriceRangeChange,
    handleSqftRangeChange,
    handleSortChange,
  } = useFacetHandlers()

  const performSearch = async () => {
    console.log('='.repeat(60))
    console.log('🚀 performSearch() called')
    console.log('='.repeat(60))
    
    // Use pending query if available, otherwise use URL params
    const effectiveQuery = pendingQueryRef.current !== null ? pendingQueryRef.current : (qParam || '')
    const effectiveTitle = pendingQueryRef.current !== null ? toTitleCase(pendingQueryRef.current.trim()) : (titleParam || undefined)
    const effectiveDescription = pendingQueryRef.current !== null ? pendingQueryRef.current.toLowerCase().trim() : (descriptionParam || undefined)
    
    console.log('📋 Current State:')
    console.log('  Pending Query:', pendingQueryRef.current)
    console.log('  Query (q):', effectiveQuery)
    console.log('  Title:', effectiveTitle)
    console.log('  Description:', effectiveDescription)
    console.log('  Selected Property Types:', selectedPropertyTypes)
    console.log('  Selected Bedrooms:', selectedBedrooms)
    console.log('  Price Range:', { min: minPrice, max: maxPrice })
    console.log('  Sqft Range:', { min: minSqft, max: maxSqft })
    console.log('  Sort:', sort)
    console.log('  Page:', page)
    
    // Check if query params changed (vs just facets)
    const currentQueryParams = {
      q: effectiveQuery || null,
      title: effectiveTitle || null,
      description: effectiveDescription || null,
    }
    const isQueryChange = previousQueryParams.current === null || 
      previousQueryParams.current.q !== currentQueryParams.q ||
      previousQueryParams.current.title !== currentQueryParams.title ||
      previousQueryParams.current.description !== currentQueryParams.description
    
    console.log('🔍 Query change detected:', isQueryChange)
    console.log('  Previous:', previousQueryParams.current)
    console.log('  Current:', currentQueryParams)
    
    // Update ref for next time
    previousQueryParams.current = currentQueryParams
    
    setLoading(true)
    setError(null)
    
    // Only clear interpreted query if it's a new query
    if (isQueryChange) {
      setInterpretedQuery(null)
      
      // Store the original query for display
      if (effectiveQuery) {
        setOriginalQuery(effectiveQuery)
      }
    }
    
    try {
      // Build search request params - use effective query values
      const requestParams: any = {
        q: effectiveQuery || undefined,
        title: effectiveTitle || undefined,
        description: effectiveDescription || undefined,
        property_type: selectedPropertyTypes.length > 0 ? selectedPropertyTypes : undefined,
        bedrooms: selectedBedrooms.length > 0 ? selectedBedrooms : undefined,
        min_price: minPrice,
        max_price: maxPrice,
        min_sqft: minSqft,
        max_sqft: maxSqft,
        sort,
        page,
        per_page: 10,
      }
      
      console.log('📤 Building request params:', requestParams)
      
      const searchResults = await searchProperties(requestParams)
      
      console.log('✅ Search successful!')
      console.log('  Total results:', searchResults.total)
      console.log('  Results returned:', searchResults.results.length)
      console.log('  Page:', searchResults.page, 'of', Math.ceil(searchResults.total / searchResults.per_page))
      console.log('  Facets:', Object.keys(searchResults.facets))
      if (searchResults.did_you_mean) {
        console.log('  Did you mean:', searchResults.did_you_mean)
      }
      if (searchResults.interpreted_query) {
        console.log('  Interpreted query:', searchResults.interpreted_query)
      }
      
      // Update search results and facets
      setSearchResults(searchResults)
      setFacets(searchResults.facets)
      setError(null)
      setLoading(false)
      console.log('✅ State updated with search results')
      
      // Only update interpreted query for new queries
      if (isQueryChange && searchResults.interpreted_query) {
        setInterpretedQuery(searchResults.interpreted_query)
        
        // Update URL with interpreted parameters
        const interpreted = searchResults.interpreted_query
        const updates: Record<string, string | null> = {}
        
        // Update q parameter to the search terms from the interpreted query
        const searchTerms = interpreted.title || interpreted.description || ''
        if (searchTerms) {
          updates.q = searchTerms.toLowerCase().trim()
        } else {
          updates.q = null
        }
        
        // Update with interpreted parameters
        updates.title = interpreted.title || null
        updates.description = interpreted.description || null
        updates.property_type = interpreted.property_type && interpreted.property_type.length > 0 
          ? interpreted.property_type.join(',') 
          : null
        updates.bedrooms = interpreted.bedrooms && interpreted.bedrooms.length > 0 
          ? interpreted.bedrooms.join(',') 
          : null
        updates.min_price = interpreted.min_price !== undefined 
          ? interpreted.min_price.toString() 
          : null
        updates.max_price = interpreted.max_price !== undefined 
          ? interpreted.max_price.toString() 
          : null
        updates.min_sqft = interpreted.min_sqft !== undefined 
          ? interpreted.min_sqft.toString() 
          : null
        updates.max_sqft = interpreted.max_sqft !== undefined 
          ? interpreted.max_sqft.toString() 
          : null
        updates.sort = interpreted.sort && interpreted.sort !== 'relevance' 
          ? interpreted.sort 
          : null
        
        // Keep page number
        updates.page = page.toString()
        
        console.log('📤 Updating URL with interpreted parameters:', updates)
        isUpdatingURLFromInterpretation.current = true
        updateURL(updates)
        // Reset flag after a short delay to allow URL update to complete
        setTimeout(() => {
          isUpdatingURLFromInterpretation.current = false
        }, 100)
        
        // Clear pending query now that URL has been updated
        pendingQueryRef.current = null
      }
    } catch (error) {
      console.error('❌ Search error:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      setError('Failed to load properties. Please check that the backend server is running.')
      setSearchResults(null)
      setLoading(false)
      console.log('🏁 Search complete (with error), loading set to false')
      console.log('='.repeat(60))
    }
  }

  // Close example queries dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exampleQueriesRef.current && !exampleQueriesRef.current.contains(event.target as Node)) {
        setShowExampleQueries(false)
      }
    }

    if (showExampleQueries) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExampleQueries])

  const handleExampleQueryClick = (exampleQuery: string) => {
    setShowExampleQueries(false)
    
    // Clear interpreted query and original query when selecting an example query
    setInterpretedQuery(null)
    setOriginalQuery(null)
    
    // Submit the search by updating URL (this will trigger performSearch via useEffect)
    if (exampleQuery.trim()) {
      const qValue = exampleQuery.toLowerCase().trim()
      const titleValue = toTitleCase(exampleQuery.trim())
      const descriptionValue = exampleQuery.toLowerCase().trim()
      
      // Clear all facet filters when submitting a new query
      updateURL({ 
        q: qValue,
        title: titleValue,
        description: descriptionValue,
        page: '1',
        property_type: null,
        bedrooms: null,
        min_price: null,
        max_price: null,
        min_sqft: null,
        max_sqft: null,
        sort: null
      })
    }
  }

  useEffect(() => {
    // Skip if we're updating URL from interpretation to prevent infinite loop
    if (isUpdatingURLFromInterpretation.current) {
      console.log('⏭️ Skipping performSearch - updating URL from interpretation')
      return
    }
    
    console.log('🔄 useEffect triggered - searchParams changed')
    console.log('  Search params string:', searchParams.toString())
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  // Format interpreted query as pills (similar to QueryBreadcrumb)
  const formatInterpretedQueryPills = (interpreted: InterpretedQuery | null): Array<{label: string, value: string}> => {
    if (!interpreted) return []
    
    const pills: Array<{label: string, value: string}> = []
    
    const formatPrice = (price: number): string => {
      if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(1)}M`
      }
      return `$${(price / 1000).toFixed(0)}k`
    }
    
    const formatSqft = (sqft: number): string => {
      return `${sqft.toLocaleString()} sqft`
    }
    
    const formatPropertyType = (type: string): string => {
      return type.charAt(0).toUpperCase() + type.slice(1)
    }
    
    const formatBedroom = (bedroom: string): string => {
      return bedroom === '0' ? 'Studio' : `${bedroom} BR`
    }
    
    const formatBedrooms = (bedrooms: string[]): string => {
      if (bedrooms.length === 0) return ''
      if (bedrooms.length === 1) {
        return formatBedroom(bedrooms[0])
      }
      
      // Sort bedrooms numerically
      const sortedBedrooms = [...bedrooms].sort((a, b) => {
        const aNum = a === '0' ? 0 : parseInt(a)
        const bNum = b === '0' ? 0 : parseInt(b)
        return aNum - bNum
      })
      
      // Check if they form a consecutive range
      const nums = sortedBedrooms.map(b => b === '0' ? 0 : parseInt(b))
      let isConsecutive = true
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] !== nums[i-1] + 1) {
          isConsecutive = false
          break
        }
      }
      
      if (isConsecutive && nums.length > 1) {
        // Format as range: "1-3 BR" or "Studio, 1-3 BR"
        const first = sortedBedrooms[0]
        const last = sortedBedrooms[sortedBedrooms.length - 1]
        if (first === '0') {
          return `Studio, ${formatBedroom(last)}`
        }
        return `${first}-${last} BR`
      } else {
        // Format as list: "1, 2, 3 BR"
        return sortedBedrooms.map(formatBedroom).join(', ')
      }
    }
    
    // Property types
    if (interpreted.property_type && interpreted.property_type.length > 0) {
      const value = interpreted.property_type.map(formatPropertyType).join(', ')
      pills.push({ label: 'Property Type', value })
    }

    // Bedrooms
    if (interpreted.bedrooms && interpreted.bedrooms.length > 0) {
      const value = formatBedrooms(interpreted.bedrooms)
      pills.push({ label: 'Bedrooms', value })
    }

    // Price range
    if (interpreted.min_price !== undefined || interpreted.max_price !== undefined) {
      let value = ''
      if (interpreted.min_price !== undefined && interpreted.max_price !== undefined) {
        value = `${formatPrice(interpreted.min_price)} - ${formatPrice(interpreted.max_price)}`
      } else if (interpreted.min_price !== undefined) {
        value = `Over ${formatPrice(interpreted.min_price)}`
      } else if (interpreted.max_price !== undefined) {
        value = `Under ${formatPrice(interpreted.max_price)}`
      }
      pills.push({ label: 'Price', value })
    }

    // Square footage range
    if (interpreted.min_sqft !== undefined || interpreted.max_sqft !== undefined) {
      let value = ''
      if (interpreted.min_sqft !== undefined && interpreted.max_sqft !== undefined) {
        value = `${formatSqft(interpreted.min_sqft)} - ${formatSqft(interpreted.max_sqft)}`
      } else if (interpreted.min_sqft !== undefined) {
        value = `Over ${formatSqft(interpreted.min_sqft)}`
      } else if (interpreted.max_sqft !== undefined) {
        value = `Under ${formatSqft(interpreted.max_sqft)}`
      }
      pills.push({ label: 'Square Feet', value })
    }

    // Title/Description (text search terms)
    if (interpreted.title) {
      pills.push({ label: 'Search Terms', value: `"${interpreted.title}"` })
    } else if (interpreted.description) {
      pills.push({ label: 'Search Terms', value: `"${interpreted.description}"` })
    }

    // Sort
    if (interpreted.sort && interpreted.sort !== 'relevance') {
      const sortMap: Record<string, string> = {
        relevance: 'Relevance',
        price_asc: 'Price: Low to High',
        price_desc: 'Price: High to Low',
        newest: 'Newest',
      }
      pills.push({ label: 'Sort', value: sortMap[interpreted.sort] || interpreted.sort })
    }
    
    return pills
  }

  // Handler for chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const message = chatInput.trim()
    if (!message || chatLoading) return
    
    // Add user message to chat history
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }
    setChatHistory(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)
    
    try {
      // Call chat API
      const response = await sendChatMessage(message)
      
      // Add assistant response to chat history
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: response.response,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      // Add error message to chat history
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }

  // Auto-scroll chat history to bottom when new messages are added
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [chatHistory, chatLoading])


  console.log('🎨 Rendering AdvancedAISearchPage:')
  console.log('  Loading:', loading)
  console.log('  Error:', error)
  console.log('  Has searchResults:', !!searchResults)
  console.log('  Has facets:', !!facets)
  console.log('  Results count:', searchResults?.results?.length || 0)
  console.log('  Interpreted query:', interpretedQuery)

  // Get all URL parameters for display
  const allUrlParams = Array.from(searchParams.entries())

  return (
    <>
      <DemoTools 
        params={allUrlParams}
        showExampleQueries={showExampleQueries}
        onToggleExampleQueries={() => setShowExampleQueries(!showExampleQueries)}
        exampleQueriesRef={exampleQueriesRef}
        exampleQueries={EXAMPLE_QUERIES}
        onExampleQueryClick={handleExampleQueryClick}
      />
      
      <div className="container">
        <header>
          <div className="header-content">
            <h1>🏠 Property Search</h1>
          </div>
        </header>

      {/* Status div - shows spinner when loading, interpreted query when available */}
      <div className="query-breadcrumb">
        {loading ? (
          // Show spinner when loading
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner} />
          </div>
        ) : interpretedQuery && originalQuery ? (
          // Show interpreted query when available
          <div className={styles.queryBreadcrumbContainer}>
            <span className="query-breadcrumb-question">
              Interpreted "{originalQuery}" as:
            </span>
            <div className="query-breadcrumb-items">
              {formatInterpretedQueryPills(interpretedQuery).map((pill, index) => (
                <span key={index} className="query-breadcrumb-item">
                  <span className="query-breadcrumb-label">{pill.label}:</span>
                  <span className="query-breadcrumb-value">{pill.value}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          // Empty state - just blue background with height
          <div className={styles.queryBreadcrumbEmpty} />
        )}
      </div>

      <div ref={mainContentRef} className={`main-content ${styles.mainContentFlex}`}>
        {facets && (
          <FacetsSidebar
            facets={facets}
            selectedPropertyTypes={selectedPropertyTypes}
            selectedBedrooms={selectedBedrooms}
            selectedPriceRanges={selectedPriceRanges}
            selectedSqftRanges={selectedSqftRanges}
            onPropertyTypeChange={handlePropertyTypeChange}
            onBedroomChange={handleBedroomChange}
            onPriceRangeChange={handlePriceRangeChange}
            onSqftRangeChange={handleSqftRangeChange}
          />
        )}

        <main className={`results ${styles.resultsFlex}`}>
          {loading ? (
            <div className={styles.loadingMessage}>
              Loading properties...
            </div>
          ) : error ? (
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <p className={styles.errorSubtext}>
                Make sure the backend is running at http://localhost:8000
              </p>
            </div>
          ) : searchResults ? (
            <>
              <ResultsHeader
                total={searchResults.total}
                sort={sort}
                onSortChange={handleSortChange}
              />
              {searchResults.results.length > 0 && (
                <div className={`results-summary ${styles.resultsSummary}`}>
                  <div>
                    Found {searchResults.total} {searchResults.total === 1 ? 'property' : 'properties'} matching your criteria.
                  </div>
                </div>
              )}
              <div className="results-list">
                {searchResults.results.length === 0 ? (
                  <div className={styles.loadingMessage}>
                    No properties found. Try adjusting your search or filters.
                  </div>
                ) : (
                  searchResults.results.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className={styles.loadingMessage}>
              Use the filters on the left or chat on the right to find properties.
            </div>
          )}
        </main>

        {/* Chat Sidebar */}
        <aside ref={chatSidebarRef} className={`chat-sidebar ${styles.chatSidebar}`}>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <h2 className={styles.chatHeaderTitle}>
              Chat
            </h2>
          </div>

          {/* Chat History Container - wraps both history and input */}
          <div className={styles.chatHistoryContainer}>
            {/* Chat History */}
            <div ref={chatHistoryRef} className={styles.chatHistory}>
              {chatHistory.length === 0 && !chatLoading ? (
                <div className={styles.chatEmptyState}>
                  No messages yet. Start a conversation to search for properties.
                </div>
              ) : (
                <>
                  {chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={message.role === 'user' ? `${styles.chatMessageContainer} ${styles.chatMessageContainerUser}` : `${styles.chatMessageContainer} ${styles.chatMessageContainerAssistant}`}
                    >
                      <div className={message.role === 'user' ? `${styles.chatMessage} ${styles.chatMessageUser}` : `${styles.chatMessage} ${styles.chatMessageAssistant}`}>
                        {message.content}
                      </div>
                      <div className={styles.chatMessageTimestamp}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className={styles.chatLoadingContainer}>
                      <div className={styles.chatLoadingMessage}>
                        <div className={styles.spinnerSmall} />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chat Input - Inside sidebar, at bottom of chat history container */}
            <div className={styles.chatInputContainer}>
              <form onSubmit={handleChatSubmit}>
                <div className={styles.chatInputForm}>
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message..."
                    className={styles.chatTextarea}
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleChatSubmit(e)
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className={`${styles.chatSendButton} ${(chatInput.trim() && !chatLoading) ? styles.chatSendButtonEnabled : styles.chatSendButtonDisabled}`}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="container">Loading...</div>}>
      <SearchPage />
    </Suspense>
  )
}
