import React, { useState, useEffect } from 'react';
import { getWeeklyReplacements, getTopReplacersOfWeek, getTotalReplacementsByTeacher, getTeacherReplacementDetails } from '../firebase/tracking';
import './ReplacementStats.css';

const ReplacementStats = ({ selectedDate, onClose }) => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [topReplacers, setTopReplacers] = useState([]);
  const [totalStats, setTotalStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly'); // 'weekly', 'total', or 'details'
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherDetails, setTeacherDetails] = useState([]);

  // Κρύψε τα 3 draggable παράθυρα όταν ανοίγει το παράθυρο Στατιστικών
  useEffect(() => {
    const teacherScheduleCard = document.querySelector('.schedule-card');
    const newWindow = document.querySelector('.new-window');
    const availabilityCard = document.querySelector('.availability-card');

    const previousStates = {
      teacherSchedule: teacherScheduleCard ? teacherScheduleCard.style.display : '',
      newWindow: newWindow ? newWindow.style.display : '',
      availability: availabilityCard ? availabilityCard.style.display : ''
    };

    if (teacherScheduleCard) teacherScheduleCard.style.display = 'none';
    if (newWindow) newWindow.style.display = 'none';
    if (availabilityCard) availabilityCard.style.display = 'none';

    return () => {
      if (teacherScheduleCard) teacherScheduleCard.style.display = previousStates.teacherSchedule || 'block';
      if (newWindow) newWindow.style.display = previousStates.newWindow || 'block';
      if (availabilityCard) availabilityCard.style.display = previousStates.availability || 'block';
    };
  }, []);

  useEffect(() => {
    loadStats();
  }, [selectedDate]);

  const loadStats = async () => {
    setLoading(true);

    // Φόρτωση εβδομαδιαίων
    const weeklyResult = await getWeeklyReplacements(selectedDate);
    if (weeklyResult.success && weeklyResult.data) {
      setWeeklyData(weeklyResult.data);
    }

    // Φόρτωση top replacers
    const topResult = await getTopReplacersOfWeek(selectedDate);
    if (topResult.success) {
      setTopReplacers(topResult.data);
    }

    // Φόρτωση συνολικών
    const totalResult = await getTotalReplacementsByTeacher();
    if (totalResult.success) {
      setTotalStats(totalResult.data);
    }

    setLoading(false);
  };

  const loadTeacherDetails = async (teacherName) => {
    setLoading(true);
    setSelectedTeacher(teacherName);
    const result = await getTeacherReplacementDetails(teacherName);
    if (result.success) {
      setTeacherDetails(result.data);
    }
    setView('details');
    setLoading(false);
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="stats-modal-overlay" onClick={onClose}>
        <div className="stats-modal" onClick={e => e.stopPropagation()}>
          <div className="stats-header">
            <h2>📊 Στατιστικά Αναπληρώσεων</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="stats-loading">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-modal-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={e => e.stopPropagation()}>
        <div className="stats-header">
          <h2>📊 Στατιστικά Αναπληρώσεων</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* View Selector */}
        <div className="view-selector">
          <button
            className={view === 'weekly' ? 'active' : ''}
            onClick={() => setView('weekly')}
          >
            📅 Εβδομάδα {weeklyData?.weekNumber}
          </button>
          <button
            className={view === 'total' ? 'active' : ''}
            onClick={() => setView('total')}
          >
            📈 Σύνολο Έτους
          </button>
          {view === 'details' && (
            <button
              className="active"
              onClick={() => setView('total')}
            >
              ← Πίσω
            </button>
          )}
        </div>

        <div className="stats-content">
          {view === 'weekly' ? (
            <>
              {/* Εβδομαδιαίο Σύνολο */}
              <div className="total-badge">
                Σύνολο Εβδομάδας: <strong>{weeklyData?.totalReplacements || 0}</strong> αναπληρώσεις
              </div>

              {/* Top 10 της Εβδομάδας */}
              <h3>🏆 Top Αναπληρωτές Εβδομάδας</h3>
              {topReplacers.length > 0 ? (
                <div className="stats-list">
                  {topReplacers.slice(0, 10).map((teacher, index) => (
                    <div key={teacher.name} className={`stat-item rank-${index + 1}`}>
                      <div className="stat-rank">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>
                      <div className="stat-name">{teacher.name}</div>
                      <div className="stat-count">{teacher.count} αναπλ.</div>
                      <div className="stat-days">
                        {Object.keys(teacher.days).length} ημέρες
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">Δεν υπάρχουν δεδομένα για αυτήν την εβδομάδα</div>
              )}
            </>
          ) : (
            <>
              {/* Σύνολο Έτους */}
              <h3>📊 Σύνολο Αναπληρώσεων (Όλο το Έτος)</h3>
              {totalStats.length > 0 ? (
                <div className="stats-list">
                  {totalStats.map((teacher, index) => (
                    <div key={teacher.name} className={`stat-item rank-${index + 1}`}>
                      <div className="stat-rank">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>
                      <div className="stat-name">{teacher.name}</div>
                      <div className="stat-count total">{teacher.count} συνολικές</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">Δεν υπάρχουν δεδομένα</div>
              )}

              <div className="total-summary">
                Σύνολο όλων: <strong>
                  {totalStats.reduce((sum, t) => sum + t.count, 0)}
                </strong> αναπληρώσεις
              </div>
            </>
          )}
        </div>

        <div className="stats-footer">
          <button className="refresh-btn" onClick={loadStats}>
            🔄 Ανανέωση
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplacementStats;

