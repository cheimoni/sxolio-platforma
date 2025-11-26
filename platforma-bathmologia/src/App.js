// @FILE-INFO: App.js | src/App.js
// TYPE: Web Root Resource
// LAYER: Presentation (Static)
// EXPORTS: App

import React from 'react';
import GradeSystem from './GradeSystem';
import './GradeSystem.css'; // Εισαγωγή του κεντρικού αρχείου CSS

function App() {
  return (
    <div className="App">
      <GradeSystem />
    </div>
  );
}

export default App;