import React, { useState, useEffect } from 'react';
import './MainWindow.css';

const UnifiedScheduleViewer = ({
  selectedDate,
  viewType, // 'teacher', 'student', 'class', 'classroom'
  selectedItem, // teacher name, student ID, class name, or classroom name
  onClose
}) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (selectedItem && viewType) {
      loadScheduleData();
    }
  }, [selectedItem, viewType]);

  const loadScheduleData = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (viewType) {
        case 'teacher':
          await loadTeacherSchedule();
          break;
        case 'student':
          await loadStudentSchedule();
          break;
        case 'class':
          await loadClassSchedule();
          break;
        case 'classroom':
          await loadClassroomSchedule();
          break;
        default:
          setError('Άγνωστος τύπος προβολής');
      }
    } catch (err) {
      setError('Σφάλμα φόρτωσης δεδομένων');
      console.error('Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherSchedule = async () => {
    const response = await fetch('/teachers.json');
    const teachers = await response.json();

    const teacher = teachers.find(t =>
      t.καθηγητής.toUpperCase().trim() === selectedItem.toUpperCase().trim()
    );

    if (teacher) {
      setScheduleData(teacher.πρόγραμμα);
      setDisplayName(`Καθηγητής: ${teacher.καθηγητής}`);
    } else {
      setError(`Δεν βρέθηκε καθηγητής: ${selectedItem}`);
    }
  };

  const loadStudentSchedule = async () => {
    const response = await fetch('/mathites/export_20251102_024727.json');
    const studentsData = await response.json();

    // Find student by matching the Source field
    const studentRows = studentsData.filter(row =>
      row.Source && row.Source.includes(selectedItem)
    );

    if (studentRows.length > 0) {
      const studentName = studentRows[0].Source;
      const schedule = parseStudentSchedule(studentRows);
      setScheduleData(schedule);
      setDisplayName(`Μαθητής: ${studentName}`);
    } else {
      setError(`Δεν βρέθηκε μαθητής: ${selectedItem}`);
    }
  };

  const loadClassSchedule = async () => {
    // Load all teachers and find classes with this name
    const response = await fetch('/teachers.json');
    const teachers = await response.json();

    const classSchedule = buildClassSchedule(teachers, selectedItem);
    setScheduleData(classSchedule);
    setDisplayName(`Τμήμα: ${selectedItem}`);
  };

  const loadClassroomSchedule = async () => {
    const response = await fetch('/aithouses/export_20251102_024634.json');
    const classroomData = await response.json();

    const classroomRows = classroomData.filter(row =>
      row.Source && row.Source === selectedItem
    );

    if (classroomRows.length > 0) {
      const schedule = parseClassroomSchedule(classroomRows);
      setScheduleData(schedule);
      setDisplayName(`Αίθουσα: ${selectedItem}`);
    } else {
      setError(`Δεν βρέθηκε αίθουσα: ${selectedItem}`);
    }
  };

  const parseStudentSchedule = (rows) => {
    const schedule = {
      'Δευτέρα': {},
      'Τρίτη': {},
      'Τετάρτη': {},
      'Πέμπτη': {},
      'Παρασκευή': {}
    };

    rows.forEach(row => {
      const period = row['0'];
      if (period && typeof period === 'number') {
        // For each day (1-5 in the JSON)
        for (let dayIndex = 1; dayIndex <= 5; dayIndex++) {
          const dayName = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'][dayIndex - 1];
          const content = row[dayIndex.toString()];
          if (content && content !== '---' && !content.includes('Δευτέρα')) {
            schedule[dayName][period.toString()] = content;
          }
        }
      }
    });

    return schedule;
  };

  const parseClassroomSchedule = (rows) => {
    const schedule = {
      'Δευτέρα': {},
      'Τρίτη': {},
      'Τετάρτη': {},
      'Πέμπτη': {},
      'Παρασκευή': {}
    };

    rows.forEach(row => {
      const period = row['0'];
      if (period && typeof period === 'number') {
        for (let dayIndex = 1; dayIndex <= 5; dayIndex++) {
          const dayName = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'][dayIndex - 1];
          const content = row[dayIndex.toString()];
          if (content && !content.includes('Δευτέρα')) {
            schedule[dayName][period.toString()] = content;
          }
        }
      }
    });

    return schedule;
  };

  const buildClassSchedule = (teachers, className) => {
    const schedule = {
      'Δευτέρα': {},
      'Τρίτη': {},
      'Τετάρτη': {},
      'Πέμπτη': {},
      'Παρασκευή': {}
    };

    const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

    teachers.forEach(teacher => {
      const teacherName = teacher.καθηγητής;
      days.forEach(day => {
        const daySchedule = teacher.πρόγραμμα?.[day];
        if (daySchedule) {
          for (let period = 1; period <= 8; period++) {
            const subject = daySchedule[period.toString()];
            if (subject && subject.includes(className)) {
              if (!schedule[day][period.toString()]) {
                schedule[day][period.toString()] = [];
              }
              if (Array.isArray(schedule[day][period.toString()])) {
                schedule[day][period.toString()].push({
                  teacher: teacherName,
                  subject: subject
                });
              }
            }
          }
        }
      });
    });

    // Convert arrays to formatted strings
    days.forEach(day => {
      for (let period = 1; period <= 8; period++) {
        const periodData = schedule[day][period.toString()];
        if (Array.isArray(periodData) && periodData.length > 0) {
          schedule[day][period.toString()] = periodData.map(item =>
            `${item.subject} (${item.teacher})`
          ).join('\n');
        }
      }
    });

    return schedule;
  };

  const getCurrentDayName = () => {
    const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return days[selectedDate.getDay()];
  };

  const getDayPeriodCount = (dayName) => {
    const daysWith8Periods = ['Δευτέρα', 'Τρίτη', 'Πέμπτη'];
    return daysWith8Periods.includes(dayName) ? 8 : 7;
  };

  const getCurrentDaySchedule = () => {
    if (!scheduleData) return null;
    const dayName = getCurrentDayName();
    return scheduleData[dayName] || null;
  };

  const renderSchedule = () => {
    const daySchedule = getCurrentDaySchedule();
    const dayName = getCurrentDayName();
    const maxPeriods = getDayPeriodCount(dayName);

    if (!daySchedule) {
      return <div className="no-schedule">Δεν υπάρχει πρόγραμμα για {dayName}</div>;
    }

    const periods = [];
    for (let i = 1; i <= maxPeriods; i++) {
      const subject = daySchedule[i.toString()];
      periods.push(
        <div key={i} className={`period-row ${subject ? 'has-subject' : 'empty'}`}>
          <div className="period-number">{i}η</div>
          <div className="period-subject">
            {subject || '---'}
          </div>
        </div>
      );
    }

    return periods;
  };

  if (loading) {
    return (
      <div className="unified-schedule-viewer">
        <div className="viewer-header">
          <h3>Φόρτωση...</h3>
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="unified-schedule-viewer">
        <div className="viewer-header">
          <h3>Σφάλμα</h3>
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="unified-schedule-viewer">
      <div className="viewer-header">
        <h3>{displayName}</h3>
        <div className="viewer-day-info">{getCurrentDayName()}</div>
        {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
      </div>
      <div className="viewer-content">
        {renderSchedule()}
      </div>
    </div>
  );
};

export default UnifiedScheduleViewer;
