'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchBox from '@/components/SearchBox'
import QueryBreadcrumb from '@/components/QueryBreadcrumb'
import FacetsSidebar from '@/components/FacetsSidebar'
import ResultsHeader from '@/components/ResultsHeader'
import PropertyCard from '@/components/PropertyCard'
import DemoTools from '@/components/DemoTools'
import { searchPropertiesBeginnerAI, interpretQueryBeginnerAI, SearchResponse, Facets, InterpretedQuery } from '@/lib/api'
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
  const [loading, setLoading] = useState(true)
  const [interpreting, setInterpreting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isApplyingInterpretedQuery = useRef(false)
  const previousQParam = useRef<string>('')
  const [showExampleQueries, setShowExampleQueries] = useState(false)
  const exampleQueriesRef = useRef<HTMLDivElement>(null)

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
    console.log('📋 Current State:')
    console.log('  Query (q):', qParam)
    console.log('  Title:', titleParam)
    console.log('  Description:', descriptionParam)
    console.log('  Selected Property Types:', selectedPropertyTypes)
    console.log('  Selected Bedrooms:', selectedBedrooms)
    console.log('  Price Range:', { min: minPrice, max: maxPrice })
    console.log('  Sqft Range:', { min: minSqft, max: maxSqft })
    console.log('  Sort:', sort)
    console.log('  Page:', page)
    
    setLoading(true)
    setError(null)
    setInterpretedQuery(null)
    
    try {
      // Build search request params - use values from URL params
      const requestParams: any = {
        q: qParam || undefined,
        title: titleParam || undefined,
        description: descriptionParam || undefined,
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
      
      // Skip interpretation if we're applying an already-interpreted query
      // This flag is set when user clicks the search button in QueryBreadcrumb
      const shouldSkipInterpretation = isApplyingInterpretedQuery.current
      
      // Skip interpretation if the query (q) parameter hasn't changed
      // Only interpret when the actual search query changes, not when facets change
      const qParamChanged = qParam !== previousQParam.current
      const shouldInterpret = !shouldSkipInterpretation && qParam && qParamChanged
      
      if (shouldSkipInterpretation) {
        console.log('⏭️ Skipping interpretation - applying already-interpreted query')
      } else if (!qParamChanged && qParam) {
        console.log('⏭️ Skipping interpretation - query unchanged (only facets changed)')
      }
      
      // Update the previous qParam ref for next comparison
      previousQParam.current = qParam
      
      // Start both calls in parallel, but don't wait for interpret to finish
      const searchPromise = searchPropertiesBeginnerAI(requestParams)
      const interpretPromise = shouldInterpret ? (() => {
        setInterpreting(true)
        return interpretQueryBeginnerAI(qParam).catch((err) => {
          console.warn('⚠️ Interpretation failed (non-blocking):', err)
          return null
        }).finally(() => {
          setInterpreting(false)
        })
      })() : Promise.resolve(null)
      
      // Wait for search to complete first, then update UI immediately
      const searchResults = await searchPromise
      
      console.log('✅ Search successful!')
      console.log('  Total results:', searchResults.total)
      console.log('  Results returned:', searchResults.results.length)
      console.log('  Page:', searchResults.page, 'of', Math.ceil(searchResults.total / searchResults.per_page))
      console.log('  Facets:', Object.keys(searchResults.facets))
      if (searchResults.did_you_mean) {
        console.log('  Did you mean:', searchResults.did_you_mean)
      }
      
      // Update search results immediately (don't wait for interpret)
      setSearchResults(searchResults)
      setFacets(searchResults.facets)
      setError(null)
      setLoading(false) // Stop loading as soon as search completes
      console.log('✅ State updated with search results')
      
      // Reset the flag AFTER search completes to ensure it persisted through the URL update
      if (isApplyingInterpretedQuery.current) {
        isApplyingInterpretedQuery.current = false
      }
      
      // Handle interpretation separately when it completes (non-blocking)
      interpretPromise.then((interpretedResult) => {
        if (interpretedResult) {
          console.log('✅ Interpretation completed!')
          console.log('  Interpreted query:', interpretedResult)
          setInterpretedQuery(interpretedResult)
        }
      }).catch((err) => {
        console.warn('⚠️ Interpretation error (non-blocking):', err)
      })
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
    
    // Clear interpreted query when selecting an example query
    setInterpretedQuery(null)
    setInterpreting(false)
    
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
    console.log('🔄 useEffect triggered - searchParams changed')
    console.log('  Search params string:', searchParams.toString())
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  const handleSearch = () => {
    console.log('🔍 handleSearch() called')
    console.log('  Query:', query)
    
    // Clear interpreted query when search button is clicked
    setInterpretedQuery(null)
    setInterpreting(false)
    
    if (query.trim()) {
      const qValue = query.toLowerCase().trim()
      const titleValue = toTitleCase(query.trim())
      const descriptionValue = query.toLowerCase().trim()
      
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
    } else {
      // Clear search params if query is empty
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


  const handleApplyInterpretedQuery = (interpretedQuery: InterpretedQuery) => {
    console.log('🔍 Applying interpreted query:', interpretedQuery)
    
    // Set flag to skip interpretation on next search
    isApplyingInterpretedQuery.current = true
    
    const updates: Record<string, string | null> = {}
    
    // Set q parameter to the search terms from the interpreted query
    // Use title if available, otherwise use description
    const searchTerms = interpretedQuery.title || interpretedQuery.description || ''
    if (searchTerms) {
      updates.q = searchTerms.toLowerCase().trim()
    } else {
      updates.q = null
    }
    
    // Apply interpreted parameters (set values or clear if not present)
    updates.title = interpretedQuery.title || null
    updates.description = interpretedQuery.description || null
    updates.property_type = interpretedQuery.property_type && interpretedQuery.property_type.length > 0 
      ? interpretedQuery.property_type.join(',') 
      : null
    updates.bedrooms = interpretedQuery.bedrooms && interpretedQuery.bedrooms.length > 0 
      ? interpretedQuery.bedrooms.join(',') 
      : null
    updates.min_price = interpretedQuery.min_price !== undefined 
      ? interpretedQuery.min_price.toString() 
      : null
    updates.max_price = interpretedQuery.max_price !== undefined 
      ? interpretedQuery.max_price.toString() 
      : null
    updates.min_sqft = interpretedQuery.min_sqft !== undefined 
      ? interpretedQuery.min_sqft.toString() 
      : null
    updates.max_sqft = interpretedQuery.max_sqft !== undefined 
      ? interpretedQuery.max_sqft.toString() 
      : null
    updates.sort = interpretedQuery.sort && interpretedQuery.sort !== 'relevance' 
      ? interpretedQuery.sort 
      : null
    
    // Reset page to 1 when applying new search
    updates.page = '1'
    
    console.log('📤 Applying updates to URL:', updates)
    updateURL(updates)
  }

  // Check if the interpreted query matches the current URL parameters
  const interpretedQueryMatchesURL = (interpretedQuery: InterpretedQuery | null): boolean => {
    if (!interpretedQuery) return false
    
    // Compare property_type
    const urlPropertyTypes = selectedPropertyTypes.sort().join(',')
    const interpretedPropertyTypes = (interpretedQuery.property_type || []).sort().join(',')
    if (urlPropertyTypes !== interpretedPropertyTypes) return false
    
    // Compare bedrooms
    const urlBedrooms = selectedBedrooms.sort().join(',')
    const interpretedBedrooms = (interpretedQuery.bedrooms || []).sort().join(',')
    if (urlBedrooms !== interpretedBedrooms) return false
    
    // Compare price
    if ((interpretedQuery.min_price !== undefined ? interpretedQuery.min_price : null) !== minPrice) return false
    if ((interpretedQuery.max_price !== undefined ? interpretedQuery.max_price : null) !== maxPrice) return false
    
    // Compare square feet
    if ((interpretedQuery.min_sqft !== undefined ? interpretedQuery.min_sqft : null) !== minSqft) return false
    if ((interpretedQuery.max_sqft !== undefined ? interpretedQuery.max_sqft : null) !== maxSqft) return false
    
    // Compare title/description
    const interpretedTitle = interpretedQuery.title || ''
    const interpretedDescription = interpretedQuery.description || ''
    if (titleParam !== interpretedTitle || descriptionParam !== interpretedDescription) return false
    
    // Compare sort (default to 'relevance' if not specified)
    const interpretedSort = interpretedQuery.sort || 'relevance'
    if (sort !== interpretedSort) return false
    
    return true
  }

  // Only show breadcrumb if interpreted query doesn't match current URL params
  const shouldShowBreadcrumb = interpretedQuery && !interpretedQueryMatchesURL(interpretedQuery)

  console.log('🎨 Rendering SearchPage:')
  console.log('  Loading:', loading)
  console.log('  Error:', error)
  console.log('  Has searchResults:', !!searchResults)
  console.log('  Has facets:', !!facets)
  console.log('  Results count:', searchResults?.results?.length || 0)
  console.log('  Should show breadcrumb:', shouldShowBreadcrumb)

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

      <QueryBreadcrumb 
        interpretedQuery={interpretedQuery} 
        isLoading={interpreting}
        onApply={handleApplyInterpretedQuery}
      />

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
