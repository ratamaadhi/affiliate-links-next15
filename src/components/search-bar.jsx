import React from 'react';
import { Input } from "@/components/ui/input";
import { RxMagnifyingGlass } from "react-icons/rx";

// SearchBar component
function SearchBar({ onSearch }) {
  const handleChange = (e) => {
    onSearch(e.target.value);
  };

  return (
    <div className="relative flex gap-2">
      <Input
        type="text"
        placeholder="Search..."
        onChange={handleChange}
        startIcon={RxMagnifyingGlass}
      />
    </div>
  );
}

export default SearchBar;
