'use client'

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export default function SearchBox({ value, onChange, onSearch }: SearchBoxProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="search-box">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search properties..."
      />
      <button onClick={onSearch}>Search</button>
    </div>
  );
}

