/**
 * API client for property search endpoints
 */

// Use relative URLs to leverage Next.js rewrite proxy, or absolute URL for direct backend access
// The Next.js rewrite maps /api/* to http://localhost:8000/api/*, so we use /api directly
const API_BASE_URL = typeof window !== 'undefined' 
  ? '/api'  // Use Next.js rewrite proxy in browser (maps to http://localhost:8000/api)
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  square_feet: number;
  property_type: 'house' | 'condo' | 'apartment' | 'townhouse';
  listing_date: string;
  images: string[];
  neighborhood: string;
  city: string;
}

export interface SearchParams {
  q?: string;
  title?: string;
  description?: string;
  property_type?: string[];
  bedrooms?: string[];
  min_price?: number;
  max_price?: number;
  min_sqft?: number;
  max_sqft?: number;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface Facets {
  property_type: Record<string, number>;
  bedrooms: Record<string, number>;
  price_ranges: Record<string, number>;
  square_feet_ranges: Record<string, number>;
}

export interface SearchResponse {
  results: Property[];
  total: number;
  page: number;
  per_page: number;
  facets: Facets;
  did_you_mean?: string | null;
  interpreted_query?: InterpretedQuery;
}

export async function searchProperties(params: SearchParams): Promise<SearchResponse> {
  console.log('📡 API: searchProperties() called')
  console.log('  API_BASE_URL:', API_BASE_URL)
  console.log('  Params:', params)
  
  const queryParams = new URLSearchParams();
  
  if (params.q) queryParams.append('q', params.q);
  if (params.title) queryParams.append('title', params.title);
  if (params.description) queryParams.append('description', params.description);
  if (params.property_type?.length) queryParams.append('property_type', params.property_type.join(','));
  if (params.bedrooms?.length) queryParams.append('bedrooms', params.bedrooms.join(','));
  if (params.min_price !== undefined) queryParams.append('min_price', params.min_price.toString());
  if (params.max_price !== undefined) queryParams.append('max_price', params.max_price.toString());
  if (params.min_sqft !== undefined) queryParams.append('min_sqft', params.min_sqft.toString());
  if (params.max_sqft !== undefined) queryParams.append('max_sqft', params.max_sqft.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.per_page) queryParams.append('per_page', params.per_page.toString());
  
  const url = `${API_BASE_URL}/search?${queryParams.toString()}`;
  console.log('  Fetching URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('  Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('  ❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to search properties: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('  ✅ Response received:', {
      total: data.total,
      resultsCount: data.results?.length || 0,
      page: data.page,
      hasFacets: !!data.facets
    });
    return data;
  } catch (error) {
    console.error('  ❌ Fetch error:', error);
    throw error;
  }
}

export async function getProperty(id: string): Promise<Property> {
  console.log('📡 API: getProperty() called for ID:', id);
  const url = `${API_BASE_URL}/properties/${id}`;
  console.log('  Fetching URL:', url);
  const response = await fetch(url);
  console.log('  Response status:', response.status);
  if (!response.ok) {
    console.error('  ❌ Failed to get property');
    throw new Error('Failed to get property');
  }
  const data = await response.json();
  console.log('  ✅ Property received:', data.title);
  return data;
}

export async function getFacets(): Promise<Facets> {
  console.log('📡 API: getFacets() called');
  const url = `${API_BASE_URL}/facets`;
  console.log('  Fetching URL:', url);
  const response = await fetch(url);
  console.log('  Response status:', response.status);
  if (!response.ok) {
    console.error('  ❌ Failed to get facets');
    throw new Error('Failed to get facets');
  }
  const data = await response.json();
  console.log('  ✅ Facets received:', Object.keys(data));
  return data;
}

export interface InterpretedQuery {
  title?: string;
  description?: string;
  property_type?: string[];
  bedrooms?: string[];
  min_price?: number;
  max_price?: number;
  min_sqft?: number;
  max_sqft?: number;
  sort?: string;
}

