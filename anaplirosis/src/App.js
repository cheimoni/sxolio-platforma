import React, { useState, useEffect } from 'react';
import { greekNames } from './data/greekNames';
import TeacherList from './components/TeacherList';
import TeacherSchedulePreview from './components/TeacherSchedulePreview';
import TeacherScheduleCard from './components/TeacherScheduleCard';
import TeacherAvailabilityCard from './components/TeacherAvailabilityCard';
import NewWindow from './components/NewWindow';
import DateDisplay from './components/DateDisplay';
import MainWindow from './components/MainWindow';
import ThemeSelector from './components/ThemeSelector';
import TextSettings from './components/TextSettings';
import SmartScheduler from './components/SmartScheduler';
import StudentAttendanceList from './components/StudentAttendanceList';
import ClassroomSelector from './components/ClassroomSelector';
import AvailableClassrooms from './components/AvailableClassrooms';
import ClassScheduleViewer from './components/ClassScheduleViewer';
import SplashScreen from './components/SplashScreen';
import ExitModal from './components/ExitModal';
import TopRightMenu from './components/TopRightMenu';
import useExitSound from './hooks/useExitSound';
import './utils/resetWindowPositions'; // Load window position utilities
import { fetchPublic } from './utils/pathHelper';
import './App.css';
import './themes.css';

// Helper to get Athens date
const getAthensDate = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Athens' }));
};

const THEME_CLASSNAMES = [
  'theme-green',
  'theme-gray',
  'theme-purple',
  'theme-orange',
  'theme-teal',
  'theme-pink',
  'theme-indigo',
  'theme-coral',
  'theme-mint',
  'theme-lavender',
  'theme-peach',
  'theme-sky',
  'theme-lime',
  'theme-rose',
  'theme-custom'
];

const DEFAULT_CUSTOM_COLOR = '#a8d5ff';
const DEFAULT_CUSTOM_OPACITY = 1.0;

const hexToRgb = (hex) => {
  if (!hex) return null;
  let value = hex.replace('#', '');
  if (value.length === 3) {
    value = value.split('').map((char) => char + char).join('');
  }
  if (value.length !== 6) return null;
  const intVal = parseInt(value, 16);
  if (Number.isNaN(intVal)) return null;
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255
  };
};

const adjustColor = (rgb, amount) => {
  if (!rgb) return { r: 255, g: 255, b: 255 };
  const adjustChannel = (channel) => {
    if (amount >= 0) {
      return Math.round(channel + (255 - channel) * amount);
    }
    return Math.round(channel * (1 + amount));
  };
  return {
    r: Math.min(255, Math.max(0, adjustChannel(rgb.r))),
    g: Math.min(255, Math.max(0, adjustChannel(rgb.g))),
    b: Math.min(255, Math.max(0, adjustChannel(rgb.b)))
  };
};

const toRgbaString = (rgb, alpha = 1) => {
  if (!rgb) return `rgba(255, 255, 255, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const applyCustomThemeVariables = (color, opacity) => {
  const baseRgb = hexToRgb(color);
  if (!baseRgb) return;
  const lightRgb = adjustColor(baseRgb, 0.35);
  const darkRgb = adjustColor(baseRgb, -0.25);

  document.body.style.setProperty('--primary-color', toRgbaString(baseRgb, opacity));
  document.body.style.setProperty('--primary-light', toRgbaString(lightRgb, Math.min(1, opacity + 0.2)));
  document.body.style.setProperty('--primary-dark', toRgbaString(darkRgb, Math.min(1, opacity + 0.1)));
};

const clearCustomThemeVariables = () => {
  document.body.style.removeProperty('--primary-color');
  document.body.style.removeProperty('--primary-light');
  document.body.style.removeProperty('--primary-dark');
};

function App() {
  // Play sound when app is closing (native browser dialog)
  useExitSound();

  const [showSplash, setShowSplash] = useState(false); // Disabled - No splash screen
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [dynamicNames, setDynamicNames] = useState([]);

  // Theme management
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'default';
  });
  const [customThemeColor, setCustomThemeColor] = useState(() => {
    return localStorage.getItem('customThemeColor') || DEFAULT_CUSTOM_COLOR;
  });
  const [customThemeOpacity, setCustomThemeOpacity] = useState(() => {
    const stored = localStorage.getItem('customThemeOpacity');
    return stored ? parseFloat(stored) || DEFAULT_CUSTOM_OPACITY : DEFAULT_CUSTOM_OPACITY;
  });

  // Text settings
  const [fontSize, setFontSize] = useState(() => {
    const stored = localStorage.getItem('fontSize');
    return stored ? parseInt(stored) : 14;
  });
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('fontFamily') || "'Courier New', monospace";
  });
  const [textColor, setTextColor] = useState(() => {
    return localStorage.getItem('textColor') || '#000000';
  });

  // Window and border settings
  const [windowBgColor, setWindowBgColor] = useState(() => {
    return localStorage.getItem('windowBgColor') || '#F8F9FA';
  });
  const [windowBgOpacity, setWindowBgOpacity] = useState(() => {
    const stored = localStorage.getItem('windowBgOpacity');
    return stored ? parseFloat(stored) : 0.96;
  });
  const [borderColor, setBorderColor] = useState(() => {
    return localStorage.getItem('borderColor') || '#667EEA';
  });
  const [borderOpacity, setBorderOpacity] = useState(() => {
    const stored = localStorage.getItem('borderOpacity');
    return stored ? parseFloat(stored) : 0.25;
  });
  const [borderWidth, setBorderWidth] = useState(() => {
    return localStorage.getItem('borderWidth') || '2px';
  });
  const [borderStyle, setBorderStyle] = useState(() => {
    return localStorage.getItem('borderStyle') || 'solid';
  });

  // Video settings
  const [videoTimeout, setVideoTimeout] = useState(() => {
    const stored = localStorage.getItem('videoTimeout');
    return stored ? parseInt(stored, 10) : 8000;
  });

  useEffect(() => {
    // Remove all theme classes
    document.body.classList.remove(...THEME_CLASSNAMES);

    if (currentTheme === 'custom') {
      document.body.classList.add('theme-custom');
      applyCustomThemeVariables(customThemeColor, customThemeOpacity);
    } else {
      clearCustomThemeVariables();
      if (currentTheme !== 'default') {
        document.body.classList.add(`theme-${currentTheme}`);
      }
    }

    localStorage.setItem('appTheme', currentTheme);
    localStorage.setItem('customThemeColor', customThemeColor);
    localStorage.setItem('customThemeOpacity', customThemeOpacity.toString());
  }, [currentTheme, customThemeColor, customThemeOpacity]);

  // Apply text settings
  useEffect(() => {
    document.body.style.setProperty('--app-font-size', `${fontSize}px`);
    document.body.style.setProperty('--app-font-family', fontFamily);
    document.body.style.setProperty('--app-text-color', textColor);

    localStorage.setItem('fontSize', fontSize.toString());
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('textColor', textColor);
  }, [fontSize, fontFamily, textColor]);

  // Apply window and border settings
  useEffect(() => {
    // Convert hex color to rgba
    const hexToRgba = (hex, opacity) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    document.body.style.setProperty('--window-bg-color', hexToRgba(windowBgColor, windowBgOpacity));
    document.body.style.setProperty('--border-color', hexToRgba(borderColor, borderOpacity));
    document.body.style.setProperty('--border-width', borderWidth);
    document.body.style.setProperty('--border-style', borderStyle);

    localStorage.setItem('windowBgColor', windowBgColor);
    localStorage.setItem('windowBgOpacity', windowBgOpacity.toString());
    localStorage.setItem('borderColor', borderColor);
    localStorage.setItem('borderOpacity', borderOpacity.toString());
    localStorage.setItem('borderWidth', borderWidth);
    localStorage.setItem('borderStyle', borderStyle);
  }, [windowBgColor, windowBgOpacity, borderColor, borderOpacity, borderWidth, borderStyle]);

  // Apply video settings
  useEffect(() => {
    localStorage.setItem('videoTimeout', videoTimeout.toString());
  }, [videoTimeout]);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
  };

  const handleFontFamilyChange = (family) => {
    setFontFamily(family);
  };

  const handleTextColorChange = (color) => {
    setTextColor(color);
  };

  const handleResetTextSettings = () => {
    setFontSize(14);
    setFontFamily("'Courier New', monospace");
    setTextColor('#000000');
  };

  // Handle teacher selection
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const handleTeacherClick = (teacherName) => {
    console.log('App: Teacher clicked from TeacherList:', teacherName);
    setSelectedTeacher(teacherName);
  };

  // Listen for selectTeacher events from SmartScheduler
  useEffect(() => {
    const handleSelectTeacher = (e) => {
      setSelectedTeacher(e.detail.teacherName);
    };

    window.addEventListener('selectTeacher', handleSelectTeacher);
    return () => {
      window.removeEventListener('selectTeacher', handleSelectTeacher);
    };
  }, []);

  // Handle teacher selection from PeriodAnalysisWindow
  const handleTeacherSelectFromAnalysis = (teacherName) => {
    console.log('App: Teacher selected from PeriodAnalysisWindow:', teacherName);
    setSelectedTeacher(teacherName);

    // Also send event to NewWindow
    const viewEvent = new CustomEvent('viewSchedule', {
      detail: {
        type: 'teacher',
        item: teacherName,
        date: selectedDate
      }
    });
    window.dispatchEvent(viewEvent);
  };

  // Handle teacher double-click for absence report
  const [teacherToAddToAbsence, setTeacherToAddToAbsence] = useState(null);
  const handleTeacherAddToAbsence = async (teacherNameOrData) => {
    console.log('App: Teacher added to absence report:', teacherNameOrData);

    // If it's just a name (from TeacherList), we need to find the full teacher data
    if (typeof teacherNameOrData === 'string') {
      try {
        const response = await fetchPublic('/teachers.json');
        const teachers = await response.json();
        const teacher = teachers.find(t =>
          t.καθηγητής.toUpperCase().trim() === teacherNameOrData.toUpperCase().trim()
        );

        if (teacher) {
          setTeacherToAddToAbsence(teacher);
        } else {
          console.log('Teacher not found:', teacherNameOrData);
        }
      } catch (err) {
        console.error('Error loading teacher data:', err);
      }
    } else {
      // If it's already teacher data (from TeacherAvailabilityCard)
      setTeacherToAddToAbsence(teacherNameOrData);
    }

    // Reset after a short delay to allow MainWindow to process it
    setTimeout(() => setTeacherToAddToAbsence(null), 100);
  };

  // Get list of assigned replacements for today
  const getAssignedReplacements = () => {
    return assignedReplacements;
  };

  // Handle date changes from DateDisplay - use Athens timezone
  const [selectedDate, setSelectedDate] = useState(getAthensDate());
  const [assignedReplacements, setAssignedReplacements] = useState([]);
  
  const handleDateChange = (newDate) => {
    console.log('App: Date changed to:', newDate);
    setSelectedDate(newDate);
  };
  
  const handleReplacementAssigned = (teacherName) => {
    console.log('App: Replacement assigned:', teacherName);
    setAssignedReplacements(prev => [...prev, teacherName]);
  };
  
  const handleReplacementRemoved = (teacherName) => {
    console.log('App: Replacement removed:', teacherName);
    setAssignedReplacements(prev => prev.filter(name => name !== teacherName));
  };

  // Handle teacher selection from availability card
  const handleTeacherSelect = (teacher) => {
    console.log('App: Teacher selected from availability card:', teacher.καθηγητής);
    setSelectedTeacher(teacher.καθηγητής);

    // Also send event to NewWindow
    const viewEvent = new CustomEvent('viewSchedule', {
      detail: {
        type: 'teacher',
        item: teacher.καθηγητής,
        date: selectedDate
      }
    });
    window.dispatchEvent(viewEvent);
  };

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  // Load dynamically extracted names from localStorage if available
  useEffect(() => {
    try {
      const raw = localStorage.getItem('extractedTeacherNames');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const uniqueSorted = Array.from(new Set(parsed)).sort((a, b) => a.localeCompare(b, 'el'));
          setDynamicNames(uniqueSorted);
          console.log('App: Loaded dynamic teacher names:', uniqueSorted.length);
        }
      }
    } catch (err) {
      console.error('App: Error loading dynamic names:', err);
    }
  }, []);

  // Debug info
  useEffect(() => {
    console.log('App: Current state:', {
      selectedTeacher,
      selectedDate: selectedDate.toDateString(),
      assignedReplacements,
      teachersCount: teachersToShow.length
    });
  }, [selectedTeacher, selectedDate, assignedReplacements]);

  const teachersToShow = dynamicNames.length > 0 ? dynamicNames : greekNames;

  // Student Attendance List state
  const [showStudentAttendance, setShowStudentAttendance] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedClassroomFile, setSelectedClassroomFile] = useState(null);
  const [absenceDataForAttendance, setAbsenceDataForAttendance] = useState([]);

  // Available Classrooms state
  const [showAvailableClassrooms, setShowAvailableClassrooms] = useState(false);
  const [selectedPeriodForClassrooms, setSelectedPeriodForClassrooms] = useState(null);

  // Class Schedule Viewer state
  const [showClassScheduleViewer, setShowClassScheduleViewer] = useState(false);

  // Listen for openStudentAttendance event from MainWindow
  useEffect(() => {
    const handleOpenStudentAttendance = (e) => {
      setAbsenceDataForAttendance(e.detail.absenceData || []);
      // Αν υπάρχει classroom και filePath, ανοίγει απευθείας το StudentAttendanceList
      if (e.detail.classroom && e.detail.filePath) {
        setSelectedClassroom(e.detail.classroom);
        setSelectedClassroomFile(e.detail.filePath);
      } else {
        // Αλλιώς δείχνει το ClassroomSelector
        setSelectedClassroom(null);
        setSelectedClassroomFile(null);
      }
      setShowStudentAttendance(true);
    };

    window.addEventListener('openStudentAttendance', handleOpenStudentAttendance);
    return () => {
      window.removeEventListener('openStudentAttendance', handleOpenStudentAttendance);
    };
  }, []);

  // Listen for openAvailableClassrooms event
  useEffect(() => {
    const handleOpenAvailableClassrooms = (e) => {
      setSelectedPeriodForClassrooms(e.detail.period);
      setShowAvailableClassrooms(true);
    };

    window.addEventListener('openAvailableClassrooms', handleOpenAvailableClassrooms);
    return () => {
      window.removeEventListener('openAvailableClassrooms', handleOpenAvailableClassrooms);
    };
  }, []);

  // Listen for openAllClasses event
  useEffect(() => {
    const handleOpenAllClasses = () => {
      setShowClassScheduleViewer(true);
    };

    window.addEventListener('openAllClasses', handleOpenAllClasses);
    return () => {
      window.removeEventListener('openAllClasses', handleOpenAllClasses);
    };
  }, []);

  return (
    <div className="app">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} videoTimeout={videoTimeout} />}

      {/* Top Right Menu */}
      <TopRightMenu />

      {/* Left Sidebar with Teacher Names */}
      <TeacherList 
        teachers={teachersToShow}
        onTeacherClick={handleTeacherClick}
        onTeacherDoubleClick={handleTeacherAddToAbsence}
        isExpanded={sidebarExpanded}
      />

      {/* Compact preview fixed bottom-left */}
      <TeacherSchedulePreview 
        teacherName={selectedTeacher}
        selectedDate={selectedDate}
      />

      {/* Teacher Schedule Card */}
      <TeacherScheduleCard 
        teacherName={selectedTeacher} 
        isExpanded={sidebarExpanded}
        selectedDate={selectedDate}
      />

      {/* Teacher Availability Card */}
      <TeacherAvailabilityCard
        isExpanded={sidebarExpanded}
        selectedDate={selectedDate}
        onTeacherSelect={handleTeacherSelect}
        onTeacherAddToAbsence={handleTeacherAddToAbsence}
        assignedReplacements={assignedReplacements}
      />


      {/* New Window - Class Schedule */}
      <NewWindow />

      {/* Date Display */}
      <DateDisplay onDateChange={handleDateChange} />

      {/* Main Window - Updated with onTeacherSelect prop */}
      <MainWindow 
        selectedTeacher={selectedTeacher} 
        teacherToAddToAbsence={teacherToAddToAbsence}
        selectedDate={selectedDate}
        onReplacementAssigned={handleReplacementAssigned}
        onReplacementRemoved={handleReplacementRemoved}
        onTeacherSelect={handleTeacherSelectFromAnalysis}
      />

      {/* Theme Selector */}
      <ThemeSelector
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        customColor={customThemeColor}
        onCustomColorChange={setCustomThemeColor}
        customOpacity={customThemeOpacity}
        onCustomOpacityChange={setCustomThemeOpacity}
      />

      {/* Text Settings */}
      <TextSettings
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        fontFamily={fontFamily}
        onFontFamilyChange={handleFontFamilyChange}
        textColor={textColor}
        onTextColorChange={handleTextColorChange}
        onResetTextSettings={handleResetTextSettings}
        windowBgColor={windowBgColor}
        onWindowBgColorChange={setWindowBgColor}
        windowBgOpacity={windowBgOpacity}
        onWindowBgOpacityChange={setWindowBgOpacity}
        borderColor={borderColor}
        onBorderColorChange={setBorderColor}
        borderOpacity={borderOpacity}
        onBorderOpacityChange={setBorderOpacity}
        borderWidth={borderWidth}
        onBorderWidthChange={setBorderWidth}
        borderStyle={borderStyle}
        onBorderStyleChange={setBorderStyle}
        videoTimeout={videoTimeout}
        onVideoTimeoutChange={setVideoTimeout}
      />

      {/* Smart Scheduler */}
      <SmartScheduler selectedDate={selectedDate} isExpanded={sidebarExpanded} />

      {/* Student Attendance List - Modal */}
      {showStudentAttendance && !selectedClassroom && (
        <div className="modal-overlay" onClick={() => setShowStudentAttendance(false)}>
          <div className="modal-content student-attendance-modal" onClick={(e) => e.stopPropagation()}>
            <ClassroomSelector
              absentTeachers={absenceDataForAttendance}
              onClassroomSelect={(classroom, filePath) => {
                setSelectedClassroom(classroom);
                setSelectedClassroomFile(filePath);
              }}
              onClose={() => setShowStudentAttendance(false)}
            />
          </div>
        </div>
      )}

      {showStudentAttendance && selectedClassroom && selectedClassroomFile && (
        <div className="modal-overlay" onClick={() => {
          setShowStudentAttendance(false);
          setSelectedClassroom(null);
          setSelectedClassroomFile(null);
        }}>
          <div className="modal-content student-attendance-modal" onClick={(e) => e.stopPropagation()}>
            <StudentAttendanceList
              htmlFilePath={selectedClassroomFile}
              selectedClassName={selectedClassroom}
              onClose={() => {
                setShowStudentAttendance(false);
                setSelectedClassroom(null);
                setSelectedClassroomFile(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Coordinates Display (if enabled) */}
      {/* This will be shown by MainWindow when coordinates are enabled */}

      {/* Available Classrooms Modal */}
      <AvailableClassrooms
        isOpen={showAvailableClassrooms}
        onClose={() => setShowAvailableClassrooms(false)}
        selectedPeriod={selectedPeriodForClassrooms}
        currentDay={selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) : 'Monday'}
      />

      {/* Class Schedule Viewer Modal */}
      {showClassScheduleViewer && (
        <div className="modal-overlay" onClick={() => setShowClassScheduleViewer(false)}>
          <div className="modal-content class-schedule-viewer-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95vw', width: '95vw', maxHeight: '95vh', overflow: 'auto' }}>
            <button
              className="close-btn"
              onClick={() => setShowClassScheduleViewer(false)}
              style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, background: '#fff', border: '2px solid #ccc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
            >
              ✕
            </button>
            <ClassScheduleViewer />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;