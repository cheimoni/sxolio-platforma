import React from 'react';
import './ScheduleChangeModal.css';

const ScheduleChangeModal = ({ isOpen, onClose, onConfirm, changeData }) => {
  if (!isOpen || !changeData) return null;

  const { teacherA, teacherB, periodA, day } = changeData;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="schedule-change-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Αλλαγή Ωραρίου</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="change-time">
            <span>{day}</span>
            <span>•</span>
            <span>{periodA}η περίοδος</span>
          </div>

          <div className="teachers-exchange">
            <div className="teacher-card teacher-a">
              <div className="teacher-label">Καθηγητής A</div>
              <div className="teacher-name">{teacherA.name}</div>
              <div className="teacher-details">
                <span className="detail-item">{teacherA.className || '-'}</span>
                <span className="detail-separator">•</span>
                <span className="detail-item">{teacherA.subject}</span>
              </div>
            </div>

            <div className="exchange-arrow">⇄</div>

            <div className="teacher-card teacher-b">
              <div className="teacher-label">Καθηγητής B</div>
              <div className="teacher-name">{teacherB.name}</div>
              <div className="teacher-details">
                <span className="detail-item">{teacherB.className || '-'}</span>
                <span className="detail-separator">•</span>
                <span className="detail-item">{teacherB.subject}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Ακύρωση</button>
          <button className="btn-confirm" onClick={onConfirm}>Επιβεβαίωση</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleChangeModal;
