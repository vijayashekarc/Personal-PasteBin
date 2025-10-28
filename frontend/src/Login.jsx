import React, { useState } from 'react';
import './Login.css'; // We'll create this file next

// This component receives one function, 'onLoginSuccess',
// which it will call after getting a token.
function Login({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    fetch('https://personal-paste-bin.vercel.app/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Invalid password');
        }
        return res.json();
      })
      .then((data) => {
        // We got the token! Save it in localStorage.
        localStorage.setItem('authToken', data.token);
        // Tell the App component that we are logged in.
        onLoginSuccess();
      })
      .catch((err) => {
        setError('Login failed. Please try again.');
        console.error(err);
      });
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        {/* --- USE YOUR SVG FILE HERE --- */}
        <div className="login-icon-wrapper">
          <img
            src="/copypaste.svg" // This path works because it's in the 'public' folder
            alt="Login Icon"
            className="login-icon"
          />
        </div>
        {/* --- END SVG --- */}
        <h2>Welcome Vijayashekar!</h2>
        <p>Enter the password to access your Pastebin.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Unlock</button>
        {error && <p className="error-message">{error}</p>}
    {/* --- MODIFY YOUR FOOTER HERE --- */}
      <footer className="login-footer">
        <p>
          Designed by Vijayasheker C |{' '}
          <a 
            href="https://github.com/vijayashekarc/Personal-PasteBin" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>
      {/* --- END FOOTER --- */}
      </form>

      
    </div>
    
  );
}

export default Login;