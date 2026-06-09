import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchAPI } from "@/services/searchService";
import { MENU_ITEMS } from "@/constants";
import { Search, X, Loader, AlertCircle, ArrowRight, FileSearch } from "lucide-react";

interface Suggestion {
  id: string;
  text: string;
  type: string;
  model: string;
  route?: string;
  source?: "page" | "record";
}

interface GlobalSearchProps {
  className?: string;
  onResultsFound?: (results: any) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className = "",
  onResultsFound,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const pageSuggestions = MENU_ITEMS.flatMap((item) =>
    (item.subMenus || []).map((sub) => ({
      id: `${item.id}-${sub.id}`,
      text: sub.label,
      type: item.label,
      model: "page",
      route: `/${item.id}/${sub.id}`,
      source: "page" as const,
    }))
  );

  // Debounced search for suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError("");

    const normalizedQuery = query.trim().toLowerCase();
    const matchingPages = pageSuggestions
      .filter(
        (page) =>
          page.text.toLowerCase().includes(normalizedQuery) ||
          page.type.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 5);

    try {
      const response = await searchAPI.getSuggestions(query, 8);
      if (response.success) {
        const recordSuggestions = (response.data || []).map((item: Suggestion) => ({
          ...item,
          source: "record" as const,
        }));
        setSuggestions([...matchingPages, ...recordSuggestions].slice(0, 10));
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions(matchingPages);
      setShowSuggestions(true);
      if (matchingPages.length === 0) {
        setError("Failed to load suggestions");
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageSuggestions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Navigate to search results page with query
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);

    if (suggestion.route) {
      navigate(suggestion.route);
      return;
    }

    navigate(`/search?q=${encodeURIComponent(suggestion.text)}&type=${suggestion.model}`);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

      if (isSearchShortcut) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search pages, items, orders..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {error && (
            <div className="flex items-center justify-center p-4 text-red-500">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          )}

          {!isLoading && suggestions.length === 0 && !error && (
            <div className="p-4 text-center text-gray-500">
              {searchQuery.length < 2
                ? "Type at least 2 characters to search"
                : "No suggestions found"}
            </div>
          )}

          {!isLoading &&
            suggestions.length > 0 &&
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {suggestion.text}
                    </div>
                    <div className="text-xs text-gray-500">{suggestion.type}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                    {suggestion.source === "page" ? (
                      <ArrowRight className="h-3 w-3" />
                    ) : (
                      <FileSearch className="h-3 w-3" />
                    )}
                    {suggestion.source === "page" ? "Open" : suggestion.type}
                  </span>
                </div>
              </button>
            ))}

          {!isLoading && suggestions.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full py-2 text-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View all results for "{searchQuery}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
