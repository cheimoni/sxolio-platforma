// @FILE-INFO: CodeManager.js | src/components/CodeManager.js

import React, { useState, useEffect } from 'react';
import { ref, set } from 'firebase/database';

const CodeManager = ({ studentsByClass, onBack, database }) => {
    const [codes, setCodes] = useState({});
    const [feedback, setFeedback] = useState({});

    useEffect(() => {
        if (studentsByClass) {
            const initialCodes = {};
            for (const className in studentsByClass) {
                for (const studentId in studentsByClass[className]) {
                    initialCodes[studentId] = studentsByClass[className][studentId].accessCode || '';
                }
            }
            setCodes(initialCodes);
        }
    }, [studentsByClass]);

    const handleCodeChange = (studentId, value) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue.length <= 6) {
            setCodes(prev => ({ ...prev, [studentId]: numericValue }));
        }
    };

    const handleSaveCode = async (student) => {
        const studentId = student.id;
        const newCode = codes[studentId];

        if (!newCode || newCode.length !== 6) {
            alert('Ο κωδικός πρέπει να είναι ακριβώς 6 ψηφία.');
            return;
        }

        try {
            const studentCodeRef = ref(database, `students/${student.class}/${studentId}/accessCode`);
            await set(studentCodeRef, newCode);
            setFeedback(prev => ({ ...prev, [studentId]: '✅' }));
            setTimeout(() => setFeedback(prev => ({ ...prev, [studentId]: null })), 2000);
        } catch (error) {
            console.error("Error saving code:", error);
            alert('Σφάλμα κατά την αποθήκευση.');
            setFeedback(prev => ({ ...prev, [studentId]: '❌' }));
        }
    };

    // --==!!  Η ΔΙΟΡΘΩΣΗ ΕΙΝΑΙ ΕΔΩ !!==--
    // Add a check to ensure studentsByClass is loaded before rendering the main content
    if (!studentsByClass || Object.keys(studentsByClass).length === 0) {
        return (
            <div className="teacher-view">
                <div className="header">
                    <h2>Διαχείριση Κωδικών Μαθητών</h2>
                    <button onClick={onBack} className="logout-btn" style={{backgroundColor: '#555'}}>⬅️ ΕΠΙΣΤΡΟΦΗ</button>
                </div>
                <p style={{textAlign: 'center', padding: '20px'}}>Φόρτωση λίστας μαθητών...</p>
            </div>
        );
    }
    
    return (
        <div className="teacher-view">
            <div className="header">
                <h2>Διαχείριση Κωδικών Μαθητών</h2>
                <button onClick={onBack} className="logout-btn" style={{backgroundColor: '#555'}}>⬅️ ΕΠΙΣΤΡΟΦΗ</button>
            </div>

            <div className="code-manager-container">
                {Object.keys(studentsByClass).map(className => (
                    <div key={className} className="class-section">
                        <h3>Τμήμα: {className}</h3>
                        <table className="code-table">
                            <thead>
                                <tr>
                                    <th>Μαθητής</th>
                                    <th>6-ψήφιος Κωδικός Πρόσβασης</th>
                                    <th>Αποθήκευση</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(studentsByClass[className]).map(student => (
                                    <tr key={student.id}>
                                        <td>{`${student.lastName} ${student.firstName}`}</td>
                                        <td>
                                            <input
                                                type="text"
                                                value={codes[student.id] || ''}
                                                onChange={(e) => handleCodeChange(student.id, e.target.value)}
                                                className="code-input"
                                                placeholder="π.χ. 123456"
                                            />
                                        </td>
                                        <td>
                                            <button onClick={() => handleSaveCode(student)} className="save-code-btn">
                                                {feedback[student.id] || '💾'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CodeManager;