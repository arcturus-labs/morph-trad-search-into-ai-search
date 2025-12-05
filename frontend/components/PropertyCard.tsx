'use client'

import { Property } from '@/lib/api';

interface PropertyCardProps {
  property: Property;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Listed today';
  if (diffDays === 1) return 'Listed 1 day ago';
  if (diffDays < 7) return `Listed ${diffDays} days ago`;
  return `Listed ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function isNewListing(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3;
}

function getBedroomLabel(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio';
  return `${bedrooms} BD`;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const newListing = isNewListing(property.listing_date);
  
  return (
    <div className="result-card">
      <div className="result-image">
        {newListing && <div className="new-badge">NEW</div>}
        <img 
          src={property.images[0] || 'https://via.placeholder.com/200x150?text=Property'} 
          alt={property.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
        />
      </div>
      <div className="result-content">
        <div className="result-header">
          <div className="result-title">
            {property.title}
          </div>
          <div className="result-price">{formatPrice(property.price)}</div>
        </div>
        <div className="result-specs">
          <span>🛏️ {getBedroomLabel(property.bedrooms)}</span>
          <span>📏 {property.square_feet.toLocaleString()} sq ft</span>
          <span>🏠 {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}</span>
        </div>
        <div className="result-description">
          {property.description}
        </div>
        <div className="result-footer">
          <span>{formatDate(property.listing_date)}</span>
        </div>
      </div>
    </div>
  );
}

