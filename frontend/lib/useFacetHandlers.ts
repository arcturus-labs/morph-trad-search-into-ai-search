/**
 * Shared hook for facet change handlers
 */

import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { parsePriceRange, parseSqftRange, getSelectedPriceRanges, getSelectedSqftRanges } from './searchUtils'

export function useFacetHandlers() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get current filter values from URL
  const selectedPropertyTypes = searchParams.get('property_type')?.split(',') || []
  const selectedBedrooms = searchParams.get('bedrooms')?.split(',') || []
  const minPrice = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined
  const maxPrice = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined
  const minSqft = searchParams.get('min_sqft') ? parseInt(searchParams.get('min_sqft')!) : undefined
  const maxSqft = searchParams.get('max_sqft') ? parseInt(searchParams.get('max_sqft')!) : undefined
  
  const updateURL = (updates: Record<string, string | null>) => {
    console.log('🔗 updateURL() called with updates:', updates)
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
        console.log(`  Removed param: ${key}`)
      } else {
        params.set(key, value)
        console.log(`  Set param: ${key} = ${value}`)
      }
    })
    
    const newURL = `?${params.toString()}`
    console.log('  New URL:', newURL)
    router.push(newURL)
  }
  
  const handlePropertyTypeChange = (value: string, checked: boolean) => {
    console.log('🏠 handlePropertyTypeChange:', value, checked);
    const newTypes = checked
      ? [...selectedPropertyTypes, value]
      : selectedPropertyTypes.filter(t => t !== value)
    console.log('  New property types:', newTypes);
    updateURL({ property_type: newTypes.length > 0 ? newTypes.join(',') : null })
  }

  const handleBedroomChange = (value: string, checked: boolean) => {
    console.log('🛏️ handleBedroomChange:', value, checked);
    const newBedrooms = checked
      ? [...selectedBedrooms, value]
      : selectedBedrooms.filter(b => b !== value)
    console.log('  New bedrooms:', newBedrooms);
    updateURL({ bedrooms: newBedrooms.length > 0 ? newBedrooms.join(',') : null })
  }

  const handlePriceRangeChange = (value: string, checked: boolean) => {
    console.log('💰 handlePriceRangeChange:', value, checked);
    
    const clickedRange = parsePriceRange(value)
    
    if (checked) {
      // Expanding: include this range in min/max
      const newMinPrice = minPrice === undefined 
        ? clickedRange.min 
        : Math.min(minPrice, clickedRange.min)
      const newMaxPrice = clickedRange.max === undefined
        ? (maxPrice === undefined ? undefined : maxPrice)
        : (maxPrice === undefined 
            ? clickedRange.max 
            : Math.max(maxPrice, clickedRange.max))
      
      const updates: Record<string, string | null> = {
        min_price: newMinPrice.toString(),
        max_price: newMaxPrice?.toString() || null
      }
      console.log('  Expanded price range:', { min: newMinPrice, max: newMaxPrice })
      updateURL(updates)
    } else {
      // Contracting: exclude this range, recalculate from remaining overlapping ranges
      const currentRanges = getSelectedPriceRanges(minPrice, maxPrice)
      const remainingRanges = currentRanges.filter(r => r !== value)
      
      if (remainingRanges.length === 0) {
        updateURL({ min_price: null, max_price: null })
      } else {
        // Recalculate min/max from remaining ranges
        const priceRanges = remainingRanges.map(parsePriceRange)
        const newMinPrice = Math.min(...priceRanges.map(r => r.min))
        const maxPrices = priceRanges.map(r => r.max).filter((m): m is number => m !== undefined)
        const newMaxPrice = maxPrices.length > 0 ? Math.max(...maxPrices) : undefined
        
        const updates: Record<string, string | null> = {
          min_price: newMinPrice.toString(),
          max_price: newMaxPrice?.toString() || null
        }
        console.log('  Contracted price range:', { min: newMinPrice, max: newMaxPrice })
        updateURL(updates)
      }
    }
  }

  const handleSqftRangeChange = (value: string, checked: boolean) => {
    console.log('📏 handleSqftRangeChange:', value, checked);
    
    const clickedRange = parseSqftRange(value)
    
    if (checked) {
      // Expanding: include this range in min/max
      const newMinSqft = minSqft === undefined 
        ? clickedRange.min 
        : Math.min(minSqft, clickedRange.min)
      const newMaxSqft = clickedRange.max === undefined
        ? (maxSqft === undefined ? undefined : maxSqft)
        : (maxSqft === undefined 
            ? clickedRange.max 
            : Math.max(maxSqft, clickedRange.max))
      
      const updates: Record<string, string | null> = {
        min_sqft: newMinSqft.toString(),
        max_sqft: newMaxSqft?.toString() || null
      }
      console.log('  Expanded sqft range:', { min: newMinSqft, max: newMaxSqft })
      updateURL(updates)
    } else {
      // Contracting: exclude this range, recalculate from remaining overlapping ranges
      const currentRanges = getSelectedSqftRanges(minSqft, maxSqft)
      const remainingRanges = currentRanges.filter(r => r !== value)
      
      if (remainingRanges.length === 0) {
        updateURL({ min_sqft: null, max_sqft: null })
      } else {
        // Recalculate min/max from remaining ranges
        const sqftRanges = remainingRanges.map(parseSqftRange)
        const newMinSqft = Math.min(...sqftRanges.map(r => r.min))
        const maxSqfts = sqftRanges.map(r => r.max).filter((m): m is number => m !== undefined)
        const newMaxSqft = maxSqfts.length > 0 ? Math.max(...maxSqfts) : undefined
        
        const updates: Record<string, string | null> = {
          min_sqft: newMinSqft.toString(),
          max_sqft: newMaxSqft?.toString() || null
        }
        console.log('  Contracted sqft range:', { min: newMinSqft, max: newMaxSqft })
        updateURL(updates)
      }
    }
  }

  const handleSortChange = (newSort: string) => {
    console.log('🔀 handleSortChange:', newSort);
    updateURL({ sort: newSort })
  }
  
  return {
    updateURL,
    handlePropertyTypeChange,
    handleBedroomChange,
    handlePriceRangeChange,
    handleSqftRangeChange,
    handleSortChange,
  }
}
