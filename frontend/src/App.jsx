import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login'; // <-- Import the Login component

const API_URL = 'https://personal-paste-bin.vercel.app/snippets';

function App() {
  // --- NEW AUTH STATE ---
  // We check localStorage *immediately* for the tokens
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  // --- END NEW AUTH STATE ---

  const [currentSnippet, setCurrentSnippet] = useState('');
  const [allSnippets, setAllSnippets] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  // --- NEW HELPER FUNCTION ---
  // We'll use this to add the token to all our API requests
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Add the token
    };
  };
  // --- END NEW HELPER ---

  // 1. Fetch all snippets
  useEffect(() => {
    // Only fetch if we are logged in (have a token)
    if (!token) return;

    fetch(API_URL, {
      headers: getAuthHeaders(), // <-- Use auth headers
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => setAllSnippets(data))
      .catch((err) => {
        console.error("Error fetching snippets:", err);
        // If token is bad, log out
        if (err.message.includes('401') || err.message.includes('403')) {
          handleLogout();
        }
      });
  }, [token]); // <-- Re-run this effect if the token changes

  // 2. Function to SAVE
  const handleSaveSnippet = () => {
    if (currentSnippet.trim() === '') return;
    fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(), // <-- Use auth headers
      body: JSON.stringify({ text: currentSnippet }),
    })
      .then((res) => res.json())
      .then((newSnippet) => {
        setAllSnippets([newSnippet, ...allSnippets]);
        setCurrentSnippet('');
      })
      .catch((err) => console.error("Error saving snippet:", err));
  };

  // 3. Function to DELETE
  const handleDeleteSnippet = (idToDelete) => {
    fetch(`${API_URL}/${idToDelete}`, {
      method: 'DELETE',
      headers: getAuthHeaders(), // <-- Use auth headers
    })
      .then((res) => res.json())
      .then(() => {
        setAllSnippets(
          allSnippets.filter((snippet) => snippet._id !== idToDelete)
        );
      })
      .catch((err) => console.error("Error deleting snippet:", err));
  };

  // 4. Function to COPY (no change)
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setStatusMessage('Copied to clipboard!');
        setTimeout(() => setStatusMessage(''), 2000);
      })
      .catch((err) => console.error("Failed to copy text: ", err));
  };

  // 5. Function to PASTE (no change)
  const handlePaste = () => {
    navigator.clipboard.readText()
      .then((text) => setCurrentSnippet(text))
      .catch((err) => console.error('Failed to read clipboard contents: ', err));
  };
  
  // --- NEW LOGOUT FUNCTION ---
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setAllSnippets([]); // Clear data
  };
  
  // --- NEW CONDITIONAL RENDER ---
  // If there is no token, show the Login component
  if (!token) {
    return (
      <Login 
        onLoginSuccess={() => {
          // When login is successful, get token from localStorage and update state
          setToken(localStorage.getItem('authToken'));
        }} 
      />
    );
  }

  // --- Main App Render ---
  // If we have a token, show the pastebin
  return (
    <div className="app-container">
      <button onClick={handleLogout} className="logout-button">
        Log Out
      </button>
      <h1>My Personal Pastebin</h1>
      <p>Your MERN stack snippet manager.</p>
      
      {/* (Rest of your JSX is the same) */}

      {statusMessage && <div className="status-message">{statusMessage}</div>}

      <textarea
        className="main-textarea"
        value={currentSnippet}
        onChange={(e) => setCurrentSnippet(e.target.value)}
        placeholder="Paste here"
      />
      <div className="main-actions">
        <button onClick={handlePaste}>Paste from Clipboard</button>
        <button className="save-button" onClick={handleSaveSnippet}>
          Save Snippet
        </button>
      </div>

      <hr />

      <h2>Saved Snippets</h2>
      <div className="snippets-list">
        {allSnippets.length === 0 ? (
          <p>No snippets saved yet.</p>
        ) : (
          allSnippets.map((snippet) => (
            <div key={snippet._id} className="snippet-card">
              <pre>{snippet.text}</pre>
              <div className="snippet-actions">
                <button onClick={() => handleCopy(snippet.text)}>Copy</button>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteSnippet(snippet._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;