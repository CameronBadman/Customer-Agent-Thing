import React, { useState } from 'react';
import './Curator.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Curator() {
  const [category, setCategory] = useState('');
  const [information, setInformation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [showList, setShowList] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category.trim() || !information.trim()) {
      setError('Please fill in both category and information fields');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/curator/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: category.trim(),
          information: information.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add knowledge');
      }

      setResult(data);
      setCategory('');
      setInformation('');

      // Success feedback
      setTimeout(() => {
        setResult(null);
      }, 5000);

    } catch (err) {
      console.error('Error adding knowledge:', err);
      setError(err.message || 'Failed to add knowledge');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadKnowledge = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/curator/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load knowledge');
      }

      setKnowledgeList(data.results || []);
      setShowList(true);

    } catch (err) {
      console.error('Error loading knowledge:', err);
      setError(err.message || 'Failed to load knowledge');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCategory('');
    setInformation('');
    setError(null);
    setResult(null);
  };

  return (
    <div className="curator-container">
      <div className="curator-header">
        <h1>Knowledge Curator</h1>
        <p className="curator-subtitle">Add general rules and information to the base knowledge store</p>
      </div>

      <div className="curator-content">
        <form onSubmit={handleSubmit} className="curator-form">
          <div className="form-group">
            <label htmlFor="category">Category / Key</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., vpn_setup, password_reset, printer_issues"
              disabled={loading}
              className="form-input"
            />
            <small className="form-hint">
              Use lowercase with underscores (e.g., vpn_setup)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="information">Information</label>
            <textarea
              id="information"
              value={information}
              onChange={(e) => setInformation(e.target.value)}
              placeholder="Enter raw information here. The AI will format it into structured knowledge.&#10;&#10;Example:&#10;vpn server is company.vpn.com port 443 use your company email and password download client from https://it.company.com/vpn"
              disabled={loading}
              className="form-textarea"
              rows="8"
            />
            <small className="form-hint">
              Enter raw information - the AI will format it professionally
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="btn btn-secondary"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !category.trim() || !information.trim()}
              className="btn btn-primary"
            >
              {loading ? 'Processing...' : 'Add Knowledge'}
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && result.success && (
          <div className="alert alert-success">
            <strong>Success!</strong> Knowledge added to base store under '{result.category}'
            {result.formatted_content && (
              <div className="formatted-preview">
                <h4>Formatted Content:</h4>
                <pre>{result.formatted_content}</pre>
              </div>
            )}
          </div>
        )}

        <div className="knowledge-list-section">
          <button
            onClick={handleLoadKnowledge}
            disabled={loading}
            className="btn btn-secondary"
          >
            {showList ? 'Refresh' : 'View'} Base Knowledge
          </button>

          {showList && knowledgeList.length > 0 && (
            <div className="knowledge-list">
              <h3>Base Knowledge ({knowledgeList.length} entries)</h3>
              {knowledgeList.map((item, index) => (
                <div key={index} className="knowledge-item">
                  <pre>{item}</pre>
                </div>
              ))}
            </div>
          )}

          {showList && knowledgeList.length === 0 && (
            <div className="alert alert-info">
              No knowledge entries found in the base store.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Curator;
