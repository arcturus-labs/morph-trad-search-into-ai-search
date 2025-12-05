# Implementation Plan: Real Estate Search Application

This document outlines how to implement the real estate search prototype (see `prototype_impl.html`) as a working application with mocked data.

## Overview

The application will consist of:
- **Frontend**: Next.js React application with minimal, semantic HTML structure
- **Backend**: FastAPI application with REST endpoints returning mocked property data

## Data Model

Based on the prototype and brainstorming session, we'll use a simplified field set:

### Property Fields

```typescript
interface Property {
  id: string;                    // Unique identifier
  title: string;                 // Property title (searchable)
  description: string;            // Full description (searchable, for snippets)
  price: number;                 // Price in dollars
  bedrooms: number;              // Number of bedrooms (0 = studio)
  square_feet: number;           // Square footage
  property_type: 'house' | 'condo' | 'apartment' | 'townhouse';
  has_parking: boolean;          // Parking available
  listing_date: string;          // ISO date string (YYYY-MM-DD)
  images: string[];             // Array of image URLs (or placeholder URLs)
  neighborhood: string;          // Neighborhood name (for breadcrumbs)
  city: string;                 // City name (for breadcrumbs)
}
```

## Backend API Endpoints

### 1. `GET /api/search`

Search for properties with query string and filters.

**Query Parameters:**
- `q` (string, optional): Search query text
- `property_type` (string[], optional): Filter by property types (comma-separated)
- `bedrooms` (string[], optional): Filter by bedroom counts (comma-separated, e.g., "3,4")
- `min_price` (number, optional): Minimum price
- `max_price` (number, optional): Maximum price
- `min_sqft` (number, optional): Minimum square feet
- `max_sqft` (number, optional): Maximum square feet
- `has_parking` (boolean, optional): Filter by parking availability
- `sort` (string, optional): Sort order - "relevance" | "price_asc" | "price_desc" | "newest"
- `page` (number, optional): Page number (default: 1)
- `per_page` (number, optional): Results per page (default: 10)

**Response:**
```json
{
  "results": [
    {
      "id": "prop-001",
      "title": "Charming Victorian Family Home with Bay Views",
      "description": "Perfect family home in quiet neighborhood. Recently updated kitchen, large backyard ideal for children. Walking distance to top-rated schools and parks. This beautiful Victorian features original hardwood floors...",
      "price": 750000,
      "bedrooms": 3,
      "square_feet": 1850,
      "property_type": "house",
      "has_parking": true,
      "listing_date": "2024-11-13",
      "images": ["/placeholder-image-1.jpg"],
      "neighborhood": "Mission District",
      "city": "San Francisco"
    }
  ],
  "total": 29,
  "page": 1,
  "per_page": 10,
  "facets": {
    "property_type": {
      "house": 23,
      "condo": 15,
      "apartment": 8,
      "townhouse": 6
    },
    "bedrooms": {
      "0": 3,
      "1": 12,
      "2": 18,
      "3": 14,
      "4": 5
    },
    "price_ranges": {
      "0-500000": 8,
      "500000-750000": 15,
      "750000-1000000": 17,
      "1000000-1500000": 6,
      "1500000-999999999": 6
    },
    "square_feet_ranges": {
      "0-800": 5,
      "800-1200": 12,
      "1200-1800": 18,
      "1800-2500": 10,
      "2500-999999": 7
    },
    "has_parking": {
      "true": 32,
      "false": 10
    }
  },
  "did_you_mean": null,
  "breadcrumb": {
    "city": "San Francisco",
    "neighborhood": "All Neighborhoods",
    "property_type": "All Property Types"
  }
}
```

**Mock Implementation Notes:**
- Return a fixed set of ~50 mocked properties
- Filter results based on query parameters
- For text search (`q`), do simple string matching in `title` and `description`
- Highlight matching terms by wrapping them in `<mark>` tags (or return highlight positions)
- Sort results based on `sort` parameter
- Calculate facet counts based on filtered result set
- Generate "did you mean" suggestions for common query variations (e.g., "800k" → "$800,000")
- Return breadcrumb based on active filters

