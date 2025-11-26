import React, { useState, useEffect } from 'react';
import './PeriodAnalysisWindow.css';
import { hasCoteaching } from '../data/coteachingPairs';

const PeriodAnalysisWindow = ({ selectedDate, onTeacherSelect, absenceData = [] }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1η');
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [busyTeachers, setBusyTeachers] = useState([]);
  const [lastPeriodSuggestions, setLastPeriodSuggestions] = useState([]);

  useEffect(() => {
    loadScheduleData();
  }, []);

  // Update selected period and get current day automatically from date
  useEffect(() => {
    if (selectedDate) {
      const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
      const currentDay = dayNames[selectedDate.getDay()];

      // Only analyze if it's a school day
      if (currentDay && currentDay !== 'Κυριακή' && currentDay !== 'Σάββατο') {
        if (scheduleData) {
          analyzeAvailability(currentDay);
          analyzeLastPeriodSwaps(currentDay);
        }
      }
    }
  }, [scheduleData, selectedDate, selectedPeriod, absenceData]);

  const loadScheduleData = async () => {
    try {
      const response = await fetch('/teachers.json');
      const data = await response.json();
      setScheduleData(data);
    } catch (error) {
      console.error('Error loading schedule data:', error);
    }
  };

  const analyzeAvailability = (dayToAnalyze) => {
    if (!scheduleData) return;

    const available = [];
    const busy = [];
    const periodNum = parseInt(selectedPeriod.replace('η', ''));

    // Συλλέγουμε τα ονόματα των απόντων καθηγητών
    const absentTeacherNames = absenceData
      .filter(absence => absence && absence.absentTeacher)
      .map(absence => absence.absentTeacher);

    scheduleData.forEach(teacher => {
      const teacherName = teacher.καθηγητής;

      // ΚΡΙΣΙΜΟ: Αν ο καθηγητής απουσιάζει, τον παραλείπουμε εντελώς
      if (absentTeacherNames.includes(teacherName)) {
        console.log(`⚠️ Skipping ${teacherName} - teacher is absent`);
        return; // Skip this teacher entirely
      }

      const daySchedule = teacher.πρόγραμμα?.[dayToAnalyze];

      if (daySchedule) {
        const periodSubject = daySchedule[periodNum.toString()];

        if (periodSubject && periodSubject !== null) {
          // Teacher is busy
          busy.push({
            name: teacherName,
            subject: periodSubject
          });
        } else {
          // Έλεγχος για συνδιδασκαλία με κάποιον από τους απόντες
          let hasCoteachingWithAbsent = false;
          let coteachingWith = '';

          for (const absentTeacher of absentTeacherNames) {
            if (hasCoteaching(teacherName, absentTeacher, dayToAnalyze, periodNum.toString())) {
              hasCoteachingWithAbsent = true;
              coteachingWith = absentTeacher;
              break;
            }
          }

          if (hasCoteachingWithAbsent) {
            // Ο καθηγητής έχει συνδιδασκαλία με έναν από τους απόντες
            busy.push({
              name: teacherName,
              subject: `🔴 Συνδιδασκαλία με ${coteachingWith}`
            });
          } else {
            // Teacher is available
            available.push({
              name: teacherName,
              hours: calculateTeachingHours(teacher, dayToAnalyze)
            });
          }
        }
      } else {
        // No schedule for this day, consider available
        available.push({
          name: teacherName,
          hours: 0
        });
      }
    });

    // Sort available teachers by teaching hours (ascending)
    available.sort((a, b) => a.hours - b.hours);

    // Sort busy teachers alphabetically
    busy.sort((a, b) => a.name.localeCompare(b.name, 'el'));

    setAvailableTeachers(available);
    setBusyTeachers(busy);
  };

  const calculateTeachingHours = (teacher, day) => {
    const daySchedule = teacher.πρόγραμμα?.[day];
    if (!daySchedule) return 0;

    let hours = 0;
    for (let i = 1; i <= 8; i++) {
      if (daySchedule[i.toString()] && daySchedule[i.toString()] !== null) {
        hours++;
      }
    }
    return hours;
  };

  const getColorClass = (hours) => {
    if (hours === 0) return 'green';
    if (hours <= 2) return 'yellow';
    return 'red';
  };

  // Αναλύει τμήματα με αναπλήρωση και βρίσκει καθηγητές με τελευταία ώρα
  const analyzeLastPeriodSwaps = (dayToAnalyze) => {
    if (!scheduleData || !absenceData || absenceData.length === 0) {
      setLastPeriodSuggestions([]);
      return;
    }

    // Ορίζουμε την τελευταία περίοδο ανάλογα με την ημέρα
    // Δευτέρα, Τρίτη, Πέμπτη: 8 ώρες
    // Τετάρτη, Παρασκευή: 7 ώρες
    const lastPeriodOfDay = (dayToAnalyze === 'Τετάρτη' || dayToAnalyze === 'Παρασκευή') ? 7 : 8;

    const suggestions = [];

    // Για κάθε απόντα καθηγητή
    absenceData.forEach(absentTeacher => {
      if (!absentTeacher.periods) return;

      // Συλλέγουμε όλες τις περιόδους αναπλήρωσης ανά τμήμα
      const classReplacements = {};

      absentTeacher.periods.forEach(period => {
        // Εξάγουμε το τμήμα από το subject (π.χ. "ΓυμΑ11" από "ΓυμΑ11Μαθηματικά")
        const classMatch = period.subject?.match(/^([Γ][υ][μ][Α-Γ]\d{1,2}(?:\+[Α-Γ]\d{1,2})*)/);
        if (!classMatch) return;

        const className = classMatch[1];
        const periodNumber = parseInt(period.period);

        if (!classReplacements[className]) {
          classReplacements[className] = [];
        }
        classReplacements[className].push({
          period: periodNumber,
          subject: period.subject
        });
      });

      // Για κάθε τμήμα με αναπληρώσεις
      Object.entries(classReplacements).forEach(([className, replacements]) => {
        // Βρες ποιοι καθηγητές μπορούν να αντικαταστήσουν
        scheduleData.forEach(teacher => {
          const teacherName = teacher.καθηγητής;
          const daySchedule = teacher.πρόγραμμα?.[dayToAnalyze];

          if (!daySchedule) return;

          // ΒΗΜΑ 1: ΚΡΙΣΙΜΟ - Ο καθηγητής ΠΡΕΠΕΙ να έχει μάθημα στην τελευταία περίοδο της ημέρας (7η ή 8η)
          const lastPeriodSubject = daySchedule[lastPeriodOfDay.toString()];
          if (!lastPeriodSubject || lastPeriodSubject === null) {
            // Ο καθηγητής ΔΕΝ έχει μάθημα στην τελευταία περίοδο της ημέρας
            return;
          }

          // ΒΗΜΑ 2: Το μάθημα στην τελευταία περίοδο ΠΡΕΠΕΙ να είναι με το τμήμα που έχει αναπλήρωση
          if (!lastPeriodSubject.includes(className)) {
            // Το μάθημα στην τελευταία περίοδο ΔΕΝ είναι με το τμήμα που έχει αναπλήρωση
            return;
          }

          // ΒΗΜΑ 3: ΚΡΙΣΙΜΟΣ ΕΛΕΓΧΟΣ - Το τμήμα ΔΕΝ πρέπει να έχει ΑΛΛΟ μάθημα στην τελευταία περίοδο της ημέρας
          // με διαφορετικό καθηγητή (αλλιώς δεν μπορεί να φύγει νωρίτερα)
          let classHasOtherLastPeriod = false;
          scheduleData.forEach(otherTeacher => {
            if (otherTeacher.καθηγητής === teacherName) return; // Skip τον ίδιο καθηγητή

            const otherDaySchedule = otherTeacher.πρόγραμμα?.[dayToAnalyze];
            if (!otherDaySchedule) return;

            const otherLastPeriodSubject = otherDaySchedule[lastPeriodOfDay.toString()];
            if (otherLastPeriodSubject && otherLastPeriodSubject.includes(className)) {
              classHasOtherLastPeriod = true;
            }
          });

          if (classHasOtherLastPeriod) {
            // Το τμήμα έχει άλλο μάθημα στην τελευταία περίοδο με άλλο καθηγητή
            // Δεν μπορεί να φύγει νωρίτερα
            return;
          }

          // ΒΗΜΑ 4: Βρες σε ποιες από τις περιόδους αναπλήρωσης ο καθηγητής είναι διαθέσιμος
          // ΚΑΙ το τμήμα ΔΕΝ έχει άλλο μάθημα με άλλον καθηγητή
          const availableReplacementPeriods = replacements.filter(rep => {
            const subj = daySchedule[rep.period.toString()];
            if (subj && subj !== null) {
              return false; // Ο καθηγητής έχει μάθημα σε αυτή την περίοδο
            }

            // Έλεγχος: Το τμήμα ΔΕΝ πρέπει να έχει άλλο μάθημα με άλλον καθηγητή στην ίδια περίοδο
            let classHasOtherLesson = false;
            scheduleData.forEach(otherTeacher => {
              if (otherTeacher.καθηγητής === teacherName) return; // Skip τον ίδιο καθηγητή

              const otherDaySchedule = otherTeacher.πρόγραμμα?.[dayToAnalyze];
              if (!otherDaySchedule) return;

              const otherPeriodSubject = otherDaySchedule[rep.period.toString()];
              if (otherPeriodSubject && otherPeriodSubject.includes(className)) {
                classHasOtherLesson = true; // Το τμήμα έχει άλλο μάθημα με άλλον καθηγητή
              }
            });

            return !classHasOtherLesson; // Διαθέσιμος μόνο αν το τμήμα ΔΕΝ έχει άλλο μάθημα
          });

          // ΒΗΜΑ 5: Αν ο καθηγητής είναι διαθέσιμος σε κάποια από τις περιόδους αναπλήρωσης
          if (availableReplacementPeriods.length > 0) {
            suggestions.push({
              className,
              absentTeacher: absentTeacher.name,
              replacementPeriods: replacements.map(r => r.period),
              availableReplacementPeriods: availableReplacementPeriods.map(r => r.period),
              teacherWithLastPeriod: teacherName,
              lastPeriod: lastPeriodOfDay,
              lastPeriodSubject,
              benefit: availableReplacementPeriods.length // Πόσες περιόδους εφημερίας κερδίζουμε
            });
          }
        });
      });
    });

    setLastPeriodSuggestions(suggestions);
  };

  // Handler για το κλικ στο όνομα καθηγητή
  const handleTeacherClick = (teacherName) => {
    console.log('PeriodAnalysisWindow: Teacher clicked:', teacherName);
    if (onTeacherSelect) {
      onTeacherSelect(teacherName);
    }
  };

  const getCurrentDayName = () => {
    if (!selectedDate) return 'Δευτέρα';
    const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return dayNames[selectedDate.getDay()];
  };

const periods = ['1η', '2η', '3η', '4η', '5η', '6η', '7η', '8η'];

  return (
    <div className="period-analysis-window">
      <div className="window-header">
        <h3>Ανάλυση Περιόδων</h3>
      </div>

      <div className="analysis-controls">
        <div className="periods-selector">
          <div className="periods-label">Περίοδος:</div>
          <div className="periods-grid">
            {periods.map(period => (
              <button
                key={period}
                className={`period-btn ${selectedPeriod === period ? 'selected' : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="analysis-content">
        <div className="teachers-section">
          <h4>Διαθέσιμοι Καθηγητές ({availableTeachers.length})</h4>
          <div className="teachers-list">
            {availableTeachers.map((teacher, index) => (
              <div 
                key={index} 
                className={`teacher-item ${getColorClass(teacher.hours)} clickable`}
                onClick={() => handleTeacherClick(teacher.name)}
                title={`Κλικ για προβολή προγράμματος - ${teacher.hours} ώρες μαθήματα σήμερα`}
              >
                <span className="teacher-name">{teacher.name}</span>
                <span className="teacher-hours">{teacher.hours} ώρες</span>
              </div>
            ))}
          </div>
        </div>

        <div className="teachers-section">
          <h4>Απασχολημένοι Καθηγητές ({busyTeachers.length})</h4>
          <div className="teachers-list">
            {busyTeachers.map((teacher, index) => (
              <div 
                key={index} 
                className="teacher-item busy clickable"
                onClick={() => handleTeacherClick(teacher.name)}
                title={`Κλικ για προβολή προγράμματος - ${teacher.subject}`}
              >
                <span className="teacher-name">{teacher.name}</span>
                <span className="teacher-subject">{teacher.subject}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color green"></span>
          <span>0 ώρες</span>
        </div>
        <div className="legend-item">
          <span className="legend-color yellow"></span>
          <span>1-2 ώρες</span>
        </div>
        <div className="legend-item">
          <span className="legend-color red"></span>
          <span>3+ ώρες</span>
        </div>
      </div>

      {lastPeriodSuggestions.length > 0 && (
        <div className="swap-suggestions-section">
          <h4>🎯 Προτάσεις Εναλλαγής για Κέρδος Εφημερίας</h4>
          <p className="suggestions-description">
            Οι παρακάτω καθηγητές έχουν τελευταία ώρα με τμήματα που έχουν αναπλήρωση
            ΚΑΙ είναι διαθέσιμοι στις ώρες αναπλήρωσης. Αντικαταστήστε την τελευταία
            ώρα με μία από τις διαθέσιμες περιόδους αναπλήρωσης για να κερδίσετε εφημερία!
          </p>
          <div className="suggestions-list">
            {lastPeriodSuggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-card">
                <div className="suggestion-header">
                  <span className="suggestion-class">{suggestion.className}</span>
                  <span className="suggestion-badge benefit">
                    🎁 Κέρδος: {suggestion.benefit} {suggestion.benefit === 1 ? 'περίοδος' : 'περίοδοι'} εφημερίας
                  </span>
                </div>
                <div className="suggestion-details">
                  <div className="suggestion-row">
                    <strong>Καθηγητής που λείπει:</strong> {suggestion.absentTeacher}
                  </div>
                  <div className="suggestion-row">
                    <strong>Περίοδοι αναπλήρωσης:</strong> {suggestion.replacementPeriods.join('η, ')}η
                  </div>
                  <div className="suggestion-row highlight">
                    <strong>Καθηγητής με τελευταία ώρα:</strong>
                    <span
                      className="teacher-link"
                      onClick={() => handleTeacherClick(suggestion.teacherWithLastPeriod)}
                    >
                      {suggestion.teacherWithLastPeriod}
                    </span>
                  </div>
                  <div className="suggestion-row">
                    <strong>Τελευταία ώρα:</strong> {suggestion.lastPeriod}η - {suggestion.lastPeriodSubject}
                  </div>
                  <div className="suggestion-row available-periods">
                    <strong>Διαθέσιμος στις περιόδους:</strong>
                    <span className="periods-badge">
                      {suggestion.availableReplacementPeriods.join('η, ')}η ώρα
                    </span>
                  </div>
                  <div className="suggestion-action">
                    💡 <strong>Λύση:</strong> Αντικαταστήστε τον {suggestion.teacherWithLastPeriod.split(' ')[0]}
                    στην {suggestion.lastPeriod}η ώρα με {suggestion.availableReplacementPeriods.length === 1 ? 'την' : 'μία από τις'} {suggestion.availableReplacementPeriods.join('η/')}η ώρα.
                    Έτσι το τμήμα και ο καθηγητής φεύγουν νωρίτερα και κερδίζετε {suggestion.benefit === 1 ? '1 περίοδο' : `${suggestion.benefit} περιόδους`} εφημερίας!
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodAnalysisWindow;
