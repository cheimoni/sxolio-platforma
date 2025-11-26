import React from 'react';
import './SubstitutionConfirmModal.css';

const SubstitutionConfirmModal = ({ result, onConfirm, onClose }) => {
  if (!result) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePeriodClick = (period) => {
    onConfirm(period);
  };

  // Φιλτράρουμε τις διαθέσιμες περιόδους:
  // - Όχι 1η (δεν καλύπτεται)
  // - Όχι την τελευταία ώρα του καθηγητή (εκεί θα γίνει η αντικατάσταση)
  const availablePeriods = result.periodsWithClass
    ? result.periodsWithClass.filter(period => period !== 1 && period !== result.lastPeriod)
    : [];

  console.log('Result object:', result);
  console.log('Periods with class:', result.periodsWithClass);
  console.log('Available periods after filter:', availablePeriods);

  return (
    <div className="substitution-modal-backdrop" onClick={handleBackdropClick}>
      <div className="substitution-modal">
        <div className="substitution-modal-header">
          <h2>✅ Καθηγητής που μπορεί να βοηθήσει</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="substitution-modal-content">
          <div className="teacher-info">
            <div className="info-row">
              <span className="info-label">👤 Καθηγητής:</span>
              <span className="info-value">{result.teacherName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">🕐 Τελευταία ώρα:</span>
              <span className="info-value">{result.lastPeriod}η</span>
            </div>
            <div className="info-row">
              <span className="info-label">📚 Μάθημα τελευταίας ώρας:</span>
              <span className="info-value">{result.lastPeriodSubject}</span>
            </div>
          </div>

          <div className="suggestion-text">
            💡 Επιλέξτε σε ποια περίοδο θα γίνει η αντικατάσταση:
          </div>

          <div className="periods-selection">
            {availablePeriods.length > 0 ? (
              availablePeriods.map((period) => (
                <button
                  key={period}
                  className="period-option-btn"
                  onClick={() => handlePeriodClick(period)}
                >
                  <span className="period-number">{period}η ώρα</span>
                  <span className="period-arrow">→</span>
                </button>
              ))
            ) : (
              <div className="no-periods-message">
                ⚠️ Δεν υπάρχουν διαθέσιμες περίοδοι για αντικατάσταση.
                <br />
                Ο καθηγητής διδάσκει μόνο την 1η ή την τελευταία ώρα.
              </div>
            )}
          </div>
        </div>

        <div className="substitution-modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            ✕ Ακύρωση
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionConfirmModal;
