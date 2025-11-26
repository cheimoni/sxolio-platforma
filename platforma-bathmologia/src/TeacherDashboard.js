// @FILE-INFO: TeacherDashboard.js | src/components/TeacherDashboard.js

import React from 'react';

const TeacherDashboard = ({ teacherName, onShowGrades, onShowCodes, onShowGallery, onExport, isExporting, onImport, onLogout }) => {
  return (
    <div className="login-container">
      <div className="user-info" style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <span>👩‍🏫 {teacherName}</span>
        <button onClick={onLogout} className="logout-btn">🚪 ΕΞΟΔΟΣ</button>
      </div>

      <div className="login-box">
        <h2>Κεντρικό Μενού</h2>
        <button onClick={onShowGrades} style={{ margin: '10px', background: '#007bff', display: 'block', width: '100%' }}>
          ➡️ Βαθμολόγηση Τμημάτων
        </button>
        <button onClick={onShowCodes} style={{ margin: '10px', background: '#6c757d', display: 'block', width: '100%' }}>
          🔑 Διαχείριση Κωδικών
        </button>
        <button onClick={onShowGallery} style={{ margin: '10px', background: '#17a2b8', display: 'block', width: '100%' }}>
          🖼️ Gallery Έργων
        </button>
        <hr style={{ width: '80%', margin: '20px auto', borderColor: 'rgba(255,255,255,0.2)' }} />
        <button onClick={onExport} disabled={isExporting} style={{ margin: '10px', background: '#28a745', display: 'block', width: '100%' }}>
          {isExporting ? '💾 Εξαγωγή σε εξέλιξη...' : '💾 Εξαγωγή Δεδομένων'}
        </button>
        <label style={{ 
            margin: '10px', background: '#ffc107', color: '#212529', display: 'block', width: '100%',
            padding: '10px', borderRadius: '5px', textAlign: 'center', cursor: 'pointer', boxSizing: 'border-box'
        }}>
          🔄️ Εισαγωγή Δεδομένων
          <input type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
};

export default TeacherDashboard;