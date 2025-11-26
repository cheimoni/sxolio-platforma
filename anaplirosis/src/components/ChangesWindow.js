import React, { useState, useEffect, useRef } from 'react';
import './ChangesWindow.css';

const ChangesWindow = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [changes, setChanges] = useState([]);
  const [position, setPosition] = useState({ x: 690, y: 260 });
  const [size, setSize] = useState({ width: 280, height: 150 });

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    try {
      const response = await fetch('/schedule.json');
      if (response.ok) {
        const data = await response.json();
        setScheduleData(data);
        analyzeChanges(data);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const analyzeChanges = (data) => {
    const detectedChanges = [];
    
    Object.values(data).forEach(teacher => {
      if (teacher.πρόγραμμα) {
        Object.entries(teacher.πρόγραμμα).forEach(([day, schedule]) => {
          const periods = Object.values(schedule).filter(p => p && p !== '-');
          
          const lastPeriod = getLastPeriodForDay(day);
          if (lastPeriod && !schedule[lastPeriod]) {
            detectedChanges.push({
              type: 'early_finish',
              teacher: teacher.καθηγητής,
              day: day,
              message: `Can finish early on ${day}`
            });
          }
          
          for (let i = 1; i <= 7; i++) {
            if (schedule[i] && schedule[i + 1] && 
                extractClassFromSubject(schedule[i]) === extractClassFromSubject(schedule[i + 1])) {
              detectedChanges.push({
                type: 'consecutive_same_class',
                teacher: teacher.καθηγητής,
                day: day,
                periods: `${i}-${i + 1}`,
                message: `Two consecutive hours with same class`
              });
            }
          }
        });
      }
    });
    
    setChanges(detectedChanges);
  };

  const getLastPeriodForDay = (day) => {
    const daysWith8Periods = ['Δευτέρα', 'Πέμπτη'];
    return daysWith8Periods.includes(day) ? 8 : 7;
  };

  const extractClassFromSubject = (subject) => {
    if (!subject) return '';
    const match = subject.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'early_finish': return '⏰';
      case 'consecutive_same_class': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'early_finish': return 'green';
      case 'consecutive_same_class': return 'orange';
      default: return 'blue';
    }
  };

  // Grid positioning functions
  const snapToGrid = (value, gridSize) => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Window is now fixed - no drag/resize functionality

  return (
    <div 
      className="changes-window"
    >
      <div className="window-header">
        <h3>Changes</h3>
        <span className="changes-count">{changes.length}</span>
      </div>
      
      <div className="changes-list">
        {changes.length === 0 ? (
          <div className="no-changes">
            <span>No suggested changes</span>
          </div>
        ) : (
          changes.slice(0, Math.floor((size.height - 60) / 40)).map((change, index) => (
            <div key={index} className={`change-item ${getChangeColor(change.type)}`}>
              <div className="change-icon">{getChangeIcon(change.type)}</div>
              <div className="change-content">
                <div className="change-teacher">{change.teacher}</div>
                <div className="change-message">{change.message}</div>
                {change.periods && (
                  <div className="change-periods">{change.periods}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChangesWindow;
