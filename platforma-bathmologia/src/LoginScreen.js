// @FILE-INFO: LoginScreen.js | src/components/LoginScreen.js
// TYPE: Feature Component
// LAYER: UI (Resource)
// SIZE: 60 lines (Medium)
// EXPORTS: LoginScreen

import React, { useState, useEffect } from 'react';

const CelestialBackground = () => {
  return (
    <div className="celestial-container">
      <div className="stars"></div>
      <div className="nebula"></div>
      <div className="planets">
        <div className="planet planet-1"></div>
        <div className="planet planet-2"></div>
        <div className="planet planet-3"></div>
        <div className="planet planet-4"></div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, error }) => {
  const [loginCode, setLoginCode] = useState('');
  const [localError, setLocalError] = useState('');

  // Update local error when the prop changes
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  const handleLoginClick = () => {
    if (loginCode) {
      onLogin(loginCode);
    } else {
      setLocalError('Παρακαλώ εισάγετε έναν κωδικό.');
    }
  };

  return (
    <div className="login-container">
      <CelestialBackground />
      <div className="login-header">
        <h1>🏛️ Σύστημα Βαθμολογίας 🏛️</h1>
      </div>
      <div className="login-box">
        <div className="login-emoji">🔐</div>
        <h3>Είσοδος Καθηγητή / Μαθητή</h3>
        <input
          type="password"
          placeholder="Εισάγετε τον κωδικό σας..."
          value={loginCode}
          onChange={(e) => {
            setLoginCode(e.target.value);
            if (localError) setLocalError(''); // Clear error on new input
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleLoginClick()}
          autoFocus
        />
        <button onClick={handleLoginClick}>🚀 ΕΙΣΟΔΟΣ</button>
        {localError && (
          <div className="login-error">{localError}</div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;