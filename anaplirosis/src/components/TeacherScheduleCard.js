import React, { useState, useEffect, useRef } from 'react';
import './TeacherScheduleCard.css';
import { coteachingPairs } from '../data/coteachingPairs';
import { useDraggable } from '../hooks/useDraggable';
import { useWindowLayer } from '../hooks/useWindowLayer';
import { useResizable } from '../hooks/useResizable';
import ScheduleChangeModal from './ScheduleChangeModal';
import { fetchPublic } from '../utils/pathHelper';

const TeacherScheduleCard = ({ teacherName, isExpanded, onPeriodDrag, selectedDate }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeData, setChangeData] = useState(null);
  const [dragOverPeriod, setDragOverPeriod] = useState(null);

  // Window layering
  const { zIndex, bringToFront } = useWindowLayer('teacherSchedule');

  // Draggable functionality - Default θέση 1:1 από capture
  const initialX = 232;
  const initialY = 1;
  const { position, setPosition, dragRef, handleMouseDown, resetPosition, isDragging, skipNextPositionSave } = useDraggable(initialX, initialY, 'teacherSchedule');

  // Resizable functionality
  const initialWidth = isExpanded ? 320 : 280;
  const initialHeight = 420;
  const { size, isResizing, positionDelta, resizeRef, handleResizeStart, resetSize, resetPositionDelta } = useResizable(initialWidth, initialHeight, 200, 200, 'teacherSchedule');

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
    window.resetTeacherSchedulePosition = () => {
      resetPosition();
      resetSize();
      resetPositionDelta();
    };
    return () => {
      delete window.resetTeacherSchedulePosition;
    };
  }, [resetPosition, resetSize, resetPositionDelta]);

  useEffect(() => {
    if (!teacherName) {
      setScheduleData(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const loadSchedule = async () => {
      try {
        // First try to load from teachers.json
        try {
          console.log('Loading schedule for:', teacherName);
          const response = await fetchPublic('/teachers.json');
          
          if (!response.ok) {
            console.error('Failed to load teachers.json:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const teachers = await response.json();
          console.log('Loaded teachers.json, total teachers:', teachers?.length || 0);
          
          if (!Array.isArray(teachers)) {
            console.error('teachers.json is not an array:', typeof teachers);
            setError('Σφάλμα: Το teachers.json δεν έχει το σωστό format');
            setLoading(false);
            return;
          }
          
          const teacherData = teachers.find(t => {
            if (!t || !t.καθηγητής) return false;
            const name = t.καθηγητής;
            return name === teacherName || 
                   name.toUpperCase() === teacherName.toUpperCase() ||
                   name.trim() === teacherName.trim();
          });
          
          if (teacherData) {
            console.log('Found teacher schedule:', teacherData.καθηγητής);
            setScheduleData(teacherData);
            setLoading(false);
            return;
          } else {
            console.warn('Teacher not found in teachers.json:', teacherName);
            // Log first few teacher names for debugging
            const sampleNames = teachers.slice(0, 5).map(t => t?.καθηγητής).filter(Boolean);
            console.log('Sample teacher names in file:', sampleNames);
          }
        } catch (err) {
          console.error('Error fetching teachers.json:', err);
          setError(`Σφάλμα φόρτωσης teachers.json: ${err.message}`);
          setLoading(false);
          return;
        }

        // Fallback: Try to load from HTML files
        const possibleFiles = [
          'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΚΑΘΗΓΗΤΗ.html',
          'students.html',
          'classrooms.html',
          'coteaching.html'
        ];

        let foundData = null;
        
        for (const filePath of possibleFiles) {
          try {
            const response = await fetchPublic(filePath);
            if (response.ok) {
              const html = await response.text();
              
              // Try to find teacher in this file
              const teacherData = extractTeacherFromHTML(html, teacherName);
              if (teacherData) {
                foundData = teacherData;
                break;
              }
            }
          } catch (err) {
            // Continue to next file
          }
        }

        if (foundData) {
          setScheduleData(foundData);
        } else {
          setError(`Δεν βρέθηκε πρόγραμμα για: ${teacherName}`);
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
        setError(`Σφάλμα φόρτωσης: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [teacherName]);

  const extractTeacherFromHTML = (html, teacherName) => {
    if (!html || !teacherName) return null;
    
    const upperHtml = html.toUpperCase();
    const nameUpper = teacherName.toUpperCase();
    
    console.log(`Searching for: ${nameUpper}`);
    console.log(`HTML length: ${html.length}`);
    
    // Try different patterns to find the teacher
    const patterns = [
      `ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:  <B>${nameUpper}</B>`,
      `ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:  ${nameUpper}`,
      `ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:${nameUpper}`,
      `<B>${nameUpper}</B>`,
      nameUpper
    ];

    let startIdx = -1;
    let foundPattern = '';
    
    for (const pattern of patterns) {
      startIdx = upperHtml.indexOf(pattern);
      if (startIdx !== -1) {
        foundPattern = pattern;
        console.log(`Found pattern: ${pattern} at index ${startIdx}`);
        break;
      }
    }
    
    if (startIdx === -1) {
      console.log('No pattern found');
      return null;
    }

    // Extract the schedule section
    const startCut = startIdx;
    const nextMarkers = ['ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:', 'ΗΜΕΡΟΜΗΝΙΑ ΕΚΤΥΠΩΣΗΣ', '<B>'];
    let endIdx = html.length;
    
    for (const marker of nextMarkers) {
      const idx = upperHtml.indexOf(marker, startIdx + foundPattern.length + 200);
      if (idx !== -1) {
        endIdx = Math.min(endIdx, idx);
      }
    }
    
    // If section is too small, take more
    if (endIdx - startCut < 500) {
      endIdx = Math.min(startCut + 2000, html.length);
    }

    const section = html.slice(startCut, endIdx);
    console.log(`Extracted section length: ${section.length}`);
    
    return {
      teacherName: teacherName,
      html: section,
      foundPattern: foundPattern
    };
  };

  // Extract class name from subject
  const extractClassName = (subject) => {
    if (!subject) return null;

    // ΠΡΩΤΑ: Έλεγχος αν είναι Στήριξη - εξάγουμε μόνο το πρώτο μέρος
    // π.χ. "Στ. 13 (Β1) Μ.Α. Ιστορία κατ (Β) B261" → "Στ. 13 (Β1) Μ.Α."
    const supportMatch = subject.match(/^(Στ\.(?:Ο\.)?\s*\d+\s*\([ΑΒΓ][0-9]+\)\s+[Α-Ω]\.[Α-Ω]\.)/);
    if (supportMatch) {
      return supportMatch[1].trim();
    }

    // ΔΕΥΤΕΡΟ: Έλεγχος αν είναι Συνδιδασκαλία με underscore - επιστρέφουμε ΟΛΟ το subject
    // π.χ. "Α11_ΠΤ_Π" → "Α11_ΠΤ_Π"
    // π.χ. "βκατ_1 ΠΛΗ_κατ (Β)" → "βκατ_1 ΠΛΗ_κατ (Β)"
    if (subject.includes('_')) {
      // Μαθήματα κατεύθυνσης: "βκατ_1 ΘΕΑ_κατ (Β)" → εξάγουμε "βκατ_1 ΘΕΑ_κατ (Β)"
      let classMatch = subject.match(/^([a-zα-ωΑ-Ω]+κατ_\d+\s+[Α-ΩA-Z]+_κατ\s*\([ΑΒΓ]\))/);
      if (classMatch) {
        return classMatch[1].trim();
      }

      // Συνδιδασκαλίες: "Α11_ΠΤ_Π" → "Α11_ΠΤ_Π"
      classMatch = subject.match(/^([ΑΒΓ][0-9]+_[Α-Ω]+_[Α-Ω])/);
      if (classMatch) {
        return classMatch[1].trim();
      }

      // Fallback: επιστρέφουμε ολόκληρο το subject
      return subject.trim();
    }

    // ΓΙΑ ΤΑ ΥΠΟΛΟΙΠΑ (κανονικά τμήματα): εξάγουμε μόνο τον κωδικό τμήματος

    // Pattern 2: Τμήμα σε παρενθέσεις (π.χ. "... (Β51)")
    let classMatch = subject.match(/\(([ΑΒΓ][0-9]+(?:_[Α-Ω]+(?:_[Α-Ω]+)?)?)\)/);

    // Pattern 3: Τμήμα με space (π.χ. "Α11 ΜΑΘΗΜΑΤΙΚΑ")
    if (!classMatch) {
      classMatch = subject.match(/^([ΑΒΓ][0-9]+)\s/);
    }

    // Pattern 4: Τμήμα χωρίς space (π.χ. "Β52Μαθηματικά")
    if (!classMatch) {
      classMatch = subject.match(/^([ΑΒΓ][0-9]+)/);
    }

    // Pattern 5: Μόνο γράμμα σε παρενθέσεις, αλλά ΟΧΙ για μαθήματα κατεύθυνσης
    // που ξεκινούν με πεζά γράμματα (π.χ. "βκατ_1", "ακατ_2")
    if (!classMatch && !subject.match(/^[a-zα-ω]/)) {
      classMatch = subject.match(/\(([ΑΒΓ])\)/);
    }

    return classMatch ? classMatch[1] : null;
  };

  // Handle drop on a period cell
  const handlePeriodDrop = async (e, targetDay, targetPeriod, targetSubject) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPeriod(null);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      // Use teacherName instead of teacher (as set in onDragStart)
      const { teacherName: draggedTeacher, day: draggedDay, period: draggedPeriod, subject: draggedSubject, className: draggedClass } = dragData;

      console.log('Drop detected:', {
        draggedTeacher,
        draggedDay,
        draggedPeriod,
        draggedSubject,
        draggedClass,
        targetTeacher: teacherName,
        targetDay,
        targetPeriod,
        targetSubject
      });

      // Validation checks
      if (!draggedSubject || draggedSubject === '-') {
        alert('Δεν μπορείτε να σύρετε κενή περίοδο!');
        return;
      }

      if (!targetSubject || targetSubject === '-') {
        alert('Δεν μπορείτε να ρίξετε σε κενή περίοδο!');
        return;
      }

      if (draggedTeacher === teacherName) {
        alert('Δεν μπορείτε να ανταλλάξετε περιόδους του ίδιου καθηγητή!');
        return;
      }

      if (draggedDay !== targetDay) {
        alert('Οι περίοδοι πρέπει να είναι την ίδια ημέρα!');
        return;
      }

      if (draggedPeriod !== targetPeriod) {
        alert('Οι περίοδοι πρέπει να είναι στην ίδια ώρα!');
        return;
      }

      // Extract class name for target subject (draggedClass already extracted from dragData)
      const targetClass = extractClassName(targetSubject);

      // Prepare change data for modal
      const change = {
        teacherA: {
          name: draggedTeacher || 'Άγνωστος Καθηγητής',
          subject: draggedSubject,
          className: draggedClass
        },
        teacherB: {
          name: teacherName,
          subject: targetSubject,
          className: targetClass
        },
        periodA: draggedPeriod,
        periodB: targetPeriod,
        day: targetDay
      };

      setChangeData(change);
      setShowChangeModal(true);

    } catch (err) {
      console.error('Error handling drop:', err);
      alert('Σφάλμα κατά την ανταλλαγή περιόδων!');
    }
  };

  // Handle drag over
  const handlePeriodDragOver = (e, period) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPeriod(period);
  };

  // Handle drag leave
  const handlePeriodDragLeave = (e) => {
    e.preventDefault();
    setDragOverPeriod(null);
  };

  // Handle modal confirm
  const handleConfirmChange = () => {
    if (!changeData) return;

    // Close modal
    setShowChangeModal(false);
    setChangeData(null);

    // Show success message
    alert(`Η αλλαγή επιβεβαιώθηκε!\n${changeData.teacherA.name} ⇄ ${changeData.teacherB.name}\n${changeData.day}, ${changeData.periodA}η περίοδος`);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowChangeModal(false);
    setChangeData(null);
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

  if (!teacherName) {
    return (
      <div 
        ref={combinedRef}
        className={`schedule-card ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
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
      <div className="schedule-header draggable-header" style={{ cursor: 'move' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '5px', width: '100%' }}>
          <span className="schedule-title">Πρόγραμμα 📌</span>
          <button
            className="schedule-refresh-btn"
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔄 Teacher Schedule: Reset button clicked!');
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
        <div className="schedule-content">
          <div className="no-selection">Επιλέξτε καθηγητή</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={combinedRef}
      className={`schedule-card ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
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
      <div className="schedule-header draggable-header" style={{ cursor: 'move' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '5px', width: '100%' }}>
            <span className="schedule-title">Πρόγραμμα 📌</span>
            <button 
              className="schedule-refresh-btn" 
              onClick={(e) => {
                e.stopPropagation();
                // Refresh functionality can be added here
              }} 
              onMouseDown={(e) => e.stopPropagation()}
              title="Ανανέωση"
            >
              🔄
            </button>
          </div>
          <span className="schedule-teacher">{teacherName}</span>
        </div>
      </div>
      <div className="schedule-content">
        {loading ? (
          <div className="loading">Φόρτωση...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : scheduleData ? (
          <div className="schedule-data">
            {scheduleData.html ? (
              <div 
                className="schedule-html" 
                dangerouslySetInnerHTML={{ 
                  __html: scheduleData.html
                    .replace(/style="[^"]*"/g, '')
                    .replace(/class="[^"]*"/g, '')
                    .replace(/<p[^>]*>/g, '<div>')
                    .replace(/<\/p>/g, '</div>')
                }} 
              />
            ) : (
              <div className="schedule-table">
                <div className="schedule-info">
                  <h3>{scheduleData.καθηγητής}</h3>
                  {scheduleData.σχολική_χρονιά && (
                    <p>Σχολική Χρονιά: {scheduleData.σχολική_χρονιά}</p>
                  )}
                </div>
                <div className="schedule-grid">
                  {scheduleData.πρόγραμμα && Object.entries(scheduleData.πρόγραμμα)
                    .filter(([day]) => {
                      // Πάρε την επιλεγμένη ημέρα από το selectedDate prop
                      const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
                      const dateToUse = selectedDate || new Date();
                      const selectedDayIndex = dateToUse.getDay();
                      const selectedDay = dayNames[selectedDayIndex];
                      // Εμφάνισε μόνο την επιλεγμένη ημέρα
                      return day === selectedDay;
                    })
                    .map(([day, periods]) => {
                    // Determine max periods based on day
                    const isEightPeriodDay = ['Δευτέρα', 'Τρίτη', 'Πέμπτη'].includes(day);
                    const maxPeriods = isEightPeriodDay ? 8 : 7;
                    
                    return (
                      <div key={day} className="day-column">
                        <div className="day-header">{day}</div>
                        {Object.entries(periods)
                          .filter(([period]) => parseInt(period) <= maxPeriods)
                          .map(([period, subject]) => {
                            // Έλεγχος αν είναι στήριξη
                            const isSupport = subject && subject.match(/^Στ\./);

                            // Έλεγχος αν είναι συνδιδασκαλία
                            const isCoteaching = subject && subject !== '-' && coteachingPairs.some(pair =>
                              pair.day === day && pair.period === period
                            );

                            // Καθορισμός χρώματος: μπλε για στήριξη, κόκκινο για συνδιδασκαλία, πράσινο για κανονικό
                            const colorClass = isSupport ? 'support-subject' : (isCoteaching ? 'coteaching-subject' : (subject && subject !== '-' ? 'normal-subject' : ''));

                            return (
                            <div
                              key={period}
                              className={`period-cell draggable-period ${colorClass} ${dragOverPeriod === period ? 'drag-over' : ''}`}
                              draggable={subject && subject !== '-'}
                              onDragStart={(e) => {
                                if (subject && subject !== '-') {
                                  // Extract class name from subject using multiple patterns
                                  let className = null;

                                  // Pattern 0: Μαθήματα κατεύθυνσης με underscore (π.χ. "βκατ_1 ΘΕΑ_κατ" → "βκατ_1_ΘΕΑ")
                                  let classMatch = subject.match(/^([a-zα-ωΑ-Ω]+κατ_\d+)\s+([Α-ΩA-Z]+)_κατ/);
                                  if (classMatch) {
                                    className = `${classMatch[1]}_${classMatch[2]}`;
                                  }

                                  if (!className) {
                                    // Pattern 1: Στήριξη με space (π.χ. "Στ. 17 (Α24)" → "Α24")
                                    classMatch = subject.match(/^Στ\.\s*\d+\s*\(([ΑΒΓ][0-9]+)\)/);

                                    if (!classMatch) {
                                      // Pattern 1b: Στήριξη με Ο. (π.χ. "Στ.Ο.6 (Β51)" → "Β51")
                                      classMatch = subject.match(/^Στ\.(?:Ο\.)?\d+\s*\(([ΑΒΓ][0-9]+)\)/);
                                    }

                                    if (!classMatch) {
                                      // Pattern 2: Τμήμα σε παρενθέσεις (π.χ. "... (Β51)")
                                      classMatch = subject.match(/\(([ΑΒΓ][0-9]+(?:_[Α-Ω]+(?:_[Α-Ω]+)?)?)\)/);
                                    }

                                    if (!classMatch) {
                                      // Pattern 3: Συνδιδασκαλία με underscore (π.χ. "Α11_ΠΤ_Π")
                                      classMatch = subject.match(/^([ΑΒΓ][0-9]+_[Α-Ω]+(?:_[Α-Ω]+)?)/);
                                    }

                                    if (!classMatch) {
                                      // Pattern 4: Τμήμα με space (π.χ. "Α11 ΜΑΘΗΜΑΤΙΚΑ")
                                      classMatch = subject.match(/^([ΑΒΓ][0-9]+)\s/);
                                    }

                                    if (!classMatch) {
                                      // Pattern 5: Τμήμα χωρίς space (π.χ. "Α12Μαθηματικά")
                                      classMatch = subject.match(/^([ΑΒΓ][0-9]+)/);
                                    }

                                    if (!classMatch && !subject.match(/^[a-zα-ω]/)) {
                                      // Pattern 6: Μόνο γράμμα σε παρενθέσεις, αλλά ΟΧΙ για μαθήματα κατεύθυνσης
                                      classMatch = subject.match(/\(([ΑΒΓ])\)/);
                                    }

                                    if (classMatch) {
                                      className = classMatch[1];
                                    }
                                  }

                                  // Extract classroom (last word, e.g., "Γ133" from "Α12Μαθηματικά Γ133" or "Ε249" from "Στ. 17 (Α24) Ν.Κ. Μαθηματικά Προσ… Ε249")
                                  const classroomMatch = subject.match(/\s([A-ZΑ-Ωa-zα-ω]\d+[A-ZΑ-Ωa-zα-ω]?\d*)$/);
                                  const classroom = classroomMatch ? classroomMatch[1] : null;

                                  const periodData = {
                                    teacherName: teacherName,
                                    day: day,
                                    period: period,
                                    subject: subject,
                                    className: className,
                                    classroom: classroom,
                                    periodNumber: parseInt(period)
                                  };
                                  e.dataTransfer.setData('application/json', JSON.stringify(periodData));
                                  e.dataTransfer.effectAllowed = 'move';
                                  console.log('🎯 Dragging period for swap:', periodData);
                                }
                              }}
                              onDragEnd={(e) => {
                                console.log('Drag ended');
                              }}
                              onDragOver={(e) => handlePeriodDragOver(e, period)}
                              onDragLeave={handlePeriodDragLeave}
                              onDrop={(e) => handlePeriodDrop(e, day, period, subject)}
                              title={subject && subject !== '-' ?
                                `Σύρετε για αλλαγή ωρολογίου - ${subject}` :
                                'Κενή περίοδος'
                              }
                            >
                              <div className="period-subject">
                                <span className="period-number-inline">{period}η</span> {subject || '-'}
                              </div>
                            </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-data">Δεν βρέθηκαν δεδομένα</div>
        )}
      </div>

      {/* Schedule Change Modal */}
      <ScheduleChangeModal
        isOpen={showChangeModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmChange}
        changeData={changeData}
      />
    </div>
  );
};

export default TeacherScheduleCard;