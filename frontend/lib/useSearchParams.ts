/**
 * Shared hook for parsing URL search parameters
 */

import { useSearchParams } from 'next/navigation'
import { getSelectedPriceRanges, getSelectedSqftRanges } from './searchUtils'

export interface ParsedSearchParams {
  // Query parameters
  qParam: string
  titleParam: string
  descriptionParam: string
  
  // Filter parameters
  selectedPropertyTypes: string[]
  selectedBedrooms: string[]
  minPrice: number | undefined
  maxPrice: number | undefined
  minSqft: number | undefined
  maxSqft: number | undefined
  
  // Derived ranges
  selectedPriceRanges: string[]
  selectedSqftRanges: string[]
  
  // Sort and pagination
  sort: string
  page: number
}

export function useParsedSearchParams(): ParsedSearchParams {
  const searchParams = useSearchParams()
  
  // Filter state from URL params
  const selectedPropertyTypes = searchParams.get('property_type')?.split(',') || []
  const selectedBedrooms = searchParams.get('bedrooms')?.split(',') || []
  const minPrice = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined
  const maxPrice = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined
  const minSqft = searchParams.get('min_sqft') ? parseInt(searchParams.get('min_sqft')!) : undefined
  const maxSqft = searchParams.get('max_sqft') ? parseInt(searchParams.get('max_sqft')!) : undefined
  const sort = searchParams.get('sort') || 'relevance'
  const page = parseInt(searchParams.get('page') || '1')
  
  // Get search parameters from URL
  const qParam = searchParams.get('q') || ''
  const titleParam = searchParams.get('title') || ''
  const descriptionParam = searchParams.get('description') || ''
  
  // Derive selected ranges from URL min/max values
  const selectedPriceRanges = getSelectedPriceRanges(minPrice, maxPrice)
  const selectedSqftRanges = getSelectedSqftRanges(minSqft, maxSqft)
  
  return {
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
  }
}
