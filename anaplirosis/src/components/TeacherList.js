// @FILE-INFO: TeacherList.js | /src/components/
// TYPE: Feature Component
// LAYER: UI (Resource)
// SIZE: 85 lines (medium)
// EXPORTS: TeacherList (default)

import React, { useState } from 'react';
import './TeacherList.css';

// Ημέρες της εβδομάδας στα ελληνικά
const daysOfWeek = [
  { value: 'monday', label: 'Δευτέρα' },
  { value: 'tuesday', label: 'Τρίτη' },
  { value: 'wednesday', label: 'Τετάρτη' },
  { value: 'thursday', label: 'Πέμπτη' },
  { value: 'friday', label: 'Παρασκευή' }
];

const TeacherList = ({ teachers, onTeacherClick, onTeacherDoubleClick, isExpanded }) => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  
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
    console.log('TeacherList: Teacher clicked:', teacherName);
    setSelectedTeacher(teacherName);
    onTeacherClick(teacherName);
  };

  const handleTeacherDoubleClick = (teacherName) => {
    console.log('TeacherList: Teacher double-clicked:', teacherName);
    if (onTeacherDoubleClick) {
      onTeacherDoubleClick(teacherName);
    }
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
      <div className="teacher-list">
        {Object.keys(groupedTeachers).sort().map(letter => (
          <div key={letter} className="letter-group">
            <div className="letter-header">{letter}</div>
            {groupedTeachers[letter].map((name, index) => (
              <div
                key={`${letter}-${index}`}
                className={`teacher-item ${selectedTeacher === name ? 'selected' : ''}`}
                onClick={() => handleTeacherClick(name)}
                onDoubleClick={() => handleTeacherDoubleClick(name)}
                title={`${name} - Κλικ για επιλογή, Διπλό κλικ για προσθήκη στην αναφορά`}
              >
                <span className="teacher-name">{name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
};

export default TeacherList;