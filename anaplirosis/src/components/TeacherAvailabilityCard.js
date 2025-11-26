import React, { useState, useEffect, useRef } from 'react';
import './TeacherAvailabilityCard.css';
import { useDraggable } from '../hooks/useDraggable';
import { useWindowLayer } from '../hooks/useWindowLayer';
import { useResizable } from '../hooks/useResizable';
import { fetchPublic } from '../utils/pathHelper';

const TeacherAvailabilityCard = ({ isExpanded, selectedDate, onTeacherSelect, onTeacherAddToAbsence }) => {
  const [allTeachers, setAllTeachers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [bdDirectors, setBdDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [isActive, setIsActive] = useState(false);

  // Window layering
  const { zIndex, bringToFront } = useWindowLayer('availability');

  // Draggable functionality - Default θέση 1:1 από capture
  const initialX = 553;
  const initialY = -2;
  const { position, setPosition, dragRef, handleMouseDown, resetPosition, isDragging, skipNextPositionSave } = useDraggable(initialX, initialY, 'teacherAvailability');

  // Resizable functionality
  const initialWidth = isExpanded ? 351 : 311;  // +31 pixels πλάτος
  const initialHeight = 420;
  const { size, isResizing, positionDelta, resizeRef, handleResizeStart, resetSize, resetPositionDelta } = useResizable(initialWidth, initialHeight, 200, 200, 'teacherAvailability');

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

  // Bring to front when clicking
  const handleClick = (e) => {
    if (e.target.closest('.resize-handle')) return;
    bringToFront();
    setIsActive(true);
    setTimeout(() => setIsActive(false), 200);
  };

  // Expose reset function globally
  useEffect(() => {
    window.resetAvailabilityPosition = () => {
      resetPosition();
      resetSize();
      resetPositionDelta();
    };
    return () => {
      delete window.resetAvailabilityPosition;
    };
  }, [resetPosition, resetSize, resetPositionDelta]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        // Load regular teachers
        const teachersResponse = await fetchPublic('/teachers.json');
        if (teachersResponse.ok) {
          const teachersData = await teachersResponse.json();
          const availabilityData = analyzeTeacherAvailability(teachersData);
          setAllTeachers(teachersData); // Store all teachers
          setTeachers(availabilityData); // Store filtered teachers for display
        }

        // Load B.D. directors
        const bdResponse = await fetchPublic('/bd-directors-schedule.json');
        if (bdResponse.ok) {
          const bdData = await bdResponse.json();
          // Extract B.D. directors from the schedule data
          const bdDirectorsList = [];
          if (bdData.βοηθοί_διευθυντή) {
            Object.entries(bdData.βοηθοί_διευθυντή).forEach(([title, names]) => {
              names.forEach(name => {
                bdDirectorsList.push({
                  όνομα: name,
                  τίτλος: title,
                  ειδικότητα: null
                });
              });
            });
          }
          setBdDirectors(bdDirectorsList);
        }
      } catch (error) {
        console.error('Error loading teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeachers();
  }, []);

  const getCurrentDayName = () => {
    if (!selectedDate) return 'Δευτέρα';
    const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return days[selectedDate.getDay()];
  };

  // Υπολογισμός αριθμού περιόδων ανά ημέρα
  const getDayPeriodCount = (dayName) => {
    const daysWith8Periods = ['Δευτέρα', 'Πέμπτη'];
    return daysWith8Periods.includes(dayName) ? 8 : 7;
  };

  const analyzeTeacherAvailability = (teachersData) => {
    return teachersData.map(teacher => {
      const schedule = teacher.πρόγραμμα;
      const availability = {
        name: teacher.καθηγητής,
        freeHours: [],
        schedule: schedule,
        periodAvailability: {},
        totalTeachingHours: 0 // Track total teaching hours per day
      };

      // Analyze each day for consecutive free periods
      Object.entries(schedule).forEach(([day, periods]) => {
        const dayFreeHours = [];
        let consecutiveCount = 0;
        let teachingHoursCount = 0;
        
        // Sort periods by number to ensure correct order
        const sortedPeriods = Object.entries(periods).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
        
        sortedPeriods.forEach(([period, subject]) => {
          if (subject === null || subject === '-') {
            consecutiveCount++;
            // Track which periods are free
            if (!availability.periodAvailability[day]) {
              availability.periodAvailability[day] = [];
            }
            availability.periodAvailability[day].push(parseInt(period));
          } else {
            teachingHoursCount++;
            // If we had consecutive free periods, add them
            if (consecutiveCount >= 3) {
              dayFreeHours.push(consecutiveCount);
            }
            consecutiveCount = 0;
          }
        });
        
        // Check if the last periods are free
        if (consecutiveCount >= 3) {
          dayFreeHours.push(consecutiveCount);
        }
        
        availability.freeHours.push(...dayFreeHours);
        availability.totalTeachingHours = Math.max(availability.totalTeachingHours, teachingHoursCount);
      });

      // Find maximum consecutive hours
      const maxConsecutive = availability.freeHours.length > 0 
        ? Math.max(...availability.freeHours) 
        : 0;

      return {
        ...availability,
        maxConsecutive,
        colorClass: getColorClass(maxConsecutive),
        isLightlyLoaded: availability.totalTeachingHours < 4 // Available if teaching less than 4 hours
      };
    }).filter(teacher => teacher.maxConsecutive >= 3 && teacher.isLightlyLoaded)
      .sort((a, b) => b.maxConsecutive - a.maxConsecutive);
  };

  const handleTeacherClick = (teacherName) => {
    console.log('Teacher clicked for schedule:', teacherName);
    
    // Check if it's a B.D. director first
    const bdDirector = bdDirectors.find(bd => teacherName.includes(bd.όνομα));
    if (bdDirector) {
      // Create a mock teacher object for B.D. directors
      const mockTeacher = {
        καθηγητής: bdDirector.όνομα,
        τίτλος: bdDirector.τίτλος,
        ειδικότητα: bdDirector.ειδικότητα,
        πρόγραμμα: {}, // B.D. don't have regular schedules
        isBdDirector: true
      };
      
      if (onTeacherSelect) {
        onTeacherSelect(mockTeacher);
        console.log('B.D. Director selected for schedule:', mockTeacher);
      }
      return;
    }
    
    // Find the regular teacher's full schedule
    const teacher = allTeachers.find(t => t.καθηγητής === teacherName);
    if (teacher && onTeacherSelect) {
      onTeacherSelect(teacher);
      console.log('Teacher schedule loaded:', teacher);
    }
  };

  const handleTeacherDoubleClick = (teacherName) => {
    console.log('Teacher double-clicked for absence report:', teacherName);
    
    // Check if it's a B.D. director first
    const bdDirector = bdDirectors.find(bd => teacherName.includes(bd.όνομα));
    if (bdDirector) {
      // Create a mock teacher object for B.D. directors
      const mockTeacher = {
        καθηγητής: bdDirector.όνομα,
        τίτλος: bdDirector.τίτλος,
        ειδικότητα: bdDirector.ειδικότητα,
        πρόγραμμα: {}, // B.D. don't have regular schedules
        isBdDirector: true
      };
      
      if (onTeacherAddToAbsence) {
        onTeacherAddToAbsence(mockTeacher);
        console.log('B.D. Director added to absence report:', mockTeacher);
      }
      return;
    }
    
    // Find the regular teacher's full schedule
    const teacher = allTeachers.find(t => t.καθηγητής === teacherName);
    if (teacher && onTeacherAddToAbsence) {
      onTeacherAddToAbsence(teacher);
      console.log('Teacher added to absence report:', teacher);
    }
  };

  const handlePeriodClick = (period) => {
    setSelectedPeriod(period);
    const currentDay = getCurrentDayName();
    
    // Don't show substitutions for first (1) or last period (8) - BD takes attendance
    if (parseInt(period) === 1 || parseInt(period) === 8) {
      setAvailableTeachers([]);
      console.log(`No substitutions for period ${period} - BD takes attendance`);
      return;
    }
    
    // Find teachers with classes or breaks within 3 periods of selected period
    const availableTeachers = allTeachers.filter(teacher => {
      // Exclude BD, BDA and Director - they don't do substitutions
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
      if (excludedTeachers.includes(teacher.καθηγητής)) {
        return false;
      }

      const daySchedule = teacher.πρόγραμμα[currentDay];
      if (!daySchedule) return false;

      // Exclude teachers who have a class at the selected period
      const periodSubject = daySchedule[period.toString()];
      if (periodSubject !== null && periodSubject !== '-' && periodSubject !== undefined) {
        return false; // Has a class at selected period, exclude
      }

      // Check if teacher has any class or break within 3 periods of selected period
      const selectedPeriodNum = parseInt(period);
      const minPeriod = Math.max(1, selectedPeriodNum - 3);
      const maxPeriod = Math.min(8, selectedPeriodNum + 3);

      // Check if teacher has at least one class or break in the range
      for (let p = minPeriod; p <= maxPeriod; p++) {
        const subject = daySchedule[p.toString()];
        if (subject !== undefined) {
          return true; // Has schedule entry in this range
        }
      }

      return false; // No schedule in range (horizontally employed)
    });

    // BD, BDA and Directors are excluded - they don't do substitutions
    // (No longer adding BD Directors to the available list)

    // Analyze each teacher's teaching load for the current day
    const availableWithAnalysis = availableTeachers.map(teacher => {
      const daySchedule = teacher.πρόγραμμα[currentDay];
      let teachingHours = 0;

      // Count teaching hours for this day
      Object.values(daySchedule).forEach(subject => {
        if (subject !== null && subject !== '-') {
          teachingHours++;
        }
      });

      // Get the subject for the selected period
      const periodSubject = daySchedule[period.toString()];
      let activityLabel = periodSubject || '';

      // Calculate consecutive periods if this teacher is selected
      const selectedPeriodNum = parseInt(period);
      let consecutivePeriods = 0;

      // Count backwards from selected period
      for (let p = selectedPeriodNum - 1; p >= 1; p--) {
        const subject = daySchedule[p.toString()];
        if (subject !== null && subject !== '-' && subject !== undefined) {
          consecutivePeriods++;
        } else {
          break; // Stop at first free period
        }
      }

      // Add the selected period itself (will be substitution)
      consecutivePeriods++;

      // Count forwards from selected period
      for (let p = selectedPeriodNum + 1; p <= 8; p++) {
        const subject = daySchedule[p.toString()];
        if (subject !== null && subject !== '-' && subject !== undefined) {
          consecutivePeriods++;
        } else {
          break; // Stop at first free period
        }
      }

      return {
        name: teacher.καθηγητής,
        teachingHours: teachingHours,
        isLightlyLoaded: teachingHours < 5,
        teacher: teacher,
        isBdDirector: false,
        activity: activityLabel,
        consecutivePeriods: consecutivePeriods
      };
    });
    
    // Filter to show only lightly loaded teachers (less than 5 hours) - exclude B.D., directors, and secretaries
    const lightlyLoadedTeachers = availableWithAnalysis.filter(t =>
      t.isLightlyLoaded &&
      !t.name.toLowerCase().includes('γραμματεία') &&
      !t.name.toLowerCase().includes('διευθυντής') &&
      !t.name.toLowerCase().includes('διευθύντρια') &&
      !t.name.includes('ΔΗΜΗΤΡΙΑΔΟΥ ΣΑΛΤΕ ΒΑΛΕΝΤΙΝΑ') &&  // Διευθύντρια
      !t.name.includes('ΓΡΑΜΜΑΤΕΙΑ') &&
      !t.name.includes('ΧΕΙΜΩΝΙΔΗΣ ΓΙΩΡΓΟΣ') &&  // Β.Δ.Α.
      // Exclude all Β.Δ.Α. and Β.Δ. from available teachers list
      !t.name.includes('ΑΝΤΩΝΙΟΥ ΝΙΚΗ') &&  // Β.Δ.Α.
      !t.name.includes('ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΝΑ') &&  // Β.Δ.Α.
      !t.name.includes('ΕΥΑΓΟΡΟΥ ΕΥΑΓΟΡΑΣ') &&  // Β.Δ.
      !t.name.includes('ΛΟΙΖΙΑ ΛΕΥΚΗ') &&  // Β.Δ.
      !t.name.includes('ΣΩΤΗΡΙΑΔΟΥ ΚΙΝΝΗ ΜΑΡΙΑ') &&  // Β.Δ.
      !t.name.includes('ΚΟΥΜΗ ΑΝΑΣΤΑΣΙΑ') &&  // Β.Δ.
      !t.name.includes('ΝΙΚΟΥ ΧΡΙΣΤΑΚΗΣ') &&  // Β.Δ.
      !t.name.includes('ΚΟΝΗ ΛΙΖΑ') &&  // Β.Δ.
      !t.name.includes('ΚΥΠΡΙΑΝΟΥ Μ. ΜΑΡΙΑ')  // Β.Δ.
    );
    
    // Sort by teaching hours (fewest first - best candidates)
    const sortedTeachers = lightlyLoadedTeachers.sort((a, b) => a.teachingHours - b.teachingHours);
    
    setAvailableTeachers(sortedTeachers);
    console.log(`Available teachers for period ${period} on ${currentDay}:`, sortedTeachers.map(t => `${t.name} (${t.teachingHours} ώρες μαθήματα)`));
  };

  const getColorClass = (teachingHours) => {
    if (teachingHours === 0) return 'green';      // 0 ώρες μαθήματα - πολύ καλός
    if (teachingHours === 1) return 'green';       // 1 ώρα μαθήματα - καλός
    if (teachingHours === 2) return 'yellow';      // 2 ώρες μαθήματα - μέτριος
    if (teachingHours === 3) return 'yellow';      // 3 ώρες μαθήματα - μέτριος
    if (teachingHours === 4) return 'red';         // 4 ώρες μαθήματα - χειρότερος
    return 'none';
  };

  const getColorLabel = (teachingHours) => {
    if (teachingHours === 0) return '0 ώρες';
    if (teachingHours === 1) return '1 ώρα';
    if (teachingHours === 2) return '2 ώρες';
    if (teachingHours === 3) return '3 ώρες';
    if (teachingHours === 4) return '4 ώρες';
    return '';
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

  if (loading) {
    return (
      <div 
        ref={combinedRef}
        className={`availability-card ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
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
        <div className="availability-header draggable-header" style={{ cursor: 'move' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '5px', width: '100%' }}>
            <span className="availability-title">Διαθέσιμοι Καθηγητές 📌</span>
            <button
              className="reset-position-btn"
              onClick={(e) => {
                e.stopPropagation();
                resetPosition();
                resetSize();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Επαναφορά θέσης"
            >
              🔄
            </button>
          </div>
        </div>
        <div className="availability-content">
          <div className="loading">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={combinedRef}
      className={`availability-card ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
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
      <div
        className="availability-header draggable-header"
        style={{ cursor: 'move' }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '5px', width: '100%' }}>
          <span className="availability-title">Διαθέσιμοι Καθηγητές 📌</span>
          <button
            className="reset-position-btn"
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔄 Availability Card: Reset button clicked!');
              console.log('🔄 Calling resetPosition()...');
              resetPosition();
              console.log('🔄 Calling resetSize()...');
              resetSize();
              console.log('✅ Reset completed!');
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Επαναφορά θέσης"
          >
            🔄
          </button>
        </div>
      </div>
      <div className="availability-content">
        <div className="day-info">
          <span className="current-day">{getCurrentDayName()}</span>
        </div>
        
        <div className="periods-selector">
          <div className="periods-label">Επιλέξτε περίοδο:</div>
          <div className="periods-grid">
            {Array.from({ length: getDayPeriodCount(getCurrentDayName()) }, (_, i) => i + 1).map(period => (
              <button
                key={period}
                className={`period-btn ${selectedPeriod === period ? 'selected' : ''}`}
                onClick={() => handlePeriodClick(period)}
              >
                {period}η
              </button>
            ))}
          </div>
        </div>

        {selectedPeriod && (
          <div className="available-teachers-section">
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Διαθέσιμοι για {selectedPeriod}η περίοδο ({availableTeachers.length})</span>
              <button
                className="classrooms-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const event = new CustomEvent('openAvailableClassrooms', {
                    detail: { period: selectedPeriod }
                  });
                  window.dispatchEvent(event);
                }}
                title="Διαθέσιμες Αίθουσες"
                style={{
                  background: 'var(--primary-color)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '3px 6px',
                  cursor: 'pointer',
                  fontSize: '7px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                🏫 Αίθουσες
              </button>
            </div>
            <div className="available-teachers-list">
              {availableTeachers.length > 0 ? (
                availableTeachers.map((teacher, index) => (
                  <div
                    key={index}
                    className={`available-teacher ${getColorClass(teacher.teachingHours)}`}
                    draggable={true}
                    onClick={() => handleTeacherClick(teacher.name)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        teacherName: teacher.name,
                        period: selectedPeriod,
                        teachingHours: teacher.teachingHours
                      }));
                      console.log('Dragging teacher:', teacher.name, 'for period:', selectedPeriod);
                    }}
                    onDoubleClick={() => {
                      console.log('Double-click on available teacher - should not add to absence report');
                      // Don't add available teachers to absence report on double-click
                      // They are meant to be replacements, not absent teachers
                    }}
                    title="Κλικ για επιλογή, Σύρετε για αναπλήρωση"
                  >
                    <span className="teacher-name">{teacher.name} <span className="preserve-color" style={{color: 'red', fontWeight: 'bold'}}>({teacher.consecutivePeriods})</span> {getColorLabel(teacher.teachingHours)}</span>
                  </div>
                ))
              ) : (
                <div className="no-available">
                  {selectedPeriod === 1 || selectedPeriod === 8 
                    ? `Β.Δ. παίρνει παρουσίες για ${selectedPeriod}η περίοδο` 
                    : 'Δεν υπάρχουν διαθέσιμοι καθηγητές'
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedPeriod && (
          <div className="select-period-message">
            <p>Επιλέξτε μια περίοδο για να δείτε τους διαθέσιμους καθηγητές</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAvailabilityCard;