export async function interpretQueryBeginnerAI(q: string): Promise<InterpretedQuery | null> {
  console.log('📡 API: interpretQueryBeginnerAI() called')
  console.log('  API_BASE_URL:', API_BASE_URL)
  console.log('  Query:', q)
  
  const queryParams = new URLSearchParams();
  if (q) queryParams.append('q', q);
  
  const url = `${API_BASE_URL}/beginner_ai/interpret?${queryParams.toString()}`;
  console.log('  Fetching URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('  Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('  ❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to interpret query: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('  ✅ Interpretation received:', data);
    return data;
  } catch (error) {
    console.error('  ❌ Fetch error:', error);
    throw error;
  }
}

export async function searchPropertiesBeginnerAI(params: SearchParams): Promise<SearchResponse> {
  console.log('📡 API: searchPropertiesBeginnerAI() called')
  console.log('  API_BASE_URL:', API_BASE_URL)
  console.log('  Params:', params)
  
  const queryParams = new URLSearchParams();
  
  if (params.q) queryParams.append('q', params.q);
  if (params.title) queryParams.append('title', params.title);
  if (params.description) queryParams.append('description', params.description);
  if (params.property_type?.length) queryParams.append('property_type', params.property_type.join(','));
  if (params.bedrooms?.length) queryParams.append('bedrooms', params.bedrooms.join(','));
  if (params.min_price !== undefined) queryParams.append('min_price', params.min_price.toString());
  if (params.max_price !== undefined) queryParams.append('max_price', params.max_price.toString());
  if (params.min_sqft !== undefined) queryParams.append('min_sqft', params.min_sqft.toString());
  if (params.max_sqft !== undefined) queryParams.append('max_sqft', params.max_sqft.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.per_page) queryParams.append('per_page', params.per_page.toString());
  
  const url = `${API_BASE_URL}/beginner_ai/search?${queryParams.toString()}`;
  console.log('  Fetching URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('  Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('  ❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to search properties: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('  ✅ Response received:', {
      total: data.total,
      resultsCount: data.results?.length || 0,
      page: data.page,
      hasFacets: !!data.facets
    });
    return data;
  } catch (error) {
    console.error('  ❌ Fetch error:', error);
    throw error;
  }
}

export interface SearchSummary {
  summary: string;
  search_ideas: string[];
}

export async function interpretQueryIntermediateAI(q: string): Promise<InterpretedQuery | null> {
  console.log('📡 API: interpretQueryIntermediateAI() called')
  console.log('  API_BASE_URL:', API_BASE_URL)
  console.log('  Query:', q)
  
  const queryParams = new URLSearchParams();
  if (q) queryParams.append('q', q);
  
  const url = `${API_BASE_URL}/intermediate_ai/interpret?${queryParams.toString()}`;
  console.log('  Fetching URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('  Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('  ❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to interpret query: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('  ✅ Interpretation received:', data);
    return data;
  } catch (error) {
    console.error('  ❌ Fetch error:', error);
    throw error;
  }
}

export async function searchPropertiesIntermediateAI(params: SearchParams): Promise<SearchResponse> {
  console.log('📡 API: searchPropertiesIntermediateAI() called')
  console.log('  API_BASE_URL:', API_BASE_URL)
  console.log('  Params:', params)
  
  const queryParams = new URLSearchParams();
  
  if (params.q) queryParams.append('q', params.q);
  if (params.title) queryParams.append('title', params.title);
  if (params.description) queryParams.append('description', params.description);
  if (params.property_type?.length) queryParams.append('property_type', params.property_type.join(','));
  if (params.bedrooms?.length) queryParams.append('bedrooms', params.bedrooms.join(','));
  if (params.min_price !== undefined) queryParams.append('min_price', params.min_price.toString());
  if (params.max_price !== undefined) queryParams.append('max_price', params.max_price.toString());
  if (params.min_sqft !== undefined) queryParams.append('min_sqft', params.min_sqft.toString());
  if (params.max_sqft !== undefined) queryParams.append('max_sqft', params.max_sqft.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.per_page) queryParams.append('per_page', params.per_page.toString());
  
  const url = `${API_BASE_URL}/intermediate_ai/search?${queryParams.toString()}`;
  console.log('  Fetching URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('  Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('  ❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to search properties: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('  ✅ Response received:', {
      total: data.total,
      resultsCount: data.results?.length || 0,
      page: data.page,
      hasFacets: !!data.facets
    });
    return data;
  } catch (error) {
    console.error('  ❌ Fetch error:', error);
    throw error;
  }
}

export async function getSearchSummaryIntermediateAI(params: SearchParams & { total?: number; results?: Property[] }): Promise<SearchSummary> {
  console.log('📡 API: getSearchSummaryIntermediateAI() called')
  console.log('  API_BASE_URL:', API_BASE_URL)
  console.log('  Params:', params)
  console.log('  Results count:', params.results?.length || 0)
  
  const url = `${API_BASE_URL}/intermediate_ai/summary`;
  console.log('  POST URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: params.q,
        title: params.title,
        description: params.description,
        property_type: params.property_type?.join(','),
        bedrooms: params.bedrooms?.join(','),
        min_price: params.min_price,
        max_price: params.max_price,
        min_sqft: params.min_sqft,
        max_sqft: params.max_sqft,
        total: params.total,
        results: params.results || [],
      }),
    });
    console.log('  Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('  ❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to get search summary: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('  ✅ Summary received:', data);
    return data;
  } catch (error) {
    console.error('  ❌ Fetch error:', error);
    throw error;
  }
}

export async function searchPropertiesAdvancedAI(params: SearchParams): Promise<SearchResponse> {
  console.log('📡 API: searchPropertiesAdvancedAI() called')
  console.log('  API_BASE_URL:', API_BASE_URL)
  console.log('  Params:', params)
  
  const queryParams = new URLSearchParams();
  
  if (params.q) queryParams.append('q', params.q);
  if (params.title) queryParams.append('title', params.title);
  if (params.description) queryParams.append('description', params.description);
  if (params.property_type?.length) queryParams.append('property_type', params.property_type.join(','));
  if (params.bedrooms?.length) queryParams.append('bedrooms', params.bedrooms.join(','));
  if (params.min_price !== undefined) queryParams.append('min_price', params.min_price.toString());
  if (params.max_price !== undefined) queryParams.append('max_price', params.max_price.toString());
  if (params.min_sqft !== undefined) queryParams.append('min_sqft', params.min_sqft.toString());
  if (params.max_sqft !== undefined) queryParams.append('max_sqft', params.max_sqft.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.per_page) queryParams.append('per_page', params.per_page.toString());
  
  const url = `${API_BASE_URL}/advanced_ai/search?${queryParams.toString()}`;
  console.log('  Fetching URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('  Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('  ❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to search properties: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('  ✅ Response received:', {
      total: data.total,
      resultsCount: data.results?.length || 0,
      page: data.page,
      hasFacets: !!data.facets
    });
    return data;
  } catch (error) {
    console.error('  ❌ Fetch error:', error);
    throw error;
  }
}

export interface ChatResponse {
  response_text: string;
  payload: any;
  type: "SearchSummaryOutput" | "QueryParameters";
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  console.log('📡 API: sendChatMessage() called')
  console.log('  API_BASE_URL:', API_BASE_URL)
  console.log('  Message:', message)
  
  const url = `${API_BASE_URL}/advanced_ai/chat`;
  console.log('  Fetching URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    console.log('  Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('  ❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to send chat message: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('  ✅ Chat response received:', data);
    return data;
  } catch (error) {
    console.error('  ❌ Fetch error:', error);
    throw error;
  }
}
