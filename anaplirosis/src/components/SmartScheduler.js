import React, { useState, useEffect, useRef } from 'react';
import './SmartScheduler.css';
import { useDraggable } from '../hooks/useDraggable';
import { useWindowLayer } from '../hooks/useWindowLayer';
import { useResizable } from '../hooks/useResizable';
import { fetchPublic } from '../utils/pathHelper';

const SmartScheduler = ({ selectedDate, isExpanded }) => {
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestedChanges, setSuggestedChanges] = useState([]);
  const [appliedChanges, setAppliedChanges] = useState([]);
  const [isActive, setIsActive] = useState(false);

  // Window layering
  const { zIndex, bringToFront } = useWindowLayer('smartScheduler');

  // Draggable functionality - Default θέση 1:1 από capture
  const initialX = 553;
  const initialY = 507;
  const { position, setPosition, dragRef, handleMouseDown, resetPosition, isDragging, skipNextPositionSave } = useDraggable(initialX, initialY, 'smartScheduler');

  // Resizable functionality - extends to bottom of screen
  const initialWidth = isExpanded ? 320 : 280;
  const initialHeight = window.innerHeight - 421 - 80;  // Αφήνω 80px χώρο κάτω για sidebars
  const { size, isResizing, positionDelta, resizeRef, handleResizeStart, resetSize, resetPositionDelta } = useResizable(initialWidth, initialHeight, 200, 200, 'smartScheduler');

  // Track previous isResizing state to detect when resize ends
  const prevIsResizing = useRef(isResizing);
  useEffect(() => {
    // When resize ends, update position with accumulated delta
    if (prevIsResizing.current && !isResizing && (positionDelta.x !== 0 || positionDelta.y !== 0)) {
      // Skip saving this position change to localStorage (it includes positionDelta)
      skipNextPositionSave();
      const newPosition = {
        x: position.x + positionDelta.x,
        y: position.y + positionDelta.y
      };
      setPosition(newPosition);
      // Reset delta after updating position
      resetPositionDelta();
      // Force save the final position (without positionDelta) after a small delay
      setTimeout(() => {
        setPosition({ ...newPosition }); // New object to trigger save
      }, 10);
    }
    prevIsResizing.current = isResizing;
  }, [isResizing, positionDelta.x, positionDelta.y, position.x, position.y, setPosition, resetPositionDelta]);

  // Combine dragRef and resizeRef
  const combinedRef = (node) => {
    dragRef.current = node;
    resizeRef.current = node;
  };

  // Get current day name
  const getCurrentDayName = () => {
    if (!selectedDate) return 'Δευτέρα';
    const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return days[selectedDate.getDay()];
  };

  // Load teachers data
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await fetchPublic('/teachers.json');
        if (response.ok) {
          const data = await response.json();
          setAllTeachers(data);
        }
      } catch (error) {
        console.error('Error loading teachers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTeachers();
  }, []);

  // Expose reset function globally
  useEffect(() => {
    window.resetSmartSchedulerPosition = () => {
      resetPosition();
      resetSize();
      resetPositionDelta();
    };
    return () => {
      delete window.resetSmartSchedulerPosition;
    };
  }, [resetPosition, resetSize, resetPositionDelta]);

  // Bring to front when clicking
  const handleClick = (e) => {
    if (e.target.closest('.resize-handle')) return;
    bringToFront();
    setIsActive(true);
    setTimeout(() => setIsActive(false), 200);
  };

  // Helper function to extract class name from subject string
  const extractClassName = (subjectString) => {
    if (!subjectString || subjectString === '-') return null;
    // Extract class name - it's typically at the start before space or underscore
    // Examples: "Α11_ΠΤ_Π Πληροφορική", "ΓυμΑ31+Α32_Κ Φυσική Αγωγή"
    const match = subjectString.match(/^([^\s]+)/);
    return match ? match[1] : null;
  };

  // Check if a class has a conflict at a given period
  const hasClassConflict = (className, period, day) => {
    if (!className) return false;

    // Check if any teacher has this class at this period
    return allTeachers.some(teacher => {
      const daySchedule = teacher.πρόγραμμα[day];
      if (!daySchedule) return false;

      const periodSubject = daySchedule[period.toString()];
      if (!periodSubject || periodSubject === '-' || periodSubject === undefined) return false;

      const periodClass = extractClassName(periodSubject);
      return periodClass === className;
    });
  };

  // Analyze schedule and find possible optimizations
  const analyzeSchedule = () => {
    setAnalyzing(true);
    const currentDay = getCurrentDayName();
    const changes = [];

    // Exclude BD, BDA and Directors
    const excludedTeachers = [
      'ΕΥΑΓΟΡΟΥ ΕΥΑΓΟΡΑΣ',
      'ΛΟΙΖΙΑ ΛΕΥΚΗ',
      'ΣΩΤΗΡΙΑΔΟΥ ΚΙΝΝΗ ΜΑΡΙΑ',
      'ΚΟΥΜΗ ΑΝΑΣΤΑΣΙΑ',
      'ΝΙΚΟΥ ΧΡΙΣΤΑΚΗΣ',
      'ΚΟΝΗ ΛΙΖΑ',
      'ΚΥΠΡΙΑΝΟΥ Μ. ΜΑΡΙΑ',
      'ΧΕΙΜΩΝΙΔΗΣ ΓΙΩΡΓΟΣ',
      'ΑΝΤΩΝΙΟΥ ΝΙΚΗ',
      'ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΝΑ (ΦΙΛΟΛΟΓΟΣ)',
      'ΔΗΜΗΤΡΙΑΔΟΥ ΣΑΛΤΕ ΒΑΛΕΝΤΙΝΑ'
    ];

    const eligibleTeachers = allTeachers.filter(t => !excludedTeachers.includes(t.καθηγητής));

    // Find teachers who can move their classes to free up last period
    eligibleTeachers.forEach(teacher => {
      const daySchedule = teacher.πρόγραμμα[currentDay];
      if (!daySchedule) return;

      // Check if teacher has a class in period 7 and is free in earlier periods
      const period7Subject = daySchedule['7'];
      if (period7Subject && period7Subject !== null && period7Subject !== '-' && period7Subject !== undefined) {
        const className = extractClassName(period7Subject);

        // Find free periods before 7
        for (let p = 2; p <= 6; p++) {
          const periodSubject = daySchedule[p.toString()];
          if (periodSubject === null || periodSubject === '-' || periodSubject === undefined) {
            // Check if the class has a conflict at this new period
            if (hasClassConflict(className, p, currentDay)) {
              console.log(`Skipping ${teacher.καθηγητής} - ${className} has conflict at period ${p}`);
              continue; // Skip this period, class already has another lesson
            }

            // Found a free period - suggest moving period 7 here

            // Calculate consecutive periods after the move
            let consecutiveAfterMove = 0;
            for (let checkP = p - 1; checkP >= 1; checkP--) {
              const subject = daySchedule[checkP.toString()];
              if (subject !== null && subject !== '-' && subject !== undefined) {
                consecutiveAfterMove++;
              } else {
                break;
              }
            }
            consecutiveAfterMove++; // The moved period itself
            for (let checkP = p + 1; checkP <= 8; checkP++) {
              const subject = daySchedule[checkP.toString()];
              if (subject !== null && subject !== '-' && subject !== undefined && checkP !== 7) {
                consecutiveAfterMove++;
              } else if (checkP !== 7) {
                break;
              }
            }

            // Only suggest if consecutive periods <= 4
            if (consecutiveAfterMove <= 4) {
              changes.push({
                teacherName: teacher.καθηγητής,
                class: period7Subject,
                className: className,
                fromPeriod: 7,
                toPeriod: p,
                consecutivePeriods: consecutiveAfterMove,
                benefit: 'Ελευθερώνει 7η περίοδο'
              });
              break; // Only one suggestion per teacher
            }
          }
        }
      }
    });

    // Sort by consecutive periods (fewer is better)
    changes.sort((a, b) => a.consecutivePeriods - b.consecutivePeriods);

    setSuggestedChanges(changes);
    setAnalyzing(false);
  };

  // Apply all suggested changes
  const applyChanges = () => {
    setAppliedChanges(suggestedChanges);
    console.log('Applied changes:', suggestedChanges);
    // TODO: Integrate with MainWindow to update the report
  };

  // Clear all changes
  const clearChanges = () => {
    setSuggestedChanges([]);
    setAppliedChanges([]);
  };

  // Helper function to render resize handles
  const renderResizeHandles = () => (
    <>
      <div className="resize-handle resize-handle-n" onMouseDown={(e) => handleResizeStart('n', e)}></div>
      <div className="resize-handle resize-handle-s" onMouseDown={(e) => handleResizeStart('s', e)}></div>
      <div className="resize-handle resize-handle-e" onMouseDown={(e) => handleResizeStart('e', e)}></div>
      <div className="resize-handle resize-handle-w" onMouseDown={(e) => handleResizeStart('w', e)}></div>
      <div className="resize-handle resize-handle-ne" onMouseDown={(e) => handleResizeStart('ne', e)}></div>
      <div className="resize-handle resize-handle-nw" onMouseDown={(e) => handleResizeStart('nw', e)}></div>
      <div className="resize-handle resize-handle-se" onMouseDown={(e) => handleResizeStart('se', e)}></div>
      <div className="resize-handle resize-handle-sw" onMouseDown={(e) => handleResizeStart('sw', e)}></div>
    </>
  );

  return (
    <div
      ref={combinedRef}
      className={`smart-scheduler ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
      style={{
        left: `${position.x + positionDelta.x}px`,
        top: `${position.y + positionDelta.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: zIndex
      }}
      onMouseDown={(e) => {
        bringToFront();
        handleMouseDown(e);
      }}
      onClick={handleClick}
    >
      {renderResizeHandles()}
      <div className="smart-scheduler-header draggable-header" style={{ cursor: 'move' }}>
        <span className="smart-scheduler-title">🤖 Έξυπνος Προγραμματισμός</span>
        <button
          className="reset-position-btn"
          onClick={(e) => {
            e.stopPropagation();
            resetPosition();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Επαναφορά θέσης"
        >
          🔄
        </button>
      </div>

      <div className="smart-scheduler-content">
        <div className="day-info">
          <span className="current-day">{getCurrentDayName()}</span>
        </div>

        {loading ? (
          <div className="loading">Φόρτωση...</div>
        ) : (
          <>
            <div className="action-buttons">
              <button
                className="analyze-btn"
                onClick={analyzeSchedule}
                disabled={analyzing}
                title="Ανάλυση Προγράμματος"
              >
                {analyzing ? '⏳' : '🔍'}
              </button>

              {suggestedChanges.length > 0 && (
                <>
                  <button className="apply-btn" onClick={applyChanges} title={`Εφαρμογή Όλων (${suggestedChanges.length})`}>
                    ✓
                  </button>
                  <button className="clear-btn" onClick={clearChanges} title="Καθαρισμός">
                    ✕
                  </button>
                </>
              )}
            </div>

            {suggestedChanges.length > 0 && (
              <div className="suggested-changes">
                <div className="section-title">
                  Προτεινόμενες Αλλαγές ({suggestedChanges.length})
                </div>
                <div className="changes-list">
                  {suggestedChanges.map((change, index) => (
                    <div key={index} className="change-item">
                      <div 
                        className="change-teacher"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Send event to App.js to update selectedTeacher
                          const teacherSelectEvent = new CustomEvent('selectTeacher', {
                            detail: {
                              teacherName: change.teacherName
                            }
                          });
                          window.dispatchEvent(teacherSelectEvent);
                        }}
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        title="Κλικ για προβολή προγράμματος"
                      >
                        {change.teacherName}
                      </div>
                      <div className="change-details">
                        <span className="change-class">{change.class}</span>
                        <span className="change-arrow">
                          {change.fromPeriod}η → {change.toPeriod}η
                        </span>
                        <span className="change-consecutive preserve-color" style={{ color: 'red', fontWeight: 'bold' }}>
                          ({change.consecutivePeriods} συνεχόμενες)
                        </span>
                      </div>
                      <div className="change-benefit">{change.benefit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appliedChanges.length > 0 && (
              <div className="applied-changes">
                <div className="section-title success">
                  ✓ Εφαρμοσμένες Αλλαγές ({appliedChanges.length})
                </div>
                <div className="info-message">
                  Οι αλλαγές καταγράφηκαν και θα εμφανιστούν στην εκτύπωση
                </div>
              </div>
            )}

            {!analyzing && suggestedChanges.length === 0 && appliedChanges.length === 0 && (
              <div className="empty-state">
                <p>Πατήστε "Ανάλυση Προγράμματος" για να βρείτε βελτιώσεις</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SmartScheduler;
