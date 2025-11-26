import React, { useState, useEffect } from 'react';
import './CoteachingModal.css';

const CoteachingModal = ({ className, onClose }) => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);

  console.log('CoteachingModal rendered with className:', className);

  useEffect(() => {
    console.log('CoteachingModal useEffect triggered, className:', className);
    if (className) {
      loadStudents();
    }
  }, [className]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/coteaching-schedule.json');
      const data = await response.json();

      let classNames = [];
      // If it's a classic coteaching class (e.g., "B11+B32"), split it.
      if (className.includes('+')) {
        classNames = className.split('+').map(c => c.trim().toUpperCase());
      } else {
        // For single classes or special groups like "Γκατ_1 (Γ31)", treat the whole name as the identifier.
        // We will match against the student's class name.
        classNames = [className.trim().toUpperCase()];
      }

      console.log('CoteachingModal: Looking for classes:', classNames);

      // Filter students that belong to any of the coteaching classes
      // Skip the header row (first element)
      const filteredStudents = data.slice(1).filter(student => {
        const studentClass = student['4']; // Column "4" is "Τμήμα"
        if (!studentClass) return false; // Make comparison case-insensitive and trim whitespace
        return classNames.some(cls => studentClass.trim().toUpperCase() === cls.trim().toUpperCase());
      });

      console.log('CoteachingModal: Found students:', filteredStudents.length);

      // Sort by class and then by last name
      filteredStudents.sort((a, b) => {
        const classCompare = (a['4'] || '').localeCompare(b['4'] || '', 'el');
        if (classCompare !== 0) return classCompare;
        return (a['2'] || '').localeCompare(b['2'] || '', 'el'); // Column "2" is "Επίθετο"
      });

      setStudents(filteredStudents);

      // Initialize all students as present
      const initialAttendance = {};
      filteredStudents.forEach((student, index) => {
        initialAttendance[index] = true;
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (index) => {
    setAttendance(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!className) return null;

  return (
    <div className="coteaching-modal-backdrop" onClick={handleBackdropClick}>
      <div className="coteaching-modal">
        <div className="coteaching-modal-header">
          <h2>Συνδιδασκαλία - {className}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="coteaching-modal-content">
          {loading ? (
            <div className="loading-message">Φόρτωση μαθητών...</div>
          ) : students.length === 0 ? (
            <div className="no-students">Δεν βρέθηκαν μαθητές για αυτή τη συνδιδασκαλία</div>
          ) : (
            <div className="students-list">
              <div className="students-header">
                <div className="header-cell">Α/Α</div>
                <div className="header-cell">ΑΜ</div>
                <div className="header-cell">Επίθετο</div>
                <div className="header-cell">Όνομα</div>
                <div className="header-cell">Τμήμα</div>
                <div className="header-cell">Παρουσία</div>
              </div>

              {students.map((student, index) => (
                <div key={index} className={`student-row ${attendance[index] ? 'present' : 'absent'}`}>
                  <div className="student-cell">{index + 1}</div>
                  <div className="student-cell">{student['1']}</div>
                  <div className="student-cell">{student['2']}</div>
                  <div className="student-cell">{student['3']}</div>
                  <div className="student-cell">{student['4']}</div>
                  <div className="student-cell">
                    <label className="attendance-checkbox">
                      <input
                        type="checkbox"
                        checked={attendance[index] || false}
                        onChange={() => toggleAttendance(index)}
                      />
                      <span className="checkbox-label">
                        {attendance[index] ? '✓' : '✗'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="coteaching-modal-footer">
          <div className="attendance-summary">
            Παρόντες: {Object.values(attendance).filter(a => a).length} / {students.length}
          </div>
          <button className="print-btn" onClick={handlePrint}>
            🖨️ Εκτύπωση
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoteachingModal;
