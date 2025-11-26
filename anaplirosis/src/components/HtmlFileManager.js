// @FILE-INFO: HtmlFileManager.js | /src/components/
// TYPE: Feature Component
// LAYER: UI (Resource)
// SIZE: 185 lines (complex)
// EXPORTS: HtmlFileManager (default)

import React, { useState, useEffect } from 'react';
import TeacherList from './TeacherList';
import TeacherSchedulePreview from './TeacherSchedulePreview';
import StudentAttendanceList from './StudentAttendanceList';
import './HtmlFileManager.css';

const HtmlFileManager = ({ onNamesExtracted }) => {
  const [fileContent, setFileContent] = useState('');
  const [teacherNames, setTeacherNames] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('teachers'); // 'teachers' or 'students'
  const [selectedStudentFile, setSelectedStudentFile] = useState(null);

  // Λίστα HTML αρχείων που έχουμε
  const availableFiles = [
    {
      name: 'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΚΑΘΗΓΗΤΗ.html',
      path: 'data_se exel/ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΚΑΘΗΓΗΤΗ.html',
      description: 'Πρόγραμμα καθηγητή',
      type: 'teacher'
    },
    {
      name: 'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΜΑΘΗΤΗ.html',
      path: 'data_se exel/ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΜΑΘΗΤΗ.html',
      description: 'Ατομικό πρόγραμμα μαθητή',
      type: 'teacher'
    },
    {
      name: 'ΠΡΟΓΡΑΜΜΑ ΑΙΘΟΥΣΑΣ.html',
      path: 'data_se exel/ΠΡΟΓΡΑΜΜΑ ΑΙΘΟΥΣΑΣ.html',
      description: 'Πρόγραμμα αίθουσας',
      type: 'teacher'
    },
    {
      name: 'Συνδιδασκαλία.html',
      path: 'data_se exel/Συνδιδασκαλία.html',
      description: 'Συνδιδασκαλία',
      type: 'teacher'
    }
  ];

  // Λίστα αρχείων συνδιδασκαλίας με μαθητές
  const studentFiles = [
    {
      name: 'Α11_ΠΤ_Π (Συνδιδασκαλία 1)',
      path: 'sindidaskalia_1/index.html',
      description: 'Κατάλογος μαθητών Α11'
    }
  ];

  // Διαβάζει το περιεχόμενο ενός HTML αρχείου
  const readHtmlFile = async (filePath) => {
    setLoading(true);
    try {
      const response = await fetch(filePath);
      if (response.ok) {
        const content = await response.text();
        setFileContent(content);
        
        // Εξάγει ονόματα καθηγητών από το HTML
        const extractedNames = extractTeacherNames(content);
        setTeacherNames(extractedNames);
      } else {
        console.error('Δεν μπόρεσα να διαβάσω το αρχείο:', filePath);
      }
    } catch (error) {
      console.error('Σφάλμα κατά την ανάγνωση:', error);
    } finally {
      setLoading(false);
    }
  };

  // Εξάγει ονόματα καθηγητών από το HTML περιεχόμενο
  const extractTeacherNames = (htmlContent) => {
    const foundNames = new Set();

    // Βοηθητικό: αγνοεί προφανείς μη-ονόματα
    const stopwords = new Set([
      'ΛΥΚΕΙΟ', 'ΑΙΘΟΥΣΑ', 'ΑΙΘΟΥΣΑΣ', 'ΠΡΟΓΡΑΜΜΑ', 'ΣΧΟΛΙΚΗ', 'ΧΡΟΝΙΑ', 'ΜΑΘΗΤΗ', 'ΚΑΘΗΓΗΤΗ', 'ΣΤΟΙΧΕΙΑ', 'ΗΜΕΡΑ', 'ΩΡΑ', 'ΤΜΗΜΑ', 'ΜΑΘΗΜΑ', 'ΣΥΝΔΙΔΑΣΚΑΛΙΑ'
    ]);

    const pushIfName = (text) => {
      const cleaned = text.replace(/\s+/g, ' ').trim();
      const parts = cleaned.split(' ');
      if (parts.length === 2) {
        const [first, last] = parts;
        if (!stopwords.has(first) && !stopwords.has(last)) {
          foundNames.add(cleaned);
        }
      }
    };

    // Patterns: bolded, labeled, and γενικό κεφαλαία διπλής λέξης
    const patterns = [
      /ΣΤΟΙΧΕΙΑ\s+ΚΑΘΗΓΗΤΗ:\s*<b>([Α-ΩΆΈΉΊΌΎΏΪΫ\s]+)<\/b>/g, // με bold
      /ΣΤΟΙΧΕΙΑ\s+ΚΑΘΗΓΗΤΗ:\s*([Α-ΩΆΈΉΊΌΎΏΪΫ]{2,}\s+[Α-ΩΆΈΉΊΌΎΏΪΫ]{2,})/g, // χωρίς bold
      /<b>([Α-ΩΆΈΉΊΌΎΏΪΫ]{2,}\s+[Α-ΩΆΈΉΊΌΎΏΪΫ]{2,})<\/b>/g,
      /\b([Α-ΩΆΈΉΊΌΎΏΪΫ]{2,}\s+[Α-ΩΆΈΉΊΌΎΏΪΫ]{2,})\b/g
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(htmlContent)) !== null) {
        const candidate = (match[1] || match[0]).toUpperCase();
        pushIfName(candidate);
      }
    });

    return Array.from(foundNames);
  };

  // Εξαγωγή ονομάτων από όλα τα διαθέσιμα αρχεία
  const extractAllTeacherNames = async () => {
    setLoading(true);
    try {
      const allNames = new Set();
      for (const file of availableFiles) {
        try {
          const response = await fetch(file.path);
          if (response.ok) {
            const content = await response.text();
            const names = extractTeacherNames(content);
            names.forEach((n) => allNames.add(n));
          }
        } catch (e) {
          // ignore single-file failures
        }
      }
      const namesArray = Array.from(allNames).sort((a, b) => a.localeCompare(b, 'el'));
      setTeacherNames(namesArray);
      // Αποθήκευση για χρήση από την εφαρμογή
      try {
        localStorage.setItem('extractedTeacherNames', JSON.stringify(namesArray));
      } catch (_) {}
      // Ενημέρωση γονέα για άμεση ανανέωση λίστας
      try {
        if (onNamesExtracted) {
          onNamesExtracted(namesArray);
        }
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  // Χειρισμός επιλογής καθηγητή
  const handleTeacherClick = (teacherName) => {
    setSelectedTeacher(teacherName);
  };

  // Χειρισμός επιλογής ημέρας
  const handleDayChange = (day) => {
    console.log('Day changed to:', day); // Debug log
    setSelectedDay(day);
  };

  // Χειρισμός επιλογής αρχείου μαθητών - ανοίγει απευθείας τη λίστα παρουσιών
  const handleStudentFileClick = (filePath) => {
    setSelectedStudentFile(filePath);
    setViewMode('students');
  };

  // Φόρτωση ονομάτων κατά την εκκίνηση
  useEffect(() => {
    extractAllTeacherNames();
  }, []);

  // Εμφανίζει το HTML περιεχόμενο σε iframe
  const renderHtmlContent = () => {
    if (!fileContent) return null;

    return (
      <div className="html-viewer">
        <div className="viewer-header">
          <h3>Προεπισκόπηση Αρχείου</h3>
          <button 
            className="close-btn"
            onClick={() => setFileContent('')}
          >
            ✕
          </button>
        </div>
        <iframe
          srcDoc={fileContent}
          title="HTML Preview"
          className="html-iframe"
        />
      </div>
    );
  };

  // Εμφανίζει τα εξαγόμενα ονόματα
  const renderTeacherNames = () => {
    if (teacherNames.length === 0) return null;

    return (
      <div className="teacher-names">
        <h3>Εξαγόμενα Ονόματα Καθηγητών:</h3>
        <ul>
          {teacherNames.map((name, index) => (
            <li key={index} className="teacher-name-item">
              {name}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="html-file-manager">
      <div className="manager-header">
        <h2>Διαχείριση HTML Αρχείων</h2>
        <p>Διαβάστε και διαχειριστείτε τα HTML αρχεία με τα προγράμματα καθηγητών και καταλόγους μαθητών</p>
      </div>

      {/* Main Content Area */}
      <div className="main-content-area">

        {/* Show Student Attendance when a file is selected */}
        {viewMode === 'students' && selectedStudentFile ? (
          <StudentAttendanceList
            htmlFilePath={selectedStudentFile}
            onClose={() => {
              setViewMode('teachers');
              setSelectedStudentFile(null);
            }}
          />
        ) : (
          <>
            {/* Teacher List Sidebar με Day Selector */}
            {viewMode === 'teachers' && teacherNames.length > 0 && (
              <TeacherList
                teachers={teacherNames}
                onTeacherClick={handleTeacherClick}
                onDayChange={handleDayChange}
                selectedDay={selectedDay}
                isExpanded={false}
              />
            )}

            {/* Debug info */}
            {viewMode === 'teachers' && (
              <div style={{position: 'fixed', top: '10px', right: '10px', background: 'yellow', padding: '5px', fontSize: '12px'}}>
                Current Day: {selectedDay}
              </div>
            )}

            {/* Teacher Schedule Preview */}
            {viewMode === 'teachers' && selectedTeacher && (
              <TeacherSchedulePreview
                teacherName={selectedTeacher}
                selectedDay={selectedDay}
              />
            )}

            {/* File Management Section - Always visible unless viewing attendance */}
            <div className="file-management-section">
          {/* Student Files - Καταλόγοι Μαθητών */}
          <div className="file-list">
            <h3>Καταλόγοι Μαθητών (Παρουσίες):</h3>
            {studentFiles.map((file, index) => (
              <div key={index} className="file-item student-file-item">
                <div className="file-info">
                  <h4>{file.name}</h4>
                  <p>{file.description}</p>
                </div>
                <div className="file-actions">
                  <button
                    className="read-btn student-attendance-btn"
                    onClick={() => handleStudentFileClick(file.path)}
                  >
                    Άνοιγμα Λίστας Παρουσιών
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Teacher Files - Προγράμματα Καθηγητών */}
          <div className="file-list">
            <h3>Προγράμματα Καθηγητών:</h3>
            {availableFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <h4>{file.name}</h4>
                  <p>{file.description}</p>
                </div>
                <div className="file-actions">
                  <button
                    className="read-btn"
                    onClick={() => readHtmlFile(file.path)}
                    disabled={loading}
                  >
                    {loading ? 'Διαβάζει...' : 'Διάβασε Αρχείο'}
                  </button>
                  <button
                    className="read-btn"
                    onClick={extractAllTeacherNames}
                    disabled={loading}
                    title="Εξαγωγή ονομάτων από όλα τα αρχεία"
                  >
                    {loading ? 'Εξαγωγή...' : 'Εξαγωγή όλων των ονομάτων'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="loading">
              <p>Διαβάζει το αρχείο...</p>
            </div>
          )}

          <div style={{ padding: '8px 0' }}>
            {teacherNames.length > 0 && (
              <div className="teacher-count">Βρέθηκαν {teacherNames.length} ονόματα</div>
            )}
          </div>
          
          {renderTeacherNames()}
          {renderHtmlContent()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HtmlFileManager;