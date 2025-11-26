// @FILE-INFO: GradingView.js | src/GradingView.js
// CLEAN VERSION with finalization button

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';

// --- UTILITY FUNCTION FOR GRADE CALCULATION ---
const calculateStudentFinalGrade = (student, currentGrades, numAssignments, numOrals) => {
    if (!student || !currentGrades) return '0.0';

    const examGrade = parseFloat(currentGrades[`${student.id}-exam-0`] || 0);
    let totalAP = 0;
    let countAP = 0;
    
    for (let i = 0; i < numAssignments; i++) {
        const gradeKey = `${student.id}-assignment-${i}`;
        if (currentGrades[gradeKey] != null && currentGrades[gradeKey] !== '') {
            totalAP += parseFloat(currentGrades[gradeKey]);
            countAP++;
        }
    }
    
    for (let i = 0; i < numOrals; i++) {
        const gradeKey = `${student.id}-oral-${i}`;
        if (currentGrades[gradeKey] != null && currentGrades[gradeKey] !== '') {
            totalAP += parseFloat(currentGrades[gradeKey]);
            countAP++;
        }
    }
    
    const avgAP = countAP > 0 ? totalAP / countAP : 0;
    const finalGrade100 = (avgAP * 0.6) + (examGrade * 0.4);
    return (finalGrade100 / 5).toFixed(1);
};

