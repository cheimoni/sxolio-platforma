// @FILE-INFO: DailyScheduleApp.js | /src/components/
// TYPE: Feature Component  
// LAYER: UI (Resource)
// SIZE: 285 lines (complex)
// EXPORTS: App (default), TeacherList, DailySchedulePreview

import React, { useState, useEffect, useRef } from 'react';

// CSS styles
const styles = `
.app-container {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.sidebar {
  width: 300px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  background-color: #fff;
}

.sidebar-header h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 18px;
}

.teacher-count {
  color: #666;
  font-size: 14px;
}

.teacher-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.letter-group {
  margin-bottom: 15px;
}

.letter-header {
  background-color: #e0e0e0;
  padding: 5px 10px;
  font-weight: bold;
  font-size: 14px;
  color: #555;
  border-radius: 4px;
  margin-bottom: 5px;
}

.teacher-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  margin: 2px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.teacher-item:hover {
  background-color: #e8f4f8;
}

.teacher-item.selected {
  background-color: #2196F3;
  color: white;
}

.teacher-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
  flex-shrink: 0;
}

.teacher-item.selected .teacher-avatar {
  background-color: rgba(255,255,255,0.2);
}

.teacher-name {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.teacher-index {
  font-size: 12px;
  color: #999;
  margin-left: 5px;
}

.teacher-item.selected .teacher-index {
  color: rgba(255,255,255,0.7);
}

.date-selector-container {
  background-color: white;
  border-top: 1px solid #ddd;
  padding: 15px;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
}

.date-selector-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.date-selector {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
}

.date-selector:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.preview-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-bottom: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-right: 15px;
}

.preview-name {
  font-size: 16px;
  color: #2196F3;
  font-weight: 500;
}

.preview-date {
  font-size: 14px;
  color: #666;
  margin-left: auto;
}

.preview-viewport {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.preview-scale {
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 16px;
}
`;

