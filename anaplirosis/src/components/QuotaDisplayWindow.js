import React, { useState, useEffect } from 'react';
import ReplacementBadgeWindow from './ReplacementBadgeWindow';

const QuotaDisplayWindow = ({ isExpanded }) => {
  const [absenceData, setAbsenceData] = useState([]);

  // Listen for absenceData changes from MainWindow
  useEffect(() => {
    const handleAbsenceDataChange = (e) => {
      setAbsenceData(e.detail.absenceData || []);
    };

    window.addEventListener('absenceDataChanged', handleAbsenceDataChange);
    return () => {
      window.removeEventListener('absenceDataChanged', handleAbsenceDataChange);
    };
  }, []);

  // Get all replacement assignments from absenceData
  const replacementAssignments = React.useMemo(() => {
    const assignments = [];
    let index = 0;
    
    if (absenceData && Array.isArray(absenceData)) {
      absenceData.forEach(absence => {
        if (absence.periods && Array.isArray(absence.periods)) {
          absence.periods.forEach(period => {
            // Only show if replacement is assigned and not default placeholder
            if (period.replacement && 
                period.replacement.trim() && 
                period.replacement.trim() !== 'ΑΝΑΠΛΗΡΩΤΗΣ' &&
                period.replacement.trim() !== '///////////////') {
              assignments.push({
                replacement: period.replacement.trim(),
                period: period.period,
                absentTeacher: absence.absentTeacher || '',
                index: index++
              });
            }
          });
        }
      });
    }
    
    return assignments;
  }, [absenceData]);

  // Reset all badge positions
  useEffect(() => {
    window.resetAllReplacementBadges = () => {
      replacementAssignments.forEach((assignment, idx) => {
        const resetKey = `resetReplacementBadge_${assignment.replacement}_${assignment.period}_${assignment.index}`;
        if (window[resetKey]) {
          window[resetKey]();
        }
      });
    };
    return () => {
      delete window.resetAllReplacementBadges;
    };
  }, [replacementAssignments]);

  return (
    <>
      {replacementAssignments.map((assignment) => (
        <ReplacementBadgeWindow
          key={`${assignment.replacement}_${assignment.period}_${assignment.index}`}
          replacement={assignment.replacement}
          period={assignment.period}
          absentTeacher={assignment.absentTeacher}
          index={assignment.index}
          isExpanded={isExpanded}
          totalCount={replacementAssignments.length}
        />
      ))}
    </>
  );
};

export default QuotaDisplayWindow;

