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

    fetch('http://localhost:4000/auth/login', {
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
      </form>
    </div>
  );
}

export default Login;