// Greek teachers names
const greekNames = [
  'ΑΛΕΞΑΝΔΡΟΥ ΧΡΙΣΤΙΝΑ',
  'ΑΝΤΩΝΙΟΥ ΝΙΚΗ',
  'ΑΝΤΩΝΙΟΥ ΣΤΕΛΛΑ',
  'ΑΝΤΩΝΟΥΡΗ ΑΝΝΑ',
  'ΒΑΣΙΛΕΙΟΥ ΗΛΙΑΣ',
  'ΓΑΒΡΙΗΛ ΑΦΡΟΥΛΑ',
  'ΓΕΩΡΓΙΟΥ ΕΥΘΥΜΙΑ',
  'ΓΕΩΡΓΙΟΥ ΜΑΡΙΑ',
  'ΓΙΑΝΝΑΚΟΥ ΑΝΤΡΗ',
  'ΔΗΜΗΤΡΙΑΔΟΥ ΣΑΛΤΕ ΒΑΛΕΝΤΙΝΑ',
  'ΔΡΟΣΟΠΟΥΛΟΥ ΚΩΝΣΤΑΝΤΙΝΑ',
  'ΕΥΑΓΓΕΛΟΥ ΧΡΙΣΤΟΥ ΧΡΙΣΤΙΑΝΑ',
  'ΕΥΑΓΟΡΟΥ ΕΥΑΓΟΡΑΣ',
  'ΕΥΜΗΔΟΥ ΑΝΤΡΗ',
  'ΕΥΡΙΠΙΔΟΥ ΜΙΧΑΗΛ',
  'ΕΥΣΤΑΘΙΟΥ ΤΑΣΟΣ',
  'ΖΑΝΤΗ ΑΙΜΙΛΙΑ',
  'ΖΑΧΑΡΙΑΔΗ ΜΥΡΩ',
  'ΘΕΟΔΟΥΛΟΥ ΟΛΓΑ',
  'ΘΕΟΦΑΝΟΥΣ ΣΑΒΒΑΣ',
  'ΙΩΑΚΕΙΜ ΙΩΑΚΕΙΜ',
  'ΙΩΑΝΝΟΥ ΞΕΝΙΑ',
  'ΙΩΑΝΝΟΥ ΑΝΘΟΥΛΑ',
  'ΚΑΓΙΑ ΕΥΓΕΝΙΑ',
  'ΚΟΝΗ ΛΙΖΑ',
  'ΚΟΥΑΛΗ ΕΛΕΝΑ',
  'ΚΟΥΜΗ ΑΝΑΣΤΑΣΙΑ',
  'ΚΟΥΝΤΟΥΡΗΣ ΚΥΡΙΑΚΟΣ',
  'ΚΟΥΣΟΥΛΟΥ ΓΕΩΡΓΙΑ',
  'ΚΡΑΣΙΔΟΥ ΠΕΡΣΕΦΟΝΗ',
  'ΚΥΠΡΙΑΝΟΥ Μ. ΜΑΡΙΑ',
  'ΚΥΡΙΑΚΟΥ ΝΕΔΗ',
  'ΚΩΝΣΤΑΝΤΙΝΙΔΗΣ ΠΑΝΑΓΙΩΤΗΣ',
  'ΚΩΝΣΤΑΝΤΙΝΟΥ ΔΕΣΠΩ',
  'ΛΟΙΖΙΑ ΛΕΥΚΗ',
  'ΛΟΥΚΑΙΔΗΣ ΓΙΩΡΓΟΣ',
  'ΜΑΚΡΗ ΑΜΑΛΙΑ',
  'ΜΑΡΚΙΔΟΥ ΣΤΕΦΑΝΗ',
  'ΜΑΡΚΟΥΛΗ ΑΝΤΡΗ',
  'ΜΙΧΑΗΛ ΠΑΝΑΓΙΩΤΑ',
  'ΝΕΟΦΥΤΟΥ ΓΕΩΡΓΙΟΥ ΘΕΟΝΙΤΣΑ',
  'ΝΙΚΗΦΟΡΟΥ ΜΑΡΙΑ',
  'ΝΙΚΟΥ ΧΡΙΣΤΑΚΗΣ',
  'ΞΕΝΟΦΩΝΤΟΣ ΜΑΡΙΑ',
  'ΟΔΥΣΣΕΩΣ ΕΥΡΙΔΙΚΗ',
  'ΟΙΚΟΝΟΜΙΔΟΥ ΜΥΡΙΑ',
  'ΟΡΦΑΝΙΔΟΥ ΔΩΡΑ',
  'ΠΑΝΑΓΙΩΤΟΥ ΑΔΕΛΙΝΑ',
  'ΠΑΝΑΓΙΩΤΟΥ ΔΗΜΗΤΡΙΟΣ',
  'ΠΑΝΑΓΙΩΤΟΥ ΕΛΕΝΗ',
  'ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ',
  'ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΝΑ',
  'ΠΕΡΙΚΛΕΟΥΣ ΓΙΩΡΓΟΥΛΑ',
  'ΠΕΤΡΟΥ ΑΓΓΕΛΑ',
  'ΠΙΤΣΙΛΛΟΣ ΧΡΙΣΤΟΣ',
  'ΠΟΙΗΤΑΡΗΣ ΕΥΑΓΟΡΑΣ',
  'ΣΒΑΝΑ ΚΑΛΙΑΝΑ',
  'ΣΟΛΟΜΩΝΙΔΟΥ ΕΥΤΥΧΙΑ',
  'ΣΠΥΡΙΔΩΝΟΣ ΜΑΡΙΑ',
  'ΣΤΑΣΟΥΛΛΗ ΧΑΡΙΚΛΕΙΑ',
  'ΣΥΚΟΠΕΤΡΙΤΗΣ ΙΩΑΚΕΙΜ',
  'ΣΩΤΗΡΙΑΔΟΥ ΚΙΝΝΗ ΜΑΡΙΑ',
  'ΤΕΡΖΗ ΑΝΝΑ',
  'ΤΡΥΓΩΝΑΚΗ ΜΑΡΙΑ',
  'ΦΕΛΛΑ ΟΡΦΕΑΣ',
  'ΧΑΡΑΛΑΜΠΟΥΣ ΘΑΣΟΣ',
  'ΧΑΤΖΗΝΙΚΟΛΑΟΥ ΓΕΩΡΓΙΑ',
  'ΧΕΙΛΙΜΙΝΔΡΗ ΑΥΓΗ',
  'ΧΕΙΜΩΝΙΔΗΣ ΓΙΩΡΓΟΣ',
  'ΧΟΥΒΑΡΤΑ ΧΡΥΣΗ',
  'ΧΡΙΣΤΟΥ ΓΙΑΝΝΗΣ',
  'ΧΡΙΣΤΟΥ ΕΥΔΟΚΙΑ',
  'ΧΡΙΣΤΟΥ ΠΡΟΔΡΟΜΟΣ',
  'ΧΡΙΣΤΟΦΗ ΑΝΘΗ'
];

