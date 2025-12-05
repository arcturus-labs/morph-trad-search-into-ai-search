'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchBox from '@/components/SearchBox'
import FacetsSidebar from '@/components/FacetsSidebar'
import ResultsHeader from '@/components/ResultsHeader'
import PropertyCard from '@/components/PropertyCard'
import DemoTools from '@/components/DemoTools'
import { searchProperties, SearchResponse, Facets } from '@/lib/api'
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
      console.log('🌐 Calling searchProperties API with params:', requestParams)
      const results = await searchProperties(requestParams)
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
    setQuery(exampleQuery)
    setShowExampleQueries(false)
    
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
      
      <div className="container">
        <header>
          <h1>🏠 Property Search</h1>
          <SearchBox value={query} onChange={setQuery} onSearch={handleSearch} />
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