const GradingView = ({ 
    studentsByClass,
    config, 
    onLocalGradeUpdate,
    onGradeChange, 
    onMessageChange, 
    onUpdateCols,
    onBack, 
    messageTemplates 
}) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [grades, setGrades] = useState({});
    const { numAssignments, numOrals } = config;

    // Effect to fetch grades when a class is selected
    useEffect(() => {
        if (!selectedClass) {
            setGrades({});
            return;
        }

        const db = getDatabase();
        const gradesRef = ref(db, `grades/${selectedClass}`);
        
        const unsubscribe = onValue(gradesRef, (snapshot) => {
            setGrades(snapshot.val() || {});
        });

        return () => unsubscribe();
    }, [selectedClass]);

    // Memoize final grades calculation to avoid re-calculating on every render
    // Moved before the conditional return to respect the Rules of Hooks.
    const finalGrades = useMemo(() => {
        if (!selectedClass) return {};
        return Object.fromEntries(Object.values(studentsByClass[selectedClass] || {}).map(student => [student.id, calculateStudentFinalGrade(student, grades, numAssignments, numOrals)]));
    }, [grades, studentsByClass, selectedClass, numAssignments, numOrals]);

    const currentStudents = useMemo(() => {
        if (!selectedClass) return [];
        return Object.values(studentsByClass[selectedClass] || {});
    }, [studentsByClass, selectedClass]);

    const hasFinalizedGrades = useMemo(() => currentStudents.some(student => grades && grades[`${student.id}-finalized`]), [currentStudents, grades]);

    // Function to finalize grades for all students in current class
    const finalizeGrades = useCallback(() => {
        if (!window.confirm('Είστε σίγουροι ότι θέλετε να οριστικοποιήσετε τη βαθμολογία για όλους τους μαθητές του τμήματος;')) {
            return;
        }
        const currentGrades = grades || {};
        const currentStudents = Object.values(studentsByClass[selectedClass]);

        currentStudents.forEach(async (student) => {
            // Collect existing assignment grades
            const assignmentGrades = [];
            for (let i = 0; i < numAssignments; i++) {
                const gradeKey = `${student.id}-assignment-${i}`;
                if (currentGrades[gradeKey] != null) {
                    assignmentGrades.push(parseFloat(currentGrades[gradeKey]));
                }
            }

            // Collect existing oral grades
            const oralGrades = [];
            for (let i = 0; i < numOrals; i++) {
                const gradeKey = `${student.id}-oral-${i}`;
                if (currentGrades[gradeKey] != null) {
                    oralGrades.push(parseFloat(currentGrades[gradeKey]));
                }
            }

            // Get exam grade
            const examGrade = parseFloat(currentGrades[`${student.id}-exam-0`] || 0);

            // Calculate average of existing continuous assessment grades
            const allContinuousGrades = [...assignmentGrades, ...oralGrades];
            const avgContinuous = allContinuousGrades.length > 0 
                ? allContinuousGrades.reduce((sum, grade) => sum + grade, 0) / allContinuousGrades.length 
                : 0;

            // Calculate final grade: 60% continuous + 40% exam
            const finalGrade100 = (avgContinuous * 0.6) + (examGrade * 0.4);
            const finalGrade20 = finalGrade100 / 5;

            // Create finalized grade data
            const finalizedData = {
                continuousAverage: avgContinuous,
                examGrade: examGrade,
                finalGrade100: finalGrade100,
                finalGrade20: finalGrade20,
                timestamp: Date.now(),
                gradeCounts: {
                    assignments: assignmentGrades.length,
                    orals: oralGrades.length,
                    exam: examGrade > 0 ? 1 : 0
                }
            };

            // Save finalized grade to Firebase
            try {
                await onGradeChange(student, 'finalized', 0, JSON.stringify(finalizedData));
            } catch (error) {
                console.error(`Error finalizing grade for ${student.firstName}:`, error);
            }
        });

        setTimeout(() => {
            alert(`Η βαθμολογία οριστικοποιήθηκε για ${currentStudents.length} μαθητές!`);
        }, 1000);
    }, [selectedClass, studentsByClass, grades, numAssignments, numOrals, onGradeChange]);

    if (!selectedClass) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <h2>Επιλέξτε Τμήμα</h2>
                    {Object.keys(studentsByClass).map(className => (
                        <button 
                            key={className} 
                            onClick={() => setSelectedClass(className)}
                            style={{ margin: '10px', display: 'block', width: '100%' }}
                        >
                            📚 {className}
                        </button>
                    ))}
                    <button 
                        onClick={onBack} 
                        className="logout-btn" 
                        style={{
                            backgroundColor: '#6c757d', 
                            display: 'block', 
                            width: '100%', 
                            marginTop: '20px'
                        }}
                    >
                        ⬅️ Επιστροφή
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-view">
            {/* Header */}
            <div className="header">
                <div className="title-section">
                    <h2>🏛️ Βαθμολόγιο: <strong>{selectedClass}</strong></h2>
                </div>
                <div className="user-info">
                    {hasFinalizedGrades && (
                        <span style={{ 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            padding: '5px 10px', 
                            borderRadius: '15px', 
                            fontSize: '12px',
                            marginRight: '10px'
                        }}>
                            ✅ Οριστικοποιημένη Βαθμολογία
                        </span>
                    )}
                    <button 
                        onClick={finalizeGrades}
                        style={{
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginRight: '10px'
                        }}
                    >
                        📊 Οριστικοποίηση Βαθμολογίας
                    </button>
                    <button 
                        onClick={() => setSelectedClass(null)} 
                        className="logout-btn" 
                        style={{ backgroundColor: '#555' }}
                    >
                        ⬅️ Αλλαγή Τμήματος
                    </button>
                </div>
            </div>

            {/* Grades Table */}
            <div className="table-container">
                <table className="grade-table">
                    <thead>
                        <tr>
                            <th rowSpan="2">👤 ΜΑΘΗΤΗΣ</th>
                            <th colSpan={numAssignments}>
                                📝 ΑΣΚΗΣΕΙΣ 
                                <button 
                                    onClick={() => onUpdateCols('assignments', numAssignments + 1)}
                                    style={{ 
                                        marginLeft: '5px',
                                        padding: '2px 6px',
                                        fontSize: '12px',
                                        background: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    +
                                </button>
                                {numAssignments > 1 && (
                                    <button 
                                        onClick={() => onUpdateCols('assignments', numAssignments - 1)}
                                        style={{ 
                                            marginLeft: '2px',
                                            padding: '2px 6px',
                                            fontSize: '12px',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        −
                                    </button>
                                )}
                            </th>
                            <th colSpan={numOrals}>
                                🗣️ ΠΡΟΦΟΡΙΚΟΙ 
                                <button 
                                    onClick={() => onUpdateCols('orals', numOrals + 1)}
                                    style={{ 
                                        marginLeft: '5px',
                                        padding: '2px 6px',
                                        fontSize: '12px',
                                        background: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    +
                                </button>
                                {numOrals > 1 && (
                                    <button 
                                        onClick={() => onUpdateCols('orals', numOrals - 1)}
                                        style={{ 
                                            marginLeft: '2px',
                                            padding: '2px 6px',
                                            fontSize: '12px',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        −
                                    </button>
                                )}
                            </th>
                            <th rowSpan="2">📊 Δ</th>
                            <th rowSpan="2">🏆 Τ</th>
                            <th rowSpan="2">✅ Οριστ.</th>
                            <th rowSpan="2">💬 ΜΗΝΥΜΑ</th>
                        </tr>
                        <tr>
                            {[...Array(numAssignments)].map((_, i) => (
                                <th key={`a-h-${i}`}>Α{i + 1}</th>
                            ))}
                            {[...Array(numOrals)].map((_, i) => (
                                <th key={`p-h-${i}`}>Π{i + 1}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentStudents.map(student => (
                            <tr key={student.id}>
                                <td className="student-name">
                                    {`${student.lastName} ${student.firstName}`}
                                    <span className="student-code">{student.accessCode}</span>
                                </td>
                                
                                {/* Assignment Grades */}
                                {[...Array(numAssignments)].map((_, i) => (
                                    <td key={i}>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="grade-input"                                            value={grades?.[`${student.id}-assignment-${i}`] ?? ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                onLocalGradeUpdate(student, 'assignment', i, value);
                                                onGradeChange(student, 'assignment', i, value);
                                            }}
                                        />
                                    </td>
                                ))}
                                
                                {/* Oral Grades */}
                                {[...Array(numOrals)].map((_, i) => (
                                    <td key={i}>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="grade-input"                                            value={grades?.[`${student.id}-oral-${i}`] ?? ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                onLocalGradeUpdate(student, 'oral', i, value);
                                                onGradeChange(student, 'oral', i, value);
                                            }}
                                        />
                                    </td>
                                ))}
                                
                                {/* Exam Grade */}
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="grade-input exam"                                        value={grades?.[`${student.id}-exam-0`] ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            onLocalGradeUpdate(student, 'exam', 0, value);
                                            onGradeChange(student, 'exam', 0, value);
                                        }}
                                    />
                                </td>
                                
                                {/* Final Grade */}
                                <td className="final-grade">
                                    {finalGrades[student.id] || '0.0'}
                                </td>
                                
                                {/* Finalized Grade */}
                                <td style={{ textAlign: 'center' }}>
                                    {(() => {
                                        const finalizedKey = `${student.id}-finalized`;
                                        const finalizedData = grades?.[finalizedKey];
                                        
                                        if (finalizedData) {
                                            try {
                                                const data = typeof finalizedData === 'string' 
                                                    ? JSON.parse(finalizedData) 
                                                    : finalizedData;
                                                return (
                                                    <div style={{ 
                                                        backgroundColor: '#28a745', 
                                                        color: 'white', 
                                                        padding: '5px', 
                                                        borderRadius: '5px',
                                                        fontSize: '12px'
                                                    }}>
                                                        <div><strong>{data.finalGrade20?.toFixed(1) || '0.0'}/20</strong></div>
                                                        <div style={{ fontSize: '10px' }}>
                                                            ({data.finalGrade100?.toFixed(0) || '0'}/100)
                                                        </div>
                                                    </div>
                                                );
                                            } catch (e) {
                                                return <span style={{ color: '#dc3545' }}>Σφάλμα</span>;
                                            }
                                        }
                                        return <span style={{ color: '#6c757d' }}>—</span>;
                                    })()}
                                </td>
                                
                                {/* Message Selector */}
                                <td className="message-cell">
                                    <select
                                        value={student.message || "kanena"}
                                        onChange={(e) => onMessageChange(student, e.target.value)}
                                    >
                                        {messageTemplates.map(template => (
                                            <option key={template.id} value={template.id}>
                                                {template.text.length > 30 
                                                    ? template.text.substring(0, 30) + '...' 
                                                    : template.text
                                                }
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GradingView;