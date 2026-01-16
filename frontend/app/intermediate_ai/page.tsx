'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchBox from '@/components/SearchBox'
import FacetsSidebar from '@/components/FacetsSidebar'
import ResultsHeader from '@/components/ResultsHeader'
import PropertyCard from '@/components/PropertyCard'
import DemoTools from '@/components/DemoTools'
import { searchProperties, searchPropertiesIntermediateAI, getSearchSummaryIntermediateAI, SearchResponse, Facets, InterpretedQuery, SearchSummary } from '@/lib/api'
import { EXAMPLE_QUERIES } from '@/lib/constants'
import { toTitleCase } from '@/lib/searchUtils'
import { useParsedSearchParams } from '@/lib/useSearchParams'
import { useFacetHandlers } from '@/lib/useFacetHandlers'

function SearchPage() {
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [facets, setFacets] = useState<Facets | null>(null)
  const [interpretedQuery, setInterpretedQuery] = useState<InterpretedQuery | null>(null)
  const [originalQuery, setOriginalQuery] = useState<string | null>(null)
  const [summary, setSummary] = useState<SearchSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExampleQueries, setShowExampleQueries] = useState(false)
  const isUpdatingURLFromInterpretation = useRef(false)
  const isHandlingSearchClick = useRef(false)
  const exampleQueriesRef = useRef<HTMLDivElement>(null)
  const previousQueryParams = useRef<{ q: string | null; title: string | null; description: string | null } | null>(null)
  const pendingQueryRef = useRef<string | null>(null)

  console.log('='.repeat(60))
  console.log('🔍 SearchPage Component Rendered')
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
    
    // Only clear interpreted query and summary if it's a new query
    if (isQueryChange) {
      setInterpretedQuery(null)
      setSummary(null)
      
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
      
      // Use traditional search if only facets changed, otherwise use AI search
      const searchResults = isQueryChange
        ? await searchPropertiesIntermediateAI(requestParams)
        : await searchProperties(requestParams)
      
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
      
      // Only update interpreted query and fetch summary for new queries
      if (isQueryChange) {
        // Update interpreted query from response (only for AI search)
        if (searchResults.interpreted_query) {
          setInterpretedQuery(searchResults.interpreted_query)
          
          // Update URL with interpreted parameters IMMEDIATELY (before summary fetch)
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
        
        // Fetch search summary after URL is updated, but only if there's a query or filters
        // Use interpreted query values if available, otherwise use effective query values
        const interpreted = searchResults.interpreted_query
        const hasTextQuery = interpreted 
          ? (interpreted.title || interpreted.description || '')
          : (effectiveQuery || effectiveTitle || effectiveDescription)
        // Check filters from interpreted query first (most accurate), then fall back to URL params
        const hasFilters = interpreted ? (
          (interpreted.property_type && interpreted.property_type.length > 0) ||
          (interpreted.bedrooms && interpreted.bedrooms.length > 0) ||
          interpreted.min_price !== undefined ||
          interpreted.max_price !== undefined ||
          interpreted.min_sqft !== undefined ||
          interpreted.max_sqft !== undefined
        ) : (
          selectedPropertyTypes.length > 0 || 
          selectedBedrooms.length > 0 || 
          minPrice !== undefined || 
          maxPrice !== undefined || 
          minSqft !== undefined || 
          maxSqft !== undefined
        )
        const hasQuery = !!hasTextQuery || hasFilters
        if (searchResults.results.length > 0 && hasQuery) {
          setSummaryLoading(true)
          try {
            // Use interpreted query values if available, otherwise use effective query values
            const summaryQuery = interpreted?.title || interpreted?.description || effectiveQuery || undefined
            const summaryTitle = interpreted?.title || effectiveTitle || undefined
            const summaryDescription = interpreted?.description || effectiveDescription || undefined
            const summaryParams = {
              q: summaryQuery,
              title: summaryTitle,
              description: summaryDescription,
              property_type: (interpreted?.property_type && interpreted.property_type.length > 0) 
                ? interpreted.property_type 
                : (selectedPropertyTypes.length > 0 ? selectedPropertyTypes : undefined),
              bedrooms: (interpreted?.bedrooms && interpreted.bedrooms.length > 0)
                ? interpreted.bedrooms
                : (selectedBedrooms.length > 0 ? selectedBedrooms : undefined),
              min_price: interpreted?.min_price !== undefined ? interpreted.min_price : minPrice,
              max_price: interpreted?.max_price !== undefined ? interpreted.max_price : maxPrice,
              min_sqft: interpreted?.min_sqft !== undefined ? interpreted.min_sqft : minSqft,
              max_sqft: interpreted?.max_sqft !== undefined ? interpreted.max_sqft : maxSqft,
              total: searchResults.total,
              results: searchResults.results,
            }
            console.log('📡 Fetching search summary with params:', summaryParams)
            console.log('  Results count:', searchResults.results.length)
            const summaryData = await getSearchSummaryIntermediateAI(summaryParams)
            console.log('✅ Summary received:', summaryData)
            setSummary(summaryData)
          } catch (error) {
            console.error('❌ Error fetching summary:', error)
            // Don't set error state - summary is optional
            setSummary(null)
          } finally {
            setSummaryLoading(false)
          }
        } else {
          setSummary(null)
        }
      }
      
      // Reset search click flag after search completes
      isHandlingSearchClick.current = false
    } catch (error) {
      console.error('❌ Search error:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      setError('Failed to load properties. Please check that the backend server is running.')
      setSearchResults(null)
      setSummary(null)
      setLoading(false)
      // Reset search click flag after error
      isHandlingSearchClick.current = false
      console.log('🏁 Search complete (with error), loading set to false')
      console.log('='.repeat(60))
    }
  }

  // Sync query state with q URL param
  useEffect(() => {
    const qFromURL = searchParams.get('q') || ''
    if (qFromURL !== query) {
      setQuery(qFromURL)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

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
    setQuery(exampleQuery)
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
    
    // Skip if we're handling a search button click (it will call performSearch directly)
    if (isHandlingSearchClick.current) {
      console.log('⏭️ Skipping performSearch - handling search button click')
      isHandlingSearchClick.current = false
      return
    }
    
    console.log('🔄 useEffect triggered - searchParams changed')
    console.log('  Search params string:', searchParams.toString())
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  const handleSearch = () => {
    console.log('🔍 handleSearch() called')
    console.log('  Query:', query)
    
    // Clear interpreted query and original query when search button is clicked
    setInterpretedQuery(null)
    setOriginalQuery(null)
    
    if (query.trim()) {
      // Set pending query in ref (immediately available) and trigger search directly
      pendingQueryRef.current = query.trim()
      isHandlingSearchClick.current = true
      
      // Clear facet filters by updating URL, but keep query params as-is for now
      // The query will be updated when interpreted query comes back
      updateURL({ 
        page: '1',
        property_type: null,
        bedrooms: null,
        min_price: null,
        max_price: null,
        min_sqft: null,
        max_sqft: null,
        sort: null
      })
      
      // Trigger search directly (useEffect will be skipped due to isHandlingSearchClick flag)
      performSearch()
    } else {
      // Clear search params if query is empty
      pendingQueryRef.current = null
      updateURL({ 
        q: null,
        title: null,
        description: null,
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

  console.log('🎨 Rendering SearchPage:')
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
          <SearchBox value={query} onChange={setQuery} onSearch={handleSearch} />
        </header>

      {/* Status div - shows spinner when loading, interpreted query when available */}
      <div className="query-breadcrumb" style={{ 
        backgroundColor: '#e8f4f8', 
        padding: '15px 30px',
        borderBottom: '1px solid #3498db',
        minHeight: '54px'
      }}>
        {loading ? (
          // Show spinner when loading
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            width: '100%'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '3px solid #3498db',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : interpretedQuery && originalQuery ? (
          // Show interpreted query when available
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
          <div style={{ minHeight: '6px' }} />
        )}
      </div>

      <div className="main-content">
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

        <main className="results">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
              Loading properties...
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#e74c3c' }}>
              <p>{error}</p>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#7f8c8d' }}>
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
                <div className="results-summary" style={{
                  backgroundColor: '#f8f9fa',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  color: '#2c3e50',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  {(() => {
                    // Check if there's a query (text or filters) - match the logic used for fetching summary
                    const hasTextQuery = qParam || titleParam || descriptionParam
                    const hasFilters = selectedPropertyTypes.length > 0 || 
                      selectedBedrooms.length > 0 || 
                      minPrice !== undefined || 
                      maxPrice !== undefined || 
                      minSqft !== undefined || 
                      maxSqft !== undefined
                    const hasQuery = hasTextQuery || hasFilters
                    if (!hasQuery && !summary) {
                      // Show default text when there's no query and no summary
                      return (
                        <div>
                          Here are some homes you might like. Use the search box above or filters on the left to find exactly what you're looking for.
                        </div>
                      )
                    }
                    if (summaryLoading) {
                      return (
                        <>
                          <style>{`
                            @keyframes spin {
                              to { transform: rotate(360deg); }
                            }
                          `}</style>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid #3498db',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite'
                            }} />
                            <span>Generating search summary...</span>
                          </div>
                        </>
                      )
                    }
                    if (summary) {
                      return (
                        <>
                          <div style={{ marginBottom: summary.search_ideas && summary.search_ideas.length > 0 ? '12px' : '0' }}>
                            {summary.summary}
                          </div>
                          {summary.search_ideas && summary.search_ideas.length > 0 && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dee2e6' }}>
                              <div style={{ marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#495057' }}>
                                Related searches:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {summary.search_ideas.map((idea, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      const qValue = idea.toLowerCase().trim()
                                      const titleValue = toTitleCase(idea.trim())
                                      const descriptionValue = idea.toLowerCase().trim()
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
                                    }}
                                    style={{
                                      backgroundColor: '#e9ecef',
                                      border: '1px solid #ced4da',
                                      borderRadius: '16px',
                                      padding: '6px 12px',
                                      fontSize: '13px',
                                      color: '#495057',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      fontWeight: '500'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#dee2e6'
                                      e.currentTarget.style.borderColor = '#adb5bd'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#e9ecef'
                                      e.currentTarget.style.borderColor = '#ced4da'
                                    }}
                                  >
                                    {idea}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    }
                    return (
                      <div>
                        Based on your query, we found {searchResults.total} properties matching your criteria.
                      </div>
                    )
                  })()}
                </div>
              )}
              <div className="results-list">
                {searchResults.results.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
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
            <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
              Enter a search query or use the filters to find properties.
            </div>
          )}
        </main>
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
