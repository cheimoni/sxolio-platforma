import React, { useState, useEffect, useRef } from 'react';
import './MainWindow.css';
import './ClockLabel.css';
import SevenReplacementsPage from './SevenReplacementsPage';
import CoteachingModal from './CoteachingModal';
import SubstitutionConfirmModal from './SubstitutionConfirmModal';
import ReplacementStats from './ReplacementStats';
import SchoolClock from './SchoolClock';
import StickyNotes from './StickyNotes';
import SwapPanelWindow from './SwapPanelWindow';
import { hasCoteaching, coteachingPairs } from '../data/coteachingPairs';
import { saveReplacementsForDay } from '../firebase/tracking';
import { useDraggable } from '../hooks/useDraggable';
import { useWindowLayer } from '../hooks/useWindowLayer';
import { useResizable } from '../hooks/useResizable';
import { fetchPublic } from '../utils/pathHelper';

// Helper function to get Athens time (UTC+2)
const getAthensTime = () => {
  const now = new Date();
  // Convert to Athens timezone (Europe/Athens)
  return now.toLocaleString('el-GR', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const MainWindow = ({ selectedTeacher, teacherToAddToAbsence, selectedDate, onReplacementAssigned, onReplacementRemoved, onTeacherSelect }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [absenceData, setAbsenceData] = useState([]);
  const [draggedTeacher, setDraggedTeacher] = useState(null);
  const [bdDirectors, setBdDirectors] = useState([]);
  const [scheduleChanges, setScheduleChanges] = useState([]);
  const [replacementPositions, setReplacementPositions] = useState({});
  const [showSevenPage, setShowSevenPage] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showStudentAttendance, setShowStudentAttendance] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedClassroomFile, setSelectedClassroomFile] = useState(null);
  const [coteachingModalOpen, setCoteachingModalOpen] = useState(false);
  const [coteachingClassName, setCoteachingClassName] = useState(null);
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false);
  const [substitutionResult, setSubstitutionResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [quotas, setQuotas] = useState({});
  const [swapSlotA, setSwapSlotA] = useState(null);
  const [swapSlotB, setSwapSlotB] = useState(null);
  const [dragOverSwapSlot, setDragOverSwapSlot] = useState(null);
  const [isSwapPanelVisible, setSwapPanelVisible] = useState(false);
  const [showStickyNotes, setShowStickyNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Window layering
  const { zIndex, bringToFront } = useWindowLayer('mainWindow');

  // Draggable functionality - Default θέση 1:1 από capture
  const { position, setPosition, dragRef, handleMouseDown, resetPosition, isDragging, skipNextPositionSave } = useDraggable(902, -1, 'mainWindow');

  // Resizable functionality
  const initialWidth = Math.min(window.innerWidth - 900, 1200);
  const initialHeight = window.innerHeight - 80;  // Αφήνω 80px χώρο κάτω για sidebars
  const { size, isResizing, positionDelta, resizeRef, handleResizeStart, resetSize, resetPositionDelta } = useResizable(initialWidth, initialHeight, 400, 300, 'mainWindow');

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
    window.resetMainWindowPosition = () => {
      resetPosition();
      resetSize();
      resetPositionDelta();
    };
    return () => {
      delete window.resetMainWindowPosition;
    };
  }, [resetPosition, resetSize, resetPositionDelta]);

  // Load BD directors from file
  useEffect(() => {
    const loadBdDirectors = async () => {
      try {
        const response = await fetchPublic('/bd-directors-schedule.json');
        if (response.ok) {
          const data = await response.json();
          setBdDirectors(data);
        }
      } catch (error) {
        console.error('Error loading BD directors:', error);
      }
    };

    loadBdDirectors();
  }, []);

  // Load teacher schedule when selectedTeacher changes
  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherSchedule(selectedTeacher);
    } else {
      setScheduleData(null);
    }
  }, [selectedTeacher]);

  // Handle teacher double-click for absence report
  useEffect(() => {
    if (teacherToAddToAbsence) {
      console.log('MainWindow: Adding teacher to absence report:', teacherToAddToAbsence);
      addTeacherToAbsenceReport(teacherToAddToAbsence);
    }
  }, [teacherToAddToAbsence]);


  // Emit absenceData changes to QuotaDisplayWindow and App
  useEffect(() => {
    const event = new CustomEvent('absenceDataChanged', {
      detail: { absenceData }
    });
    window.dispatchEvent(event);
  }, [absenceData]);

  // Listen for period drag events from TeacherScheduleCard
  useEffect(() => {
    const handlePeriodDraggedToSwap = (e) => {
      const periodData = e.detail;
      console.log('🔄 Period dragged to swap manager:', periodData);

      // If both slots are empty, fill slot A
      if (!swapSlotA && !swapSlotB) {
        setSwapSlotA(periodData);
      }
      // If only slot A is filled, fill slot B
      else if (swapSlotA && !swapSlotB) {
        setSwapSlotB(periodData);
      }
      // If both slots are filled, ask which one to replace
      else if (swapSlotA && swapSlotB) {
        const choice = window.confirm('Θέλετε να αντικαταστήσετε τη Θέση A; (OK για Α, Cancel για Β)');
        if (choice) {
          setSwapSlotA(periodData);
        } else {
          setSwapSlotB(periodData);
        }
      }
      // If only slot B is filled, fill slot A
      else if (!swapSlotA && swapSlotB) {
        setSwapSlotA(periodData);
      }
    };

    window.addEventListener('periodDraggedToSwap', handlePeriodDraggedToSwap);
    return () => window.removeEventListener('periodDraggedToSwap', handlePeriodDraggedToSwap);
  }, [swapSlotA, swapSlotB]);

  // Mouse hover trigger to show swap panel
  useEffect(() => {
    const handleMouseMove = (e) => {
      const threshold = 10; // pixels from bottom
      const windowHeight = window.innerHeight;

      // If mouse is near bottom and panel is not visible, show it
      if (!isSwapPanelVisible && windowHeight - e.clientY <= threshold) {
        setSwapPanelVisible(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isSwapPanelVisible]);

  // Listen for schedule change events from TeacherScheduleCard
  useEffect(() => {
    const handleScheduleChange = (e) => {
      const changeData = e.detail;
      console.log('📅 Schedule change received:', changeData);

      // Create a unique ID for this change
      const changeId = `${changeData.teacherA.name}-${changeData.teacherB.name}-${changeData.day}-${changeData.periodA}-${Date.now()}`;

      // Add to schedule changes
      const newChange = {
        id: changeId,
        fromTeacher: changeData.teacherA.name,
        toTeacher: changeData.teacherB.name,
        fromClass: changeData.teacherA.className,
        toClass: changeData.teacherB.className,
        fromSubject: changeData.teacherA.subject,
        toSubject: changeData.teacherB.subject,
        period: changeData.periodA,
        day: changeData.day,
        timestamp: new Date().toLocaleString('el-GR', {
          timeZone: 'Europe/Athens',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setScheduleChanges(prev => [...prev, newChange]);
      console.log('✅ Schedule change added to list');
    };

    window.addEventListener('scheduleChange', handleScheduleChange);
    return () => {
      window.removeEventListener('scheduleChange', handleScheduleChange);
    };
  }, []);

  // Load quotas from localStorage
  useEffect(() => {
    const loadQuotas = () => {
      try {
        const saved = localStorage.getItem('teacherQuotas');
        if (saved) {
          const parsed = JSON.parse(saved);
          setQuotas(parsed);
          // Debug: log quotas keys and count
          const keys = Object.keys(parsed);
          console.log(`📊 Loaded ${keys.length} quotas. Keys:`, keys.slice(0, 10));
          if (keys.length > 0) {
            console.log('📊 Sample quota:', keys[0], '=', parsed[keys[0]]);
          }
        } else {
          console.log('⚠️ No quotas found in localStorage');
        }
      } catch (err) {
        console.error('Error loading quotas:', err);
      }
    };

    loadQuotas();
    const interval = setInterval(loadQuotas, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen mode with ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Helper function to find quota by name (case-insensitive, trim spaces)
  const findQuota = (name) => {
    if (!name) return null;
    if (!quotas || Object.keys(quotas).length === 0) {
      console.log(`⚠️ No quotas loaded yet for "${name}"`);
      return null;
    }
    
    const trimmedName = name.trim();
    if (!trimmedName) return null;
    
    const normalizedName = trimmedName.toUpperCase();
    
    // Try exact match first
    if (quotas[trimmedName]) {
      console.log(`✅ Found exact match for "${trimmedName}":`, quotas[trimmedName]);
      return quotas[trimmedName];
    }
    
    // Try case-insensitive match
    for (const key in quotas) {
      if (key && key.trim().toUpperCase() === normalizedName) {
        console.log(`✅ Found case-insensitive match: "${key}" for "${trimmedName}":`, quotas[key]);
        return quotas[key];
      }
    }
    
    // Try partial match (contains)
    for (const key in quotas) {
      if (key && (key.trim().toUpperCase().includes(normalizedName) || normalizedName.includes(key.trim().toUpperCase()))) {
        console.log(`✅ Found partial match: "${key}" for "${trimmedName}":`, quotas[key]);
        return quotas[key];
      }
    }
    
    // Debug: log what we're looking for vs what we have
    const availableKeys = Object.keys(quotas).slice(0, 10);
    console.log(`❌ No quota found for "${trimmedName}". Looking for: "${normalizedName}". Available keys (first 10):`, availableKeys);
    return null;
  };

  const loadTeacherSchedule = async (teacherName) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchPublic('/teachers.json');
      const teachers = await response.json();
      
      // Find teacher with robust matching
      const teacher = teachers.find(t => 
        t.καθηγητής.toUpperCase().trim() === teacherName.toUpperCase().trim()
      );
      
      if (teacher) {
        setScheduleData(teacher);
        console.log('Found teacher:', teacher.καθηγητής);
      } else {
        setError(`Δεν βρέθηκε καθηγητής: ${teacherName}`);
        console.log('Teacher not found:', teacherName);
      }
    } catch (err) {
      setError('Σφάλμα φόρτωσης δεδομένων');
      console.error('Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMaxPeriodsForDay = (day) => {
    return ['Δευτέρα', 'Τρίτη', 'Πέμπτη'].includes(day) ? 8 : 7;
  };

  const getCurrentDayName = () => {
    const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    const dayName = days[selectedDate.getDay()];
    console.log('Selected day:', dayName, 'Date:', selectedDate.toDateString());
    return dayName;
  };

  // Function to check if a day has 8 periods or 7 periods
  const getDayPeriodCount = (dayName) => {
    // Σταθερή λογική βασισμένη στα δεδομένα του σχολείου:
    // Δευτέρα, Πέμπτη: 8 περίοδοι
    // Τρίτη, Τετάρτη, Παρασκευή: 7 περίοδοι
    const daysWith8Periods = ['Δευτέρα', 'Πέμπτη'];
    return daysWith8Periods.includes(dayName) ? 8 : 7;
  };

  // Function to check if a period should show "///////////////"
  const shouldShowSlashLine = (periodNumber, dayName, isLastPeriod) => {
    const isFirstPeriod = periodNumber === 1;
    const dayPeriodCount = getDayPeriodCount(dayName);
    
    // For days with 8 periods: 1st period and 8th period (if last)
    if (dayPeriodCount === 8) {
      return isFirstPeriod || (periodNumber === 8 && isLastPeriod);
    }
    
    // For days with 7 periods: 1st period and 7th period (if last)
    if (dayPeriodCount === 7) {
      return isFirstPeriod || (periodNumber === 7 && isLastPeriod);
    }
    
    return false;
  };

  const getCurrentDaySchedule = () => {
    if (!scheduleData) return null;
    const dayName = getCurrentDayName();
    return scheduleData.πρόγραμμα[dayName] || null;
  };

  const getCurrentDayScheduleWithSubjects = () => {
    if (!scheduleData) return null;
    const dayName = getCurrentDayName();
    const daySchedule = scheduleData.πρόγραμμα[dayName];
    if (!daySchedule) return null;
    
    // Filter out null/empty periods and create array of subjects with their periods
    const subjectsWithPeriods = [];
    for (let i = 1; i <= 8; i++) {
      const subject = daySchedule[i.toString()];
      if (subject) {
        subjectsWithPeriods.push({
          period: i,
          subject: subject
        });
      }
    }
    
    return subjectsWithPeriods;
  };

  const addTeacherToAbsenceReport = async (teacherData) => {
    console.log('🚀 Starting addTeacherToAbsenceReport with:', teacherData);
    
    if (!teacherData) {
      console.log('❌ No teacherData provided');
      return;
    }
    
    const teacherName = teacherData.καθηγητής || teacherData.name;
    console.log('👤 Teacher name:', teacherName);
    
    if (!teacherName) {
      console.log('❌ No teacher name found in teacherData:', teacherData);
      return;
    }
    
    // Check if teacher is already in absence list
    const existingTeacher = absenceData.find(teacher => 
      teacher.absentTeacher && teacher.absentTeacher.toUpperCase() === teacherName.toUpperCase()
    );
    
    if (existingTeacher) {
      console.log('Teacher already in absence list:', teacherName);
      return;
    }
    
    // Check if it's a B.D. director
    if (teacherData.isBdDirector) {
      // For B.D. directors, add them with special handling
      const newAbsentTeacher = {
        absentTeacher: `${teacherName} (${teacherData.τίτλος}${teacherData.ειδικότητα ? ` - ${teacherData.ειδικότητα}` : ''})`,
        periods: [{
          period: "7η-8η",
          replacement: "///////////////",
          subject: `Β.Δ. - ${teacherData.ειδικότητα || 'Γενικά'}`
        }],
        total: "1",
        isBdDirector: true
      };
      
      setAbsenceData(prev => [...prev, newAbsentTeacher]);
      console.log('Added B.D. director to absence report:', teacherName);
      return;
    }
    
    // Load teacher schedule data if not already loaded
    let teacherScheduleData = scheduleData;
    if (!teacherScheduleData || teacherScheduleData.καθηγητής !== teacherName) {
      try {
        const response = await fetchPublic('/teachers.json');
        const teachers = await response.json();
        teacherScheduleData = teachers.find(t => 
          t.καθηγητής.toUpperCase().trim() === teacherName.toUpperCase().trim()
        );
      } catch (err) {
        console.error('Error loading teacher data:', err);
        return;
      }
    }
    
    if (!teacherScheduleData) {
      console.log('Teacher not found in schedule data:', teacherName);
      return;
    }
    
    // Get current day schedule for the teacher
    const dayName = getCurrentDayName();
    const daySchedule = teacherScheduleData.πρόγραμμα?.[dayName];
    
    console.log('📅 Current day:', dayName);
    console.log('📚 Teacher schedule data available days:', Object.keys(teacherScheduleData.πρόγραμμα || {}));
    console.log('🔍 Looking for day schedule:', daySchedule);
    
    if (!daySchedule) {
      console.log('❌ No schedule data for current day:', dayName);
      return;
    }
    
    // Find periods with subjects for current day
    const periodsWithSubjects = [];
    console.log(`🔍 Processing teacher ${teacherName} for day ${dayName}:`);
    console.log('📋 Day schedule:', daySchedule);
    
    // Determine the last period for this day
    const dayPeriodCount = getDayPeriodCount(dayName);

    for (let i = 1; i <= dayPeriodCount; i++) {  // Loop μόνο μέχρι τις περιόδους της ημέρας
      const subject = daySchedule[i.toString()];
      console.log(`  Period ${i}: ${subject}`);

      // Πάντα προσθέτουμε την 1η περίοδο και την τελευταία (7η ή 8η) ακόμα και αν είναι κενές
      const isFirstPeriod = i === 1;
      const isLastPeriodOfDay = i === dayPeriodCount;
      const shouldAlwaysInclude = isFirstPeriod || isLastPeriodOfDay;

      // Only add periods that have subjects OR are first/last period
      if (subject || shouldAlwaysInclude) {
        // Check if this is the last period with a subject
        let isLastPeriod = false;
        // Check if there are any subjects after this period (μέχρι την τελευταία της ημέρας)
        let hasSubjectAfter = false;
        for (let j = i + 1; j <= dayPeriodCount; j++) {
          if (daySchedule[j.toString()]) {
            hasSubjectAfter = true;
            break;
          }
        }
        isLastPeriod = !hasSubjectAfter;

        let replacementText = "ΑΝΑΠΛΗΡΩΤΗΣ";
        if (shouldShowSlashLine(i, dayName, isLastPeriod) || shouldAlwaysInclude) {
          replacementText = "///////////////";
        }
        
        // Εξάγουμε το ΠΛΗΡΕΣ όνομα τμήματος από το subject
        // Examples:
        // "Στ.Ο.4 (Γ1) Εικαστικές..." → "Στ.Ο.4 (Γ1)"
        // "Γκατ_1 ΕΙΚ_κατ (Γ) Εικαστικές..." → "Γκατ_1 ΕΙΚ_κατ (Γ)"
        // "Α11 Μαθηματικά..." → "Α11"
        // "Α11_ΠΤ_Π Πληροφορική..." → "Α11_ΠΤ_Π"
        let className = null;

        // Only extract className if subject exists
        if (subject) {
          // Pattern 1: Στήριξη (Στ.Ο.X ή Στ. X) με παρενθέσεις → ΠΛΗΡΕΣ ΟΝΟΜΑ
          // "Στ.Ο.4 (Γ1)" or "Στ. 17 (Α24)"
          let classMatch = subject.match(/^(Στ\.?\s*(?:Ο\.?)?\s*\d+\s*\([ΑΒΓ][0-9]+\))/);

          if (!classMatch) {
            // Pattern 2: Συνδιδασκαλία με _κατ και παρενθέσεις → ΠΛΗΡΕΣ ΟΝΟΜΑ
            // "Γκατ_1 ΕΙΚ_κατ (Γ)" or "βκατ_1 ΒΙΟ_κατ (Β)" or "Γκατ_2 ΓΑΛ_6_κατ (Γ"
            // Pattern: [Letters]_[Number] [CAPS]_κατ (Class)
            classMatch = subject.match(/^([Α-Ωα-ω]+_\d+\s+[Α-Ω0-9_]+κατ\s*\([ΑΒΓ][0-9]*\))/);
          }

          if (!classMatch) {
            // Pattern 3: Συνδιδασκαλία απλή με underscore (π.χ. "Α11_ΠΤ_Π")
            classMatch = subject.match(/^([ΑΒΓ][0-9]+_[Α-Ω]+(?:_[Α-Ω]+)?)/);
          }

          if (!classMatch) {
            // Pattern 4: Τμήμα σε παρενθέσεις με underscore (π.χ. "... (Β51_ΠΤ)")
            classMatch = subject.match(/\(([ΑΒΓ][0-9]+(?:_[Α-Ω]+)?)\)/);
          }

          if (!classMatch) {
            // Pattern 5: Τμήμα με space (π.χ. "Α11 ΜΑΘΗΜΑΤΙΚΑ")
            classMatch = subject.match(/^([ΑΒΓ][0-9]+)\s/);
          }

          if (!classMatch) {
            // Pattern 6: Τμήμα χωρίς space (π.χ. "Β52Μαθηματικά") - τελευταία επιλογή
            classMatch = subject.match(/^([ΑΒΓ][0-9]+)/);
          }

          if (classMatch) {
            className = classMatch[1];
          }
        }
        
        const periodData = {
          period: `${i}η`,
          replacement: replacementText,
          subject: subject || `Β.Δ. - ${isFirstPeriod ? 'Παρουσίες 1η ώρα' : 'Παρουσίες τελευταία ώρα'}`,
          class: className
        };
        
        periodsWithSubjects.push(periodData);
        console.log(`  ✅ Added period ${i}η:`, periodData);
      }
    }
    
    console.log(`📊 Total periods found for ${teacherName}: ${periodsWithSubjects.length}`);
    console.log('🔍 All periods:', periodsWithSubjects);
    
    if (periodsWithSubjects.length > 0) {
      const newAbsentTeacher = {
        absentTeacher: teacherName,
        periods: periodsWithSubjects,
        total: periodsWithSubjects.length.toString(),
        isBdDirector: false
      };
      
      setAbsenceData(prev => {
        const newData = [...prev, newAbsentTeacher];
        console.log(`💾 Updated absence data with ${newAbsentTeacher.periods.length} periods:`, newData);
        return newData;
      });
      console.log(`✅ Successfully added teacher ${teacherName} with ${periodsWithSubjects.length} periods to absence report`);
    } else {
      // Even if no subjects for current day, add teacher with a note
      const newAbsentTeacher = {
        absentTeacher: teacherName,
        periods: [{
          period: "1η-8η",
          replacement: "///////////////",
          subject: `Δεν υπάρχει πρόγραμμα για ${dayName}`
        }],
        total: "1",
        isBdDirector: false
      };
      
      setAbsenceData(prev => [...prev, newAbsentTeacher]);
      console.log('Added teacher to absence report (no schedule for current day):', teacherName);
    }
  };

  const removeTeacherFromAbsenceReport = (teacherName) => {
    if (!teacherName) return;

    setAbsenceData(prev => prev.filter(teacher =>
      teacher.absentTeacher && teacher.absentTeacher.toUpperCase() !== teacherName.toUpperCase()
    ));
  };

  // Χειρισμός δεξιού κλικ σε καθηγητή για άνοιγμα απουσιολογίου
  const handleTeacherRightClick = (e, teacher) => {
    e.preventDefault(); // Αποτρέπει το default context menu

    // Βρίσκουμε τα unique τμήματα του καθηγητή
    const classrooms = [...new Set(teacher.periods.map(p => p.class).filter(Boolean))];

    if (classrooms.length === 0) {
      alert('Δεν βρέθηκαν τμήματα για αυτόν τον καθηγητή');
      return;
    }

    // Αν υπάρχει μόνο ένα τμήμα, ανοίγει απευθείας το απουσιολόγιο
    if (classrooms.length === 1) {
      const classroom = classrooms[0];
      const filePath = getClassroomFilePath(classroom);

      if (filePath) {
        // Στέλνουμε event στο App.js για να ανοίξει το StudentAttendanceList
        const event = new CustomEvent('openStudentAttendance', {
          detail: { 
            absenceData,
            classroom,
            filePath
          }
        });
        window.dispatchEvent(event);
      } else {
        alert(`Δεν βρέθηκε αρχείο απουσιολογίου για το τμήμα ${classroom}`);
      }
    } else {
      // Αν υπάρχουν πολλά τμήματα, δείχνει τη λίστα
      const event = new CustomEvent('openStudentAttendance', {
        detail: { absenceData }
      });
      window.dispatchEvent(event);
    }
  };

  // Helper function για το mapping τμημάτων σε αρχεία
  const getClassroomFilePath = (className, subjectText = null) => {
    if (!className) {
      return '/tmimata-kanonika.txt'; // Χρησιμοποιούμε .txt αντί για .html (πιο γρήγορο)
    }
    
    const trimmed = className.trim();
    const upper = trimmed.toUpperCase();
    
    const isSupport = upper.startsWith('ΣΤ.');
    const isRegular = /^[ΑΒΓ][0-9]+/.test(upper);
    const isCoteaching = upper.includes('_') || upper.includes('ΚΑΤ');

    // ΓΙΑ ΣΤΗΡΙΞΗ: Χρησιμοποιούμε support-classes.json
    if (isSupport) {
      console.log(`📂 Support "${className}" → Using /support-classes.json`);
      return '/support-classes.json';
    }

    // ΓΙΑ ΣΥΝΔΙΔΑΣΚΑΛΙΕΣ: Χρησιμοποιούμε coteaching-classes.json
    if (isCoteaching) {
      console.log(`📂 Coteaching "${className}" → Using /coteaching-classes.json`);
      return '/coteaching-classes.json';
    }

    // ΓΙΑ ΚΑΝΟΝΙΚΕΣ ΤΑΞΕΙΣ: Χρησιμοποιούμε tmimata-kanonika.txt
    if (isRegular) {
      console.log(`📂 Regular "${className}" → Using /tmimata-kanonika.txt`);
      return '/tmimata-kanonika.txt';
    }

    // Fallback
    return '/tmimata-kanonika.txt';
  };

  // Handler για δεξί κλικ στο μάθημα - εξάγει το τμήμα από το subject
  const handleClassRightClick = (e, subjectText, periodClass) => {
    e.preventDefault(); // Αποτρέπει το default context menu

    console.log('🔍 handleClassRightClick called with:', { subjectText, periodClass });

    // Προσπαθούμε να πάρουμε το τμήμα από το period.class
    let className = periodClass;

    // Αν δεν υπάρχει στο period.class, εξάγουμε από το subject text
    if (!className && subjectText) {
      // Το τμήμα μπορεί να είναι στην αρχή ή μέσα σε παρενθέσεις
      // Patterns: "Α11 ΜΑΘΗΜΑΤΙΚΑ", "Α11_ΠΤ_ΠΠληροφορική", "Στ.Ο.6 (Β51)"

      // Priority 1: Special groups like "Στ.Ο.6 (Β51)" or "Γκατ_1 (Γ31)" or "Γκατ_1 ΕΙΚ_κατ (Γ)"
      // ΚΡΙΣΙΜΟ: Για support groups, πρέπει να πάρουμε ΟΛΟ το όνομα (π.χ. "Στ.Ο.4 (Γ1)"), όχι μόνο το τμήμα!
      let classMatch = subjectText.match(/^(Στ\.(?:Ο\.)?\s*\d+\s*\([ΑΒΓ][0-9]+\))/); // e.g., "Στ.Ο.6 (Β51)" or "Στ. 11 (Γ41)"
      // Για Γκατ: πιάνουμε "Γκατ_1" ή "Γκατ_1 ΕΙΚ_κατ" (με ή χωρίς παρενθέσεις στο τέλος)
      if (!classMatch) classMatch = subjectText.match(/^(Γκατ_\d+(?:\s+[Α-Ω_]+)?(?:\s*\([ΑΒΓ][0-9]*\))?)/); // e.g., "Γκατ_1 (Γ31)", "Γκατ_1 ΕΙΚ_κατ (Γ)", "Γκατ_4 (Γ)"
      if (!classMatch) classMatch = subjectText.match(/^(βκατ_\d+.*?\([ΑΒΓ]\))/); // e.g., "βκατ_1 ΠΛΗ_κατ (Β)"

      // Priority 2: Coteaching like "B11+B32"
      if (!classMatch) classMatch = subjectText.match(/^([ΑΒΓ]\d{2}\+[ΑΒΓ]\d{2})/);

      // Priority 3: Standard class name at the beginning
      if (!classMatch) classMatch = subjectText.match(/^([ΑΒΓ]\d{2})/);

      if (classMatch) {
        // ΚΡΙΣΙΜΟ: Χρησιμοποιούμε classMatch[0] (full match) για support groups, classMatch[1] για capture groups
        // Αν το classMatch[1] υπάρχει (capture group), το χρησιμοποιούμε, αλλιώς το classMatch[0] (full match)
        className = classMatch[1] || classMatch[0];
        
        // Για Γκατ: αφαιρούμε τις παρενθέσεις στο τέλος (π.χ. "Γκατ_1 ΕΙΚ_κατ (Γ)" → "Γκατ_1 ΕΙΚ_κατ")
        // Αλλά ΚΡΑΤΑΜΕ τις παρενθέσεις για Στ.Ο. (π.χ. "Στ.Ο.4 (Γ1)" → "Στ.Ο.4 (Γ1)")
        if (className.startsWith('Γκατ_') || className.startsWith('βκατ_')) {
          className = className.replace(/\s*\([ΑΒΓ][0-9]*\)\s*$/, '').trim();
        }
        
        console.log('✅ Extracted className from subject:', className);
        // Αν είναι support group, επιβεβαιώνουμε ότι έχουμε το ολόκληρο όνομα
        if (className.match(/^Στ\./)) {
          console.log('📌 Support group detected - using full name:', className);
        }
      } else {
        console.log('❌ No className found in subject text');
      }
    }

    if (!className) {
      alert(`Δεν βρέθηκε τμήμα για αυτό το μάθημα.\nSubject: "${subjectText}"\nΠαρακαλώ ελέγξτε το πρόγραμμα.`);
      return;
    }
    
    const filePath = getClassroomFilePath(className, subjectText);

    if (filePath) {
      console.log('✅ Found file path:', filePath);
      // Στέλνουμε event στο App.js για να ανοίξει το StudentAttendanceList
      const event = new CustomEvent('openStudentAttendance', {
        detail: { 
          absenceData,
          classroom: className,
          filePath
        }
      });
      window.dispatchEvent(event);
    } else {
      alert(`Δεν βρέθηκε αρχείο απουσιολογίου για το τμήμα ${className}`);
    }
  };

  // Handle drag and drop for substitutions
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Get the dragged period from the drag data
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { period: draggedPeriod } = dragData;
      const targetPeriod = parseInt(e.currentTarget.getAttribute('data-period'));
      
      // Add visual feedback based on period match
      if (draggedPeriod === targetPeriod) {
        e.currentTarget.classList.add('correct-period');
        e.currentTarget.classList.remove('wrong-period');
      } else {
        e.currentTarget.classList.add('wrong-period');
        e.currentTarget.classList.remove('correct-period');
      }
    } catch (err) {
      e.currentTarget.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('correct-period');
    e.currentTarget.classList.remove('wrong-period');
  };

  const handleDrop = async (e, targetPeriod, targetTeacher) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('correct-period');
    e.currentTarget.classList.remove('wrong-period');
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { teacherName, period: draggedPeriod, teachingHours } = dragData;
      
      console.log('Dropped teacher:', teacherName, 'for period:', targetPeriod, 'for teacher:', targetTeacher, 'dragged from period:', draggedPeriod);
      
      // Only allow dropping if the period matches exactly
      if (draggedPeriod !== targetPeriod) {
        console.log(`❌ Cannot place ${teacherName} from ${draggedPeriod}η period to ${targetPeriod}η period - periods must match!`);
        alert(`Λάθος! Δεν μπορείτε να βάλετε καθηγητή από ${draggedPeriod}η περίοδο στην ${targetPeriod}η περίοδο. Οι περίοδοι πρέπει να ταιριάζουν!`);
        return;
      }
      
      // Check if teacher is available for this specific period
      // We need to verify the teacher is actually free during this period
      // AND that they don't have coteaching with the absent teacher
      const dayName = getCurrentDayName();

      // ΠΡΩΤΑ: Έλεγχος για συνδιδασκαλία από το ειδικό component
      if (hasCoteaching(teacherName, targetTeacher, dayName, targetPeriod.toString())) {
        console.log(`❌ ΣΥΝΔΙΔΑΣΚΑΛΙΑ! ${teacherName} και ${targetTeacher} διδάσκουν μαζί την ${dayName}, περίοδο ${targetPeriod}`);
        alert(`Λάθος! Ο καθηγητής ${teacherName} έχει συνδιδασκαλία με τον ${targetTeacher} την ${dayName}, περίοδο ${targetPeriod}η. Δεν μπορεί να τον αναπληρώσει!`);
        return;
      }

      const isTeacherAvailableForPeriod = async () => {
        try {
          // ΔΕΥΤΕΡΑ: Έλεγχος αν ο καθηγητής έχει μάθημα την ίδια περίοδο
          const response = await fetchPublic('/teachers.json');
          const teachers = await response.json();
          const teacher = teachers.find(t =>
            t.καθηγητής.toUpperCase().trim() === teacherName.toUpperCase().trim()
          );

          if (!teacher) return false;

          const daySchedule = teacher.πρόγραμμα?.[dayName];
          if (!daySchedule) return false;

          const periodSubject = daySchedule[targetPeriod.toString()];

          // If teacher has no class this period, they're available
          if (periodSubject === null || periodSubject === '-' || periodSubject === undefined) {
            return true;
          }

          // Teacher has a class - not available
          return false;
        } catch (err) {
          console.error('Error checking teacher availability:', err);
          return false;
        }
      };

      const isAvailable = await isTeacherAvailableForPeriod();
      if (!isAvailable) {
        console.log(`❌ Teacher ${teacherName} is not available for period ${targetPeriod}!`);
        alert(`Λάθος! Ο καθηγητής ${teacherName} δεν είναι διαθέσιμος για την ${targetPeriod}η περίοδο. Έχει ήδη μάθημα!`);
        return;
      }
      
      const absentTeacher = absenceData.find(teacher => 
        teacher.absentTeacher === targetTeacher
      );
      
      console.log(`🎯 Looking for teacher: ${targetTeacher}`);
      console.log(`🔍 Found teacher:`, absentTeacher);
      
      if (absentTeacher) {
        // Check if this teacher is already assigned to this specific position
        const existingReplacement = absentTeacher.periods.find(p => 
          p.period === `${targetPeriod}η` && p.replacement === teacherName
        );
        
        if (existingReplacement) {
          console.log(`Teacher ${teacherName} is already assigned to this position`);
          return;
        }
        
        // Update the replacement for this specific period
        setAbsenceData(prev => {
          const updatedData = prev.map(teacher => {
            if (teacher.absentTeacher === absentTeacher.absentTeacher) {
              const updatedTeacher = {
                ...teacher,
                periods: teacher.periods.map(p => 
                  p.period === `${targetPeriod}η` 
                    ? { ...p, replacement: teacherName }
                    : p
                )
              };
              console.log(`🔄 Updated teacher ${teacher.absentTeacher}:`, updatedTeacher);
              return updatedTeacher;
            }
            return teacher;
          });
          console.log(`📊 Full absence data after update:`, updatedData);
          return updatedData;
        });
        
        // Store the position for this teacher
        setReplacementPositions(prev => ({
          ...prev,
          [teacherName]: {
            absentTeacher: absentTeacher.absentTeacher,
            period: targetPeriod,
            timestamp: getAthensTime()
          }
        }));
        
        console.log(`✅ Correctly placed ${teacherName} for ${targetPeriod}η period`);
        
        // Notify parent component about the assignment
        if (onReplacementAssigned) {
          onReplacementAssigned(teacherName);
        }
      } else {
        console.log('No absent teacher found for period:', targetPeriod);
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  };

  const printToPDF = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = document.querySelector('.absence-report-display');
    
    if (printContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Αναφορά Απουσιών</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.5;
              font-weight: bold;
            }
            
            .absence-report-display {
              padding: 5px;
              max-width: 100%;
            }
            
            .report-header {
              text-align: center;
              margin-bottom: 2px;
              border-bottom: 2px solid #333;
              padding-bottom: 2px;
            }
            
            .report-header h1 {
              font-size: 22px;
              font-weight: 900;
              color: #333;
              margin: 0 0 2px 0;
              line-height: 1.1;
            }
            
            .report-date {
              font-size: 16px;
              color: #333;
              font-weight: 900;
              line-height: 1.1;
            }
            
            .section {
              margin-bottom: 2px;
            }
            
            .section h2 {
              font-size: 18px;
              font-weight: 900;
              color: #333;
              margin: 0 0 1px 0;
              background: #f0f0f0;
              padding: 2px;
              border-left: 4px solid #2196F3;
              line-height: 1.1;
            }
            
            .section h3 {
              font-size: 16px;
              font-weight: 900;
              color: #333;
              margin: 0 0 1px 0;
              line-height: 1.1;
            }
            
            .section h4 {
              font-size: 14px;
              font-weight: 900;
              color: #333;
              margin: 0 0 1px 0;
              line-height: 1.1;
            }
            
            .table-container {
              overflow-x: auto;
              margin-bottom: 1px;
            }
            
            .absence-table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #333;
              font-size: 14px;
              font-weight: 900;
            }
            
            .absence-table th {
              background: #f5f5f5;
              border: 1px solid #333;
              padding: 2px 1px;
              font-weight: 900;
              text-align: center;
              font-size: 14px;
              line-height: 1.1;
            }
            
            .absence-table td {
              border: 1px solid #333;
              padding: 2px 1px;
              vertical-align: top;
              font-weight: 900;
              line-height: 1.1;
            }
            
            .teacher-name {
              font-weight: 900;
              background: #f9f9f9;
              text-align: center;
              vertical-align: middle !important;
              font-size: 18px;
              min-width: 200px;
              width: 200px;
            }
            
            .teacher-name-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0px;
              width: 100%;
            }
            
            .period {
              text-align: center;
              font-weight: 900;
              background: #e3f2fd;
              font-size: 14px;
            }
            
            .replacement {
              font-weight: 900;
              background: #e8f5e8;
              font-size: 14px;
              padding: 2px 2px;
              min-height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .subject {
              font-size: 12px;
              line-height: 1.3;
              font-weight: 900;
            }
            
            .total {
              text-align: center;
              font-weight: 900;
              background: #fff3e0;
              vertical-align: middle !important;
              font-size: 14px;
            }
            
            .no-absent-teachers {
              background: #f9f9f9;
              border: 2px dashed #ccc;
              padding: 5px;
              text-align: center;
              color: #666;
              font-style: italic;
            }
            
            .no-absent-teachers p {
              margin: 2px 0;
              font-size: 16px;
              font-weight: 900;
              line-height: 1.1;
            }
            
            .no-absent-teachers .day-info {
              font-weight: 900;
              color: #2196F3;
              margin-top: 1px !important;
            }
            
            .sub-section {
              margin-left: 2px;
            }
            
            .no-assistant-directors {
              background: #f0f0f0;
              border: 1px solid #ccc;
              padding: 2px;
              text-align: center;
              font-style: italic;
              color: #333;
              font-size: 14px;
              font-weight: 900;
              line-height: 1.1;
            }
            
            .report-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 2px;
              padding-top: 2px;
              border-top: 1px solid #ccc;
              font-size: 14px;
              color: #333;
              font-weight: 900;
              line-height: 1.1;
            }
            
            .footer-left {
              font-weight: 900;
            }
            
            .footer-right {
              font-style: italic;
              font-weight: 900;
            }
            
            .summary-section {
              display: none;
            }
            
            .schedule-changes-section {
              margin-top: 10px;
              padding: 10px;
              border: 2px solid #333;
              border-radius: 4px;
            }
            
            .schedule-changes-section h3 {
              font-size: 16px;
              font-weight: 900;
              margin-bottom: 8px;
              text-align: center;
            }
            
            .schedule-changes-list {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            
            .schedule-change-item-compact {
              padding: 4px 4px 4px 2px;
              border-left: 3px solid #333;
              border-right: none;
              border-top: none;
              border-bottom: none;
              border-radius: 0;
              margin-bottom: 1px;
              margin-left: 0;
            }
            
            .schedule-change-item-compact .compact-change-header {
              display: none;
            }
            
            .schedule-change-item-compact .compact-teachers {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              flex-wrap: nowrap;
              margin-bottom: 4px;
            }
            
            .schedule-change-item-compact .compact-teacher {
              display: flex;
              flex-direction: column;
              gap: 2px;
              flex: 1;
            }
            
            .schedule-change-item-compact .compact-name {
              font-size: 18px;
              font-weight: 900;
              color: #333;
              margin-bottom: 2px;
              margin-left: 4px;
            }
            
            .schedule-change-item-compact .compact-details {
              font-size: 16px;
              font-weight: 900;
              color: #333;
              line-height: 1.3;
              margin-left: 4px;
            }

            .schedule-change-item-compact .compact-subject {
              font-size: 14px;
              font-weight: 700;
              color: #333;
              line-height: 1.4;
              margin-top: 3px;
              margin-left: 4px;
              word-wrap: break-word;
            }

            /* Hide day name in print */
            .schedule-change-item-compact .compact-details .print-hide-day {
              display: none;
            }

            /* Make classes bold in print */
            .schedule-change-item-compact .compact-details .print-bold-classes {
              font-weight: 900;
            }

            .schedule-change-item-compact .compact-arrow {
              font-size: 28px;
              color: #333;
              font-weight: 900;
              align-self: center;
              margin: 0 10px;
            }
            
            .schedule-change-item-compact .compact-remove-btn {
              display: none;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              .absence-report-display {
                padding: 3px !important;
              }
              
              .action-buttons,
              .print-btn,
              button {
                display: none !important;
              }
              
              @page {
                size: A4 landscape;
                margin: 0.2in;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      window.print();
    }
  };

  const dayNames = ['ΚΥΡΙΑΚΗ', 'ΔΕΥΤΕΡΑ', 'ΤΡΙΤΗ', 'ΤΕΤΑΡΤΗ', 'ΠΕΜΠΤΗ', 'ΠΑΡΑΣΚΕΥΗ', 'ΣΑΒΒΑΤΟ'];
  const dayName = dayNames[selectedDate.getDay()];
  const formattedDate = `${dayName} ${selectedDate.toISOString().split('T')[0]}`;
  const printDate = `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;

  const handleScheduleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Do nothing - drops are only handled in the swap manager panel
    console.log('Drop on main window - ignoring (use swap manager panel instead)');
  };

  const handleScheduleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const removeScheduleChange = (changeId) => {
    setScheduleChanges(prev => prev.filter(change => change.id !== changeId));
  };

  // Swap manager handlers
  const handleSwapSlots = () => {
    // Swap positions A and B
    const temp = swapSlotA;
    setSwapSlotA(swapSlotB);
    setSwapSlotB(temp);
  };

  const handleClearSlotA = () => {
    setSwapSlotA(null);
  };

  const handleClearSlotB = () => {
    setSwapSlotB(null);
  };

  const handleClearAllSlots = () => {
    setSwapSlotA(null);
    setSwapSlotB(null);
  };

  const handleConfirmSwap = () => {
    if (!swapSlotA || !swapSlotB) {
      alert('Πρέπει να συμπληρώσετε και τις δύο θέσεις!');
      return;
    }

    // Check if any teacher is absent
    const absentTeachers = absenceData
      .filter(absence => absence && absence.absentTeacher)
      .map(absence => absence.absentTeacher);

    if (absentTeachers.includes(swapSlotA.teacherName)) {
      alert(`⚠️ Ο καθηγητής ${swapSlotA.teacherName} απουσιάζει και δεν μπορεί να κάνει αλλαγή προγράμματος!`);
      return;
    }

    if (absentTeachers.includes(swapSlotB.teacherName)) {
      alert(`⚠️ Ο καθηγητής ${swapSlotB.teacherName} απουσιάζει και δεν μπορεί να κάνει αλλαγή προγράμματος!`);
      return;
    }

    // Create schedule change entry
    const changeId = `${swapSlotA.teacherName}-${swapSlotB.teacherName}-${swapSlotA.day}-${swapSlotA.period}-${swapSlotB.day}-${swapSlotB.period}-${Date.now()}`;
    const timestamp = new Date().toLocaleString('el-GR');

    const newChange = {
      id: changeId,
      dayA: swapSlotA.day,
      periodA: swapSlotA.period,
      dayB: swapSlotB.day,
      periodB: swapSlotB.period,
      fromTeacher: swapSlotA.teacherName,
      fromClass: swapSlotA.className || '-',
      fromSubject: swapSlotA.subject || '-',
      fromClassroom: swapSlotA.classroom || '-',
      toTeacher: swapSlotB.teacherName,
      toClass: swapSlotB.className || '-',
      toSubject: swapSlotB.subject || '-',
      toClassroom: swapSlotB.classroom || '-',
      timestamp
    };

    setScheduleChanges(prev => [...prev, newChange]);

    // Clear slots and close panel
    setSwapSlotA(null);
    setSwapSlotB(null);

    // Success message - no modal, direct confirmation
    console.log(`✅ Αλλαγή καταχωρήθηκε: ${swapSlotA.teacherName} (${swapSlotA.day} ${swapSlotA.period}η) ⇄ ${swapSlotB.teacherName} (${swapSlotB.day} ${swapSlotB.period}η)`);
  };

  const handleSwapDrop = (e, slot) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSwapSlot(null);

    try {
      const periodData = JSON.parse(e.dataTransfer.getData('application/json'));
      console.log('📦 Dropped period data:', periodData);
      console.log('📦 Teacher name:', periodData.teacherName);
      console.log('📦 Slot:', slot);

      // Check if teacher is absent
      const absentTeachers = absenceData
        .filter(absence => absence && absence.absentTeacher)
        .map(absence => absence.absentTeacher);
      
      if (periodData.teacherName && absentTeachers.includes(periodData.teacherName)) {
        alert(`⚠️ Ο καθηγητής ${periodData.teacherName} απουσιάζει και δεν μπορεί να κάνει αλλαγή προγράμματος!`);
        return;
      }

      if (slot === 'A') {
        setSwapSlotA(periodData);
        console.log('✅ Set slot A:', periodData);
      } else if (slot === 'B') {
        setSwapSlotB(periodData);
        console.log('✅ Set slot B:', periodData);
      }
    } catch (err) {
      console.error('❌ Error parsing dropped data:', err);
    }
  };

  const handleSwapDragOver = (e, slot) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSwapSlot(slot);
  };

  const handleSwapDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSwapSlot(null);
  };

  // Βρίσκει τον καθηγητή που έχει τελευταία ώρα με συγκεκριμένο τμήμα
  const findTeacherWithLastPeriodForClass = async (subject, absentTeacherName) => {
    try {
      // Εξάγουμε το τμήμα από το subject (π.χ. "Β52" από "Β52Μαθηματικά")
      // Updated regex to match actual class format: Β52, Α23, Γ41 (Greek letter + 2 digits)
      const classMatch = subject?.match(/^([ΑΒΓ]\d{2})/);
      if (!classMatch) {
        console.log('Could not extract class name from:', subject);
        return null;
      }

      const className = classMatch[1];
      console.log('Looking for teacher with last period for class:', className, '(absent teacher:', absentTeacherName, ')');

      // Φορτώνουμε τα δεδομένα καθηγητών
      const response = await fetchPublic('/teachers.json');
      const teachers = await response.json();

      // Παίρνουμε την τρέχουσα ημέρα
      const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
      const currentDay = selectedDate ? dayNames[selectedDate.getDay()] : dayNames[new Date().getDay()];

      console.log('Searching on day:', currentDay);

      // ΒΗΜΑ 0: Βρίσκουμε ποιες περιόδους έχει ο ΑΠΟΝΤΑΣ καθηγητής με αυτό το τμήμα
      const absentTeacher = teachers.find(t => t.καθηγητής === absentTeacherName);
      if (!absentTeacher) {
        console.log('Could not find absent teacher:', absentTeacherName);
        return null;
      }

      const absentDaySchedule = absentTeacher.πρόγραμμα?.[currentDay];
      const absentTeacherPeriodsWithClass = [];
      if (absentDaySchedule) {
        for (let i = 1; i <= 8; i++) {
          const subj = absentDaySchedule[i.toString()];
          if (subj && subj.includes(className)) {
            absentTeacherPeriodsWithClass.push(i);
          }
        }
      }
      console.log(`Absent teacher ${absentTeacherName} has class ${className} in periods: ${absentTeacherPeriodsWithClass.join(', ')}`);

      // Καθορίζουμε την τελευταία περίοδο της ημέρας αυτόματα
      const lastPeriodOfDay = getDayPeriodCount(currentDay);

      // Ψάχνουμε για καθηγητές που:
      // 1. Έχουν μάθημα στην τελευταία περίοδο της ημέρας
      // 2. Αυτό το μάθημα είναι με το τμήμα που ψάχνουμε
      for (const teacher of teachers) {
        const teacherName = teacher.καθηγητής;

        // ΚΡΙΣΙΜΟ: Μην προτείνεις τον ίδιο καθηγητή που απουσιάζει
        if (teacherName === absentTeacherName) {
          console.log(`⚠️ Skipping ${teacherName} - cannot substitute for themselves`);
          continue;
        }

        const daySchedule = teacher.πρόγραμμα?.[currentDay];

        if (!daySchedule) continue;

        // ΒΗΜΑ 1: ΚΡΙΣΙΜΟ - Ελέγξε αν ο καθηγητής έχει μάθημα στην τελευταία περίοδο της ημέρας
        const lastPeriodSubject = daySchedule[lastPeriodOfDay.toString()];
        if (!lastPeriodSubject || lastPeriodSubject === null || lastPeriodSubject === undefined) {
          // Ο καθηγητής ΔΕΝ έχει μάθημα στην τελευταία περίοδο της ημέρας
          continue;
        }

        // ΒΗΜΑ 2: Ελέγξε αν το μάθημα στην τελευταία περίοδο είναι με το τμήμα που ψάχνουμε
        if (lastPeriodSubject.includes(className)) {
          // Ο καθηγητής έχει το τμήμα στην τελευταία περίοδο της ημέρας!
          // Βρίσκουμε όλες τις περιόδους που έχει με το τμήμα
          const periodsWithClass = [];
          for (let i = 1; i <= 8; i++) {
            const subj = daySchedule[i.toString()];
            if (subj && subj.includes(className)) {
              periodsWithClass.push(i);
            }
          }

          // ΚΡΙΣΙΜΟ: Φιλτράρουμε περιόδους
          // Κρατάμε ΜΟΝΟ τις περιόδους που:
          // 1. Ο αναπληρωτής έχει με το τμήμα
          // 2. Ο απών καθηγητής ΕΠΙΣΗΣ έχει με το τμήμα (κοινές περίοδοι)
          // 3. ΔΕΝ έχουν συνδιδασκαλία μεταξύ τους
          // 4. Ο αναπληρωτής ΔΕΝ έχει συνδιδασκαλία με ΑΛΛΟΥΣ καθηγητές σε αυτή την περίοδο
          const filteredPeriods = [];
          for (const period of periodsWithClass) {
            let isAvailable = true;

            // ΕΛΕΓΧΟΣ 1: Η περίοδος πρέπει να είναι και στις περιόδους του απόντα
            if (!absentTeacherPeriodsWithClass.includes(period)) {
              isAvailable = false;
              console.log(`⚠️ Period ${period} skipped - absent teacher doesn't have this class in this period`);
            }

            // ΕΛΕΓΧΟΣ 2: Έλεγχος για συνδιδασκαλία με κάποιον από τους απόντες
            if (isAvailable) {
              for (const absentT of absenceData) {
                if (hasCoteaching(teacherName, absentT.absentTeacher, currentDay, period.toString())) {
                  isAvailable = false;
                  console.log(`⚠️ Period ${period} skipped - coteaching with absent teacher ${absentT.absentTeacher}`);
                  break;
                }
              }
            }

            // ΕΛΕΓΧΟΣ 3: Ο αναπληρωτής ΔΕΝ πρέπει να έχει συνδιδασκαλία με ΑΛΛΟΥΣ (όχι τον απόντα) σε αυτή την περίοδο
            if (isAvailable) {
              // Ελέγχουμε αν ο αναπληρωτής έχει συνδιδασκαλία με ΟΠΟΙΟΝΔΗΠΟΤΕ σε αυτή την περίοδο
              const hasCoteachingWithOthers = coteachingPairs.some(pair => {
                // Έλεγχος αν ο αναπληρωτής είναι στο ζευγάρι
                const isTeacherInPair = pair.teachers.some(t => t.toUpperCase().trim() === teacherName.toUpperCase().trim());

                // Έλεγχος αν ταιριάζει η ημέρα και η περίοδος
                const matchesDayPeriod = pair.day === currentDay && pair.period === period.toString();

                if (isTeacherInPair && matchesDayPeriod) {
                  // Ελέγχουμε αν το τμήμα της συνδιδασκαλίας ΔΕΝ είναι το τμήμα που αναπληρώνουμε
                  // Αν η συνδιδασκαλία είναι για ΑΛΛΟ τμήμα, τότε ΔΕΝ μπορεί να μετακινηθεί
                  if (pair.class !== className) {
                    console.log(`⚠️ Period ${period} - ${teacherName} has coteaching with other class: ${pair.class}`);
                    return true;
                  }
                }
                return false;
              });

              if (hasCoteachingWithOthers) {
                isAvailable = false;
                console.log(`⚠️ Period ${period} skipped - substitute teacher has coteaching with other teachers for different class`);
              }
            }

            // Αν περνάει όλους τους ελέγχους, την προσθέτουμε
            if (isAvailable) {
              filteredPeriods.push(period);
            }
          }

          console.log('✅ Found teacher with last period for class:', teacherName, 'Last period:', lastPeriodOfDay, 'Subject:', lastPeriodSubject);
          console.log(`Original periods with class ${className}: ${periodsWithClass.join(', ')} → Filtered periods (available): ${filteredPeriods.join(', ')}`);

          // Αν δεν έχει μείνει καμία περίοδος μετά το φιλτράρισμα, επιστρέφουμε null
          if (filteredPeriods.length === 0) {
            console.log('❌ No periods left after filtering - cannot suggest this teacher');
            return null;
          }

          return {
            teacherName,
            lastPeriod: lastPeriodOfDay,
            lastPeriodSubject,
            periodsWithClass: filteredPeriods
          };
        }
      }

      console.log('❌ No teacher found with last period for class:', className);
      return null;
    } catch (error) {
      console.error('Error finding teacher with last period:', error);
      return null;
    }
  };

  // Programmatic assignment - κάνει αντικατάσταση χωρίς drag & drop
  const assignTeacherToPeriod = async (teacherName, targetPeriod, absentTeacherName) => {
    console.log(`Assigning ${teacherName} to period ${targetPeriod} for absent teacher ${absentTeacherName}`);

    // Βρίσκουμε τον απόντα καθηγητή στα absenceData
    const absentTeacher = absenceData.find(teacher =>
      teacher.absentTeacher === absentTeacherName
    );

    if (!absentTeacher) {
      console.error(`Could not find absent teacher: ${absentTeacherName}`);
      alert(`Σφάλμα: Δεν βρέθηκε ο απών καθηγητής ${absentTeacherName}`);
      return;
    }

    // Ενημερώνουμε τα absenceData
    setAbsenceData(prev => {
      const updatedData = prev.map(teacher => {
        if (teacher.absentTeacher === absentTeacherName) {
          return {
            ...teacher,
            periods: teacher.periods.map(p =>
              p.period === `${targetPeriod}η`
                ? { ...p, replacement: teacherName }
                : p
            )
          };
        }
        return teacher;
      });

      console.log('Updated absence data:', updatedData);
      return updatedData;
    });

    // Αλλάζουμε και τον επιλεγμένο καθηγητή στο dropdown
    if (onTeacherSelect) {
      onTeacherSelect(teacherName);
    }

    console.log(`✅ Successfully assigned ${teacherName} to ${targetPeriod}η period`);
  };

  // Handler για κλικ στο μάθημα - βρίσκει και εμφανίζει τον καθηγητή με τελευταία ώρα
  const handleSubjectClick = async (subject, event, absentTeacherName = null) => {
    console.log('Subject clicked:', subject, 'Ctrl pressed:', event?.ctrlKey, 'Absent teacher:', absentTeacherName);

    // Ctrl+Click → Show class schedule in NewWindow
    if (event && event.ctrlKey) {
      console.log('Ctrl+Click detected - attempting to show class schedule');

      // --- NEW UNIFIED LOGIC ---
      // Use the same robust logic from handleClassRightClick to find the className
      let className = null;
      console.log('🔍 [Ctrl+Click] Parsing subject:', subject);
      console.log('🔍 [Ctrl+Click] Subject length:', subject?.length);
      console.log('🔍 [Ctrl+Click] Subject type:', typeof subject);
      
      // First try to match special groups (support groups) - improved pattern
      // Match "Στ.Ο.4 (Γ1)" or "Στ. 13 (Β1)" - with optional Ο. and flexible spacing
      let classMatch = subject.match(/^(Στ\.(?:Ο\.)?\s*\d+\s*\([ΑΒΓ][0-9]+\))/); 
      if (classMatch) {
        console.log('✅ [Ctrl+Click] Found special group:', classMatch[1]);
        className = classMatch[1];
      } else {
        console.log('❌ [Ctrl+Click] No special group match, trying other patterns...');
      }
      
      if (!classMatch) {
        classMatch = subject.match(/^(Γκατ_\d+\s*\([ΑΒΓ][0-9]*\))/); // e.g., "Γκατ_1 (Γ31)" or "Γκατ_4 (Γ)"
        if (classMatch) console.log('✅ [Ctrl+Click] Found Γκατ:', classMatch[1]);
      }
      if (!classMatch) {
        classMatch = subject.match(/^(βκατ_\d+.*?\([ΑΒΓ]\))/); // e.g., "βκατ_1 ΠΛΗ_κατ (Β)"
        if (classMatch) console.log('✅ [Ctrl+Click] Found βκατ:', classMatch[1]);
      }
      if (!classMatch) {
        classMatch = subject.match(/^([ΑΒΓ]\d{2}\+[ΑΒΓ]\d{2})/); // Coteaching like "B11+B32"
        if (classMatch) console.log('✅ [Ctrl+Click] Found coteaching:', classMatch[1]);
      }
      if (!classMatch) {
        classMatch = subject.match(/^([ΑΒΓ]\d{2})/); // Standard class name
        if (classMatch) console.log('✅ [Ctrl+Click] Found standard class:', classMatch[1]);
      }

      if (classMatch && !className) {
        className = classMatch[1];
      }

      if (className) {
        console.log('✅ [Ctrl+Click] Final extracted className:', className);

        const viewEvent = new CustomEvent('viewSchedule', {
          detail: {
            type: 'class',
            item: className,
            date: selectedDate
          }
        });
        window.dispatchEvent(viewEvent);
        console.log('✅ [Ctrl+Click] viewSchedule event dispatched successfully for', className);
        return;
      }

      console.warn('❌ [Ctrl+Click] No class name found in subject:', subject);
      alert('Δεν ήταν δυνατό να εξαχθεί το τμήμα από το μάθημα για την προβολή του προγράμματος.');
    }

    // Regular click → Find teacher with last period
    const result = await findTeacherWithLastPeriodForClass(subject, absentTeacherName);

    if (result) {
      // Προσθέτουμε το όνομα του απόντα καθηγητή στο result
      const enrichedResult = {
        ...result,
        absentTeacherName: absentTeacherName
      };
      setSubstitutionResult(enrichedResult);
      setSubstitutionModalOpen(true);
    } else {
      alert('❌ Δεν βρέθηκε καθηγητής που:\n- Να έχει τελευταία ώρα\n- ΚΑΙ να διδάσκει αυτό το τμήμα');
    }
  };

  return (
    <div
      ref={combinedRef}
      className={`main-window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
      style={{
        left: `${position.x + positionDelta.x}px`,
        top: `${position.y + positionDelta.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: zIndex
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDrop={handleScheduleDrop}
      onDragOver={handleScheduleDragOver}
    >
      {/* Resize Handles */}
      <div className="resize-handle resize-handle-n" onMouseDown={(e) => handleResizeStart('n', e)}></div>
      <div className="resize-handle resize-handle-s" onMouseDown={(e) => handleResizeStart('s', e)}></div>
      <div className="resize-handle resize-handle-e" onMouseDown={(e) => handleResizeStart('e', e)}></div>
      <div className="resize-handle resize-handle-w" onMouseDown={(e) => handleResizeStart('w', e)}></div>
      <div className="resize-handle resize-handle-ne" onMouseDown={(e) => handleResizeStart('ne', e)}></div>
      <div className="resize-handle resize-handle-nw" onMouseDown={(e) => handleResizeStart('nw', e)}></div>
      <div className="resize-handle resize-handle-se" onMouseDown={(e) => handleResizeStart('se', e)}></div>
      <div className="resize-handle resize-handle-sw" onMouseDown={(e) => handleResizeStart('sw', e)}></div>

      {/* School Clock - now rendered independently with trigger button */}
      <SchoolClock />

      {/* Draggable Header */}
      <div className="draggable-header">
        <div className="window-header-content">
          <h3>Κεντρικό Παράθυρο</h3>
        </div>
      </div>

      {/* Mini Navigation Buttons */}
      <div className="mini-nav-buttons">
        <a
          href="http://evagorasev.fwh.is/index_menu.php"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
        >
          Α
        </a>
        <a
          href="https://lasl-8511e.web.app/welcome.html"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
        >
          Δ
        </a>
        <a
          href="https://imerolokio-2025v2.web.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
        >
          Π
        </a>
        <a
          href="/alkes - orariou .html"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
        >
          ΑΩ
        </a>
        <a
          href="/ΩΡΑΡΙΟ%20ΛΕΙΤΟΥΡΓΙΑΣ%20ΤΟΥ%20%20ΣΧΟΛΕΙΟΥ%20(3).xps"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          title="Ωράριο Λειτουργίας Σχολείου"
        >
          ΩΛ
        </a>
        <a
          href="/Year Table 2025 (ΛΥΚΕΙΟ).png"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#ff9800', borderColor: '#ff9800'}}
          title="Year Table 2025"
        >
          ΕΠ
        </a>
        <a
          href="/Β.Δ. Συντονιστές κλάδων και Διοικητικοί (1).html"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#4caf50', borderColor: '#4caf50'}}
          title="Β.Δ. Συντονιστές κλάδων και Διοικητικοί"
        >
          ΒΔΣ
        </a>
        <a
          href="/Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.html"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#9c27b0', borderColor: '#9c27b0'}}
          title="Β.Δ.Α Υπεύθυνος ΔΔΚ καθήκοντα"
        >
          ΔΔΚ
        </a>
        <a
          href="/Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#f44336', borderColor: '#f44336'}}
          title="Β.Δ.Α Υπεύθυνος Τομέα καθήκοντα"
        >
          ΥΤ
        </a>
        <a
          href="/Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#3f51b5', borderColor: '#3f51b5'}}
          title="Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ."
        >
          ΕΚ
        </a>
        <a
          href="/Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#009688', borderColor: '#009688'}}
          title="Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ"
        >
          ΚΒΔ
        </a>
        <a
          href="/Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#673ab7', borderColor: '#673ab7'}}
          title="Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ"
        >
          ΚΒΔΑ
        </a>
        <a
          href="/ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#795548', borderColor: '#795548'}}
          title="ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ."
        >
          ΥΠΤ
        </a>
        <a
          href="/greek_odigos_ipodoxis.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#e91e63', borderColor: '#e91e63'}}
          title="Ελληνικός Οδηγός Υποδοχής"
        >
          ΕΟΙ
        </a>
        <a
          href="/sxolia .pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mini-btn"
          style={{background: '#607d8b', borderColor: '#607d8b'}}
          title="Σχόλια"
        >
          Σ
        </a>
      </div>

      {/* Absence Report Display */}
      <div className="absence-report-display">
        {/* Header */}
        <div className="report-header">
          <h1 className="school-name-hoverable">ΛΥΚΕΙΟ ΑΓΙΟΥ ΣΠΥΡΙΔΩΝΑ</h1>
          <div className="report-date">{formattedDate}</div>
        </div>

        {/* Action Buttons (moved under header) */}
        <div className="action-buttons">
          <button className="print-btn" onClick={printToPDF}>
            🖨️ Εκτύπωση
          </button>
          <button className="print-btn" onClick={() => setShowSevenPage(true)}>
            7 αναπληρώσεις
          </button>
          <button className="print-btn student-attendance-main-btn" onClick={() => {
            const event = new CustomEvent('openStudentAttendance', {
              detail: { absenceData }
            });
            window.dispatchEvent(event);
          }}>
            ✓ Παρουσίες Μαθητών
          </button>
          <button className="print-btn" onClick={() => {
            const event = new CustomEvent('openAllClasses');
            window.dispatchEvent(event);
          }}>
            📚 Όλα τα Τμήματα
          </button>
          <button className="print-btn" onClick={() => setShowStats(true)}>
            📊 Στατιστικά
          </button>
          <button className="print-btn" onClick={() => setShowStickyNotes(!showStickyNotes)}>
            📝 Σημειώσεις
          </button>
          <button
            className="reset-windows-btn"
            onClick={() => {
              // Επαναφορά θέσεων όλων των draggable παραθύρων
              // Χρησιμοποιούμε το resetAllWindowPositions που:
              // 1. Καθαρίζει το localStorage
              // 2. Καλεί όλες τις reset functions από κάθε component
              // 3. Κάνει reload για να φορτώσουν οι default θέσεις
              if (window.resetAllWindowPositions) {
                window.resetAllWindowPositions();
              } else {
                // Fallback: αν δεν υπάρχει το resetAllWindowPositions, καλούμε τις μεμονωμένες
                console.warn('⚠️ resetAllWindowPositions not found, using individual resets');
                if (window.resetMainWindowPosition) window.resetMainWindowPosition();
                if (window.resetTeacherSchedulePosition) window.resetTeacherSchedulePosition();
                if (window.resetNewWindowPosition) window.resetNewWindowPosition();
                if (window.resetAvailabilityPosition) window.resetAvailabilityPosition();
                if (window.resetSmartSchedulerPosition) window.resetSmartSchedulerPosition();
              }

              // Κλείσιμο ΜΟΝΟ του παραθύρου Στατιστικά
              // ΟΧΙ τα παράθυρα "7 αναπληρώσεις" και "Παρουσίες Μαθητών" - αυτά παραμένουν ανοιχτά
              setShowStats(false);
            }}
            title="Επαναφορά θέσεων παραθύρων"
          >
            🔄 Επαναφορά Παραθύρων
          </button>
          <button
            className="print-btn fullscreen-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleFullscreen();
            }}
            title="Πλήρης Οθόνη (ESC για έξοδο)"
          >
            {isFullscreen ? '⊗ Έξοδος' : '⛶ Πλήρης Οθόνη'}
          </button>
        </div>

        {/* Regular Teachers Section */}
        <div className="section">
          <h2>ΑΠΟΝΤΕΣ ΚΑΘΗΓΗΤΕΣ ΚΑΙ ΩΡΕΣ ΑΝΑΠΛΗΡΩΣΗΣ</h2>
          
          {absenceData.filter(teacher => !teacher.isBdDirector).length === 0 ? (
            <div className="no-absent-teachers" style={{ display: 'none' }}>
            </div>
          ) : (
            <div className="table-container">
              <table className="absence-table">
                <colgroup>
                  <col style={{width: '280px'}} />
                  <col style={{width: '48px'}} />
                  <col style={{width: '250px'}} />
                  <col style={{width: '200px'}} />
                  <col style={{width: '40px'}} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{width: '280px', minWidth: '280px', maxWidth: '280px'}}>Απόντας Καθηγητής</th>
                    <th style={{width: '48px', minWidth: '48px', maxWidth: '48px'}}>Περ.</th>
                    <th style={{width: '250px', minWidth: '250px', maxWidth: '250px'}}>Αναπληρωτής</th>
                    <th style={{width: '200px', minWidth: '200px', maxWidth: '200px'}}>Μάθημα</th>
                    <th style={{width: '40px', minWidth: '40px', maxWidth: '40px'}}>Συν.</th>
                  </tr>
                </thead>
                <tbody>
                  {absenceData.filter(teacher => !teacher.isBdDirector).map((teacher, teacherIndex) => {
                    console.log(`🎯 Rendering teacher ${teacher.absentTeacher} with ${teacher.periods.length} periods:`, teacher.periods);
                    return (
                      <React.Fragment key={teacherIndex}>
                        {teacher.periods.map((period, periodIndex) => {
                          console.log(`  🔍 Rendering period ${periodIndex + 1}/${teacher.periods.length}:`, period);
                          const isLastPeriod = periodIndex === teacher.periods.length - 1;
                          return (
                            <tr key={`${teacherIndex}-${periodIndex}`}>
                          <td className={`teacher-name ${periodIndex === 0 ? 'first-period' : 'continuation'} ${isLastPeriod ? 'last-period' : ''}`}>
                            {periodIndex === 0 ? (
                              <div className="teacher-name-container">
                                <span>{teacher.absentTeacher}</span>
                                <button
                                  className="remove-teacher-btn"
                                  onClick={() => removeTeacherFromAbsenceReport(teacher.absentTeacher)}
                                  title="Αφαίρεση καθηγητή"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div style={{ visibility: 'hidden' }}>-</div>
                            )}
                          </td>
                          <td className="period">{period.period}</td>
                          <td
                            className="replacement drop-zone"
                            data-period={parseInt(period.period)}
                            data-teacher={teacher.absentTeacher}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, parseInt(period.period), teacher.absentTeacher)}
                            title={`Σύρετε αναπληρωτή για ${period.period} περίοδο - ${teacher.absentTeacher}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <span>{period.replacement}</span>
                                {period.replacement &&
                                 period.replacement !== "ΑΝΑΠΛΗΡΩΤΗΣ" &&
                                 period.replacement !== "///////////////" && (() => {
                                  const quota = findQuota(period.replacement);
                                  // Show default quota (7) if not found, but only if quotas have been loaded
                                  const displayQuota = quota || (Object.keys(quotas).length > 0 ? null : { remaining: 7 });
                                  if (displayQuota) {
                                    return (
                                      <span className="quota-badge" style={{
                                        fontSize: '9px',
                                        fontWeight: 'bold',
                                        color: displayQuota.remaining === 0 ? '#dc3545' : '#28a745',
                                        background: displayQuota.remaining === 0 ? '#ffe0e0' : '#e8f5e8',
                                        padding: '1px 5px',
                                        borderRadius: '8px',
                                        whiteSpace: 'nowrap',
                                        border: '1px solid',
                                        borderColor: displayQuota.remaining === 0 ? '#dc3545' : '#28a745'
                                      }}>
                                        {displayQuota.remaining}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              {period.replacement &&
                               period.replacement !== "ΑΝΑΠΛΗΡΩΤΗΣ" &&
                               period.replacement !== "///////////////" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Αφαίρεση αναπληρωτή - επαναφορά σε "ΑΝΑΠΛΗΡΩΤΗΣ"
                                    setAbsenceData(prev => {
                                      const updatedData = prev.map(t => {
                                        if (t.absentTeacher === teacher.absentTeacher) {
                                          return {
                                            ...t,
                                            periods: t.periods.map(p =>
                                              p.period === period.period
                                                ? { ...p, replacement: "ΑΝΑΠΛΗΡΩΤΗΣ" }
                                                : p
                                            )
                                          };
                                        }
                                        return t;
                                      });
                                      console.log(`Removed replacement for ${teacher.absentTeacher} period ${period.period}`);
                                      return updatedData;
                                    });
                                  }}
                                  style={{
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    padding: '2px 6px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    flexShrink: 0
                                  }}
                                  title="Αφαίρεση αναπληρωτή"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>
                          <td
                            className="subject clickable-subject"
                            onClick={(e) => handleSubjectClick(period.subject, e, teacher.absentTeacher)}
                            onContextMenu={(e) => handleClassRightClick(e, period.subject, period.class)}
                            title={`Κλικ για να βρείτε ποιος καθηγητής έχει τελευταία ώρα με το τμήμα\nCtrl+Κλικ για να δείτε το πρόγραμμα της τάξης\nΔεξί κλικ για απουσιολόγιο μαθητών`}
                          >
                            {period.subject}
                          </td>
                          <td className={`total ${periodIndex === 0 ? 'first-period' : 'continuation'} ${isLastPeriod ? 'last-period' : ''}`}>
                            {periodIndex === 0 ? teacher.total : ''}
                          </td>
                        </tr>
                          );
                        })}
                        {/* Διαχωριστική γραμμή μεταξύ καθηγητών */}
                        {teacherIndex < absenceData.filter(t => !t.isBdDirector).length - 1 && (
                          <tr className="teacher-separator-row">
                            <td colSpan="5" style={{
                              height: '3px',
                              padding: 0,
                              backgroundColor: '#2196F3',
                              border: 'none'
                            }}></td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {/* Hover zone for clock - right side */}
              <div className="clock-hover-zone"></div>
            </div>
          )}
        </div>

        {/* Assistant Directors Section */}
        <div className="section bd-section">
          <h3>Β.Δ. ΠΟΥ ΠΑΙΡΝΟΥΝ ΑΠΟΥΣΙΕΣ ΤΗΝ ΤΕΛΕΥΤΑΙΑ ΠΕΡΙΟΔΟ</h3>
          <div className="sub-section">
            <div className="bd-directors-text">
              {(() => {
                if (!bdDirectors.ημέρες_εμφάνισης) return '';
                
                const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
                const selectedDayName = selectedDate ? dayNames[selectedDate.getDay()] : null;
                
                const availableBd = [];
                
                // Add Β.Δ. if available for this day
                if (bdDirectors.ημέρες_εμφάνισης['Β.Δ.'][selectedDayName]) {
                  availableBd.push(bdDirectors.ημέρες_εμφάνισης['Β.Δ.'][selectedDayName]);
                }
                
                return availableBd.join(', ');
              })()}
            </div>
            
            {absenceData.filter(teacher => teacher.isBdDirector).length === 0 ? (
              <div className="no-assistant-directors" style={{ display: 'none' }}>
              </div>
            ) : (
              <div className="table-container">
                <table className="absence-table">
                  <colgroup>
                    <col style={{width: '280px'}} />
                    <col style={{width: '48px'}} />
                    <col style={{width: '250px'}} />
                    <col style={{width: '200px'}} />
                    <col style={{width: '40px'}} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{width: '280px', minWidth: '280px', maxWidth: '280px'}}>Β.Δ. με Απουσία</th>
                      <th style={{width: '48px', minWidth: '48px', maxWidth: '48px'}}>Περ.</th>
                      <th style={{width: '250px', minWidth: '250px', maxWidth: '250px'}}>Αναπληρωτής</th>
                      <th style={{width: '200px', minWidth: '200px', maxWidth: '200px'}}>Ειδικότητα</th>
                      <th style={{width: '40px', minWidth: '40px', maxWidth: '40px'}}>Συν.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absenceData.filter(teacher => teacher.isBdDirector).map((teacher, teacherIndex) => (
                      <React.Fragment key={teacherIndex}>
                        {teacher.periods.map((period, periodIndex) => {
                          const isLastPeriod = periodIndex === teacher.periods.length - 1;
                          return (
                          <tr key={`${teacherIndex}-${periodIndex}`}>
                            <td className={`teacher-name ${periodIndex === 0 ? 'first-period' : 'continuation'} ${isLastPeriod ? 'last-period' : ''}`}>
                              {periodIndex === 0 ? (
                                <div className="teacher-name-container">
                                  <span>{teacher.absentTeacher}</span>
                                  <button
                                    className="remove-teacher-btn"
                                    onClick={() => removeTeacherFromAbsenceReport(teacher.absentTeacher)}
                                    title="Αφαίρεση Β.Δ."
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div style={{ visibility: 'hidden' }}>-</div>
                              )}
                            </td>
                            <td className="period">{period.period}</td>
                            <td
                              className="replacement drop-zone"
                              data-period={parseInt(period.period)}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, parseInt(period.period))}
                              title={`Σύρετε αναπληρωτή για ${period.period} περίοδο`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                  <span>{period.replacement}</span>
                                  {period.replacement &&
                                   period.replacement !== "ΑΝΑΠΛΗΡΩΤΗΣ" &&
                                   period.replacement !== "///////////////" && (() => {
                                    const quota = findQuota(period.replacement);
                                    // Show default quota (7) if not found, but only if quotas have been loaded
                                    const displayQuota = quota || (Object.keys(quotas).length > 0 ? null : { remaining: 7 });
                                    if (displayQuota) {
                                      return (
                                        <span className="quota-badge" style={{
                                          fontSize: '9px',
                                          fontWeight: 'bold',
                                          color: displayQuota.remaining === 0 ? '#dc3545' : '#28a745',
                                          background: displayQuota.remaining === 0 ? '#ffe0e0' : '#e8f5e8',
                                          padding: '1px 5px',
                                          borderRadius: '8px',
                                          whiteSpace: 'nowrap',
                                          border: '1px solid',
                                          borderColor: displayQuota.remaining === 0 ? '#dc3545' : '#28a745'
                                        }}>
                                          {displayQuota.remaining}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                {period.replacement &&
                                 period.replacement !== "ΑΝΑΠΛΗΡΩΤΗΣ" &&
                                 period.replacement !== "///////////////" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Αφαίρεση αναπληρωτή - επαναφορά σε "ΑΝΑΠΛΗΡΩΤΗΣ"
                                      setAbsenceData(prev => {
                                        const updatedData = prev.map(t => {
                                          if (t.absentTeacher === teacher.absentTeacher) {
                                            return {
                                              ...t,
                                              periods: t.periods.map(p =>
                                                p.period === period.period
                                                  ? { ...p, replacement: "ΑΝΑΠΛΗΡΩΤΗΣ" }
                                                  : p
                                              )
                                            };
                                          }
                                          return t;
                                        });
                                        console.log(`Removed replacement for ${teacher.absentTeacher} period ${period.period}`);
                                        return updatedData;
                                      });
                                    }}
                                    style={{
                                      background: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      padding: '2px 6px',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      flexShrink: 0
                                    }}
                                    title="Αφαίρεση αναπληρωτή"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </td>
                            <td
                              className="subject"
                              onContextMenu={(e) => handleClassRightClick(e, period.subject, period.class)}
                              title="Δεξί κλικ για απουσιολόγιο μαθητών"
                            >
                            {period.subject}
                          </td>
                            <td className={`total ${periodIndex === 0 ? 'first-period' : 'continuation'} ${isLastPeriod ? 'last-period' : ''}`}>
                              {periodIndex === 0 ? teacher.total : ''}
                            </td>
                          </tr>
                          );
                        })}
                        {/* Διαχωριστική γραμμή μεταξύ Β.Δ. */}
                        {teacherIndex < absenceData.filter(t => t.isBdDirector).length - 1 && (
                          <tr className="teacher-separator-row">
                            <td colSpan="5" style={{
                              height: '3px',
                              padding: 0,
                              backgroundColor: '#2196F3',
                              border: 'none'
                            }}></td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="summary-section">
          <div className="summary-row">
            <span className="summary-label">Απώντες Καθηγητές:</span>
            <span className="summary-value">{absenceData.filter(teacher => !teacher.isBdDirector).length}</span>
            <span className="summary-label">Χρειάζονται Αναπλήρωση:</span>
            <span className="summary-value">
              {absenceData.reduce((total, teacher) => 
                total + teacher.periods.filter(period => period.replacement !== "///////////////").length, 0
              )}
            </span>
            <span className="summary-label">Με Αναπληρωτή:</span>
            <span className="summary-value">
              {absenceData.reduce((total, teacher) => 
                total + teacher.periods.filter(period => 
                  period.replacement && 
                  period.replacement !== "ΑΝΑΠΛΗΡΩΤΗΣ" && 
                  period.replacement !== "///////////////"
                ).length, 0
              )}
            </span>
          </div>
        </div>

        {showSevenPage && (
          <SevenReplacementsPage onClose={() => setShowSevenPage(false)} />
        )}


        {/* Schedule Changes Display (always visible) */}
        {scheduleChanges.length > 0 && (
          <div className="schedule-changes-section">
            <h3>🔄 ΑΛΛΑΓΕΣ ΩΡΑΡΙΟΥ</h3>
            <div className="schedule-changes-list">
              {scheduleChanges.map(change => (
                <div key={change.id} className="schedule-change-item-compact">
                  <div className="compact-change-header">
                    <strong>Ανταλλαγή Ωραρίου</strong>
                    <span className="change-timestamp">{change.timestamp}</span>
                  </div>
                  <div className="compact-teachers">
                    <div className="compact-teacher teacher-a">
                      <div className="compact-name">{change.fromTeacher}</div>
                      <div className="compact-details">
                        {change.periodA}η
                      </div>
                      <div className="compact-subject">{change.fromSubject}</div>
                    </div>
                    <div className="compact-arrow">→</div>
                    <div className="compact-teacher teacher-b">
                      <div className="compact-name">{change.toTeacher}</div>
                      <div className="compact-details">
                        {change.periodB}η
                      </div>
                      <div className="compact-subject">{change.toSubject}</div>
                    </div>
                  </div>
                  <button
                    className="compact-remove-btn"
                    onClick={() => removeScheduleChange(change.id)}
                    title="Διαγραφή"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="report-footer">
          <div className="footer-left">Από τη Διεύθυνση</div>
          <div className="footer-right">Ημερομηνία εκτύπωσης: {printDate}</div>
        </div>
      </div>

      {/* Floating Swap Manager Panel */}
      {isSwapPanelVisible && (
        <SwapPanelWindow
          swapSlotA={swapSlotA}
          swapSlotB={swapSlotB}
          setSwapSlotA={setSwapSlotA}
          setSwapSlotB={setSwapSlotB}
          dragOverSwapSlot={dragOverSwapSlot}
          onDrop={handleSwapDrop}
          onDragOver={handleSwapDragOver}
          onDragLeave={handleSwapDragLeave}
          onSwapSlots={handleSwapSlots}
          onConfirmSwap={handleConfirmSwap}
          onClearAllSlots={handleClearAllSlots}
          onClearSlotA={handleClearSlotA}
          onClearSlotB={handleClearSlotB}
          onClose={() => setSwapPanelVisible(false)}
        />
      )}

      {/* Coteaching Modal - appears above everything */}
      {coteachingModalOpen && (
        <CoteachingModal
          className={coteachingClassName}
          onClose={() => {
            setCoteachingModalOpen(false);
            setCoteachingClassName(null);
          }}
        />
      )}

      {/* Substitution Confirm Modal */}
      {substitutionModalOpen && (
        <SubstitutionConfirmModal
          result={substitutionResult}
          onConfirm={(selectedPeriod) => {
            // Αυτόματη εφαρμογή - κάνουμε την αντικατάσταση στη συγκεκριμένη περίοδο
            if (substitutionResult && substitutionResult.absentTeacherName) {
              console.log(`Επιλέχθηκε περίοδος: ${selectedPeriod}η για καθηγητή: ${substitutionResult.teacherName}`);
              assignTeacherToPeriod(
                substitutionResult.teacherName,
                selectedPeriod,
                substitutionResult.absentTeacherName
              );
            }
            setSubstitutionModalOpen(false);
            setSubstitutionResult(null);
          }}
          onClose={() => {
            setSubstitutionModalOpen(false);
            setSubstitutionResult(null);
          }}
        />
      )}

      {/* Replacement Stats Modal */}
      {showStats && (
        <ReplacementStats
          selectedDate={selectedDate}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Confirmation Modal for Registration */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            minWidth: '300px'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Θα γίνει καταχώριση. Είσαι σίγουρος;</h3>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  console.log('Καταχώριση επιβεβαιώθηκε');
                  setShowConfirmModal(false);
                }}
                style={{
                  padding: '8px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: '2px solid #28a745',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#155724';
                  e.target.style.borderColor = '#155724';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#28a745';
                  e.target.style.borderColor = '#28a745';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.2)';
                }}
              >
                ✓ Ναι
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '8px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: '2px solid #dc3545',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#a71d2a';
                  e.target.style.borderColor = '#a71d2a';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#dc3545';
                  e.target.style.borderColor = '#dc3545';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.2)';
                }}
              >
                ✕ Όχι
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Notes */}
      {showStickyNotes && (
        <StickyNotes onClose={() => setShowStickyNotes(false)} />
      )}
    </div>
  );
};

export default MainWindow;