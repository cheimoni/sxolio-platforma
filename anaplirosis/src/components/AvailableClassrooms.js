import React, { useState, useEffect } from 'react';
import './AvailableClassrooms.css';

const AvailableClassrooms = ({ isOpen, onClose, selectedPeriod, currentDay }) => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDayNameInGreek = () => {
    const days = {
      'Monday': 'Δευτέρα',
      'Tuesday': 'Τρίτη',
      'Wednesday': 'Τετάρτη',
      'Thursday': 'Πέμπτη',
      'Friday': 'Παρασκευή'
    };
    return days[currentDay] || 'Δευτέρα';
  };

  useEffect(() => {
    const loadAvailableRooms = async () => {
      if (!isOpen || !selectedPeriod) return;

      setLoading(true);
      try {
        const response = await fetch('/classrooms-schedule.json');
        if (!response.ok) throw new Error('Failed to load classrooms');

        const data = await response.json();
        const dayName = getDayNameInGreek();

        // Βρίσκουμε τις αίθουσες που είναι κενές στην επιλεγμένη περίοδο
        const available = [];
        const roomsMap = new Map();

        data.forEach(entry => {
          const period = entry[''];
          const roomName = entry['Κατηγορία'];
          const daySchedule = entry[dayName] || '';

          if (parseInt(period) === selectedPeriod && daySchedule.trim() === '') {
            if (!roomsMap.has(roomName)) {
              roomsMap.set(roomName, true);
              available.push({ room: roomName, period: selectedPeriod });
            }
          }
        });

        // Ταξινομούμε τις αίθουσες αλφαβητικά
        available.sort((a, b) => a.room.localeCompare(b.room));
        setAvailableRooms(available);
      } catch (error) {
        console.error('Error loading available classrooms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailableRooms();
  }, [isOpen, selectedPeriod, currentDay]);

  if (!isOpen) return null;

  return (
    <div className="available-classrooms-overlay" onClick={onClose}>
      <div className="available-classrooms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="available-classrooms-header">
          <h3>Διαθέσιμες Αίθουσες - {selectedPeriod}η Περίοδο</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="available-classrooms-content">
          {loading ? (
            <div className="loading">Φόρτωση...</div>
          ) : availableRooms.length > 0 ? (
            <div className="classrooms-grid">
              {availableRooms.map((item, index) => (
                <div key={index} className="classroom-item">
                  <span className="classroom-icon">🏫</span>
                  <span className="classroom-name">{item.room}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-classrooms">
              Δεν υπάρχουν διαθέσιμες αίθουσες για την {selectedPeriod}η περίοδο
            </div>
          )}
          <div className="classrooms-count">
            Σύνολο: {availableRooms.length} {availableRooms.length === 1 ? 'αίθουσα' : 'αίθουσες'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailableClassrooms;