### 2. `GET /api/properties/{property_id}`

Get a single property by ID.

**Response:**
```json
{
  "id": "prop-001",
  "title": "Charming Victorian Family Home with Bay Views",
  "description": "Full property description...",
  "price": 750000,
  "bedrooms": 3,
  "square_feet": 1850,
  "property_type": "house",
  "has_parking": true,
  "listing_date": "2024-11-13",
  "images": ["/placeholder-image-1.jpg", "/placeholder-image-2.jpg"],
  "neighborhood": "Mission District",
  "city": "San Francisco"
}
```

### 3. `GET /api/facets`

Get available facets (useful for initial page load or when no search is performed).

**Response:**
```json
{
  "property_type": {
    "house": 23,
    "condo": 15,
    "apartment": 8,
    "townhouse": 6
  },
  "bedrooms": {
    "0": 3,
    "1": 12,
    "2": 18,
    "3": 14,
    "4": 5
  },
  "price_ranges": {
    "0-500000": 8,
    "500000-750000": 15,
    "750000-1000000": 17,
    "1000000-1500000": 6,
    "1500000-999999999": 6
  },
  "square_feet_ranges": {
    "0-800": 5,
    "800-1200": 12,
    "1200-1800": 18,
    "1800-2500": 10,
    "2500-999999": 7
  },
  "has_parking": {
    "true": 32,
    "false": 10
  }
}
```

## Frontend Structure

### Component Hierarchy

```
Page (app/page.tsx)
├── Header
│   ├── SearchBox
│   └── SearchButton
├── Breadcrumb
├── DidYouMean (conditional)
└── MainContent
    ├── FacetsSidebar
    │   ├── FacetGroup (Property Type)
    │   ├── FacetGroup (Bedrooms)
    │   ├── FacetGroup (Price Range)
    │   ├── FacetGroup (Square Feet)
    │   └── FacetGroup (Parking)
    └── ResultsArea
        ├── ResultsHeader
        │   ├── ResultsCount
        │   └── SortDropdown
        └── ResultsList
            └── PropertyCard (repeated)
                ├── PropertyImage
                ├── PropertyContent
                │   ├── PropertyTitle
                │   ├── PropertyPrice
                │   ├── PropertySpecs
                │   ├── PropertyDescription
                │   └── PropertyFooter
```

### Minimal HTML Structure

The frontend should use semantic HTML with minimal, clean divs:

```tsx
// Main page structure
<div className="container">
  <header>
    <h1>🏠 Property Search</h1>
    <div className="search-box">
      <input type="text" />
      <button>Search</button>
    </div>
  </header>
  
  <div className="breadcrumb">
    {/* Breadcrumb links */}
  </div>
  
  <div className="did-you-mean">
    {/* Did you mean suggestion */}
  </div>
  
  <div className="main-content">
    <aside className="facets">
      <div className="facet-group">
        <h3>Property Type</h3>
        <div className="facet-option">
          <input type="checkbox" />
          <label>House</label>
          <span className="facet-count">(23)</span>
        </div>
        {/* More facet options */}
      </div>
      {/* More facet groups */}
    </aside>
    
    <main className="results">
      <div className="results-header">
        <div className="results-count">Showing 29 properties</div>
        <div className="sort-by">
          <label>Sort by:</label>
          <select>
            <option>Relevance</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>
      </div>
      
      <div className="results-list">
        <div className="result-card">
          <div className="result-image">
            <div className="new-badge">NEW</div>
            {/* Image placeholder */}
          </div>
          <div className="result-content">
            <div className="result-header">
              <div className="result-title">
                {/* Title with highlighted terms */}
              </div>
              <div className="result-price">$750,000</div>
            </div>
            <div className="result-specs">
              <span>🛏️ 3 BD</span>
              <span>📏 1,850 sq ft</span>
              <span>🏠 House</span>
            </div>
            <div className="result-description">
              {/* Description snippet with highlighted terms */}
            </div>
            <div className="result-footer">
              <span className="badge">🅿️ Parking</span>
              <span>Listed 2 days ago</span>
            </div>
          </div>
        </div>
        {/* More result cards */}
      </div>
    </main>
  </div>
</div>
```

