// @FILE-INFO: StudentView.js | src/components/StudentView.js

import React, { useEffect, useState } from 'react';

const StudentView = ({ student, grades, config, onLogout, calculateFinal, messageTemplates, getVocative, onShowGallery }) => {
  const { numAssignments, numOrals } = config;

  const formatMessage = () => {
    const templateId = student.message || 'kanena'; const defaultMessage = "Καλή προσπάθεια! Συνέχισε έτσι.";
    if (templateId === 'kanena') { return defaultMessage; }
    const template = messageTemplates.find(t => t.id === templateId);
    if (!template || !template.text) { return defaultMessage; }

    if (template.text.includes('{}')) { return template.text.replace('{}', getVocative(student.firstName)); }
    return template.text;
  };
  const personalMessage = formatMessage();

  return (
    <div className="student-view">
      <div className="header">
        <h2>🏛️ Οι Βαθμοί μου</h2>
        <div className="user-info">
          <button onClick={onShowGallery} className="logout-btn" style={{backgroundColor: '#17a2b8', marginRight: '10px'}}>🖼️ Δες τη Gallery</button>
          <span>🎯 ΓΕΙΑ ΣΟΥ, {getVocative(student.firstName)}!</span>
          <button onClick={onLogout} className="logout-btn">🚪 ΕΞΟΔΟΣ</button>
        </div>
      </div>
      <div className="student-card-view">
        <div className="student-avatar"><h3>{`${student.lastName} ${student.firstName}`}</h3></div>
        <div className="grade-section-vertical personal-message"><h4>💡 Μήνυμα από τον καθηγητή</h4><p>"{personalMessage}"</p></div>
        <div className="grades-container-vertical">
          <div className="grade-section-vertical">

            <h4>📝 ΑΣΚΗΣΕΙΣ</h4>
            <div className="grade-list-vertical">

              {[...Array(numAssignments)].map((_, i) => { const grade = grades[`${student.id}-assignment-${i}`]; return (<div key={`a-${i}`} className="grade-item-vertical"><span className="grade-label">ΑΣΚΗΣΗ {i + 1}:</span><span className="grade-value-large">{grade != null ? grade : '—'}</span></div>); })}
            </div>
          </div>
          <div className="grade-section-vertical">
            <h4>🗣️ ΠΡΟΦΟΡΙΚΟΙ</h4>
            <div className="grade-list-vertical">
              {[...Array(numOrals)].map((_, i) => { const grade = grades[`${student.id}-oral-${i}`]; return (<div key={`p-${i}`} className="grade-item-vertical"><span className="grade-label">ΠΡΟΦΟΡΙΚΟΣ {i + 1}:</span><span className="grade-value-large">{grade != null ? grade : '—'}</span></div>); })}
            </div>
          </div>
          <div className="grade-section-vertical exam-item">
            <h4>📊 ΔΙΑΓΩΝΙΣΜΑ</h4>
            <div className="grade-item-vertical"><span className="grade-label">ΔΙΑΓΩΝΙΣΜΑ:</span><span className="grade-value-large">{grades[`${student.id}-exam-0`] || '—'}</span></div>
          </div>
          <div className="grade-section-vertical final-section">
            <h4>🏆 ΤΕΛΙΚΟΣ ΒΑΘΜΟΣ</h4>
            <div className="final-grade-large">🏆 {calculateFinal(student)}</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentView;