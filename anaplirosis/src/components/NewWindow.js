import React, { useState, useEffect, useRef } from 'react';
import './NewWindow.css';
import { coteachingPairs } from '../data/coteachingPairs';
import { useDraggable } from '../hooks/useDraggable';
import { useWindowLayer } from '../hooks/useWindowLayer';
import { useResizable } from '../hooks/useResizable';

const NewWindow = () => {
  const [viewType, setViewType] = useState(null); // 'teacher', 'student', 'class', 'classroom'
  const [selectedItem, setSelectedItem] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCoteaching, setIsCoteaching] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [activeGroupTabs, setActiveGroupTabs] = useState({}); // For switching between groups in coteaching per period

  // Window layering
  const { zIndex, bringToFront } = useWindowLayer('newWindow');

  // Draggable functionality - Default θέση 1:1 από capture
  const { position, setPosition, dragRef, handleMouseDown, resetPosition, isDragging, skipNextPositionSave } = useDraggable(230, 506, 'newWindow');

  // Resizable functionality - larger initial size for class schedules with coteaching
  const initialWidth = 350;  // -70 pixels πλάτος
  const initialHeight = window.innerHeight - 421 - 80;  // Αφήνω 80px χώρο κάτω για sidebars
  const { size, isResizing, positionDelta, resizeRef, handleResizeStart, resetSize, resetPositionDelta } = useResizable(initialWidth, initialHeight, 280, 150, 'newWindow');

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
    window.resetNewWindowPosition = () => {
      resetPosition();
      resetSize();
      resetPositionDelta();
    };
    return () => {
      delete window.resetNewWindowPosition;
    };
  }, [resetPosition, resetSize, resetPositionDelta]);

  // Build class schedule helper function - merges data from teachers, students, and classrooms
  const buildClassSchedule = async (teachers, students, classrooms, className) => {
    console.log('Building class schedule for:', className);
    console.log('Data sources - Teachers:', teachers?.length, 'Students:', students?.length, 'Classrooms:', classrooms?.length);

    // --- NEW LOGIC for Special Groups ---
    // If className is a special group like "Στ.Ο.6 (Β51)" or "Στ. 13 (Β1)", extract the base class
    let baseClassName = className;
    let isSpecialGroup = false;
    let specialGroupPrefix = '';
    // Match patterns like: "Στ.Ο.4 (Γ1)", "Στ. 13 (Β1)", "Στ.Ο.6 (Β51)"
    const specialGroupMatch = className.match(/^([ΣΤ]τ\.?\s*[Οο]?\.?\s*[0-9]+)\s*\(([ΑΒΓ][0-9]+)\)/);
    if (specialGroupMatch) {
      isSpecialGroup = true;
      specialGroupPrefix = specialGroupMatch[1].trim(); // e.g., "Στ.Ο.6" or "Στ. 13"
      baseClassName = specialGroupMatch[2]; // e.g., "Β51" or "Γ1"
      console.log(`Special group detected: "${specialGroupPrefix}" with base class "${baseClassName}"`);
    } else {
      // Also check for simpler pattern like "(Β51)"
      const simpleMatch = className.match(/\(([ΑΒΓ][0-9]+)\)/);
      if (simpleMatch) {
        baseClassName = simpleMatch[1];
        console.log(`Special group detected. Using base class "${baseClassName}" for schedule lookup.`);
      }
    }

    const schedule = {
      'Δευτέρα': {},
      'Τρίτη': {},
      'Τετάρτη': {},
      'Πέμπτη': {},
      'Παρασκευή': {}
    };

    const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];
    const searchClassNameUpper = baseClassName.toUpperCase().trim();
    const originalClassNameUpper = className.toUpperCase().trim();

    // First, collect data from teachers
    const teacherData = {};
    teachers.forEach(teacher => {
      const teacherName = teacher.καθηγητής;
      days.forEach(day => {
        const maxPeriods = getDayPeriodCount(day);
        const daySchedule = teacher.πρόγραμμα?.[day];
        if (daySchedule) {
          for (let period = 1; period <= maxPeriods; period++) {
            const subject = daySchedule[period.toString()];
            if (subject && subject.trim() !== '-') {
              const subjectUpper = subject.toUpperCase().trim();
              let matches = false;

              if (searchClassNameUpper.includes('+')) {
                const parts = searchClassNameUpper.split('+');
                matches = parts.every(part => subjectUpper.includes(part));
              } else {
                // Escape special regex characters in class name
                const escapedClassName = searchClassNameUpper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                const patterns = [
                  // Match at start: "Β11", "Β11_", "Β11 ", "Β11_ΠΤ", "Β1 ", "Β1_"
                  new RegExp(`^${escapedClassName}[\\s_+]`, 'i'),
                  // Match in middle: " Α11 ", " Α11_", " Α11+", " Β1 ", " Γ1 "
                  new RegExp(`[\\s+]${escapedClassName}[\\s_+]`, 'i'),
                  // Match gym classes: "ΓυμΒ11", "ΓυμΒ11_", "ΓυμΒ1"
                  new RegExp(`Γυμ${escapedClassName}[\\s_+]`, 'i'),
                  // Match with parentheses: "(Β11)", "(Β1)", "(Γ1)"
                  new RegExp(`\\(${escapedClassName}\\)`, 'i'),
                  // Match as part of compound: "Β11+Β12", "Α11+Β11", "Β1+Β2"
                  new RegExp(`[\\s_+]*${escapedClassName}[\\s_+]*[+\\s]`, 'i'),
                  // Match with underscore and text: "Β11_ΠΤ", "Β1_ΦΤ", "Γ1_ΤΠ"
                  new RegExp(`^${escapedClassName}_[Α-Ω]`, 'i'),
                  // Match with space and text: "Β1 Μαθηματικά", "Γ1 Νέα Ελληνικά"
                  new RegExp(`^${escapedClassName}\\s+[Α-Ω]`, 'i'),
                ];
                
                // For special groups (Στ.Ο.6, Στ. 13, etc.), ONLY match subjects that contain the special group prefix
                // We should NOT match regular class subjects, only support group subjects
                if (isSpecialGroup && specialGroupPrefix) {
                  const specialGroupUpper = specialGroupPrefix.toUpperCase().trim();
                  // Escape dots and create flexible pattern for "Στ.Ο.4" or "Στ. 13"
                  const escapedPrefix = specialGroupUpper.replace(/\./g, '\\.').replace(/\s+/g, '\\s*');
                  
                  // Clear all previous patterns - for special groups we ONLY want support group subjects
                  patterns.length = 0;
                  
                  patterns.push(
                    // Match "Στ.Ο.4" or "Στ. 13" at start
                    new RegExp(`^${escapedPrefix}[\\s_+]`, 'i'),
                    // Match "Στ.Ο.4 (" or "Στ. 13 ("
                    new RegExp(`${escapedPrefix}[\\s_]*\\(`, 'i'),
                    // Match with space: "Στ.Ο.4 Εικαστικές" or "Στ. 13 Μ.Α."
                    new RegExp(`${escapedPrefix}\\s+`, 'i'),
                    // Match the full original class name (e.g., "Στ.Ο.4 (Γ1)")
                    new RegExp(originalClassNameUpper.replace(/\./g, '\\.').replace(/\s+/g, '\\s*'), 'i')
                  );
                  
                  console.log(`🔍 Special group search: "${specialGroupPrefix}" -> "${specialGroupUpper}"`);
                  console.log(`   Patterns:`, patterns.map(p => p.toString()));
                  console.log(`   Subject: "${subject}" -> "${subjectUpper}"`);
                }
                
                // Also check if subject contains the original class name (for special groups)
                if (isSpecialGroup) {
                  // For special groups, ONLY match if it contains the special group prefix
                  // Do NOT match regular class subjects
                  matches = patterns.some(pattern => pattern.test(subjectUpper));
                  if (matches) {
                    console.log(`   ✅ MATCHED for special group!`);
                  } else {
                    console.log(`   ❌ NOT matched for special group`);
                  }
                } else {
                  // For regular classes, check patterns first
                  matches = patterns.some(pattern => pattern.test(subjectUpper));
                  
                  // If no pattern matched, do a more careful includes check
                  // Only match if the class name appears as a word boundary (not part of another word)
                  if (!matches) {
                    // Check if class name appears with word boundaries
                    // This helps catch cases like "Β11_ΠΤ_Τ Σχεδ. & Τεχνολογία" or "Β1 Μαθηματικά"
                    const classWordBoundary = new RegExp(`(^|[\\s_+])${escapedClassName}([\\s_+]|$|[^Α-Ω])`, 'i');
                    if (classWordBoundary.test(subjectUpper)) {
                      matches = true;
                    }
                  }
                  
                  // IMPORTANT: Exclude support groups (Στ.Ο.X) when searching for regular classes
                  // If the subject starts with "Στ" or "ΣΤ", it's a support group, not a regular class subject
                  if (matches && (subjectUpper.startsWith('ΣΤ') || subjectUpper.startsWith('ΣΤ.') || 
                      subjectUpper.match(/^Σ[Ττ][\s\.]*[Οο][\s\.]*[0-9]+/))) {
                    // This is a support group subject, exclude it for regular class searches
                    matches = false;
                  }
                }
              }

              if (matches) {
                const key = `${day}-${period}`;
                if (!teacherData[key]) teacherData[key] = [];
                teacherData[key].push({ teacher: teacherName, subject: subject });
              }
            }
          }
        }
      });
    });

    // Second, collect data from students - track both unified and split groups
    const studentData = {};
    const studentGroupData = {}; // Track split groups (coteaching/electives)

    if (students && students.length > 0) {
      // Filter students who belong to this class
      const classStudents = students.filter(s => {
        const kategoria = s['Κατηγορία'] || '';
        return kategoria.includes(`(${baseClassName})`);
      });

      // Get unique student IDs
      const uniqueStudents = [...new Set(classStudents.map(s => s['Κατηγορία']))];
      console.log(`Found ${uniqueStudents.length} students in class ${baseClassName}`);

      days.forEach(day => {
        for (let period = 1; period <= 8; period++) {
          const key = `${day}-${period}`;
          const subjectsInPeriod = new Map(); // Map: subject -> count of students

          // Get all unique subjects for this period across all students in this class
          uniqueStudents.forEach(studentId => {
            // Students have multiple rows - find the row for this period
            const studentRecords = students.filter(s => s['Κατηγορία'] === studentId);
            const periodRecord = studentRecords.find(r => r[''] === period.toString());

            if (periodRecord && periodRecord[day]) {
              const subject = periodRecord[day].trim();
              if (subject) {
                if (!subjectsInPeriod.has(subject)) {
                  subjectsInPeriod.set(subject, 0);
                }
                subjectsInPeriod.set(subject, subjectsInPeriod.get(subject) + 1);
              }
            }
          });

          // If all students have the SAME subject, it's a class-wide subject
          if (subjectsInPeriod.size === 1) {
            const subject = Array.from(subjectsInPeriod.keys())[0];
            const subjectUpper = subject.toUpperCase();
            // Check if this subject is for the whole class (not an elective)
            let matchesClass = false;
            
            if (isSpecialGroup && specialGroupPrefix) {
              // For special groups, ONLY match if subject contains the special group prefix
              // Do NOT match regular class subjects
              const specialGroupUpper = specialGroupPrefix.toUpperCase();
              matchesClass = subjectUpper.includes(specialGroupUpper) ||
                           subjectUpper.includes(originalClassNameUpper);
            } else {
              // For regular classes, match if contains class name
              matchesClass = subjectUpper.includes(searchClassNameUpper);
              
              // IMPORTANT: Exclude support groups (Στ.Ο.X) when searching for regular classes
              if (matchesClass && 
                  (subjectUpper.startsWith('ΣΤ') || subjectUpper.startsWith('ΣΤ.') || 
                   subjectUpper.match(/^Σ[Ττ][\s\.]*[Οο][\s\.]*[0-9]+/))) {
                matchesClass = false;
              }
            }
            
            if (matchesClass) {
              studentData[key] = subject;
            }
          } else if (subjectsInPeriod.size > 1) {
            // Check if subjects are variations of the same class (e.g., gym with _Κ/_Α suffixes)
            // Normalize subjects by removing gender/group suffixes for comparison
            const normalizedSubjects = new Map();
            Array.from(subjectsInPeriod.entries()).forEach(([subject, count]) => {
              // Remove common suffixes like _Κ, _Α, _Κ1, _Κ2, etc. for comparison
              // Also handle cases like "ΓυμΑ11+Α43_Κ" -> "ΓυμΑ11+Α43"
              const normalized = subject.replace(/_[ΚΑ][0-9]*$/i, '').trim();
              if (!normalizedSubjects.has(normalized)) {
                normalizedSubjects.set(normalized, []);
              }
              normalizedSubjects.get(normalized).push({ subject, count });
            });

            // If after normalization there's only one unique subject, treat as unified
            if (normalizedSubjects.size === 1) {
              const unifiedSubject = Array.from(normalizedSubjects.values())[0][0].subject;
              const normalizedSubject = unifiedSubject.replace(/_[ΚΑ][0-9]*$/i, '').trim();
              const normalizedUpper = normalizedSubject.toUpperCase();
              const unifiedUpper = unifiedSubject.toUpperCase();
              // Check if the normalized subject contains the class name
              let matchesClass = false;
              
              if (isSpecialGroup && specialGroupPrefix) {
                // For special groups, ONLY match if subject contains the special group prefix
                const specialGroupUpper = specialGroupPrefix.toUpperCase();
                matchesClass = unifiedUpper.includes(specialGroupUpper) ||
                              unifiedUpper.includes(originalClassNameUpper);
              } else {
                // For regular classes, match if contains class name
                matchesClass = normalizedUpper.includes(searchClassNameUpper) || 
                              unifiedUpper.includes(searchClassNameUpper);
                
                // IMPORTANT: Exclude support groups (Στ.Ο.X) when searching for regular classes
                if (matchesClass && 
                    (unifiedUpper.startsWith('ΣΤ') || unifiedUpper.startsWith('ΣΤ.') || 
                     unifiedUpper.match(/^Σ[Ττ][\s\.]*[Οο][\s\.]*[0-9]+/))) {
                  matchesClass = false;
                }
              }
              
              if (matchesClass) {
                studentData[key] = unifiedSubject;
              } else {
                // Still split if normalized subject doesn't match class
                studentGroupData[key] = Array.from(subjectsInPeriod.entries()).map(([subject, count]) => ({
                  subject: subject,
                  studentCount: count
                }));
              }
            } else {
              // Check if all normalized subjects contain the base class name
              // If so, they might be variations of the same unified class
              const allContainClass = Array.from(normalizedSubjects.keys()).every(normSubj => {
                const normUpper = normSubj.toUpperCase();
                if (isSpecialGroup && specialGroupPrefix) {
                  // For special groups, ONLY match if contains special group prefix
                  const specialGroupUpper = specialGroupPrefix.toUpperCase();
                  return normUpper.includes(specialGroupUpper) ||
                         normUpper.includes(originalClassNameUpper);
                } else {
                  return normUpper.includes(searchClassNameUpper);
                }
              });
              
              if (allContainClass && normalizedSubjects.size <= 2) {
                // Likely just gender variations (Κ/Α) - treat as unified
                // Use the first subject that contains the class name or special group prefix
                const unifiedEntry = Array.from(subjectsInPeriod.entries()).find(([subject]) => {
                  const subjUpper = subject.toUpperCase();
                  
                  if (isSpecialGroup && specialGroupPrefix) {
                    // For special groups, ONLY match if contains special group prefix
                    const specialGroupUpper = specialGroupPrefix.toUpperCase();
                    return subjUpper.includes(specialGroupUpper) ||
                           subjUpper.includes(originalClassNameUpper);
                  } else {
                    // For regular classes, match if contains class name
                    const matches = subjUpper.includes(searchClassNameUpper);
                    
                    // Exclude support groups for regular classes
                    if (matches && 
                        (subjUpper.startsWith('ΣΤ') || subjUpper.startsWith('ΣΤ.') || 
                         subjUpper.match(/^Σ[Ττ][\s\.]*[Οο][\s\.]*[0-9]+/))) {
                      return false;
                    }
                    
                    return matches;
                  }
                });
                if (unifiedEntry) {
                  studentData[key] = unifiedEntry[0];
                } else {
                  studentGroupData[key] = Array.from(subjectsInPeriod.entries()).map(([subject, count]) => ({
                    subject: subject,
                    studentCount: count
                  }));
                }
              } else {
                // Students are truly split into different groups (coteaching/electives)
                studentGroupData[key] = Array.from(subjectsInPeriod.entries()).map(([subject, count]) => ({
                  subject: subject,
                  studentCount: count
                }));
              }
            }
          }
        }
      });
    }

    // Third, collect data from classrooms (includes room names)
    const classroomData = {};
    if (classrooms && classrooms.length > 0) {
      days.forEach(day => {
        for (let period = 1; period <= 8; period++) {
          // Note: There can be multiple classrooms for the same period
          const classroomRecords = classrooms.filter(c => c[''] === period.toString());
          classroomRecords.forEach(record => {
            if (record[day]) {
              const entry = record[day];
              const entryUpper = entry ? entry.toUpperCase() : '';
              // Check if entry contains the base class name or (for special groups) the special group prefix
              let matchesClass = false;
              
              if (isSpecialGroup && specialGroupPrefix) {
                // For special groups, ONLY match if entry contains the special group prefix
                const specialGroupUpper = specialGroupPrefix.toUpperCase();
                matchesClass = entryUpper.includes(specialGroupUpper) ||
                              entryUpper.includes(originalClassNameUpper);
              } else {
                // For regular classes, match if contains class name
                matchesClass = entryUpper.includes(searchClassNameUpper);
                
                // IMPORTANT: Exclude support groups (Στ.Ο.X) when searching for regular classes
                if (matchesClass && 
                    (entryUpper.startsWith('ΣΤ') || entryUpper.startsWith('ΣΤ.') || 
                     entryUpper.match(/^Σ[Ττ][\s\.]*[Οο][\s\.]*[0-9]+/))) {
                  matchesClass = false;
                }
              }
              
              if (entry && matchesClass) {
                const key = `${day}-${period}`;
                const roomName = record['Κατηγορία']; // Room name like "B253", "B121", etc.
                if (!classroomData[key]) classroomData[key] = [];
                classroomData[key].push({ room: roomName, entry: entry });
              }
            }
          });
        }
      });
    }

    console.log('Teacher data keys:', Object.keys(teacherData).length);
    console.log('Student data keys:', Object.keys(studentData).length);
    console.log('Student group data keys:', Object.keys(studentGroupData).length);
    console.log('Classroom data keys:', Object.keys(classroomData).length);

    // Now merge all three sources
    days.forEach(day => {
      const maxPeriods = getDayPeriodCount(day);
      for (let period = 1; period <= maxPeriods; period++) {
        const key = `${day}-${period}`;

        // Priority: teacher data (most detailed), enhanced with classroom room info
        if (teacherData[key]) {
          if (!schedule[day][period.toString()]) {
            schedule[day][period.toString()] = [];
          }

          // Enhance teacher data with room info from classrooms
          teacherData[key].forEach(item => {
            const classroomInfo = classroomData[key];
            let room = 'Άγνωστη αίθουσα';

            // Try to find matching classroom by checking if subject matches
            if (classroomInfo && classroomInfo.length > 0) {
              const matchingClassroom = classroomInfo.find(c =>
                c.entry.toUpperCase().includes(searchClassNameUpper)
              );
              if (matchingClassroom) {
                room = matchingClassroom.room;
              } else if (classroomInfo.length === 1) {
                // If only one classroom for this period, use it
                room = classroomInfo[0].room;
              }
            }

            schedule[day][period.toString()].push({
              ...item,
              room: room
            });
          });
        } else if (studentGroupData[key]) {
          // Students are split into different groups (coteaching/electives)
          // Show all the groups with their student counts
          if (!schedule[day][period.toString()]) {
            schedule[day][period.toString()] = [];
          }

          studentGroupData[key].forEach(group => {
            // Try to extract room from the subject string (it's usually at the end)
            let room = 'Άγνωστη αίθουσα';
            const roomMatch = group.subject.match(/([A-ZΑ-Ω][0-9]{3}|[A-ZΑ-Ω]{2,}[0-9]{1,3}|Γηπ[0-9])/);
            if (roomMatch) {
              room = roomMatch[0];
            }

            schedule[day][period.toString()].push({
              teacher: 'Συνδιδασκαλία',
              subject: group.subject,
              room: room,
              studentCount: group.studentCount,
              isGroup: true
            });
          });
        } else if (studentData[key] || classroomData[key]) {
          // If no teacher data but student/classroom data exists, use that
          const subject = studentData[key];
          const classroomInfo = classroomData[key];
          const room = classroomInfo && classroomInfo.length > 0 ? classroomInfo[0].room : 'Άγνωστη αίθουσα';

          if (!schedule[day][period.toString()]) {
            schedule[day][period.toString()] = [];
          }
          schedule[day][period.toString()].push({
            teacher: 'Άγνωστος',
            subject: subject || (classroomInfo && classroomInfo[0] ? classroomInfo[0].entry : ''),
            room: room
          });
        }
      }
    });

    // Convert arrays to formatted strings and mark coteaching
    days.forEach(day => {
      for (let period = 1; period <= 8; period++) {
        const periodData = schedule[day][period.toString()];
        if (Array.isArray(periodData) && periodData.length > 0) {
          if (periodData.length > 1) {
            // Multiple entries - could be coteaching or split groups
            const hasGroups = periodData.some(item => item.isGroup);
            schedule[day][period.toString()] = {
              groups: periodData.map(item => ({
                subject: item.subject,
                teacher: item.teacher || 'Συνδιδασκαλία',
                room: item.room,
                studentCount: item.studentCount,
                isGroup: item.isGroup
              })),
              isCoteaching: true,
              isGroupSplit: hasGroups
            };
          } else {
            // Single entry
            const item = periodData[0];
            if (item.isGroup) {
              schedule[day][period.toString()] = `${item.subject}\n(${item.studentCount} μαθητές)\nΑίθουσα: ${item.room}`;
            } else {
              schedule[day][period.toString()] = `${item.subject}\n(${item.teacher})\nΑίθουσα: ${item.room}`;
            }
          }
        }
      }
    });

    return schedule;
  };

  // Load class schedule function - fetches all three data sources and merges them
  const loadClassSchedule = async (className) => {
    console.log(`Loading complete class schedule for "${className}" from all three sources...`);

    try {
      // Fetch all three data sources in parallel
      const [teachersResponse, studentsResponse, classroomsResponse] = await Promise.all([
        fetch('/teachers.json'),
        fetch('/mathites-schedule.json'),
        fetch('/classrooms-schedule.json')
      ]);

      const teachers = await teachersResponse.json();
      const students = await studentsResponse.json();
      const classrooms = await classroomsResponse.json();

      console.log('Fetched all data sources successfully');
      console.log('Teachers:', teachers?.length, 'Students:', students?.length, 'Classrooms:', classrooms?.length);

      // Build merged schedule from all three sources
      const classSchedule = await buildClassSchedule(teachers, students, classrooms, className);
      setScheduleData(classSchedule);
      setDisplayName(`Τμήμα: ${className}`);
    } catch (error) {
      console.error('Error loading class schedule:', error);
      throw error;
    }
  };

  // Listen for custom events from other components - ONLY for classes
  useEffect(() => {
    const handleViewSchedule = async (e) => {
      bringToFront();
      console.log('NewWindow: Received viewSchedule event', e.detail);
      const { type, item, date } = e.detail;

      // Only handle 'class' type events
      if (type !== 'class') {
        console.log('NewWindow: Ignoring non-class event');
        return;
      }

      // Check if this is coteaching (contains "+")
      const isCoteachingClass = item && item.includes('+');
      console.log('NewWindow: Is coteaching?', isCoteachingClass, 'Item:', item);
      setIsCoteaching(isCoteachingClass);

      setViewType(type);
      setSelectedItem(item);
      if (date) setSelectedDate(new Date(date));

      // Load class schedule directly - fetch and build inline
      setLoading(true);
      setError(null);

      try {
        await loadClassSchedule(item);
      } catch (err) {
        console.error('NewWindow: Error loading schedule:', err);
        setError('Σφάλμα φόρτωσης δεδομένων: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    console.log('NewWindow: Adding viewSchedule event listener (class only)');
    window.addEventListener('viewSchedule', handleViewSchedule);
    return () => {
      console.log('NewWindow: Removing viewSchedule event listener');
      window.removeEventListener('viewSchedule', handleViewSchedule);
    };
  }, [bringToFront]); // Re-add listener if bringToFront changes

  // Calculate optimal width based on schedule content
  const calculateOptimalWidth = (schedule) => {
    if (!schedule) return 420; // Default width

    let maxLength = 0;
    let totalLength = 0;
    let count = 0;

    // Check all days and periods
    Object.values(schedule).forEach(daySchedule => {
      Object.values(daySchedule).forEach(subject => {
        if (subject && typeof subject === 'string') {
          const length = subject.length;
          totalLength += length;
          count++;
          if (length > maxLength) {
            maxLength = length;
          }
        }
      });
    });

    // Calculate average length
    const avgLength = count > 0 ? totalLength / count : 0;

    // Width calculation:
    // - Base width: 420px
    // - If max length > 80 chars: add 100px
    // - If max length > 120 chars: add 200px
    // - If average length > 60 chars: add 50px
    let width = 420;

    if (maxLength > 120) {
      width += 250;
    } else if (maxLength > 80) {
      width += 150;
    } else if (maxLength > 60) {
      width += 80;
    }

    if (avgLength > 60) {
      width += 50;
    }

    // Cap at reasonable max width (80% of screen width)
    const maxWidth = Math.floor(window.innerWidth * 0.8);
    return Math.min(width, maxWidth);
  };

  const loadScheduleData = async (type, item) => {
    setLoading(true);
    setError(null);

    try {
      switch (type) {
        case 'teacher':
          await loadTeacherSchedule(item);
          break;
        case 'student':
          await loadStudentSchedule(item);
          break;
        case 'class':
          await loadClassSchedule(item);
          break;
        case 'classroom':
          await loadClassroomSchedule(item);
          break;
        default:
          setError('Άγνωστος τύπος προβολής');
      }
    } catch (err) {
      setError('Σφάλμα φόρτωσης δεδομένων');
      console.error('Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherSchedule = async (teacherName) => {
    const response = await fetch('/teachers.json');
    const teachers = await response.json();

    const teacher = teachers.find(t =>
      t.καθηγητής.toUpperCase().trim() === teacherName.toUpperCase().trim()
    );

    if (teacher) {
      setScheduleData(teacher.πρόγραμμα);
      setDisplayName(`Καθηγητής: ${teacher.καθηγητής}`);
    } else {
      setError(`Δεν βρέθηκε καθηγητής: ${teacherName}`);
    }
  };

  const loadStudentSchedule = async (studentId) => {
    const response = await fetch('/mathites-schedule.json');
    const studentsData = await response.json();

    const studentRows = studentsData.filter(row =>
      row.Source && row.Source.includes(studentId)
    );

    if (studentRows.length > 0) {
      const studentName = studentRows[0].Source;
      const schedule = parseStudentSchedule(studentRows);
      setScheduleData(schedule);
      setDisplayName(`Μαθητής: ${studentName}`);
    } else {
      setError(`Δεν βρέθηκε μαθητής: ${studentId}`);
    }
  };

  const loadClassroomSchedule = async (classroomName) => {
    const response = await fetch('/classrooms-schedule.json');
    const classroomData = await response.json();

    const classroomRows = classroomData.filter(row =>
      row.Source && row.Source === classroomName
    );

    if (classroomRows.length > 0) {
      const schedule = parseClassroomSchedule(classroomRows);
      setScheduleData(schedule);
      setDisplayName(`Αίθουσα: ${classroomName}`);
    } else {
      setError(`Δεν βρέθηκε αίθουσα: ${classroomName}`);
    }
  };

  const parseStudentSchedule = (rows) => {
    const schedule = {
      'Δευτέρα': {},
      'Τρίτη': {},
      'Τετάρτη': {},
      'Πέμπτη': {},
      'Παρασκευή': {}
    };

    rows.forEach(row => {
      const period = row['0'];
      if (period && typeof period === 'number') {
        for (let dayIndex = 1; dayIndex <= 5; dayIndex++) {
          const dayName = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'][dayIndex - 1];
          const content = row[dayIndex.toString()];
          if (content && content !== '---' && !content.includes('Δευτέρα')) {
            schedule[dayName][period.toString()] = content;
          }
        }
      }
    });

    return schedule;
  };

  const parseClassroomSchedule = (rows) => {
    const schedule = {
      'Δευτέρα': {},
      'Τρίτη': {},
      'Τετάρτη': {},
      'Πέμπτη': {},
      'Παρασκευή': {}
    };

    rows.forEach(row => {
      const period = row['0'];
      if (period && typeof period === 'number') {
        for (let dayIndex = 1; dayIndex <= 5; dayIndex++) {
          const dayName = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'][dayIndex - 1];
          const content = row[dayIndex.toString()];
          if (content && !content.includes('Δευτέρα')) {
            schedule[dayName][period.toString()] = content;
          }
        }
      }
    });

    return schedule;
  };

  const getCurrentDayName = () => {
    const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return days[selectedDate.getDay()];
  };

  const getDayPeriodCount = (dayName) => {
    const daysWith8Periods = ['Δευτέρα', 'Τρίτη', 'Πέμπτη'];
    return daysWith8Periods.includes(dayName) ? 8 : 7;
  };

  const getCurrentDaySchedule = () => {
    if (!scheduleData) return null;
    const dayName = getCurrentDayName();
    return scheduleData[dayName] || null;
  };

  // Έλεγχος αν ένα μάθημα είναι συνδιδασκαλία
  const isCoteachingSubject = (dayName, period) => {
    // Έλεγχος αν υπάρχει στη λίστα συνδιδασκαλιών
    return coteachingPairs.some(pair =>
      pair.day === dayName && pair.period === period.toString()
    );
  };

  const renderSchedule = () => {
    const daySchedule = getCurrentDaySchedule();
    const dayName = getCurrentDayName();
    const maxPeriods = getDayPeriodCount(dayName);

    if (!daySchedule) {
      return <div className="no-schedule">Δεν υπάρχει πρόγραμμα για {dayName}</div>;
    }

    const periods = [];
    for (let i = 1; i <= maxPeriods; i++) {
      const subjectData = daySchedule[i.toString()];

      // Check if it's an object with groups (new structure) or other formats
      let subject, isCoteaching, groups;
      if (typeof subjectData === 'object' && subjectData !== null && 'groups' in subjectData) {
        // New structure with groups array
        groups = subjectData.groups;
        isCoteaching = subjectData.isCoteaching || false;
        // Display the currently active group for this period
        if (groups && groups.length > 0) {
          const activePeriodTab = activeGroupTabs[i] || 0;
          const activeGroup = groups[activePeriodTab % groups.length] || groups[0];
          subject = activeGroup.isGroup
            ? `${activeGroup.subject}\n(${activeGroup.studentCount} μαθητές)\nΑίθουσα: ${activeGroup.room}`
            : `${activeGroup.subject}\n(${activeGroup.teacher})\nΑίθουσα: ${activeGroup.room}`;
        }
      } else if (typeof subjectData === 'object' && subjectData !== null && 'text' in subjectData) {
        // Old structure with concatenated text
        subject = subjectData.text.replace(/\\n/g, '\n');
        isCoteaching = subjectData.isCoteaching || false;
      } else {
        subject = subjectData;
        // For regular class schedules, check if the subject string itself indicates co-teaching
        isCoteaching = subject && (subject.includes('+') || subject.includes('\n'));
      }

      // If subject is an array (from older data structures), join it.
      if (Array.isArray(subject)) {
        subject = subject.join('\n');
        isCoteaching = true;
      }

      // Κόκκινο για συνδιδασκαλία, πράσινο για κανονικά μαθήματα
      const colorClass = isCoteaching ? 'coteaching-subject' : (subject ? 'normal-subject' : '');

      // Ειδική κλάση για Γυμναστική
      const isGym = subject && subject.includes('Γυμ');
      const gymClass = isGym ? 'gym-subject' : '';

      periods.push(
        <div key={i} className={`period-row ${subject ? 'has-subject' : 'empty'} ${colorClass} ${gymClass}`}>
          <div className="period-number">{i}η</div>
          <div className="period-subject">
            {subject || 'Κενό ωράριο'}
            {groups && groups.length > 1 && (
              <div className="group-tabs">
                {groups.map((group, idx) => (
                  <button
                    key={idx}
                    className={`group-tab ${idx === (activeGroupTabs[i] || 0) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveGroupTabs(prev => ({ ...prev, [i]: idx }));
                    }}
                  >
                    Ομάδα {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return periods;
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

  if (!viewType) {
    return (
      <div 
        ref={combinedRef}
        className={`new-window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
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
        <div className="window-header draggable-header" style={{ cursor: 'move' }}>
          <h3>Πρόγραμμα Τάξης 📌</h3>
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

        <div className="window-content">
          <div className="content-placeholder">
            <p>Πρόγραμμα Τάξης</p>
            <ul>
              <li>Κάντε Ctrl+Κλικ σε ένα μάθημα</li>
              <li>Για να δείτε το πρόγραμμα της τάξης</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        ref={combinedRef}
        className={`new-window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
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
        <div className="window-header draggable-header" style={{ cursor: 'move' }}>
          <h3>Φόρτωση... 📌</h3>
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
        <div className="window-content">
          <div className="loading-message">Φόρτωση δεδομένων...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        ref={combinedRef}
        className={`new-window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
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
        <div className="window-header draggable-header" style={{ cursor: 'move' }}>
          <h3>Σφάλμα 📌</h3>
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
        <div className="window-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={combinedRef}
      className={`new-window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
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
      <div className="window-header draggable-header" style={{ cursor: 'move' }}>
        <h3>{displayName} 📌</h3>
        <div className="header-info">
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
          <span className="current-day">{getCurrentDayName()}</span>
        </div>
      </div>

      <div className="window-content schedule-display">
        {renderSchedule()}
      </div>
    </div>
  );
};

export default NewWindow;
