'use client'

interface FacetOption {
  value: string;
  label: string;
  count: number;
}

interface FacetGroupProps {
  title: string;
  options: FacetOption[];
  selected: string[];
  onChange: (value: string, checked: boolean) => void;
}

export default function FacetGroup({ title, options, selected, onChange }: FacetGroupProps) {
  const hasSelection = selected.length > 0;
  
  return (
    <div className="facet-group">
      <h3>{title}</h3>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const isGrayedOut = hasSelection && !isSelected;
        
        return (
          <div 
            key={option.value} 
            className={`facet-option ${isGrayedOut ? 'facet-option-grayed' : ''}`}
          >
            <input
              type="checkbox"
              id={`${title}-${option.value}`}
              checked={isSelected}
              onChange={(e) => onChange(option.value, e.target.checked)}
            />
            <label htmlFor={`${title}-${option.value}`}>{option.label}</label>
            <span className="facet-count">({option.count})</span>
          </div>
        );
      })}
    </div>
  );
}

