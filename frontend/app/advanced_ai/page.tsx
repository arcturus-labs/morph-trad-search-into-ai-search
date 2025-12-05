'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import FacetsSidebar from '@/components/FacetsSidebar'
import ResultsHeader from '@/components/ResultsHeader'
import PropertyCard from '@/components/PropertyCard'
import DemoTools from '@/components/DemoTools'
import Conversation from '@/components/Conversation'
import { searchPropertiesAdvancedAI, searchProperties, SearchResponse, Facets, SearchParams } from '@/lib/api'
import { EXAMPLE_QUERIES } from '@/lib/constants'
import { toTitleCase } from '@/lib/searchUtils'
import { useParsedSearchParams } from '@/lib/useSearchParams'
import { useFacetHandlers } from '@/lib/useFacetHandlers'

function SearchPage() {
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [facets, setFacets] = useState<Facets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExampleQueries, setShowExampleQueries] = useState(false)
  const [chatInputValue, setChatInputValue] = useState<string | undefined>(undefined)
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
      console.log('🌐 Calling searchPropertiesAdvancedAI API with params:', requestParams)
      const results = await searchPropertiesAdvancedAI(requestParams)
      console.log('✅ Search successful!')
      console.log('  Total results:', results.total)
      console.log('  Results returned:', results.results.length)
      console.log('  Page:', results.page, 'of', Math.ceil(results.total / results.per_page))
      console.log('  Facets:', Object.keys(results.facets))
      if (results.did_you_mean) {
        console.log('  Did you mean:', results.did_you_mean)
      }
      
      setSearchResults(results)
      setFacets(results.facets)
      setError(null)
      console.log('✅ State updated with search results')
    } catch (error) {
      console.error('❌ Search error:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      setError('Failed to load properties. Please check that the backend server is running.')
      setSearchResults(null)
    } finally {
      setLoading(false)
      console.log('🏁 Search complete, loading set to false')
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
    setShowExampleQueries(false)
    
    // For advanced_ai page, put the query in the chat box instead of submitting
    if (exampleQuery.trim()) {
      setChatInputValue(exampleQuery.trim())
    }
  }

  const handleChatInputValueSet = () => {
    // Clear the external input value after it's been set
    setChatInputValue(undefined)
  }

  useEffect(() => {
    console.log('🔄 useEffect triggered - searchParams changed')
    console.log('  Search params string:', searchParams.toString())
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  const handleSearchFromChat = async (payload: any) => {
    console.log('🔍 handleSearchFromChat() called')
    console.log('  Payload from chat:', payload)
    
    if (!payload || !payload.q) {
      console.warn('  ⚠️ No query in payload, skipping search')
      return
    }
    
    // Helper function to normalize array values
    const normalizeArray = (value: any): string[] | undefined => {
      if (!value) return undefined
      if (Array.isArray(value)) {
        return value.filter(v => v !== null && v !== undefined).map(v => String(v))
      }
      return [String(value)]
    }
    
    // Convert payload to SearchParams format for traditional API
    const searchParams: SearchParams = {
      q: payload.q,
      title: payload.title || undefined,
      description: payload.description || undefined,
      property_type: normalizeArray(payload.property_type),
      bedrooms: normalizeArray(payload.bedrooms),
      min_price: payload.min_price || undefined,
      max_price: payload.max_price || undefined,
      min_sqft: payload.min_sqft || undefined,
      max_sqft: payload.max_sqft || undefined,
      sort: payload.sort || undefined,
      page: 1,
      per_page: 10,
    }
    
    // Remove undefined values
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key as keyof SearchParams] === undefined) {
        delete searchParams[key as keyof SearchParams]
      }
    })
    
    setQuery(payload.q)
    setLoading(true)
    setError(null)
    
    try {
      console.log('📤 Calling traditional search API with params:', searchParams)
      const results = await searchProperties(searchParams)
      console.log('✅ Traditional search successful!')
      console.log('  Total results:', results.total)
      console.log('  Results returned:', results.results.length)
      
      setSearchResults(results)
      setFacets(results.facets)
      setError(null)
      
      // Update URL to reflect the search (for bookmarking/sharing)
      const qValue = payload.q.toLowerCase().trim()
      const titleValue = payload.title || toTitleCase(payload.q.trim())
      const descriptionValue = payload.description || payload.q.toLowerCase().trim()
      
      // Normalize arrays for URL params
      const propertyTypeArray = normalizeArray(payload.property_type)
      const bedroomsArray = normalizeArray(payload.bedrooms)
      
      updateURL({ 
        q: qValue,
        title: titleValue,
        description: descriptionValue,
        page: '1',
        property_type: propertyTypeArray && propertyTypeArray.length > 0 ? propertyTypeArray.join(',') : null,
        bedrooms: bedroomsArray && bedroomsArray.length > 0 ? bedroomsArray.join(',') : null,
        min_price: payload.min_price ? String(payload.min_price) : null,
        max_price: payload.max_price ? String(payload.max_price) : null,
        min_sqft: payload.min_sqft ? String(payload.min_sqft) : null,
        max_sqft: payload.max_sqft ? String(payload.max_sqft) : null,
        sort: payload.sort || null
      })
    } catch (error) {
      console.error('❌ Traditional search error:', error)
      setError('Failed to search properties. Please try again.')
      setSearchResults(null)
    } finally {
      setLoading(false)
    }
  }


  console.log('🎨 Rendering SearchPage:')
  console.log('  Loading:', loading)
  console.log('  Error:', error)
  console.log('  Has searchResults:', !!searchResults)
  console.log('  Has facets:', !!facets)
  console.log('  Results count:', searchResults?.results?.length || 0)

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
      
      <div className="container" style={{ maxWidth: 'calc(100% - 500px)', marginLeft: 0, marginRight: 0 }}>
        <header>
          <h1>🏠 Property Search</h1>
        </header>

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
      
      <Conversation 
        onSearchFromChat={handleSearchFromChat}
        externalInputValue={chatInputValue}
        onExternalInputValueSet={handleChatInputValueSet}
      />
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
