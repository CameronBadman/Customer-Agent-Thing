import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './SearchBar.css';

const SearchBar = ({ currentChatId, onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');

  const { searchChat } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim() || !currentChatId) return;

    try {
      setIsSearching(true);
      setError('');
      
      const response = await searchChat(currentChatId, searchTerm.trim());
      setSearchResults(response.results || []);
      setShowResults(true);
      onSearchResults(response.results || []);
    } catch (error) {
      setError('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setError('');
    onSearchResults([]);
  };

  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentChatId) {
    return (
      <div className="search-bar disabled">
        <p>Select a chat to search</p>
      </div>
    );
  }

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSearch} className="search-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in this chat..."
            className="search-input"
            disabled={isSearching}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="clear-search-btn"
            >
              ×
            </button>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!searchTerm.trim() || isSearching}
          className="search-btn"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {showResults && (
        <div className="search-results">
          <div className="search-results-header">
            <h4>
              Search Results ({searchResults.length})
              {searchResults.length > 0 && (
                <span className="search-term">for "{searchTerm}"</span>
              )}
            </h4>
            <button onClick={clearSearch} className="close-results-btn">
              ×
            </button>
          </div>
          
          <div className="results-list">
            {searchResults.length === 0 ? (
              <div className="no-results">
                <p>No messages found containing "{searchTerm}"</p>
                <p>Try a different search term.</p>
              </div>
            ) : (
              searchResults.map((result, index) => (
                <div key={index} className="result-item">
                  <div className="result-header">
                    <span className={`result-sender ${result.sender}`}>
                      {result.sender === 'bot' ? 'Customer Service' : 'You'}
                    </span>
                    <span className="result-time">
                      {formatTimestamp(result.timestamp)}
                    </span>
                  </div>
                  <div className="result-content">
                    {highlightText(result.content, searchTerm)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;