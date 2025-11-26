// @FILE-INFO: StudentAttendanceList.js | /src/components/
// TYPE: Feature Component
// LAYER: UI (Resource)
// EXPORTS: StudentAttendanceList (default)

import React, { useState, useEffect } from 'react';
import './StudentAttendanceList.css';

const StudentAttendanceList = ({ htmlFilePath, onClose, selectedClassName }) => {
  const [students, setStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState(new Set());
  const [classInfo, setClassInfo] = useState({ title: '', schoolYear: '' });
  const [loading, setLoading] = useState(false);
  const [currentClassName, setCurrentClassName] = useState(selectedClassName || '');

  // Κρύψε τα 3 draggable παράθυρα όταν ανοίγει το παράθυρο Παρουσίες Μαθητών
  // Και σταμάτα τους ήχους του SchoolClock
  useEffect(() => {
    const teacherScheduleCard = document.querySelector('.schedule-card');
    const newWindow = document.querySelector('.new-window');
    const availabilityCard = document.querySelector('.availability-card');
    
    // Σταμάτα τους ήχους του SchoolClock
    // 1. Σταμάτα όλα τα audio elements
    const clockAudioElements = document.querySelectorAll('audio');
    clockAudioElements.forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    // 2. Κλείσε όλα τα AudioContext αν είναι ανοιχτά
    if (window.schoolClockAudioContext) {
      try {
        window.schoolClockAudioContext.close();
      } catch (e) {
        // Ignore if already closed
      }
      window.schoolClockAudioContext = null;
    }
    
    // 3. Στείλε event για να σταματήσει το tick sound
    console.log('StudentAttendanceList: Dispatching stopClockSounds event');
    window.dispatchEvent(new CustomEvent('stopClockSounds', { detail: { stop: true } }));
    
    // Force disable sounds immediately
    if (window.schoolClockDisableSounds) {
      window.schoolClockDisableSounds();
    }

    const previousStates = {
      teacherSchedule: teacherScheduleCard ? teacherScheduleCard.style.display : '',
      newWindow: newWindow ? newWindow.style.display : '',
      availability: availabilityCard ? availabilityCard.style.display : ''
    };

    if (teacherScheduleCard) teacherScheduleCard.style.display = 'none';
    if (newWindow) newWindow.style.display = 'none';
    if (availabilityCard) availabilityCard.style.display = 'none';

    return () => {
      // Re-enable sounds when component unmounts (when modal closes)
      console.log('StudentAttendanceList: Unmounting, re-enabling clock sounds');
      window.dispatchEvent(new CustomEvent('modalClosed'));
      
      if (teacherScheduleCard) teacherScheduleCard.style.display = previousStates.teacherSchedule || 'block';
      if (newWindow) newWindow.style.display = previousStates.newWindow || 'block';
      if (availabilityCard) availabilityCard.style.display = previousStates.availability || 'block';
    };
  }, []);

  // Φορτώνει και αναλύει το HTML αρχείο
  useEffect(() => {
    if (htmlFilePath) {
      loadStudentList(htmlFilePath);
    } else if (currentClassName) {
      // Αν δεν υπάρχει htmlFilePath αλλά υπάρχει currentClassName, φόρτωσε αυτόματα
      const filePath = getDefaultFilePathForClass(currentClassName);
      if (filePath) {
        loadStudentList(filePath);
      }
    }
  }, [htmlFilePath, currentClassName]);

  // Φορτώνει την κατάσταση απουσιών από το localStorage (ΜΟΝΟ αν είναι σε print mode)
  useEffect(() => {
    // ΔΕΝ φορτώνουμε προηγούμενες απουσίες - κάθε φορά ξεκινάμε από καθαρό απουσιολόγιο
    // Έτσι ο καθηγητής μπορεί να το τυπώσει και να συμπληρώσει τα checkboxes με το χέρι
    setAbsentStudents(new Set());
  }, [htmlFilePath, selectedClassName]);

  // ΔΕΝ αποθηκεύουμε τις απουσίες - το απουσιολόγιο είναι για εκτύπωση
  // Ο καθηγητής θα συμπληρώσει τα checkboxes με το χέρι

  const getDefaultFilePathForClass = (className) => {
    if (!className) {
      return '/tmimata-kanonika.txt'; // Χρησιμοποιούμε .txt αντί για .html (πιο γρήγορο και εύκολο)
    }
    
    const trimmed = className.trim();
    const upper = trimmed.toUpperCase();
    
    const hasSupportPrefix = upper.startsWith('ΣΤ.');
    const startsWithRegularClass = /^[ΑΒΓ]\d+/.test(upper);
    const containsCoteachingMarkers = upper.includes('_') || upper.includes('ΚΑΤ');

    // ΓΙΑ ΣΤΗΡΙΞΗ: Χρησιμοποιούμε support-classes.json
    if (hasSupportPrefix) {
      console.log(`📂 Support class "${className}" → Using /support-classes.json`);
      return '/support-classes.json';
    }

    // ΓΙΑ ΣΥΝΔΙΔΑΣΚΑΛΙΕΣ: Χρησιμοποιούμε coteaching-classes.json
    if (containsCoteachingMarkers) {
      console.log(`📂 Coteaching class "${className}" → Using /coteaching-classes.json`);
      return '/coteaching-classes.json';
    }

    // ΓΙΑ ΚΑΝΟΝΙΚΕΣ ΤΑΞΕΙΣ: Χρησιμοποιούμε tmimata-kanonika.txt
    if (startsWithRegularClass) {
      console.log(`📂 Regular class "${className}" → Using /tmimata-kanonika.txt`);
      return '/tmimata-kanonika.txt';
    }

    return '/tmimata-kanonika.txt';
  };

  const loadStudentList = async (filePath) => {
    setLoading(true);

    const classNameToUse = currentClassName || selectedClassName;
    const normalizedFilePath = filePath || getDefaultFilePathForClass(classNameToUse);

    try {
      console.log('Loading file:', normalizedFilePath);
      const response = await fetch(normalizedFilePath);
      if (!response.ok) {
        console.error('Δεν μπόρεσα να φορτώσω το αρχείο:', normalizedFilePath, response.status);
        return;
      }

      const urlWithoutQuery = normalizedFilePath.split('?')[0];
      const extension = urlWithoutQuery.split('.').pop().toLowerCase();

      if (extension === 'txt') {
        const textContent = await response.text();
        console.log('TXT loaded, length:', textContent.length);
        parseTxtData(textContent);
      } else if (extension === 'html' || extension === 'htm') {
        const htmlContent = await response.text();
        console.log('HTML loaded, length:', htmlContent.length);
        parseStudentData(htmlContent);
      } else if (extension === 'json') {
        const jsonData = await response.json();
        console.log('JSON loaded, entries:', Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData || {}).length);
        parseJsonData(jsonData);
      } else {
        console.warn('Άγνωστη επέκταση αρχείου, προσπαθώ να το διαβάσω σαν κείμενο');
        const fallbackContent = await response.text();
        parseTxtData(fallbackContent);
      }
    } catch (error) {
      console.error('Σφάλμα κατά τη φόρτωση αρχείου:', normalizedFilePath, error);
    } finally {
      setLoading(false);
    }
  };

  const parseJsonData = async (jsonData) => {
    console.log('Parsing JSON data...');

    // Ελέγχουμε αν είναι το coteaching-classes.json format (array of class objects)
    if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0].className && jsonData[0].students) {
      console.log('✅ Detected coteaching-classes.json format with', jsonData.length, 'classes');

      const classNameToSearch = currentClassName || selectedClassName;
      if (!classNameToSearch) {
        console.warn('⚠️ No className provided, cannot filter students');
        setStudents([]);
        return;
      }

      // Κανονικοποιούμε το className
      const selectedClassUpper = classNameToSearch.trim().toUpperCase();
      console.log('🔍 Looking for class:', selectedClassUpper);

      // Βρίσκουμε το class που ταιριάζει με το selectedClassName
      const matchingClass = jsonData.find(classObj => {
        const classNameUpper = classObj.className.trim().toUpperCase();
        console.log('📋 Checking class:', classNameUpper);

        // Exact match or contains
        return classNameUpper === selectedClassUpper ||
               classNameUpper.includes(selectedClassUpper) ||
               selectedClassUpper.includes(classNameUpper);
      });

      if (!matchingClass) {
        console.warn('⚠️ No matching class found for:', selectedClassUpper);
        console.log('Available classes:', jsonData.map(c => c.className).slice(0, 10).join(', '), '...');
        setStudents([]);
        setClassInfo(prev => ({ ...prev, title: selectedClassName }));
        return;
      }

      console.log('✅ Found matching class:', matchingClass.className, 'with', matchingClass.studentCount, 'students');

      // Μετατρέπουμε τους μαθητές στο format που χρειάζεται το component
      const studentList = matchingClass.students.map((student, index) => ({
        number: index + 1,
        am: student.am,
        lastName: student.epitheto,
        firstName: student.onoma,
        classRoom: student.tmima
      }));

      setStudents(studentList);
      setClassInfo({
        title: matchingClass.className,
        schoolYear: '2025-2026',
        teachers: matchingClass.teachers ? matchingClass.teachers.join(', ') : '',
        rooms: matchingClass.rooms ? matchingClass.rooms.join(', ') : ''
      });

      return;
    }

    // Ελέγχουμε αν είναι η νέα δομή με metadata και groups (Συνδιδασκαλία_Α_Τάξη.json, κλπ)
    if (jsonData.metadata && jsonData.groups && Array.isArray(jsonData.groups)) {
      console.log('✅ Detected new coteaching structure with', jsonData.groups.length, 'groups');

      // Βρίσκουμε τη σχολική χρονιά
      setClassInfo(prev => ({ ...prev, schoolYear: '2025-2026' }));

      const studentList = [];

      const classNameToSearch = currentClassName || selectedClassName;
      if (!classNameToSearch) {
        console.warn('⚠️ No className provided, cannot filter students');
        setStudents([]);
        return;
      }

      // Κανονικοποιούμε το className
      const selectedClassUpper = classNameToSearch.trim().toUpperCase();
      console.log('🔍 Looking for class:', selectedClassUpper);

      // Βρίσκουμε το group που ταιριάζει με το selectedClassName
      let matchingGroup = null;
      
      for (const group of jsonData.groups) {
        if (!group.title || !group.members) continue;
        
        // Εξάγουμε το όνομα της συνδιδασκαλίας από το title
        // Format: "Τμήμα/Συνδιδασκαλία:         Α11_ΠΤ_Π"
        const titleMatch = group.title.match(/Τμήμα\/Συνδιδασκαλία:\s*([^\n\r]+)/i);
        if (!titleMatch) continue;
        
        const groupName = titleMatch[1].trim().toUpperCase();
        console.log('📋 Checking group:', groupName);
        
        // Καθαρίζουμε τα ονόματα από extra spaces και παρενθέσεις
        let cleanGroupName = groupName.replace(/\s+/g, ' ').trim();
        let cleanSelectedClass = selectedClassUpper.replace(/\s+/g, ' ').trim();
        
        // Αφαιρούμε παρενθέσεις και το περιεχόμενό τους (π.χ. "(Γ)" → "")
        cleanGroupName = cleanGroupName.replace(/\s*\([^)]*\)\s*/g, '').trim();
        cleanSelectedClass = cleanSelectedClass.replace(/\s*\([^)]*\)\s*/g, '').trim();
        
        // Εξάγουμε το base class (π.χ. "Α11" από "Α11_ΠΤ_Π", "Γκατ_1" από "Γκατ_1 ΕΙΚ_κατ")
        // Για "Γκατ_1", το base είναι "Γκατ_1" (πρώτα δύο μέρη)
        const groupParts = cleanGroupName.split(/\s+/);
        const selectedParts = cleanSelectedClass.split(/\s+/);
        const baseGroupClass = groupParts.length > 0 ? groupParts[0] : cleanGroupName.split('_')[0];
        const baseSelectedClass = selectedParts.length > 0 ? selectedParts[0] : cleanSelectedClass.split('_')[0];
        
        // Ελέγχουμε αν ταιριάζει:
        // 1. Ακριβές match
        // 2. Το groupName περιέχει το selectedClass
        // 3. Το selectedClass περιέχει το groupName
        // 4. Τα base classes ταιριάζουν (για περιπτώσεις όπως "Α11" vs "Α11_ΠΤ_Π" ή "Γκατ_1" vs "Γκατ_1 ΕΙΚ_κατ")
        // 5. Για Γκατ: αν το base είναι "Γκατ_1" και ταιριάζει
        if (cleanGroupName === cleanSelectedClass || 
            cleanGroupName.includes(cleanSelectedClass) || 
            cleanSelectedClass.includes(cleanGroupName) ||
            (baseGroupClass && baseSelectedClass && baseGroupClass === baseSelectedClass) ||
            (baseGroupClass.startsWith('Γκατ_') && baseSelectedClass.startsWith('Γκατ_') && baseGroupClass === baseSelectedClass)) {
          matchingGroup = group;
          console.log('✅ Found matching group:', groupName, 'for class:', selectedClassUpper);
          break;
        }
      }

      if (!matchingGroup) {
        console.warn('⚠️ No matching group found for:', selectedClassUpper);
        console.log('Available groups:', jsonData.groups.map(g => {
          const match = g.title?.match(/Τμήμα\/Συνδιδασκαλία:\s*([^\n\r]+)/i);
          return match ? match[1].trim() : 'Unknown';
        }));

        setStudents([]);
        setClassInfo(prev => ({ ...prev, title: selectedClassName }));
        return;
      }

      // Εξάγουμε τους μαθητές από το matchingGroup
      matchingGroup.members.forEach((member, index) => {
        const studentNumber = member['Α/Α'] || member['A/A'];
        const studentId = member['ΑΜ'];
        const lastName = member['Επίθετο'];
        const firstName = member['Όνομα'];
        const classRoom = member['Τμήμα'];

        // Παραλείπουμε headers
        if (!studentNumber || studentNumber === 'A/A' || studentNumber === 'Α/Α' || 
            !lastName || lastName === 'Επίθετο' || !studentId || studentId === 'ΑΜ') {
          return;
        }

        if (lastName && firstName && studentNumber && studentId) {
          studentList.push({
            id: `${studentId}_${index}`,
            number: studentNumber,
            studentId: studentId,
            lastName: lastName,
            firstName: firstName,
            classRoom: classRoom || '',
            source: matchingGroup.title
          });
        }
      });

      console.log('✅ Parsed', studentList.length, 'students from new structure');
      setStudents(studentList);
      setClassInfo(prev => ({ ...prev, title: selectedClassName }));
      return;
    }

    // Παλιά δομή - συνεχίζουμε με την υπάρχουσα λογική
    // Φορτώνουμε τα τμήματα από το teachers.json για να βρούμε το σωστό τμήμα
    let classesFromTeachers = null;
    try {
      const classesResponse = await fetch('/classes-from-teachers.json');
      if (classesResponse.ok) {
        classesFromTeachers = await classesResponse.json();
        console.log('✅ Loaded classes from teachers.json:', classesFromTeachers.total, 'classes');
      }
    } catch (e) {
      console.warn('⚠️ Could not load classes-from-teachers.json:', e);
    }

    // Βρίσκουμε τη σχολική χρονιά
    setClassInfo(prev => ({ ...prev, schoolYear: '2025-2026' }));

    // Αν έχουμε επιλεγμένο τμήμα, το χρησιμοποιούμε
    if (selectedClassName) {
      setClassInfo(prev => ({ ...prev, title: selectedClassName }));
    }

    const studentList = [];

    // Ελέγχουμε αν το αρχείο έχει ελληνικά κλειδιά (students-sindidaskalia.json)
    if (!Array.isArray(jsonData)) {
      console.error('❌ JSON data is not an array:', typeof jsonData);
      setStudents([]);
      return;
    }

    const hasGreekKeys = jsonData.length > 0 &&
                        (jsonData[0]['Συνδιδασκαλία'] !== undefined || jsonData[0]['Καθηγητής'] !== undefined);

    jsonData.forEach((entry, index) => {
      let studentNumber, studentId, lastName, firstName, classRoom, source;

      if (hasGreekKeys) {
        // Δομή students-sindidaskalia.json με ελληνικά κλειδιά
        studentNumber = entry['Α/Α'] || entry['A/A']; // Δοκιμάζουμε και τα δύο
        studentId = entry['ΑΜ'];
        lastName = entry['Επίθετο'];
        firstName = entry['Όνομα'];
        classRoom = entry['Τμήμα'];
        source = entry['Συνδιδασκαλία'] || entry['Καθηγητής']; // Το "Συνδιδασκαλία" ή "Καθηγητής" περιέχει το όνομα της συνδιδασκαλίας (π.χ. "Α11_ΠΤ_Π")

        // Παραλείπουμε headers
        if (!studentNumber || studentNumber === 'A/A' || studentNumber === 'Α/Α' || !lastName || lastName === 'Επίθετο') return;
      } else {
        // Δομή students-all.json με αριθμητικά κλειδιά
        // Διαβάζουμε entries με Source="Κατάλογος Μαθητών" (κανονικοί μαθητές)
        // ΚΑΙ entries με Source που ξεκινάει με "Στ." (στηρίξεις)
        // ΚΑΙ entries με Source που περιέχει underscore (συνδιδασκαλίες)
        // Υποστηρίζουμε και "Source" (παλιά) και "Συνδιδασκαλία" (νέα)
        source = entry['Source'] || entry['Συνδιδασκαλία'];
        if (!source) return;
        
        const isRegularStudent = source === 'Κατάλογος Μαθητών';
        const isSupport = source.startsWith('Στ.');
        const isCoteaching = source.includes('_');
        
        // Παραλείπουμε entries που δεν είναι μαθητές (π.χ. προγράμματα, αίθουσες)
        if (!isRegularStudent && !isSupport && !isCoteaching) return;
        
        // Παραλείπουμε headers (A/A, ΑΜ, κλπ)
        if (entry['0'] === 'A/A' || entry['2'] === 'Επίθετο') return;
        
        // Ελέγχουμε αν έχει τα απαραίτητα πεδία
        if (!entry['0'] || !entry['1'] || !entry['2'] || !entry['3'] || !entry['4']) return;
        
        studentNumber = entry['0'];
        studentId = entry['1'];
        lastName = entry['2'];
        firstName = entry['3'];
        classRoom = entry['4'];
        // Το source έχει ήδη οριστεί παραπάνω
      }

      // Αγνοούμε headers και άδειες γραμμές
      if (lastName && firstName && studentNumber && 
          lastName !== 'Επίθετο' && studentId !== 'ΑΜ') {
        studentList.push({
          id: `${studentId}_${index}`,
          number: studentNumber,
          studentId: studentId,
          lastName: lastName,
          firstName: firstName,
          classRoom: classRoom,
          source: source // Αποθηκεύουμε και το Source/Καθηγητής
        });
      }
    });

    console.log('Parsed', studentList.length, 'students from JSON');

    // Φιλτράρουμε με βάση το επιλεγμένο τμήμα
    // ΠΡΟΣΟΧΗ: Αν δεν υπάρχει selectedClassName, ΔΕΝ εμφανίζουμε κανέναν μαθητή
    let filteredStudents = [];
    if (selectedClassName) {
      console.log('🔍 Filtering for selected class:', selectedClassName);
      console.log('📋 Total students loaded:', studentList.length);
      console.log('📚 Available sources:', [...new Set(studentList.map(s => s.source).filter(Boolean))].sort());
      console.log('🏫 Available classes:', [...new Set(studentList.map(s => s.classRoom))].sort());
      
      let selectedClass = selectedClassName.trim();
      let selectedClassUpper = selectedClass.toUpperCase();
      console.log('🎯 Will search for (uppercase):', selectedClassUpper);

      // Αν το selectedClass είναι "Γκατ_1" ή παρόμοιο, ψάχνουμε στο classes-from-teachers.json
      // για να βρούμε το πραγματικό τμήμα (π.χ. "Γ" από "(Γ)")
      // ΠΡΟΣΟΧΗ: Το "Γκατ_1" είναι τμήμα συνδιδασκαλίας που βρίσκεται στον καθηγητή
      // και χρειάζεται να χρησιμοποιήσουμε τους καταλόγους των τμημάτων από το students-all.json
      if (selectedClassUpper.includes('_') && classesFromTeachers) {
        // Ελέγχουμε αν το selectedClass υπάρχει στα classes-from-teachers.json
        const allClasses = classesFromTeachers.allClasses || [];
        const foundInTeachers = allClasses.includes(selectedClass);
        
        if (foundInTeachers) {
          console.log(`✅ Found "${selectedClass}" in teachers.json classes`);
          
          // ΠΡΩΤΑ: Προσπαθούμε να εξάγουμε το τμήμα από παρενθέσεις στο selectedClassName
          // (π.χ. "Γκατ_1 (Γ)" -> "Γ")
          let parensMatch = selectedClassName.match(/\(([ΑΒΓ][0-9]*)\)/);
          if (parensMatch) {
            selectedClass = parensMatch[1];
            selectedClassUpper = parensMatch[1].toUpperCase();
            console.log(`ℹ️ Extracted class from parentheses in selectedClassName: "${selectedClass}"`);
          } else if (selectedClassUpper.startsWith('ΓΚΑΤ_')) {
            // "Γκατ_1" = "Γ μαθητικής κατεύθυνσης" (από την ανάλυση των καθηγητών)
            // Όλοι οι καθηγητές που διδάσκουν "Γκατ_1" έχουν "(Γ)" στις παρενθέσεις
            selectedClass = 'Γ';
            selectedClassUpper = 'Γ';
            console.log(`ℹ️ "${selectedClassName}" = "Γ μαθητικής κατεύθυνσης" -> using "Γ"`);
          } else if (selectedClassUpper.startsWith('ΑΡΧ_') || selectedClassUpper.startsWith('ΑΓΓ_')) {
            // "ΑΡΧ_4_κατ" ή "ΑΓΓ_6_κατ" - από την ανάλυση, όλοι έχουν "(Γ)" στις παρενθέσεις
            selectedClass = 'Γ';
            selectedClassUpper = 'Γ';
            console.log(`ℹ️ "${selectedClassName}" -> using "Γ" (from teachers analysis)`);
          }
        }
      }
      
      filteredStudents = studentList.filter(student => {
        if (!student.source) {
          console.log('⚠️ Student without source:', student);
          return false;
        }

        const studentSource = student.source.trim();
        const studentSourceUpper = studentSource.toUpperCase();
        
        // ΠΡΩΤΑ: Exact match (case-insensitive)
        if (studentSourceUpper === selectedClassUpper) {
          console.log(`✅ Exact match: "${studentSource}" === "${selectedClass}"`);
          return true;
        }
        
        // ΔΕΥΤΕΡΑ: Για στηρίξεις με όνομα καθηγητή, αφαιρούμε το όνομα και συγκρίνουμε
        // (π.χ. "Στ. 13 (Β1) Μ.Α." → "Στ. 13 (Β1)")
        if (selectedClassUpper.startsWith('ΣΤ.')) {
          const sourceWithoutTeacher = studentSourceUpper.replace(/\s+[Α-Ω]\.[Α-Ω]\.$/, '').trim();
          if (sourceWithoutTeacher === selectedClassUpper) {
            return true;
          }
        }
        
        // ΤΕΤΑΡΤΟ: Για συνδιδασκαλίες που ξεκινάνε με "Γκατ" ή "ΑΓΓ"
        // ΠΡΟΣΟΧΗ: "Γκατ_1", "Γκατ_2" κλπ είναι ΤΜΗΜΑΤΑ, όχι συνδιδασκαλίες!
        // Άρα δεν ψάχνουμε για αυτά εδώ - θα τα βρούμε με το classRoom field παρακάτω
        
        // ΠΕΜΠΤΟ: Έλεγχος με το classRoom field ΜΟ��Ο για exact match
        const studentClass = student.classRoom ? student.classRoom.trim().toUpperCase() : '';

        // Exact match μόνο (π.χ. "Β1" === "Β1", "Γ32" === "Γ32")
        // ΟΧΙ fallback για "Β1 Ιστορία κατ (Β)" → "Β1"
        if (studentClass === selectedClassUpper) {
          return true;
        }

        return false;
      });
      
      console.log(`Filtered to ${filteredStudents.length} students for class: "${selectedClassName}"`);
      
      // Αν δεν βρήκαμε μαθητές και το selectedClass είναι "Γκατ_1" ή παρόμοιο τμήμα,
      // προσπαθούμε να εξάγουμε το τμήμα από παρενθέσεις από το selectedClassName
      // (αν έχει περαστεί ως "Γκατ_1 (Γ31)" ή "Γκατ_1 (Γ)")
      // ΠΡΟΣΟΧΗ: Μόνο αν δεν βρήκαμε ΚΑΝΕΝΑΝ μαθητή!
      if (filteredStudents.length === 0 && selectedClassUpper.includes('_')) {
        console.log('⚠️ No students found, trying to extract base class...');
        console.log('Selected className:', selectedClassName);

        let baseClass = null;
        let isSingleLetter = false;

        // ΠΡΩΤΑ: Προσπαθούμε να εξάγουμε το τμήμα από την ΑΡΧΗ του string (π.χ. "Γ32" από "Γ32 Μαθηματικά κατ (Γ)")
        const classAtStartMatch = selectedClassName.match(/^([ΑΒΓ][0-9]+)/);
        if (classAtStartMatch) {
          baseClass = classAtStartMatch[1];
          console.log(`✅ Found specific class at start: "${baseClass}"`);
        } else {
          // ΔΕΥΤΕΡΑ: Προσπαθούμε να εξάγουμε το τμήμα από παρενθέσεις (π.χ. "Γ31" από "Γκατ_1 (Γ31)" ή "Γ" από "Γκατ_1 (Γ)")
          let classInParensMatch = selectedClassName.match(/\(([ΑΒΓ][0-9]+)\)/);

          // Αν δεν βρούμε πλήρες τμήμα, προσπαθούμε να βρούμε μόνο το γράμμα (π.χ. "Γ")
          if (!classInParensMatch) {
            classInParensMatch = selectedClassName.match(/\(([ΑΒΓ])\)/);
            isSingleLetter = true;
          }

          if (classInParensMatch) {
            baseClass = classInParensMatch[1];
            console.log(`✅ Found base class in parentheses: "${baseClass}" (single letter: ${isSingleLetter})`);
          }
        }

        if (baseClass && !isSingleLetter) {
          // Μόνο αν έχουμε ΣΥΓΚΕΚΡΙΜΕΝΟ τμήμα (π.χ. "Γ31", "Γ32"), φιλτράρουμε
          // ΔΕΝ κάνουμε fallback σε όλους τους μαθητές της τάξης (π.χ. όλα τα "Β")
          // ΚΡΙΣΙΜΟΣ ΕΛΕΓΧΟΣ: Exact match ΜΟΝΟ για το baseClass, ΟΧΙ για συνδιδασκαλίες
          const baseClassUpper = baseClass.toUpperCase();
          filteredStudents = studentList.filter(student => {
            const studentClass = student.classRoom ? student.classRoom.trim().toUpperCase() : '';
            // Exact match ΜΟΝΟ για το baseClass (π.χ. "Α11"), ΟΧΙ για "Α11_ΠΤ_Π" ή "Α11_ΠΦ_Π"
            // Ελέγχουμε ότι το studentClass είναι ΑΚΡΙΒΩΣ ίσο με το baseClass
            // ή ότι ξεκινάει με baseClass + "_" (για συνδιδασκαλίες που έχουν το baseClass)
            // Αλλά εδώ θέλουμε ΜΟΝΟ exact match γιατί κάνουμε fallback
            return studentClass === baseClassUpper;
          });
          console.log(`✅ Fallback: Found ${filteredStudents.length} students for specific class "${baseClass}" (exact match only)`);
          
          // Αν δεν βρήκαμε μαθητές με exact match, μην εμφανίζουμε τίποτα
          // (γιατί μπορεί να είναι συνδιδασκαλία που δεν έχει μαθητές στο JSON)
          if (filteredStudents.length === 0) {
            console.warn(`⚠️ No students found for exact match "${baseClass}"`);
            console.warn(`This might be a coteaching class (${selectedClassName}) that needs data from txt file`);
          }
        } else {
          // Αν έχουμε μόνο γράμμα τάξης (π.χ. "Β") ή δεν βρέθηκε τμήμα,
          // ΔΕΝ εμφανίζουμε μαθητές γιατί δεν ξέρουμε το συγκεκριμένο τμήμα
          if (isSingleLetter) {
            console.warn(`⚠️ Only found grade letter "${baseClass}" - not showing all ${baseClass} students`);
            console.warn('This coteaching class may not have student data in the system');
          } else {
            console.warn('⚠️ No base class found - will show empty list');
            console.warn('Selected className format:', selectedClassName);
          }
          filteredStudents = [];
        }
      }
      
      // Debug: Εμφάνιση πληροφοριών για το φιλτράρισμα
      console.log(`📊 Filtering results: ${filteredStudents.length} students found for "${selectedClassName}"`);
      if (filteredStudents.length > 0) {
        console.log(`   First student:`, filteredStudents[0]);
        console.log(`   Sample classes:`, [...new Set(filteredStudents.slice(0, 10).map(s => s.classRoom))]);
      }
      
      if (filteredStudents.length === 0) {
        console.warn('⚠️ No students found! Debugging info:');
        console.warn('Selected:', selectedClassName);
        console.warn('Selected (upper):', selectedClassUpper);
        console.warn('First 10 sources:', studentList.slice(0, 10).map(s => ({ source: s.source, sourceUpper: s.source?.toUpperCase(), classRoom: s.classRoom })));
        console.warn('All unique sources:', [...new Set(studentList.map(s => s.source).filter(Boolean))]);
      }
    }

    setStudents(filteredStudents);
  };

  const parseTxtData = (txtContent) => {
    console.log('Parsing TXT content...');

    const studentList = [];

    const classNameToUse = currentClassName || selectedClassName;
    if (!classNameToUse) {
      console.warn('No className provided for TXT parsing');
      setStudents([]);
      return;
    }

    const selectedClassTrimmed = classNameToUse.trim();
    const selectedClassUpper = selectedClassTrimmed.toUpperCase();
    // Αν το selectedClassName έχει παρενθέσεις (π.χ. "Α11_ΠΤ_Π (Α)"), εξάγουμε το base class
    let classNameToSearch = selectedClassUpper;
    let baseClass = selectedClassUpper.split('_')[0]; // Α11 από Α11_ΠΤ_Π
    let isSupportClass = false;
    let supportIdentifierUpper = null;
    
    // ΠΡΩΤΑ: Ελέγχουμε αν είναι στήριξη (π.χ. "Στ.Ο.4 (Γ1)" ή "Στ. 11 (Γ41) Ψ.Α.")
    // Αν είναι, χρησιμοποιούμε ΟΛΟ το όνομα, ΟΧΙ μόνο το τμήμα από τις παρενθέσεις!
    const supportMatch1 = selectedClassTrimmed.match(/^(Στ\.\s*\d+\s*\([ΑΒΓ][0-9]+\)(?:\s+[Α-Ω]\.[Α-Ω]\.)?)/i); // "Στ. 11 (Γ41) Ψ.Α."
    const supportMatch2 = selectedClassTrimmed.match(/^(Στ\.Ο\.\d+\s*\([ΑΒΓ][0-9]+\))/i); // "Στ.Ο.4 (Γ1)"
    
    if (supportMatch1 || supportMatch2) {
      isSupportClass = true;
      supportIdentifierUpper = (supportMatch1 || supportMatch2)[1].replace(/\s+/g, ' ').trim();
      // ΚΡΙΣΙΜΟ: Χρησιμοποιούμε το original (με κεφαλαία/μικρά όπως είναι στο HTML)
      // γιατί το HTML μπορεί να έχει διαφορετική μορφή spacing
      // ΑΛΛΑ για το regex pattern, χρειαζόμαστε uppercase για case-insensitive matching
      classNameToSearch = supportIdentifierUpper.toUpperCase();
      console.log('📌 Support class detected:', supportIdentifierUpper);
      console.log('📌 Will search for (uppercase):', classNameToSearch);
    }
    
    // Αν έχει παρενθέσεις με τμήμα (π.χ. "Α11_ΠΤ_Π (Α)"), χρησιμοποιούμε το τμήμα από τις παρενθέσεις
    // ΑΛΛΑ ΜΟΝΟ αν ΔΕΝ είναι στήριξη!
    const parensMatch = selectedClassUpper.match(/\(([ΑΒΓ][0-9]+)\)/);
    if (parensMatch && !isSupportClass) {
      baseClass = parensMatch[1];
      classNameToSearch = baseClass;
      console.log(`🔍 Found class in parentheses: ${baseClass}, will search for this instead`);
    } else if (parensMatch && isSupportClass) {
      baseClass = parensMatch[1];
      console.log(`🔍 Support class base: ${baseClass} (but using full support name: ${classNameToSearch})`);
    }
    
    // Αν είναι συνδιδασκαλία χωρίς παρενθέσεις, χρησιμοποιούμε το base class
    if (selectedClassUpper.includes('_') && !parensMatch && !isSupportClass) {
      // Ειδική περίπτωση: "Γκατ_1", "βκατ_1", "Ακατ_1" → χρησιμοποιούμε το τμήμα "Γ1", "Β1", "Α1"
      if (baseClass === 'ΓΚΑΤ' || baseClass === 'ΒΚΑΤ' || baseClass === 'ΑΚΑΤ') {
        // Εξάγουμε το grade από το baseClass
        const grade = baseClass.charAt(0); // "Γ" από "ΓΚΑΤ"
        classNameToSearch = grade + '1'; // "Γ1", "Β1", "Α1"
        baseClass = classNameToSearch;
        console.log(`🔍 "Γκατ" class detected, using base class: ${classNameToSearch}`);
      } else {
        classNameToSearch = baseClass;
        console.log(`🔍 Coteaching class detected, using base class: ${baseClass}`);
      }
    }
    
    console.log(`🔍 Looking for class: ${classNameToSearch} (original: ${selectedClassUpper}, base: ${baseClass})`);
    console.log(`🔍 isSupportClass: ${isSupportClass}`);
    
    // Βρίσκουμε το section του επιλεγμένου τμήματος
    // Για support classes, κάνουμε το pattern πιο flexible με spacing
    let escapedClassName = classNameToSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isSupportClass) {
      // Κάνουμε τα spaces flexible (μπορεί να είναι 1, 2, ή περισσότερα spaces)
      // π.χ. "Στ.Ο.4 (Γ1)" -> "Στ\\.Ο\\.4\\s+\\(Γ1\\)"
      escapedClassName = escapedClassName.replace(/\s+/g, '\\s+');
      console.log(`🔍 Support class - escaped pattern: ${escapedClassName}`);
    }
    const classHeaderPattern = new RegExp(`Τμήμα/Συνδιδασκαλία:\\s+${escapedClassName}`, 'i');
    console.log(`🔍 Regex pattern: ${classHeaderPattern}`);
    
    // Debug: Ας δούμε τι υπάρχει στο αρχείο γύρω από αυτό που ψάχνουμε
    if (isSupportClass) {
      const testMatch = txtContent.match(/Τμήμα\/Συνδιδασκαλία:\s*([^\n\r]+)/gi);
      if (testMatch) {
        console.log(`🔍 Found headers in file (first 10):`, testMatch.slice(0, 10));
        const supportHeaders = testMatch.filter(h => h.toUpperCase().includes('ΣΤ.'));
        console.log(`🔍 Support headers found:`, supportHeaders.slice(0, 5));
      }
    }
    
    const classMatch = txtContent.match(classHeaderPattern);
    
    if (!classMatch) {
      console.warn(`⚠️ Could not find header for ${classNameToSearch} in TXT file`);
      console.warn(`⚠️ Pattern was: ${classHeaderPattern}`);
      // Προσπάθεια fallback: ας δοκιμάσουμε με διαφορετικό spacing
      if (isSupportClass) {
        const fallbackPattern = new RegExp(`Τμήμα/Συνδιδασκαλία:\\s*${classNameToSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')}`, 'i');
        console.log(`🔍 Trying fallback pattern: ${fallbackPattern}`);
        const fallbackMatch = txtContent.match(fallbackPattern);
        if (fallbackMatch) {
          console.log(`✅ Found with fallback pattern!`);
          // Χρησιμοποιούμε το fallback match
          const startIndex = fallbackMatch.index;
          const nextHeaderPattern = /Τμήμα\/Συνδιδασκαλία:\s*([^\n\r]+)/gi;
          let endIndex = txtContent.length;
          nextHeaderPattern.lastIndex = startIndex + fallbackMatch[0].length;
          let nextMatch;
          while ((nextMatch = nextHeaderPattern.exec(txtContent)) !== null) {
            const nextClassRaw = nextMatch[1].trim();
            const nextClassNormalized = nextClassRaw.replace(/\s+/g, ' ').trim();
            const classNameToSearchNormalized = classNameToSearch.replace(/\s+/g, ' ').trim();
            if (nextClassNormalized.toUpperCase() !== classNameToSearchNormalized.toUpperCase()) {
              endIndex = nextMatch.index;
              break;
            }
          }
          const section = txtContent.substring(startIndex, endIndex);
          const allLines = section.split('\n');
          const lines = allLines.map(l => l.trim());
          // Συνεχίζουμε με την εξαγωγή μαθητών...
          // (θα χρειαστεί να μεταφέρουμε τον κώδικα παρακάτω)
          // Για τώρα, ας χρησιμοποιήσουμε το fallbackMatch ως classMatch
          const fakeMatch = { index: startIndex, 0: fallbackMatch[0] };
          // Θα χρειαστεί να μεταφέρουμε όλο τον κώδικα εξαγωγής εδώ
          // Αλλά είναι πολύπλοκο, οπότε ας διορθώσουμε το αρχικό pattern
        }
      }
      setStudents([]);
      return;
    }
    
    const startIndex = classMatch.index;
    console.log(`✅ Found header for ${classNameToSearch} at position ${startIndex}`);
    
    // Βρίσκουμε το επόμενο header για άλλο τμήμα
    const nextHeaderPattern = /Τμήμα\/Συνδιδασκαλία:\s*([^\n\r]+)/gi;
    let endIndex = txtContent.length;
    
    // Reset regex και ξεκινάμε από μετά το header του Α11
    nextHeaderPattern.lastIndex = startIndex + classMatch[0].length;
    let nextMatch;
    
    while ((nextMatch = nextHeaderPattern.exec(txtContent)) !== null) {
      const nextClass = nextMatch[1].trim().toUpperCase();
      const nextBaseMatch = nextClass.match(/([ΑΒΓ][0-9]+)/);
      const nextBase = nextBaseMatch ? nextBaseMatch[1] : nextClass.split('_')[0];
      const isSameSupport = isSupportClass && nextClass === classNameToSearch;
      const isSameRegular = !isSupportClass && (nextClass === classNameToSearch || nextBase === baseClass);
      
      // Αν βρήκαμε άλλο τμήμα (όχι το ίδιο), σταματάμε
      if (!isSameSupport && !isSameRegular) {
        endIndex = nextMatch.index;
        console.log(`⚠️ Found next class ${nextClass} at position ${endIndex}, stopping extraction`);
        break;
      }
    }
    
    // Εξάγουμε το section μεταξύ startIndex και endIndex
    const section = txtContent.substring(startIndex, endIndex);
    console.log(`📋 Extracting students from section (length: ${section.length})...`);
    
    // Διαβάζουμε τις γραμμές του section (ΧΩΡΙΣ να αφαιρούμε τις κενές)
    const allLines = section.split('\n');
    const lines = allLines.map(l => l.trim());
    
    // Βρίσκουμε τη γραμμή με τα headers (A/A, ΑΜ)
    // Διαφορά μεταξύ Α και Β/Γ τάξεων:
    // - Α τάξη: "A/A ΑΜ" σε μια γραμμή
    // - Β/Γ τάξη: "A/A" σε μια γραμμή, "ΑΜ" σε άλλη (μπορεί να είναι πολύ πιο κάτω)
    let headerLineIndex = -1;
    let hasSeparatedHeaders = false; // Αν τα headers είναι σε ξεχωριστές γραμμές
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('A/A') || lines[i].includes('Α/Α')) {
        headerLineIndex = i;
        // Ελέγχουμε αν το "ΑΜ" είναι στην ίδια γραμμή
        if (lines[i].includes('ΑΜ') || lines[i].includes('AM')) {
          hasSeparatedHeaders = false; // Α τάξη: "A/A ΑΜ" σε μια γραμμή
        } else {
          // Ελέγχουμε αν το "ΑΜ" είναι σε κάποια από τις επόμενες γραμμές (μέχρι 50 γραμμές)
          // γιατί στο Β52 το "ΑΜ" είναι πολύ πιο κάτω
          let foundAmSeparate = false;
          for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
            if (lines[j] === 'ΑΜ' || lines[j] === 'AM') {
              foundAmSeparate = true;
              break;
            }
          }
          hasSeparatedHeaders = foundAmSeparate; // Β/Γ τάξη: "A/A" και "ΑΜ" σε ξεχωριστές γραμμές
        }
        console.log(`✅ Found header line at index ${headerLineIndex}, separated headers: ${hasSeparatedHeaders}`);
        break;
      }
    }
    
    if (headerLineIndex === -1) {
      console.warn('⚠️ Could not find header line');
      setStudents([]);
      return;
    }
    
    // Διαβάζουμε τους μαθητές
    // Δομή: Στο txt αρχείο τα δεδομένα είναι σε στήλες:
    // - Στήλη 1: "1 1286104 ΓΑΒΡΙΛΙΔΟΥ", "2 1537804 ΓΕΩΡΓΙΟΥ", ...
    // - Στήλη 2: "ΚΩΝΣΤΑΝΤΙΝΑ", "ΣΟΦΙΑ", ... (ονόματα)
    // - Στήλη 3: "Α11", "Α11", ... (τμήματα)
    
    // Βρίσκουμε όλες τις γραμμές με αριθμούς μαθητών
    const studentNumberLines = [];
    const studentNameLines = [];
    const studentClassLines = [];
    
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Αν βρήκαμε νέο header για άλλο τμήμα, σταματάμε
      if (line.match(/^Τμήμα\/Συνδιδασκαλία:\s*[^\n\r]+/i)) {
        const nextClassMatch = line.match(/Τμήμα\/Συνδιδασκαλία:\s*([^\n\r]+)/i);
        if (nextClassMatch) {
          const nextClassRaw = nextClassMatch[1].trim();
          const nextClass = nextClassRaw.toUpperCase();
          // Για support classes, συγκρίνουμε με το original (με spacing όπως είναι)
          // γιατί το HTML μπορεί να έχει διαφορετικό spacing
          const nextClassNormalized = nextClassRaw.replace(/\s+/g, ' ').trim();
          const classNameToSearchNormalized = classNameToSearch.replace(/\s+/g, ' ').trim();
          const nextBaseMatch = nextClass.match(/([ΑΒΓ][0-9]+)/);
          const nextBase = nextBaseMatch ? nextBaseMatch[1] : nextClass.split('_')[0];
          // Για support classes, συγκρίνουμε normalized strings
          const isSameSupport = isSupportClass && (
            nextClassNormalized.toUpperCase() === classNameToSearchNormalized.toUpperCase() ||
            nextClass === classNameToSearch.toUpperCase()
          );
          const isSameRegular = !isSupportClass && (nextClass === classNameToSearch || nextBase === baseClass);
          // Χρησιμοποιούμε το classNameToSearch για σύγκριση
          if (!isSameSupport && !isSameRegular) {
            console.log(`⚠️ Found next class header ${nextClassRaw}, stopping extraction`);
            break;
          }
        }
      }
      
      // Αν η γραμμή είναι κενή, συνεχίζουμε
      if (!line || line.length === 0) {
        continue;
      }
      
      // Έλεγχος αν είναι γραμμή με αριθμό μαθητή (π.χ. "1 1286104 ΓΑΒΡΙΛΙΔΟΥ")
      const numberMatch = line.match(/^(\d+)\s+(\d+)\s+([Α-ΩΑ-Ω\s]+)$/);
      if (numberMatch) {
        studentNumberLines.push({
          index: i,
          number: numberMatch[1],
          studentId: numberMatch[2],
          lastName: numberMatch[3].trim(),
          format: 'combined' // Μορφή: "1 1286104 ΓΑΒΡΙΛΙΔΟΥ" σε μια γραμμή
        });
        continue;
      }

      // Έλεγχος αν είναι γραμμή με αριθμό και ΑΜ (π.χ. "2 6791") χωρίς επώνυμο
      const numberAmOnlyMatch = line.match(/^(\d+)\s+(\d{3,})$/);
      if (numberAmOnlyMatch) {
        studentNumberLines.push({
          index: i,
          number: numberAmOnlyMatch[1],
          studentId: numberAmOnlyMatch[2],
          lastName: null,
          format: hasSeparatedHeaders ? 'separated' : 'combined'
        });
        continue;
      }
      
      // Έλεγχος αν είναι μόνο αριθμός μαθητή (π.χ. "1" ή "2") - για διαφορετική δομή
      // Αυτό συμβαίνει όταν τα δεδομένα είναι σε ξεχωριστές γραμμές (Β/Γ τάξεις)
      // ΠΡΟΣΟΧΗ: Δεν προσθέτουμε αν έχουμε ήδη βρει "combined" format γιατί μπορεί να είναι header
      const singleNumberMatch = line.match(/^(\d+)$/);
      if (singleNumberMatch && i > headerLineIndex) {
        // Ελέγχουμε αν έχουμε ήδη "combined" format
        const hasCombined = studentNumberLines.some(n => n.format === 'combined');
        // Αν έχουμε separated headers (Β/Γ τάξη), τότε τα δεδομένα είναι σε ξεχωριστές γραμμές
        if (!hasCombined && hasSeparatedHeaders) {
          // Ελέγχουμε ότι δεν είναι header (π.χ. "A/A", "ΑΜ")
          const isHeader = line === 'A/A' || line === 'Α/Α' || line === 'ΑΜ' || line === 'AM' || 
                          line === 'Επίθετο' || line === 'Όνομα' || line === 'Τμήμα';
          // Ελέγχουμε ότι δεν είναι ήδη προσθεμένος ο αριθμός
          const alreadyAdded = studentNumberLines.some(n => n.index === i);
          // Ελέγχουμε ότι ο αριθμός είναι μικρότερος από 100 (για να αποφύγουμε ΑΜ που είναι 4-5 ψηφία)
          const numberValue = parseInt(singleNumberMatch[1]);
          if (!isHeader && !alreadyAdded && numberValue < 100) {
            // Αυτή είναι η διαφορετική δομή - τα δεδομένα είναι σε ξεχωριστές γραμμές
            studentNumberLines.push({
              index: i,
              number: singleNumberMatch[1],
              studentId: null, // Θα το πάρουμε από την στήλη ΑΜ
              lastName: null, // Θα το πάρουμε από την στήλη Επίθετο
              format: 'separated' // Μορφή: "1", "2"... σε στήλη, "6881", "6863"... σε άλλη στήλη, κλπ
            });
            continue;
          }
        }
      }
      
      // Έλεγχος αν είναι όνομα (περιέχει μόνο ελληνικά γράμματα, όχι αριθμούς, όχι τμήμα)
      if (line.match(/^[Α-ΩΑ-Ω\s]+$/) && !line.match(/^\d+/) && !line.match(/^Τμήμα/) && !line.match(/^[Α-Ω]\d+$/)) {
        studentNameLines.push({
          index: i,
          name: line.trim()
        });
        continue;
      }
      
      // Έλεγχος αν είναι τμήμα (π.χ. "Α11")
      if (line.match(/^[Α-Ω]\d+$/)) {
        const classRoom = line.trim();
        const roomClassBase = classRoom.split('_')[0];
        
        // ΚΡΙΣΙΜΟΣ ΕΛΕΓΧΟΣ: Αν το τμήμα είναι άλλο, ΣΤΑΜΑΤΑΜΕ
        if (roomClassBase !== baseClass) {
          console.log(`⚠️ Found different class ${classRoom} (base: ${roomClassBase}), stopping extraction`);
          break;
        }
        
        studentClassLines.push({
          index: i,
          classRoom: classRoom
        });
        continue;
      }
    }
    
    console.log(`📊 Found ${studentNumberLines.length} student number lines`);
    console.log(`📊 Found ${studentNameLines.length} student name lines`);
    console.log(`📊 Found ${studentClassLines.length} student class lines`);
    
    // Ταιριάζουμε τα δεδομένα: κάθε μαθητής έχει αριθμό, όνομα και τμήμα
    // Έλεγχος αν έχουμε "separated" format (δεδομένα σε ξεχωριστές γραμμές)
    const hasSeparatedFormat = studentNumberLines.some(n => n.format === 'separated');
    
    if (hasSeparatedFormat) {
      const numberColumn = [];
      const amColumn = [];
      const lastNameColumn = [];
      const firstNameColumn = [];
      const classColumn = [];
      
      let currentSection = 'numbers';
      for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        
        if (line === 'ΑΜ' || line === 'AM') {
          currentSection = 'am';
          continue;
        }
        if (line === 'Επίθετο') {
          currentSection = 'lastName';
          continue;
        }
        if (line === 'Όνομα') {
          currentSection = 'firstName';
          continue;
        }
        if (line === 'Τμήμα') {
          currentSection = 'class';
          continue;
        }
        if (line.startsWith('Τμήμα/Συνδιδασκαλία')) break;
        
        switch (currentSection) {
          case 'numbers': {
            const combined = line.match(/^(\d+)\s+(\d{3,})$/);
            if (combined) {
              numberColumn.push(combined[1]);
              amColumn.push(combined[2]);
            } else if (line.match(/^\d+$/)) {
              numberColumn.push(line.trim());
            }
            break;
          }
          case 'am':
            if (line.match(/^\d+$/)) {
              amColumn.push(line.trim());
              if (amColumn.length >= numberColumn.length) break;
            }
            break;
          case 'lastName':
            lastNameColumn.push(line.trim());
            if (lastNameColumn.length >= numberColumn.length) break;
            break;
          case 'firstName':
            firstNameColumn.push(line.trim());
            if (firstNameColumn.length >= numberColumn.length) break;
            break;
          case 'class':
            if (line.match(/^[Α-Ω]\d+$/)) {
              const foundClass = line.trim().toUpperCase();
              const foundBase = foundClass.split('_')[0];
                if (!isSupportClass && foundBase !== baseClass) break;
              classColumn.push(foundClass);
              if (classColumn.length >= numberColumn.length) break;
            }
            break;
          default:
            break;
        }
      }
      
      const maxStudents = Math.max(
        numberColumn.length,
        amColumn.length,
        lastNameColumn.length,
        firstNameColumn.length,
        classColumn.length
      );
      
      for (let i = 0; i < maxStudents; i++) {
        const number = numberColumn[i] || (i + 1).toString();
        const studentId = amColumn[i] || '';
        const lastName = lastNameColumn[i] || lastNameColumn[lastNameColumn.length - 1] || '';
        const firstName = firstNameColumn[i] || firstNameColumn[firstNameColumn.length - 1] || '';
        const classRoom = (classColumn[i] || classNameToSearch).trim().toUpperCase();
        
        if (!isSupportClass && !classRoom.startsWith(baseClass)) continue;
        if (!studentId) continue;
        
        studentList.push({
          id: `${studentId}_${i}`,
          number,
          studentId,
          lastName,
          firstName,
          classRoom
        });
      }
    } else {
      // Συνήθης δομή: "1 1286104 ΓΑΒΡΙΛΙΔΟΥ", "ΚΩΝΣΤΑΝΤΙΝΑ", "Α11" σε διαφορετικές γραμμές
      const maxStudents = Math.min(studentNumberLines.length, studentNameLines.length, studentClassLines.length);
      
      for (let i = 0; i < maxStudents; i++) {
        const numberLine = studentNumberLines[i];
        const nameLine = studentNameLines[i];
        const classLine = studentClassLines[i];
        
        // Έλεγχος ότι το τμήμα είναι το σωστό
        const classRoom = classLine.classRoom.trim().toUpperCase();
        const roomClassBase = classRoom.split('_')[0];
        
        if (roomClassBase !== baseClass) {
          console.log(`⚠️ Student ${i+1} has wrong class ${classRoom}, stopping`);
          break;
        }
        
        studentList.push({
          id: `${numberLine.studentId}_${i}`,
          number: numberLine.number,
          studentId: numberLine.studentId,
          lastName: numberLine.lastName,
          firstName: nameLine.name,
          classRoom: classRoom
        });
      }
    }
    
    // Αν έχουμε "combined" format και περισσότερους αριθμούς από ονόματα/τμήματα, προσθέτουμε τους υπόλοιπους
    if (!hasSeparatedFormat && studentNumberLines.length > studentNameLines.length) {
      const maxStudents = Math.min(studentNumberLines.length, studentNameLines.length, studentClassLines.length);
      console.log(`⚠️ Found ${studentNumberLines.length - maxStudents} extra student numbers, adding them...`);
      for (let i = maxStudents; i < studentNumberLines.length; i++) {
        const numberLine = studentNumberLines[i];
        // Ελέγχουμε αν το επόμενο τμήμα είναι άλλο
        if (i < studentClassLines.length) {
          const classRoom = studentClassLines[i].classRoom.trim().toUpperCase();
          const roomClassBase = classRoom.split('_')[0];
          if (roomClassBase !== baseClass) {
            console.log(`⚠️ Found different class ${classRoom}, stopping`);
            break;
          }
        }
        
        studentList.push({
          id: `${numberLine.studentId}_${i}`,
          number: numberLine.number,
          studentId: numberLine.studentId,
          lastName: numberLine.lastName,
          firstName: i < studentNameLines.length ? studentNameLines[i].name : '',
          classRoom: i < studentClassLines.length ? studentClassLines[i].classRoom : classNameToSearch
        });
      }
    }
    
    // Φιλτράρουμε μόνο τους μαθητές του επιλεγμένου τμήματος
    const filteredStudents = isSupportClass
      ? studentList
      : studentList.filter(s => {
          const sClass = (s.classRoom || classNameToSearch).trim().toUpperCase();
          // Exact match για το classNameToSearch (π.χ. "Α11")
          return sClass === classNameToSearch || sClass === baseClass;
        });
    
    console.log(`✅ Parsed ${filteredStudents.length} students from TXT for ${classNameToSearch} (original: ${selectedClassUpper})`);
    console.log(`Students:`, filteredStudents.map(s => `${s.number}. ${s.lastName} ${s.firstName}`).join(', '));
    
    // Ταξινόμηση κατά αριθμό μαθητή
    filteredStudents.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
    
    setStudents(filteredStudents);
    
    // Ενημερώνουμε τις πληροφορίες τάξης
    setClassInfo({
      title: selectedClassName, // Κρατάμε το original για εμφάνιση
      schoolYear: txtContent.match(/ΣΧΟΛΙΚΗ ΧΡΟΝΙΑ:\s*(\d{4}-\d{4})/)?.[1] || '2025-2026'
    });
  };

  const parseStudentData = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    console.log('Parsing HTML content...');

    // Εξαγωγή πληροφοριών τάξης
    const bodyText = doc.body.textContent || '';
    
    // Αν έχουμε επιλεγμένο τμήμα, το χρησιμοποιούμε αυτό
    // Αλλιώς ψάχνουμε στο κείμενο
    if (selectedClassName) {
      setClassInfo(prev => ({ ...prev, title: selectedClassName }));
      console.log('Using selected class name:', selectedClassName);
    } else {
      const titleMatch = bodyText.match(/Τμήμα\/Συνδιδασκαλία:\s*([^\n]+)/);
      if (titleMatch) {
        setClassInfo(prev => ({ ...prev, title: titleMatch[1].trim() }));
        console.log('Found class title:', titleMatch[1].trim());
      }
    }

    // Αναζήτηση για σχολική χρονιά
    const yearMatch = bodyText.match(/ΣΧΟΛΙΚΗ ΧΡΟΝΙΑ:\s*(\d{4}-\d{4})/);
    if (yearMatch) {
      setClassInfo(prev => ({ ...prev, schoolYear: yearMatch[1] }));
      console.log('Found school year:', yearMatch[1]);
    }

    // Βελτιωμένη εξαγωγή: Βρίσκουμε το table που ανήκει στο επιλεγμένο τμήμα
    const studentList = [];
    const allTables = doc.querySelectorAll('table');
    
    console.log('Found', allTables.length, 'tables in HTML');

    // Αν έχουμε επιλεγμένο τμήμα, ψάχνουμε το table που ανήκει σε αυτό
    if (selectedClassName) {
      const selectedClassUpper = selectedClassName.trim().toUpperCase();
      const baseClass = selectedClassUpper.split('_')[0]; // Α11 από Α11_ΠΤ_Π
      
      console.log(`🔍 Looking for class: ${selectedClassUpper} (base: ${baseClass})`);
      
      // ΕΝΑΛΛΑΚΤΙΚΗ ΜΕΘΟΔΟΣ: Ψάχνουμε όλο το HTML για το section του Α11
      // Χρησιμοποιούμε textContent για να βρούμε το ακριβές section
      const bodyText = doc.body.textContent || '';
      const selectedClassPattern = new RegExp(`Τμήμα/Συνδιδασκαλία:\\s*${selectedClassUpper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const classMatch = bodyText.match(selectedClassPattern);
      
      let targetTable = null;
      let startIndex = -1;
      let endIndex = bodyText.length;
      
      if (classMatch) {
        startIndex = classMatch.index;
        console.log(`✅ Found header for ${selectedClassUpper} at position ${startIndex}`);
        
        // Βρίσκουμε το επόμενο header για άλλο τμήμα (π.χ. Α21, Β11, κλπ)
        const nextHeaderPattern = /Τμήμα\/Συνδιδασκαλία:\s*([Α-Ω]\d+)/gi;
        let nextMatch;
        let searchStart = startIndex + classMatch[0].length;
        
        while ((nextMatch = nextHeaderPattern.exec(bodyText)) !== null) {
          if (nextMatch.index > startIndex) {
            const nextClass = nextMatch[1].trim().toUpperCase();
            const nextBase = nextClass.split('_')[0];
            
            // Αν βρήκαμε άλλο τμήμα (όχι το ίδιο), σταματάμε
            if (nextClass !== selectedClassUpper && nextBase !== baseClass) {
              endIndex = nextMatch.index;
              console.log(`⚠️ Found next class ${nextClass} at position ${endIndex}, stopping extraction`);
              break;
            }
          }
        }
        
        // Τώρα ψάχνουμε το table που βρίσκεται μεταξύ startIndex και endIndex
        const allElements = doc.querySelectorAll('*');
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i];
          const elementText = element.textContent || '';
          const elementIndex = bodyText.indexOf(elementText);
          
          // Αν το element είναι table και βρίσκεται στο σωστό range
          if (element.tagName === 'TABLE' && elementIndex >= startIndex && elementIndex < endIndex) {
            // Ελέγχουμε αν το table περιέχει το header του Α11
            const tableText = elementText;
            if (tableText.includes(`Τμήμα/Συνδιδασκαλία: ${selectedClassUpper}`) || 
                tableText.includes(`Τμήμα/Συνδιδασκαλία: ${baseClass}`)) {
              targetTable = element;
              console.log(`✅ Found target table for ${selectedClassUpper}`);
              break;
            }
          }
        }
        
        // Fallback: Αν δεν βρήκαμε με την πρώτη μέθοδο, ψάχνουμε το πρώτο table μετά το header
        if (!targetTable) {
          const allTables = doc.querySelectorAll('table');
          for (let i = 0; i < allTables.length; i++) {
            const table = allTables[i];
            const tableText = table.textContent || '';
            const tableIndex = bodyText.indexOf(tableText);
            
            // Αν το table βρίσκεται μετά το header και πριν το επόμενο header
            if (tableIndex > startIndex && tableIndex < endIndex) {
              targetTable = table;
              console.log(`✅ Found target table (fallback) for ${selectedClassUpper}`);
              break;
            }
          }
        }
      }
      
      // Αν βρήκαμε το target table, διαβάζουμε από αυτό
      if (targetTable) {
        console.log(`📋 Extracting students from target table for class ${selectedClassUpper}...`);
        const rows = targetTable.querySelectorAll('tr');
        let foundNextClass = false;
        
        rows.forEach((row, rowIndex) => {
          if (rowIndex === 0) return; // Skip header
          
          // Έλεγχος αν βρήκαμε header για άλλο τμήμα μέσα στο table
          const rowText = row.textContent || '';
          const nextClassMatch = rowText.match(/Τμήμα\/Συνδιδασκαλία:\s*([^\n\r]+)/i);
          if (nextClassMatch) {
            const nextClass = nextClassMatch[1].trim().toUpperCase();
            const nextBase = nextClass.split('_')[0];
            if (nextBase !== baseClass && nextBase.length > 0) {
              console.log(`⚠️ Found next class ${nextClass} in table, stopping extraction`);
              foundNextClass = true;
              return;
            }
          }

          const cells = row.querySelectorAll('td');
          if (cells.length >= 5) {
            const studentNumber = cells[0].textContent.trim();
            const studentId = cells[1].textContent.trim();
            const lastName = cells[2].textContent.trim();
            const firstName = cells[3].textContent.trim();
            const classRoom = cells[4].textContent.trim();

            // Έλεγχος αν το classRoom είναι header για άλλο τμήμα
            if (classRoom && classRoom.match(/^[Α-Ω]\d+$/)) {
              const roomClassBase = classRoom.split('_')[0];
              if (roomClassBase !== baseClass && roomClassBase.length > 0) {
                console.log(`⚠️ Found different class in classRoom field: ${classRoom}, stopping`);
                foundNextClass = true;
                return;
              }
            }

            if (studentNumber && studentNumber !== 'A/A' && studentNumber !== 'Α/Α' &&
                lastName && lastName !== 'Επίθετο' && 
                firstName && firstName !== 'Όνομα' &&
                studentId && studentId !== 'ΑΜ' && !foundNextClass) {
              
              const studentClassUpper = (classRoom || selectedClassUpper).trim().toUpperCase();
              const studentBaseClass = studentClassUpper.split('_')[0];
              
              // ΚΡΙΣΙΜΟΣ ΕΛΕΓΧΟΣ: Αν το classRoom είναι άλλο τμήμα (π.χ. Β11, Γ11), ΣΤΑΜΑΤΑΜΕ
              if (classRoom && classRoom.match(/^[Α-Ω]\d+$/)) {
                const roomClassBase = classRoom.split('_')[0];
                if (roomClassBase !== baseClass) {
                  console.log(`⚠️ Found different class in classRoom: ${classRoom} (base: ${roomClassBase}), stopping extraction`);
                  foundNextClass = true;
                  return;
                }
              }
              
              // Προσθέτουμε τον μαθητή ΜΟΝΟ αν το τμήμα του ταιριάζει ΑΚΡΙΒΩΣ
              if (studentClassUpper === selectedClassUpper || 
                  studentClassUpper === baseClass) {
                studentList.push({
                  id: `${studentId}_target_${rowIndex}`,
                  number: studentNumber,
                  studentId: studentId,
                  lastName: lastName,
                  firstName: firstName,
                  classRoom: classRoom || selectedClassUpper
                });
              } else {
                console.log(`  ⚠️ Skipping student ${lastName} ${firstName} - class mismatch: ${studentClassUpper} vs ${selectedClassUpper}`);
                // Αν το classRoom είναι άλλο τμήμα, σταματάμε
                if (classRoom && classRoom.match(/^[Α-Ω]\d+$/) && studentBaseClass !== baseClass) {
                  console.log(`⚠️ Stopping extraction due to class mismatch`);
                  foundNextClass = true;
                  return;
                }
              }
            }
          }
        });
        
        console.log(`✅ Extracted ${studentList.length} students from target table`);
        
        // Έλεγχος: Αν βρήκαμε περισσότερους από 30 μαθητές, μπορεί να έχουμε πρόβλημα
        if (studentList.length > 30) {
          console.warn(`⚠️ WARNING: Found ${studentList.length} students, which seems too many for a single class. Checking for class mismatches...`);
          
          // Ελέγχουμε πόσα διαφορετικά τμήματα έχουμε
          const uniqueClasses = [...new Set(studentList.map(s => s.classRoom))];
          console.log(`Found students from classes: ${uniqueClasses.join(', ')}`);
          
          // Αν έχουμε περισσότερα από 1 τμήμα, φιλτράρουμε μόνο το Α11
          if (uniqueClasses.length > 1) {
            console.log(`⚠️ Filtering to only ${selectedClassUpper} students...`);
            const filtered = studentList.filter(s => {
              const sClass = (s.classRoom || '').trim().toUpperCase();
              return sClass === selectedClassUpper || sClass === baseClass;
            });
            console.log(`✅ Filtered from ${studentList.length} to ${filtered.length} students`);
            studentList.length = 0;
            studentList.push(...filtered);
          }
        }
      }
      
      // ΠΑΛΙΑ ΜΕΘΟΔΟΣ: Ψάχνουμε για header "Τμήμα/Συνδιδασκαλία: Α11" πριν από κάθε table
      // (χρησιμοποιείται ως fallback αν δεν βρέθηκε με την πρώτη μέθοδο)
      // ΠΡΟΣΟΧΗ: Αν ήδη βρήκαμε μαθητές, ΔΕΝ τρέχουμε τη fallback μέθοδο
      if (studentList.length === 0) {
        console.log('⚠️ No students found with first method, trying fallback method...');
        let foundCorrectTable = false;
        allTables.forEach((table, tableIndex) => {
          // Αν ήδη βρήκαμε το σωστό table, σταματάμε
          if (foundCorrectTable) return;
        // Βρίσκουμε το header πριν από το table
        let prevElement = table.previousElementSibling;
        let foundClassHeader = false;
        let classInHeader = null;
        let foundWrongClass = false;
        
        // Ψάχνουμε προς τα πίσω για το header (μέχρι 10 elements)
        let searchCount = 0;
        while (prevElement && !foundClassHeader && !foundWrongClass && searchCount < 10) {
          const text = prevElement.textContent || '';
          const headerMatch = text.match(/Τμήμα\/Συνδιδασκαλία:\s*([^\n\r]+)/i);
          if (headerMatch) {
            classInHeader = headerMatch[1].trim().toUpperCase();
            console.log(`  Found header: "${classInHeader}" before table ${tableIndex}`);
            
            // Έλεγχος αν το header ταιριάζει ΑΚΡΙΒΩΣ με το επιλεγμένο τμήμα
            // ΜΟΝΟ αν είναι exact match ή base class match (για συνδιδασκαλίες)
            if (classInHeader === selectedClassUpper || 
                (selectedClassUpper.includes('_') && classInHeader === baseClass)) {
              foundClassHeader = true;
              console.log(`  ✅ Match found! Using table ${tableIndex} for class ${classInHeader}`);
            } else {
              // Αν βρήκαμε άλλο τμήμα (π.χ. Β11, Γ11), σταματάμε
              foundWrongClass = true;
              console.log(`  ❌ Wrong class found: ${classInHeader}, stopping search`);
              break;
            }
          }
          prevElement = prevElement.previousElementSibling;
          searchCount++;
        }
        
        // Αν βρήκαμε το σωστό header, διαβάζουμε τους μαθητές από αυτό το table
        if (foundClassHeader && !foundWrongClass) {
          console.log(`📋 Extracting students from table ${tableIndex} for class ${classInHeader}...`);
          foundCorrectTable = true;
          const rows = table.querySelectorAll('tr');
          let foundNextClass = false;
          
          rows.forEach((row, rowIndex) => {
            // Παραλείπουμε την πρώτη γραμμή (κεφαλίδες)
            if (rowIndex === 0) return;
            
            // Έλεγχος αν βρήκαμε header για άλλο τμήμα
            const rowText = row.textContent || '';
            const nextClassMatch = rowText.match(/Τμήμα\/Συνδιδασκαλία:\s*([^\n\r]+)/i);
            if (nextClassMatch) {
              const nextClass = nextClassMatch[1].trim().toUpperCase();
              const nextBase = nextClass.split('_')[0];
              if (nextBase !== baseClass && nextBase.length > 0) {
                console.log(`⚠️ Found next class ${nextClass} in table, stopping extraction`);
                foundNextClass = true;
                return;
              }
            }

            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
              const studentNumber = cells[0].textContent.trim();
              const studentId = cells[1].textContent.trim();
              const lastName = cells[2].textContent.trim();
              const firstName = cells[3].textContent.trim();
              const classRoom = cells[4].textContent.trim();

              // Έλεγχος αν το classRoom είναι header για άλλο τμήμα
              if (classRoom && classRoom.match(/^[Α-Ω]\d+$/)) {
                const roomClassBase = classRoom.split('_')[0];
                if (roomClassBase !== baseClass && roomClassBase.length > 0) {
                  console.log(`⚠️ Found different class in classRoom field: ${classRoom}, stopping`);
                  foundNextClass = true;
                  return;
                }
              }

              // Έλεγχος ότι δεν είναι header row
              if (studentNumber && studentNumber !== 'A/A' && studentNumber !== 'Α/Α' &&
                  lastName && lastName !== 'Επίθετο' && 
                  firstName && firstName !== 'Όνομα' &&
                  studentId && studentId !== 'ΑΜ' && !foundNextClass) {
                
                // Επιπλέον φιλτράρισμα: Ελέγχουμε ότι ο μαθητής ανήκει στο σωστό τμήμα
                const studentClassUpper = (classRoom || classInHeader).trim().toUpperCase();
                const studentBaseClass = studentClassUpper.split('_')[0];
                
                // Προσθέτουμε τον μαθητή ΜΟΝΟ αν το τμήμα του ταιριάζει ΑΚΡΙΒΩΣ
                if (studentClassUpper === selectedClassUpper || 
                    studentClassUpper === baseClass) {
                  studentList.push({
                    id: `${studentId}_${tableIndex}_${rowIndex}`,
                    number: studentNumber,
                    studentId: studentId,
                    lastName: lastName,
                    firstName: firstName,
                    classRoom: classRoom || classInHeader
                  });
                } else {
                  console.log(`  ⚠️ Skipping student ${lastName} ${firstName} - class mismatch: ${studentClassUpper} vs ${selectedClassUpper}`);
                }
              }
            }
          });
          
          console.log(`✅ Extracted ${studentList.length} students from table ${tableIndex}`);
        }
      });
      }
    } else {
      // Αν δεν έχουμε επιλεγμένο τμήμα, διαβάζουμε όλους τους μαθητές από όλα τα tables
      allTables.forEach((table, tableIndex) => {
        const rows = table.querySelectorAll('tr');
        
        rows.forEach((row, rowIndex) => {
          if (rowIndex === 0) return; // Skip header

          const cells = row.querySelectorAll('td');
          if (cells.length >= 5) {
            const studentNumber = cells[0].textContent.trim();
            const studentId = cells[1].textContent.trim();
            const lastName = cells[2].textContent.trim();
            const firstName = cells[3].textContent.trim();
            const classRoom = cells[4].textContent.trim();

            if (studentNumber && studentNumber !== 'A/A' && studentNumber !== 'Α/Α' &&
                lastName && lastName !== 'Επίθετο' && 
                firstName && firstName !== 'Όνομα' &&
                studentId && studentId !== 'ΑΜ') {
              studentList.push({
                id: `${studentId}_${tableIndex}_${rowIndex}`,
                number: studentNumber,
                studentId: studentId,
                lastName: lastName,
                firstName: firstName,
                classRoom: classRoom
              });
            }
          }
        });
      });
    }

    console.log('Parsed', studentList.length, 'students from HTML');
    console.log('Students found:', studentList.map(s => `${s.number}. ${s.lastName} ${s.firstName}`).join(', '));

    // Ταξινόμηση κατά αριθμό μαθητή
    studentList.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });

    console.log(`✅ Total students loaded for ${selectedClassName}: ${studentList.length}`);
    setStudents(studentList);
  };

  const toggleAbsence = (studentId) => {
    setAbsentStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const clearAllAbsences = () => {
    setAbsentStudents(new Set());
  };

  const printAttendanceList = () => {
    // Δημιουργούμε ένα νέο παράθυρο για εκτύπωση - FULLSCREEN
    const printWindow = window.open('', '_blank');
    
    // Υπολογίζουμε το μέγεθος γραμματοσειράς με βάση τον αριθμό μαθητών
    const studentCount = students.length;
    let fontSize = '11pt';
    let rowPadding = '2.5mm';
    let checkboxSize = '14px';
    
    if (studentCount > 20) {
      fontSize = '10pt';
      rowPadding = '2mm';
      checkboxSize = '13px';
    }
    if (studentCount > 25) {
      fontSize = '9pt';
      rowPadding = '1.5mm';
      checkboxSize = '12px';
    }
    if (studentCount > 30) {
      fontSize = '8pt';
      rowPadding = '1mm';
      checkboxSize = '11px';
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Απουσιολόγιο - ${classInfo.title || selectedClassName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body {
            width: 100%;
            height: 100%;
            font-family: Arial, sans-serif;
            background: white;
          }
          
          body {
            display: flex;
            flex-direction: column;
            padding: 5mm 10mm;
            height: 100vh;
          }
          
          .header {
            text-align: center;
            margin-bottom: 3mm;
            border-bottom: 3px solid black;
            padding-bottom: 2mm;
            flex-shrink: 0;
          }
          
          .header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 2mm;
            letter-spacing: 1pt;
          }
          
          .header h2 {
            font-size: 13pt;
            font-weight: bold;
          }
          
          .table-container {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid black;
            height: 100%;
          }
          
          th {
            background: #e0e0e0;
            border: 1.5px solid black;
            padding: 2mm;
            font-size: 11pt;
            font-weight: bold;
            text-align: center;
          }
          
          td {
            border: 1px solid #aaa;
            padding: ${rowPadding};
            font-size: ${fontSize};
            vertical-align: middle;
          }
          
          tbody tr:nth-child(even) {
            background: #f5f5f5;
          }
          
          .col-checkbox {
            width: 18mm;
            text-align: center;
          }
          
          .col-number {
            width: 15mm;
            text-align: center;
            font-weight: bold;
          }
          
          .col-name {
            width: auto;
            padding-left: 3mm;
            font-weight: 500;
          }

          .col-class {
            width: 25mm;
            text-align: center;
            font-weight: bold;
            color: #333;
          }
          
          .checkbox {
            display: inline-block;
            width: ${checkboxSize};
            height: ${checkboxSize};
            border: 1px solid #ccc;
            background: white;
            vertical-align: middle;
            border-radius: 2px;
            position: relative;
          }

          .checkbox.checked {
            background: white;
            border: 1px solid #ccc;
          }

          .checkbox.checked::after {
            content: "";
            position: absolute;
            display: block;
            left: 50%;
            top: 50%;
            width: 10px;
            height: 18px;
            border: solid black;
            border-width: 0 5px 5px 0;
            transform: translate(-50%, -65%) rotate(45deg);
          }
          
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .header {
              margin-bottom: 3mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ΛΥΚΕΙΟ ΑΓΙΟΥ ΣΠΥΡΙΔΩΝΑ</h1>
          <h2>Κατάλογος Μαθητών - Τμήμα: ${classInfo.title || selectedClassName}</h2>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-checkbox">ΑΠΟΥΣΙΑ</th>
                <th class="col-number">Α/Α</th>
                <th class="col-name">ΕΠΙΘΕΤΟ</th>
                <th class="col-name">ΟΝΟΜΑ</th>
                <th class="col-class">ΤΜΗΜΑ</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(student => {
                const isAbsent = absentStudents.has(student.id);
                return `
                <tr>
                  <td class="col-checkbox"><span class="checkbox${isAbsent ? ' checked' : ''}"></span></td>
                  <td class="col-number">${student.number}</td>
                  <td class="col-name">${student.lastName}</td>
                  <td class="col-name">${student.firstName}</td>
                  <td class="col-class">${student.classRoom || ''}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Περιμένουμε να φορτώσει και μετά τυπώνουμε
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return <div className="attendance-loading">Φορτώνει τη λίστα μαθητών...</div>;
  }

  if (students.length === 0) {
    return (
      <div className="attendance-empty">
        <h3>Δεν βρέθηκαν μαθητές</h3>
        {selectedClassName ? (
          <div>
            <p>Δεν βρέθηκαν μαθητές για το τμήμα: <strong>{selectedClassName}</strong></p>
            <p className="hint">Ελέγξτε αν το τμήμα έχει σωστό όνομα στο HTML αρχείο.</p>
            <p className="hint">Ανοίξτε το Developer Console (F12) για περισσότερες λεπτομέρειες.</p>
          </div>
        ) : (
          <p>Παρακαλώ επιλέξτε ένα τμήμα.</p>
        )}
      </div>
    );
  }

  const absentCount = absentStudents.size;
  const presentCount = students.length - absentCount;

  return (
    <div className="student-attendance-list">
      <div className="attendance-header">
        <div className="class-info">
          <div className="header-top">
            <h2>ΛΥΚΕΙΟ ΑΓΙΟΥ ΣΠΥΡΙΔΩΝΑ</h2>
            {onClose && (
              <button
                onClick={(e) => {
                  console.log('Close button clicked');
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  if (onClose) {
                    console.log('Calling onClose');
                    onClose();
                  }
                }}
                className="close-attendance-btn"
                title="Επιστροφή"
                type="button"
              >
                ✕ Κλείσιμο
              </button>
            )}
          </div>

          <p className="class-title">Κατάλογος Μαθητών - Τμήμα: {classInfo.title || currentClassName || '---'}</p>
          {classInfo.schoolYear && <p className="school-year">Σχολική Χρονία: {classInfo.schoolYear}</p>}
        </div>
        <div className="attendance-stats">
          <div className="stat-box present">
            <span className="stat-number">{presentCount}</span>
            <span className="stat-label">Παρόντες</span>
          </div>
          <div className="stat-box absent">
            <span className="stat-number">{absentCount}</span>
            <span className="stat-label">Απόντες</span>
          </div>
        </div>
      </div>

      <div className="attendance-controls">
        <button
          onClick={(e) => {
            console.log('Print button clicked');
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            printAttendanceList();
          }}
          className="control-btn print-btn"
          style={{ background: '#2196F3' }}
          type="button"
        >
          🖨️ Εκτύπωση Απουσιολογίου
        </button>
        <button
          onClick={clearAllAbsences}
          className="control-btn clear-btn"
          disabled={absentStudents.size === 0}
        >
          Καθαρισμός Επιλογών
        </button>
      </div>

      <div className="students-table">
        <div className="table-header">
          <div className="col-checkbox">Απουσία</div>
          <div className="col-number">Α/Α</div>
          <div className="col-id">ΑΜ</div>
          <div className="col-name">Επίθετο</div>
          <div className="col-name">Όνομα</div>
          <div className="col-class">Τμήμα</div>
        </div>

        <div className="table-body">
          {students.map((student) => {
            const isAbsent = absentStudents.has(student.id);
            return (
              <div
                key={student.id}
                className={`student-row ${isAbsent ? 'absent' : 'present'}`}
              >
                <div className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                  <label
                    className="checkbox-container"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isAbsent}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleAbsence(student.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="checkmark"></span>
                  </label>
                </div>
                <div className="col-number">{student.number}</div>
                <div className="col-id">{student.studentId}</div>
                <div className="col-name">{student.lastName}</div>
                <div className="col-name">{student.firstName}</div>
                <div className="col-class">{student.classRoom}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="attendance-summary">
        <p>
          Σύνολο μαθητών: <strong>{students.length}</strong> |
          Παρόντες: <strong>{presentCount}</strong> |
          Απόντες: <strong>{absentCount}</strong>
        </p>
      </div>
    </div>
  );
};

export default StudentAttendanceList;
