import React, { useState, useEffect } from 'react';
import './DateDisplay.css';

const DateDisplay = ({ onDateChange }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  
  const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
  const months = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 
                  'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
  
  const dayName = days[selectedDate.getDay()];
  const day = selectedDate.getDate();
  const month = months[selectedDate.getMonth()];
  const year = selectedDate.getFullYear();

  const handleDateChange = (event) => {
    const newDate = new Date(event.target.value);
    setSelectedDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const resetToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setIsEditing(false);
    if (onDateChange) {
      onDateChange(today);
    }
  };

  // Notify parent component when date changes
  useEffect(() => {
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  }, [selectedDate, onDateChange]);

  return (
    <div className="date-display">
      <div className="date-day">{dayName}</div>
      <div className="date-numbers">
        <span className="date-day-num">{day}</span>
        <span className="date-month">{month}</span>
        <span className="date-year">{year}</span>
      </div>
      
      <div className="date-controls">
        <button className="date-btn edit-btn" onClick={toggleEdit} title="Επεξεργασία ημερομηνίας">
          ✏️
        </button>
        <button className="date-btn today-btn" onClick={resetToToday} title="Σήμερα">
          📅
        </button>
      </div>

      {isEditing && (
        <div className="date-edit">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            className="date-input"
          />
          <button className="date-btn close-btn" onClick={() => setIsEditing(false)} title="Κλείσιμο">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default DateDisplay;