### Key Frontend Features

1. **Search Input**: 
   - Controlled input component
   - Submit on button click or Enter key
   - Update URL query parameters

2. **Facets**:
   - Checkboxes for multi-select filters
   - Show counts from API response
   - Update URL parameters when changed
   - Reflect active filters visually

3. **Results**:
   - Display property cards with all metadata
   - Highlight search terms in title and description (using `<mark>` tags or CSS)
   - Show "NEW" badge if listing_date is within last 3 days
   - Format prices, dates, and numbers appropriately

4. **Breadcrumb**:
   - Show current filter context
   - Make clickable to remove filters

5. **Did You Mean**:
   - Show when API returns a suggestion
   - Make clickable to update search query

6. **Sorting**:
   - Dropdown to change sort order
   - Update results immediately

7. **URL State Management**:
   - All filters and search query should be reflected in URL
   - Page should be bookmarkable and shareable
   - Browser back/forward should work

## Mock Data Generation

Create a Python function that generates ~50 diverse property listings with:
- Varied property types, bedrooms, prices, square footage
- Realistic descriptions with varied keywords
- Mix of recent and older listings
- Some with parking, some without
- Different neighborhoods and cities
- Placeholder image URLs

Example mock data structure:

```python
MOCK_PROPERTIES = [
    {
        "id": "prop-001",
        "title": "Charming Victorian Family Home with Bay Views",
        "description": "Perfect family home in quiet neighborhood. Recently updated kitchen, large backyard ideal for children. Walking distance to top-rated schools and parks. This beautiful Victorian features original hardwood floors, high ceilings, and period details throughout.",
        "price": 750000,
        "bedrooms": 3,
        "square_feet": 1850,
        "property_type": "house",
        "has_parking": True,
        "listing_date": "2024-11-13",
        "images": ["https://via.placeholder.com/400x300?text=Property+1"],
        "neighborhood": "Mission District",
        "city": "San Francisco"
    },
    # ... more properties
]
```

## Implementation Steps

### Backend (FastAPI)

1. Create mock data generator function
2. Implement `/api/search` endpoint:
   - Parse query parameters
   - Filter mock properties based on parameters
   - Simple text matching for search query
   - Calculate facets from filtered results
   - Sort results
   - Paginate results
   - Generate "did you mean" suggestions
   - Return formatted response
3. Implement `/api/properties/{id}` endpoint
4. Implement `/api/facets` endpoint
5. Add CORS middleware (already present)
6. Test endpoints with curl or Postman

### Frontend (Next.js)

1. Create API client utility to call backend endpoints
2. Create components:
   - `SearchBox` - search input and button
   - `Breadcrumb` - navigation breadcrumb
   - `DidYouMean` - query suggestion
   - `FacetsSidebar` - left sidebar with all facets
   - `FacetGroup` - individual facet group
   - `ResultsHeader` - count and sort dropdown
   - `PropertyCard` - individual result card
   - `PropertyImage` - image with NEW badge
3. Create main page component that:
   - Reads URL query parameters on mount
   - Fetches search results from API
   - Manages state for filters and results
   - Updates URL when filters change
   - Handles loading and error states
4. Add CSS styling (can use the styles from prototype_impl.html as reference)
5. Implement text highlighting for search terms
6. Format dates, prices, and numbers appropriately

## Styling Approach

- Use CSS modules or Tailwind CSS for styling
- Match the visual design from `prototype_impl.html`
- Keep styles minimal and semantic
- Ensure responsive design (mobile-friendly)
- Use CSS variables for colors and spacing

## Testing Considerations

- Test with various search queries
- Test filter combinations
- Test sorting options
- Test pagination
- Test edge cases (no results, empty query, etc.)
- Test URL state persistence

## Future Enhancements (Not in Initial Implementation)

- Real search engine integration (Elasticsearch, Algolia, etc.)
- Real database
- Image upload/storage
- User authentication
- Saved searches
- Property detail pages
- Map view
- Advanced filters

