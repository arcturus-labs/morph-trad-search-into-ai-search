'use client'

interface ResultsHeaderProps {
  total: number;
  displayed: number;
  sort: string;
  onSortChange: (sort: string) => void;
}

export default function ResultsHeader({ total, displayed, sort, onSortChange }: ResultsHeaderProps) {
  return (
    <div className="results-header">
      <div className="results-count">
        {displayed < total ? (
          <>Showing first <strong>{displayed}</strong> of <strong>{total}</strong> {total === 1 ? 'property' : 'properties'}</>
        ) : (
          <>Showing <strong>{total}</strong> {total === 1 ? 'property' : 'properties'}</>
        )}
      </div>
      <div className="sort-by">
        <label>Sort by:</label>
        <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>
    </div>
  );
}

