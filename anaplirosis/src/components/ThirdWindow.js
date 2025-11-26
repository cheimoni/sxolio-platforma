import React, { useState, useEffect } from 'react';
import './ThirdWindow.css';

const ThirdWindow = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Δευτέρα');
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    try {
      const response = await fetch('/teachers.json');
      const data = await response.json();
      setScheduleData(data);
      
      // Extract unique teachers
      const teacherSet = new Set();
      data.forEach(teacher => {
        if (teacher.καθηγητής) {
          teacherSet.add(teacher.καθηγητής);
        }
      });
      setTeachers(Array.from(teacherSet).sort());
      console.log('Loaded teachers:', Array.from(teacherSet).sort());
    } catch (error) {
      console.error('Error loading schedule data:', error);
      // Fallback: add some sample teachers for testing
      setTeachers(['ΑΛΕΞΑΝΔΡΟΥ ΧΡΙΣΤΙΝΑ', 'ΑΝΤΩΝΙΟΥ ΝΙΚΗ', 'ΕΥΑΓΓΕΛΟΥ ΧΡΙΣΤΟΥ ΧΡΙΣΤΙΑΝΑ']);
    }
  };

  const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];
  const periods = ['1η', '2η', '3η', '4η', '5η', '6η', '7η', '8η'];

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const handleEarlyFinish = (teacher, period) => {
    if (period === '7η' || period === '8η') {
      alert(`⚠️ Προσοχή: Η σχολασμός στην ${period} περίοδο δεν πρέπει να επηρεάζει συνεχόμενα μαθήματα!`);
    }
    console.log(`Σχολασμός: ${teacher} - ${period} περίοδο`);
    
    // Show suggestions for this teacher
    showSuggestions(teacher, period);
  };

  const showSuggestions = (teacher, period) => {
    const suggestions = [
      `✅ ${teacher} μπορεί να σχολάσει στην ${period} περίοδο`,
      `📋 Έλεγχος συνεχόμενων μαθημάτων απαιτείται`,
      `🔄 Ενημέρωση ωρολογίου προγράμματος`,
      `📝 Καταγραφή αλλαγής στο σύστημα`
    ];
    
    alert(`Προτάσεις για ${teacher}:\n\n${suggestions.join('\n')}`);
  };

  return (
    <div className="third-window">
      <div className="window-header">
        <h3>Διαχείριση Ωρών</h3>
        <span className="window-id">#3</span>
      </div>
      
      <div className="window-content">
        <div className="day-selector">
          <label>Ημέρα:</label>
          <select 
            value={selectedDay} 
            onChange={(e) => setSelectedDay(e.target.value)}
            className="day-select"
          >
            {days.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        <div className="periods-grid">
          <div className="periods-label">Επιλέξτε περίοδο:</div>
          <div className="periods-buttons">
            {periods.map(period => (
              <button 
                key={period}
                className={`period-btn ${selectedPeriod === period ? 'selected' : ''}`}
                onClick={() => handlePeriodChange(period)}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="teachers-list">
          <div className="teachers-label">Καθηγητές:</div>
          <div className="teachers-container">
            {teachers.map(teacher => (
              <div key={teacher} className="teacher-item">
                <span className="teacher-name">{teacher}</span>
                <button 
                  className="early-finish-btn"
                  onClick={() => handleEarlyFinish(teacher, selectedPeriod)}
                  disabled={!selectedPeriod}
                  title={selectedPeriod === '7η' || selectedPeriod === '8η' ? 
                    '⚠️ Προσοχή: Μη επηρεάζεις συνεχόμενα μαθήματα!' : 
                    'Σχολασμός στην επιλεγμένη περίοδο'
                  }
                >
                  🏠 Σχολασμός
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="warning-message">
          <p>⚠️ <strong>Σημαντικό:</strong> Σχολασμός στην 7η ή 8η περίοδο δεν πρέπει να επηρεάζει συνεχόμενα μαθήματα!</p>
        </div>
      </div>
    </div>
  );
};

export default ThirdWindow;
