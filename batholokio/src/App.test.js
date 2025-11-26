import React, { useState } from 'react';
import './GradeTable.css';

const GradeTable = () => {
  const students = [
    'ΑΡΙΣΤΕΙΔΟΥ ΚΥΒΕΛΗ',
    'ΖΙΠΙΤΗ ΣΤΕΦΑΝΟΣ', 
    'ΚΑΠΛΑΝΙΟΥ ΡΑΦΑΕΛΑ',
    'ΚΕΡΡΥ ΑΝΤΡΙΑΝΑ',
    'ΚΡΙΓΓΟΥ ΑΝΤΡΕΑ',
    'ΚΧΑΛΕΝΤΙ ΜΠΑΤΡΑΣΙ ΜΑΡΙΑ',
    'ΚΩΝΣΤΑΝΤΙΝΟΥ ΧΡΙΣΤΟΣ',
    'ΝΤΙΝΟΥ ΣΕΛΕΝΑ ΑΝΤΡΕΕΑ',
    'ΠΑΝΑΓΙΩΤΟΥ ΜΑΡΙΝΑ',
    'ΧΑΤΖΗΓΙΑΣΟΥΜΗ ΜΑΡΙΝΟΣ',
    'ΧΡΙΣΤΟΦΟΡΟΥ ΔΗΜΗΤΡΗΣ'
  ];

  const [grades, setGrades] = useState({});

  const handleGradeChange = (student, type, index, value) => {
    const key = `${student}-${type}-${index}`;
    setGrades(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const calculateFinal = (student) => {
    // Διακόνισμα 40%
    const examGrade = parseFloat(grades[`${student}-exam-0`] || 0);
    
    // Ασκήσεις + Προφορικοί 60%
    let totalAP = 0;
    let countAP = 0;
    
    // Ασκήσεις
    for(let i = 0; i < 8; i++) {
      const grade = parseFloat(grades[`${student}-assignment-${i}`] || 0);
      if(grade > 0) {
        totalAP += grade;
        countAP++;
      }
    }
    
    // Προφορικοί
    for(let i = 0; i < 8; i++) {
      const grade = parseFloat(grades[`${student}-oral-${i}`] || 0);
      if(grade > 0) {
        totalAP += grade;
        countAP++;
      }
    }
    
    const avgAP = countAP > 0 ? totalAP / countAP : 0;
    const finalGrade = (examGrade * 0.4) + (avgAP * 0.6);
    
    return finalGrade.toFixed(1);
  };

  return (
    <div className="grade-container">
      <h2>Πίνακας Βαθμολογίας Β1</h2>
      <table className="grade-table">
        <thead>
          <tr>
            <th>Μαθητής</th>
            <th>Α</th><th>Α</th><th>Α</th><th>Α</th><th>Α</th><th>Α</th><th>Α</th><th>Α</th>
            <th>Π</th><th>Π</th><th>Π</th><th>Π</th><th>Π</th><th>Π</th><th>Π</th><th>Π</th>
            <th>Δ</th>
            <th>Τ</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, idx) => (
            <tr key={idx}>
              <td className="student-name">{student}</td>
              
              {/* Ασκήσεις */}
              {[...Array(8)].map((_, i) => (
                <td key={`a-${i}`}>
                  <input 
                    type="number" 
                    min="0" 
                    max="20" 
                    step="0.5"
                    className="grade-input"
                    value={grades[`${student}-assignment-${i}`] || ''}
                    onChange={(e) => handleGradeChange(student, 'assignment', i, e.target.value)}
                  />
                </td>
              ))}
              
              {/* Προφορικοί */}
              {[...Array(8)].map((_, i) => (
                <td key={`p-${i}`}>
                  <input 
                    type="number" 
                    min="0" 
                    max="20" 
                    step="0.5"
                    className="grade-input"
                    value={grades[`${student}-oral-${i}`] || ''}
                    onChange={(e) => handleGradeChange(student, 'oral', i, e.target.value)}
                  />
                </td>
              ))}
              
              {/* Διακόνισμα */}
              <td>
                <input 
                  type="number" 
                  min="0" 
                  max="20" 
                  step="0.5"
                  className="grade-input exam"
                  value={grades[`${student}-exam-0`] || ''}
                  onChange={(e) => handleGradeChange(student, 'exam', 0, e.target.value)}
                />
              </td>
              
              {/* Τελικός */}
              <td className="final-grade">
                {calculateFinal(student)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="legend">
        <strong>Α</strong>=Άσκηση | <strong>Π</strong>=Προφορικός | <strong>Δ</strong>=Διακόνισμα | <strong>Τ</strong>=Τελικός
        <br/>
        <small>Τελικός = (Δ × 40%) + (Μ.Ο. Α,Π × 60%)</small>
      </div>
    </div>
  );
};

export default GradeTable;
