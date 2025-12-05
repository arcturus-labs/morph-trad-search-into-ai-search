/**
 * Shared utility functions for search pages
 */

// Helper function to convert string to title case
export const toTitleCase = (str: string): string => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

// Helper to parse a price range string into min/max
export const parsePriceRange = (range: string) => {
  const [min, max] = range.split('-')
  return {
    min: parseInt(min),
    max: max === '999999999' ? undefined : parseInt(max)
  }
}

// Helper to parse a sqft range string into min/max
export const parseSqftRange = (range: string) => {
  const [min, max] = range.split('-')
  return {
    min: parseInt(min),
    max: max === '999999' ? undefined : parseInt(max)
  }
}

// Convert min/max back to selected price ranges by checking which ranges overlap
export const getSelectedPriceRanges = (min: number | undefined, max: number | undefined): string[] => {
  if (min === undefined && max === undefined) return []
  
  // Available price ranges from backend
  const availableRanges = ['0-500000', '500000-750000', '750000-1000000', '1000000-1500000', '1500000-999999999']
  
  return availableRanges.filter(range => {
    const [rangeMin, rangeMaxStr] = range.split('-')
    const rangeMinNum = parseInt(rangeMin)
    const rangeMaxNum = rangeMaxStr === '999999999' ? Infinity : parseInt(rangeMaxStr)
    
    // Check if this range overlaps with the selected min/max
    const effectiveMin = min ?? 0
    const effectiveMax = max ?? Infinity
    
    return rangeMinNum < effectiveMax && rangeMaxNum > effectiveMin
  })
}

// Convert min/max back to selected sqft ranges by checking which ranges overlap
export const getSelectedSqftRanges = (min: number | undefined, max: number | undefined): string[] => {
  if (min === undefined && max === undefined) return []
  
  // Available sqft ranges from backend
  const availableRanges = ['0-800', '800-1200', '1200-1800', '1800-2500', '2500-999999']
  
  return availableRanges.filter(range => {
    const [rangeMin, rangeMaxStr] = range.split('-')
    const rangeMinNum = parseInt(rangeMin)
    const rangeMaxNum = rangeMaxStr === '999999' ? Infinity : parseInt(rangeMaxStr)
    
    // Check if this range overlaps with the selected min/max
    const effectiveMin = min ?? 0
    const effectiveMax = max ?? Infinity
    
    return rangeMinNum < effectiveMax && rangeMaxNum > effectiveMin
  })
}
