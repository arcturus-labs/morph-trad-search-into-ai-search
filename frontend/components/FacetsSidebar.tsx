'use client'

import FacetGroup from './FacetGroup';
import { Facets } from '@/lib/api';

interface FacetsSidebarProps {
  facets: Facets;
  selectedPropertyTypes: string[];
  selectedBedrooms: string[];
  selectedPriceRanges: string[];
  selectedSqftRanges: string[];
  onPropertyTypeChange: (value: string, checked: boolean) => void;
  onBedroomChange: (value: string, checked: boolean) => void;
  onPriceRangeChange: (value: string, checked: boolean) => void;
  onSqftRangeChange: (value: string, checked: boolean) => void;
}

export default function FacetsSidebar({
  facets,
  selectedPropertyTypes,
  selectedBedrooms,
  selectedPriceRanges,
  selectedSqftRanges,
  onPropertyTypeChange,
  onBedroomChange,
  onPriceRangeChange,
  onSqftRangeChange,
}: FacetsSidebarProps) {
  // Convert property type facets to options
  const propertyTypeOptions = Object.entries(facets.property_type).map(([value, count]) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    count,
  }));

  // Convert bedroom facets to options
  const bedroomOptions = Object.entries(facets.bedrooms)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([value, count]) => ({
      value,
      label: value === '0' ? 'Studio' : `${value} BR`,
      count,
    }));

  // Convert price range facets to options
  const priceRangeOptions = Object.entries(facets.price_ranges).map(([value, count]) => {
    const [min, max] = value.split('-');
    let label = '';
    if (max === '999999999') {
      label = `Over $${(parseInt(min) / 1000).toFixed(0)}k`;
    } else {
      label = `$${(parseInt(min) / 1000).toFixed(0)}k - $${(parseInt(max) / 1000).toFixed(0)}k`;
    }
    if (min === '0') {
      label = `Under $${(parseInt(max) / 1000).toFixed(0)}k`;
    }
    return { value, label, count };
  });

  // Convert square feet range facets to options
  const sqftRangeOptions = Object.entries(facets.square_feet_ranges).map(([value, count]) => {
    const [min, max] = value.split('-');
    let label = '';
    if (max === '999999') {
      label = `Over ${parseInt(min).toLocaleString()}`;
    } else {
      label = `${parseInt(min).toLocaleString()} - ${parseInt(max).toLocaleString()}`;
    }
    if (min === '0') {
      label = `Under ${parseInt(max).toLocaleString()}`;
    }
    return { value, label, count };
  });

  return (
    <aside className="facets">
      <FacetGroup
        title="Property Type"
        options={propertyTypeOptions}
        selected={selectedPropertyTypes}
        onChange={onPropertyTypeChange}
      />
      
      <FacetGroup
        title="Bedrooms"
        options={bedroomOptions}
        selected={selectedBedrooms}
        onChange={onBedroomChange}
      />
      
      <FacetGroup
        title="Price Range"
        options={priceRangeOptions}
        selected={selectedPriceRanges}
        onChange={onPriceRangeChange}
      />
      
      <FacetGroup
        title="Square Feet"
        options={sqftRangeOptions}
        selected={selectedSqftRanges}
        onChange={onSqftRangeChange}
      />
    </aside>
  );
}

