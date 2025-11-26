import React, { useState, useEffect } from 'react';
import './TeacherScheduleViewer.css';

const TeacherScheduleViewer = () => {
  const [teacherSchedules, setTeacherSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    const loadTeacherSchedules = async () => {
      try {
        setLoading(true);
        const response = await fetch('/ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΚΑΘΗΓΗΤΗ.html');
        const htmlContent = await response.text();
        
        // Parse HTML content to extract teacher schedules
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        const schedules = [];
        
        // Find all teacher sections
        const sections = doc.querySelectorAll('p');
        sections.forEach(section => {
          const text = section.textContent;
          if (text.includes('ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:')) {
            const match = text.match(/ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:\s*<b>([^<]+)<\/b>/);
            if (match) {
              const teacherName = match[1].trim();
              
              // Find the table that follows this section
              let nextElement = section.nextElementSibling;
              while (nextElement && nextElement.tagName !== 'TABLE') {
                nextElement = nextElement.nextElementSibling;
              }
              
              if (nextElement && nextElement.tagName === 'TABLE') {
                const schedule = parseTeacherSchedule(nextElement, teacherName);
                if (schedule) {
                  schedules.push(schedule);
                }
              }
            }
          }
        });
        
        setTeacherSchedules(schedules);
        setLoading(false);
      } catch (err) {
        console.error('Error loading teacher schedules:', err);
        setError('Σφάλμα φόρτωσης ατομικών προγραμμάτων');
        setLoading(false);
      }
    };

    loadTeacherSchedules();
  }, []);

  const parseTeacherSchedule = (table, teacherName) => {
    try {
      const schedule = {
        teacher: teacherName,
        days: {}
      };

      const rows = table.querySelectorAll('tr');
      let currentDay = '';
      
      rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const firstCell = cells[0]?.textContent?.trim();
          const secondCell = cells[1]?.textContent?.trim();
          
          // Check if this is a day header
          if (firstCell && ['ΔΕΥΤΕΡΑ', 'ΤΡΙΤΗ', 'ΤΕΤΑΡΤΗ', 'ΠΕΜΠΤΗ', 'ΠΑΡΑΣΚΕΥΗ'].includes(firstCell.toUpperCase())) {
            currentDay = firstCell.toUpperCase();
            schedule.days[currentDay] = {};
          }
          
          // Check if this is a period row
          if (firstCell && /^\d+$/.test(firstCell) && currentDay) {
            const period = parseInt(firstCell);
            const subject = secondCell || '-';
            schedule.days[currentDay][period] = subject;
          }
        }
      });

      return schedule;
    } catch (err) {
      console.error('Error parsing schedule for teacher:', teacherName, err);
      return null;
    }
  };

  const getDayName = (day) => {
    const dayNames = {
      'ΔΕΥΤΕΡΑ': 'Δευτέρα',
      'ΤΡΙΤΗ': 'Τρίτη', 
      'ΤΕΤΑΡΤΗ': 'Τετάρτη',
      'ΠΕΜΠΤΗ': 'Πέμπτη',
      'ΠΑΡΑΣΚΕΥΗ': 'Παρασκευή'
    };
    return dayNames[day] || day;
  };

  if (loading) {
    return (
      <div className="teacher-schedule-viewer">
        <div className="loading">Φόρτωση ατομικών προγραμμάτων...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-schedule-viewer">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="teacher-schedule-viewer">
      <h2>Ατομικά Προγράμματα Καθηγητών</h2>
      
      <div className="teacher-list">
        {teacherSchedules.map((schedule, index) => (
          <div 
            key={index} 
            className={`teacher-card ${selectedTeacher === schedule.teacher ? 'selected' : ''}`}
            onClick={() => setSelectedTeacher(selectedTeacher === schedule.teacher ? null : schedule.teacher)}
          >
            <h3>{schedule.teacher}</h3>
            <div className="teacher-summary">
              {Object.keys(schedule.days).length} ημέρες προγραμματισμένες
            </div>
          </div>
        ))}
      </div>

      {selectedTeacher && (
        <div className="schedule-detail">
          <h3>Πρόγραμμα: {selectedTeacher}</h3>
          <div className="schedule-table">
            <table>
              <thead>
                <tr>
                  <th>Ημέρα</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                    <th key={period}>{period}η</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(teacherSchedules.find(s => s.teacher === selectedTeacher)?.days || {})
                  .filter(([day]) => {
                    // Φιλτράρισμα για να δείχνει μόνο την τρέχουσα ημέρα
                    const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
                    const today = new Date().getDay();
                    const currentDay = dayNames[today];
                    return getDayName(day) === currentDay;
                  })
                  .map(([day, periods]) => (
                  <tr key={day}>
                    <td className="day-cell">{getDayName(day)}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                      <td key={period} className="period-cell">
                        {periods[period] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherScheduleViewer;

