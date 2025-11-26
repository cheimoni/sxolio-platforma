import React, { useState, useEffect } from 'react';
import './CoteachingViewer.css';

const CoteachingViewer = () => {
  const [coteachingData, setCoteachingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCoteachingData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/coteaching.html');
        const htmlContent = await response.text();
        
        // Parse HTML content to extract coteaching information
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Extract coteaching sections
        const coteachingSections = [];
        
        // Find all sections with "Τμήμα/Συνδιδασκαλία"
        const sections = doc.querySelectorAll('p');
        sections.forEach(section => {
          const text = section.textContent;
          if (text.includes('Τμήμα/Συνδιδασκαλία:')) {
            const match = text.match(/Τμήμα\/Συνδιδασκαλία:\s*([A-Z0-9_]+)/);
            if (match) {
              const coteachingCode = match[1];
              
              // Find the table that follows this section
              let nextElement = section.nextElementSibling;
              while (nextElement && nextElement.tagName !== 'TABLE') {
                nextElement = nextElement.nextElementSibling;
              }
              
              if (nextElement && nextElement.tagName === 'TABLE') {
                const students = [];
                const rows = nextElement.querySelectorAll('tr');
                
                rows.forEach((row, index) => {
                  if (index === 0) return; // Skip header row
                  
                  const cells = row.querySelectorAll('td');
                  if (cells.length >= 2) {
                    const studentName = cells[1]?.textContent?.trim();
                    if (studentName && studentName !== '') {
                      students.push(studentName);
                    }
                  }
                });
                
                coteachingSections.push({
                  code: coteachingCode,
                  students: students
                });
              }
            }
          }
        });
        
        setCoteachingData(coteachingSections);
        setLoading(false);
      } catch (err) {
        console.error('Error loading coteaching data:', err);
        setError('Σφάλμα φόρτωσης δεδομένων συνδιδασκαλιών');
        setLoading(false);
      }
    };

    loadCoteachingData();
  }, []);

  if (loading) {
    return (
      <div className="coteaching-viewer">
        <div className="loading">Φόρτωση συνδιδασκαλιών...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="coteaching-viewer">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="coteaching-viewer">
      <h2>Συνδιδασκαλίες</h2>
      <div className="coteaching-sections">
        {coteachingData && coteachingData.length > 0 ? (
          coteachingData.map((section, index) => (
            <div key={index} className="coteaching-section">
              <h3>{section.code}</h3>
              <div className="students-list">
                {section.students.map((student, studentIndex) => (
                  <div key={studentIndex} className="student-item">
                    {student}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-data">Δεν βρέθηκαν συνδιδασκαλίες</div>
        )}
      </div>
    </div>
  );
};

export default CoteachingViewer;

