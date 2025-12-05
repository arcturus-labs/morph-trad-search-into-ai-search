'use client'

import { InterpretedQuery } from '@/lib/api'

interface QueryBreadcrumbProps {
  interpretedQuery: InterpretedQuery | null;
  isLoading?: boolean;
  onApply?: (interpretedQuery: InterpretedQuery) => void;
}

interface BreadcrumbItem {
  label: string;
  value: string;
}

export default function QueryBreadcrumb({ interpretedQuery, isLoading = false, onApply }: QueryBreadcrumbProps) {

  const handleApply = () => {
    if (onApply && interpretedQuery) {
      onApply(interpretedQuery);
    }
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}k`;
  };

  const formatSqft = (sqft: number): string => {
    return `${sqft.toLocaleString()} sqft`;
  };

  const formatPropertyType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatBedroom = (bedroom: string): string => {
    return bedroom === '0' ? 'Studio' : `${bedroom} BR`;
  };

  const formatBedrooms = (bedrooms: string[]): string => {
    if (bedrooms.length === 0) return '';
    if (bedrooms.length === 1) {
      return formatBedroom(bedrooms[0]);
    }
    
    // Sort bedrooms numerically
    const sortedBedrooms = [...bedrooms].sort((a, b) => {
      const aNum = a === '0' ? 0 : parseInt(a);
      const bNum = b === '0' ? 0 : parseInt(b);
      return aNum - bNum;
    });
    
    // Check if they form a consecutive range
    const nums = sortedBedrooms.map(b => b === '0' ? 0 : parseInt(b));
    let isConsecutive = true;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] !== nums[i-1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    
    if (isConsecutive && nums.length > 1) {
      // Format as range: "1-3 BR" or "Studio, 1-3 BR"
      const first = sortedBedrooms[0];
      const last = sortedBedrooms[sortedBedrooms.length - 1];
      if (first === '0') {
        return `Studio, ${formatBedroom(last)}`;
      }
      return `${first}-${last} BR`;
    } else {
      // Format as list: "1, 2, 3 BR"
      return sortedBedrooms.map(formatBedroom).join(', ');
    }
  };

  const formatSort = (sort: string): string => {
    const sortMap: Record<string, string> = {
      relevance: 'Relevance',
      price_asc: 'Price: Low to High',
      price_desc: 'Price: High to Low',
      newest: 'Newest',
    };
    return sortMap[sort] || sort;
  };

  const items: BreadcrumbItem[] = [];

  // Only build items if interpretedQuery exists
  if (interpretedQuery) {
    // Property types
    if (interpretedQuery.property_type && interpretedQuery.property_type.length > 0) {
      const value = interpretedQuery.property_type.map(formatPropertyType).join(', ');
      items.push({ label: 'Property Type', value });
    }

    // Bedrooms
    if (interpretedQuery.bedrooms && interpretedQuery.bedrooms.length > 0) {
      const value = formatBedrooms(interpretedQuery.bedrooms);
      items.push({ label: 'Bedrooms', value });
    }

    // Price range
    if (interpretedQuery.min_price !== undefined || interpretedQuery.max_price !== undefined) {
      let value = '';
      if (interpretedQuery.min_price !== undefined && interpretedQuery.max_price !== undefined) {
        value = `${formatPrice(interpretedQuery.min_price)} - ${formatPrice(interpretedQuery.max_price)}`;
      } else if (interpretedQuery.min_price !== undefined) {
        value = `Over ${formatPrice(interpretedQuery.min_price)}`;
      } else if (interpretedQuery.max_price !== undefined) {
        value = `Under ${formatPrice(interpretedQuery.max_price)}`;
      }
      items.push({ label: 'Price', value });
    }

    // Square footage range
    if (interpretedQuery.min_sqft !== undefined || interpretedQuery.max_sqft !== undefined) {
      let value = '';
      if (interpretedQuery.min_sqft !== undefined && interpretedQuery.max_sqft !== undefined) {
        value = `${formatSqft(interpretedQuery.min_sqft)} - ${formatSqft(interpretedQuery.max_sqft)}`;
      } else if (interpretedQuery.min_sqft !== undefined) {
        value = `Over ${formatSqft(interpretedQuery.min_sqft)}`;
      } else if (interpretedQuery.max_sqft !== undefined) {
        value = `Under ${formatSqft(interpretedQuery.max_sqft)}`;
      }
      items.push({ label: 'Square Feet', value });
    }

    // Title/Description (text search terms)
    if (interpretedQuery.title) {
      items.push({ label: 'Search Terms', value: `"${interpretedQuery.title}"` });
    } else if (interpretedQuery.description) {
      items.push({ label: 'Search Terms', value: `"${interpretedQuery.description}"` });
    }

    // Sort
    if (interpretedQuery.sort && interpretedQuery.sort !== 'relevance') {
      items.push({ label: 'Sort', value: formatSort(interpretedQuery.sort) });
    }
  }

  // Determine if breadcrumb is empty (no loading, no results)
  const isEmpty = !isLoading && (!interpretedQuery || items.length === 0);

  // Always render the breadcrumb container with blue background
  return (
    <div className={`query-breadcrumb ${isEmpty ? 'query-breadcrumb-empty' : ''}`}>
      {isLoading ? (
        // Show spinner when loading
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          width: '100%',
          minHeight: '24px'
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
      ) : interpretedQuery && items.length > 0 ? (
        // Show results when available
        <>
          <span className="query-breadcrumb-question">Did you mean this?</span>
          <div className="query-breadcrumb-items">
            {items.map((item, index) => (
              <span key={index} className="query-breadcrumb-item">
                <span className="query-breadcrumb-label">{item.label}:</span>
                <span className="query-breadcrumb-value">{item.value}</span>
              </span>
            ))}
          </div>
          {onApply && (
            <button 
              className="query-breadcrumb-apply-button"
              onClick={handleApply}
              title="Apply these search parameters"
            >
              🔍 Search
            </button>
          )}
        </>
      ) : (
        // Empty state - just blue background with height
        <div style={{ minHeight: '6px' }} />
      )}
    </div>
  );
}