// Days of the week in Greek
const daysOfWeek = [
  { value: 'monday', label: 'Δευτέρα' },
  { value: 'tuesday', label: 'Τρίτη' },
  { value: 'wednesday', label: 'Τετάρτη' },
  { value: 'thursday', label: 'Πέμπτη' },
  { value: 'friday', label: 'Παρασκευή' }
];

// Mock function to extract daily schedule for a teacher
const extractDailySchedule = (teacherName, day) => {
  // This would normally parse the HTML file and extract the specific day's schedule
  const mockSchedule = {
    'ΑΛΕΞΑΝΔΡΟΥ ΧΡΙΣΤΙΝΑ': {
      monday: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h3>ΑΛΕΞΑΝΔΡΟΥ ΧΡΙΣΤΙΝΑ - Δευτέρα</h3>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr><th>Ώρα</th><th>Μάθημα</th><th>Τμήμα</th><th>Αίθουσα</th></tr>
            <tr><td>2η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Γ52+Γ53_Κ</td><td>Γηπ2</td></tr>
            <tr><td>3η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Α11+Α32_Κ</td><td>Γηπ2</td></tr>
            <tr><td>4η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Α31+Α32_Κ</td><td>Γηπ2</td></tr>
            <tr><td>5η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Α11+Α32_Κ</td><td>Γηπ2</td></tr>
            <tr><td>8η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Γ52+Γ53_Κ</td><td>Γηπ2</td></tr>
          </table>
        </div>
      `,
      tuesday: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h3>ΑΛΕΞΑΝΔΡΟΥ ΧΡΙΣΤΙΝΑ - Τρίτη</h3>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr><th>Ώρα</th><th>Μάθημα</th><th>Τμήμα</th><th>Αίθουσα</th></tr>
            <tr><td>2η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Γ1+Γ31+Γ32_Κ1</td><td>Γηπ2</td></tr>
            <tr><td>3η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Α21+Α22_Κ</td><td>Γηπ2</td></tr>
            <tr><td>4η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Α11+Α43_Κ</td><td>Γηπ2</td></tr>
            <tr><td>5η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Α33+Α51+Α52_Κ</td><td>Γηπ2</td></tr>
            <tr><td>6η</td><td>Φυσική Αγωγή Κοριτσιών</td><td>Γυμ Γ41+Γ51_Κ</td><td>Γηπ2</td></tr>
          </table>
        </div>
      `
    },
    'ΑΝΤΩΝΙΟΥ ΝΙΚΗ': {
      monday: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h3>ΑΝΤΩΝΙΟΥ ΝΙΚΗ - Δευτέρα</h3>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr><th>Ώρα</th><th>Μάθημα</th><th>Τμήμα</th><th>Αίθουσα</th></tr>
            <tr><td>5η</td><td>Πληροφορική (Α')</td><td>Α11_ΠΤ_Π</td><td>Γ133</td></tr>
            <tr><td>6η</td><td>Πληροφορική (Α')</td><td>Α21_ΠΦ_Π</td><td>Γ133</td></tr>
            <tr><td>8η</td><td>Πληροφορική (Α')</td><td>Α31</td><td>Γ133</td></tr>
          </table>
        </div>
      `,
      tuesday: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h3>ΑΝΤΩΝΙΟΥ ΝΙΚΗ - Τρίτη</h3>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr><th>Ώρα</th><th>Μάθημα</th><th>Τμήμα</th><th>Αίθουσα</th></tr>
            <tr><td>4η</td><td>Πληροφορική (Α')</td><td>Α11_ΤΠ_Π</td><td>Γ133</td></tr>
            <tr><td>5η</td><td>Πληροφορική (Α')</td><td>Α31</td><td>Γ133</td></tr>
            <tr><td>6η</td><td>Πληροφορική (Α')</td><td>Α11_ΤΠ_Π</td><td>Γ133</td></tr>
            <tr><td>7η</td><td>Πληροφορική (Α')</td><td>Α21_ΠΦ_Π</td><td>Γ133</td></tr>
          </table>
        </div>
      `
    }
  };

  const teacher = mockSchedule[teacherName];
  if (!teacher || !teacher[day]) {
    return `
      <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center; color: #666;">
        <h3>${teacherName} - ${daysOfWeek.find(d => d.value === day)?.label}</h3>
        <p>Δεν βρέθηκε πρόγραμμα για αυτή την ημέρα.</p>
      </div>
    `;
  }

  return teacher[day];
};

// TeacherList Component
const TeacherList = ({ teachers, onTeacherClick, selectedTeacher }) => {
  // Sort teachers alphabetically
  const sortedTeachers = [...teachers].sort((a, b) => a.localeCompare(b, 'el'));
  
  // Group teachers by first letter
  const groupedTeachers = sortedTeachers.reduce((groups, teacher) => {
    const firstLetter = teacher.charAt(0).toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(teacher);
    return groups;
  }, {});

  const handleTeacherClick = (teacherName) => {
    onTeacherClick(teacherName);
  };

  return (
    <div className="teacher-list">
      {Object.keys(groupedTeachers).sort().map(letter => (
        <div key={letter} className="letter-group">
          <div className="letter-header">{letter}</div>
          {groupedTeachers[letter].map((name, index) => (
            <div
              key={`${letter}-${index}`}
              className={`teacher-item ${selectedTeacher === name ? 'selected' : ''}`}
              onClick={() => handleTeacherClick(name)}
              title={name}
            >
              <span className="teacher-avatar">
                {name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(part => part.charAt(0))
                  .join('')}
              </span>
              <span className="teacher-name">{name}</span>
              <span className="teacher-index">{sortedTeachers.indexOf(name) + 1}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// DailySchedulePreview Component
const DailySchedulePreview = ({ teacherName, selectedDay }) => {
  const [scheduleHtml, setScheduleHtml] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    if (teacherName && selectedDay) {
      const dailySchedule = extractDailySchedule(teacherName, selectedDay);
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif; 
              background-color: #f9f9f9;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              background-color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th, td { 
              padding: 12px; 
              text-align: left; 
              border: 1px solid #ddd; 
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            h3 {
              color: #333;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>${dailySchedule}</body>
        </html>
      `;
      setScheduleHtml(fullHtml);
    } else {
      setScheduleHtml('');
    }
  }, [teacherName, selectedDay]);

  if (!teacherName || !selectedDay) {
    return (
      <div className="no-selection">
        Επιλέξτε καθηγητή και ημέρα για να δείτε το πρόγραμμα
      </div>
    );
  }

  return (
    <div className="preview-scale">
      <iframe
        ref={iframeRef}
        srcDoc={scheduleHtml}
        title="Daily schedule preview"
        className="preview-iframe"
      />
    </div>
  );
};

// Main App Component
const App = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedDay, setSelectedDay] = useState('monday');

  const handleTeacherClick = (teacherName) => {
    setSelectedTeacher(teacherName);
  };

  const handleDayChange = (event) => {
    setSelectedDay(event.target.value);
  };

  const selectedDayLabel = daysOfWeek.find(day => day.value === selectedDay)?.label;

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>Καθηγητές</h3>
            <div className="teacher-count">
              {greekNames.length} ονόματα
            </div>
          </div>
          
          <TeacherList 
            teachers={greekNames}
            onTeacherClick={handleTeacherClick}
            selectedTeacher={selectedTeacher}
          />
          
          <div className="date-selector-container">
            <label className="date-selector-label">
              Επιλογή Ημέρας:
            </label>
            <select 
              className="date-selector"
              value={selectedDay}
              onChange={handleDayChange}
            >
              {daysOfWeek.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="main-content">
          <div className="preview-container">
            <div className="preview-header">
              <span className="preview-title">Ημερήσιο Πρόγραμμα</span>
              <span className="preview-name">
                {selectedTeacher || '—'}
              </span>
              {selectedTeacher && (
                <span className="preview-date">
                  {selectedDayLabel}
                </span>
              )}
            </div>
            <div className="preview-viewport">
              <DailySchedulePreview 
                teacherName={selectedTeacher}
                selectedDay={selectedDay}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;