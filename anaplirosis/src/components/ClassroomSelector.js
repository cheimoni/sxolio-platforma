// @FILE-INFO: ClassroomSelector.js | /src/components/
// TYPE: Feature Component
// LAYER: UI (Resource)
// EXPORTS: ClassroomSelector (default)

import React, { useState, useEffect } from 'react';
import './ClassroomSelector.css';

const ClassroomSelector = ({ absentTeachers, onClassroomSelect, onClose }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Κρύψε τα 3 draggable παράθυρα όταν ανοίγει το ClassroomSelector
  useEffect(() => {
    const teacherScheduleCard = document.querySelector('.schedule-card');
    const newWindow = document.querySelector('.new-window');
    const availabilityCard = document.querySelector('.availability-card');

    const previousStates = {
      teacherSchedule: teacherScheduleCard ? teacherScheduleCard.style.display : '',
      newWindow: newWindow ? newWindow.style.display : '',
      availability: availabilityCard ? availabilityCard.style.display : ''
    };

    if (teacherScheduleCard) teacherScheduleCard.style.display = 'none';
    if (newWindow) newWindow.style.display = 'none';
    if (availabilityCard) availabilityCard.style.display = 'none';

    return () => {
      if (teacherScheduleCard) teacherScheduleCard.style.display = previousStates.teacherSchedule || 'block';
      if (newWindow) newWindow.style.display = previousStates.newWindow || 'block';
      if (availabilityCard) availabilityCard.style.display = previousStates.availability || 'block';
    };
  }, []);

  useEffect(() => {
    // Συλλέγει όλα τα τμήματα από τους απόντες καθηγητές
    const extractClassrooms = () => {
      const classroomSet = new Set();

      if (absentTeachers && absentTeachers.length > 0) {
        absentTeachers.forEach(teacher => {
          if (teacher.periods && Array.isArray(teacher.periods)) {
            teacher.periods.forEach(period => {
              // Προσπαθούμε να πάρουμε το τμήμα από το period.class
              let className = period.class;
              
              // Αν δεν υπάρχει, εξάγουμε από το subject
              if (!className && period.subject) {
                // Το τμήμα είναι στην αρχή ή μέσα σε παρενθέσεις
                // Pattern 1: Στήριξη με space (π.χ. "Στ. 17 (Α24)" → "Α24")
                let classMatch = period.subject.match(/^Στ\.\s*\d+\s*\(([ΑΒΓ][0-9]+)\)/);
                
                if (!classMatch) {
                  // Pattern 1b: Στήριξη με Ο. (π.χ. "Στ.Ο.6 (Β51)" → "Β51")
                  classMatch = period.subject.match(/^Στ\.(?:Ο\.)?\d+\s*\(([ΑΒΓ][0-9]+)\)/);
                }
                
                // Pattern 2: Τμήμα σε παρενθέσεις
                if (!classMatch) {
                  classMatch = period.subject.match(/\(([ΑΒΓ][0-9]+(?:_[Α-Ω]+(?:_[Α-Ω]+)?)?)\)/);
                }
                // Pattern 3: Συνδιδασκαλία με underscore
                if (!classMatch) {
                  classMatch = period.subject.match(/^([ΑΒΓ][0-9]+_[Α-Ω]+(?:_[Α-Ω]+)?)/);
                }
                // Pattern 4: Τμήμα με space
                if (!classMatch) {
                  classMatch = period.subject.match(/^([ΑΒΓ][0-9]+)\s/);
                }
                // Pattern 5: Τμήμα χωρίς space
                if (!classMatch) {
                  classMatch = period.subject.match(/^([ΑΒΓ][0-9]+)/);
                }
                if (classMatch) {
                  className = classMatch[1];
                }
              }
              
              if (className) {
                classroomSet.add(className);
              }
            });
          }
        });
      }

      const classroomList = Array.from(classroomSet).sort((a, b) =>
        a.localeCompare(b, 'el')
      );

      setClassrooms(classroomList);
      setLoading(false);
    };

    extractClassrooms();
  }, [absentTeachers]);

  const getClassroomFilePath = (className) => {
    // Χρησιμοποιούμε JSON αρχεία για σωστό encoding

    // Αν το τμήμα περιέχει underscore (συνδιδασκαλία)
    // ΠΡΟΣΟΧΗ: "Γκατ_1", "Γκατ_2" κλπ είναι ΤΜΗΜΑΤΑ, όχι συνδιδασκαλίες!
    // Οι συνδιδασκαλίες έχουν format "Α11_ΠΤ_Π" (τμήμα_μάθημα_μάθημα)
    if (className && className.includes('_')) {
      // Ελέγχουμε αν είναι πραγματική συνδιδασκαλία (π.χ. "Α11_ΠΤ_Π")
      // ή τμήμα με underscore (π.χ. "Γκατ_1")
      const isRealCoteaching = /^[ΑΒΓ][0-9]+_[Α-Ω]+(_[Α-Ω]+)?$/.test(className);
      if (isRealCoteaching) {
        return '/students-sindidaskalia.json';
      }
      // Αν είναι "Γκατ_1" ή παρόμοιο, είναι τμήμα, όχι συνδιδασκαλία
    }
    
    // Κανονικά τμήματα
    if (className && /^[ΑΒΓ][0-9]+$/.test(className)) {
      return '/students-all.json';
    }
    
    // Default: όλα τα τμήματα
    return '/students-all.json';
  };

  const handleClassroomClick = (classroom) => {
    const filePath = getClassroomFilePath(classroom);
    if (filePath) {
      onClassroomSelect(classroom, filePath);
    } else {
      alert(`Δεν βρέθηκε αρχείο καταλόγου για το τμήμα ${classroom}`);
    }
  };

  if (loading) {
    return (
      <div className="classroom-selector">
        <div className="selector-header">
          <h2>Φόρτωση τμημάτων...</h2>
          {onClose && (
            <button onClick={onClose} className="close-selector-btn">
              ✕ Κλείσιμο
            </button>
          )}
        </div>
      </div>
    );
  }

  if (classrooms.length === 0) {
    return (
      <div className="classroom-selector">
        <div className="selector-header">
          <h2>Επιλογή Τμήματος</h2>
          {onClose && (
            <button onClick={onClose} className="close-selector-btn">
              ✕ Κλείσιμο
            </button>
          )}
        </div>
        <div className="no-classrooms">
          <p>Δεν βρέθηκαν τμήματα με απόντες καθηγητές.</p>
          <p className="hint">Προσθέστε πρώτα καθηγητές στη λίστα απουσιών.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="classroom-selector">
      <div className="selector-header">
        <h2>Επιλέξτε Τμήμα για Απουσιολόγιο</h2>
        {onClose && (
          <button onClick={onClose} className="close-selector-btn">
            ✕ Κλείσιμο
          </button>
        )}
      </div>

      <div className="selector-info">
        <p>Τμήματα με απόντες καθηγητές: <strong>{classrooms.length}</strong></p>
      </div>

      <div className="classrooms-grid">
        {classrooms.map((classroom, index) => (
          <div
            key={index}
            className="classroom-card"
            onClick={() => handleClassroomClick(classroom)}
            onContextMenu={(e) => {
              e.preventDefault(); // Αποτρέπει το default context menu
              handleClassroomClick(classroom);
            }}
          >
            <div className="classroom-icon">📚</div>
            <div className="classroom-name">{classroom}</div>
            <div className="classroom-action">
              Άνοιγμα Απουσιολογίου →
              <span className="right-click-hint"> (ή δεξί κλικ)</span>
            </div>
          </div>
        ))}
      </div>

      <div className="selector-footer">
        <p className="info-text">
          💡 Κάντε αριστερό ή <strong>δεξί κλικ</strong> σε ένα τμήμα για να ανοίξετε το απουσιολόγιο μαθητών
        </p>
      </div>
    </div>
  );
};

export default ClassroomSelector;
