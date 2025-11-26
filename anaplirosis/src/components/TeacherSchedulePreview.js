// @FILE-INFO: TeacherSchedulePreview.js | /src/components/
// TYPE: Feature Component
// LAYER: UI (Resource)
// SIZE: 145 lines (complex)
// EXPORTS: TeacherSchedulePreview (default)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './TeacherSchedulePreview.css';
import { fetchPublic } from '../utils/pathHelper';

const SCHEDULE_FILE_PATH = 'data_se exel/ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΚΑΘΗΓΗΤΗ.html';

// Ημέρες της εβδομάδας στα ελληνικά
const daysOfWeek = [
  { value: 'monday', label: 'Δευτέρα', greek: 'ΔΕΥΤΕΡΑ' },
  { value: 'tuesday', label: 'Τρίτη', greek: 'ΤΡΙΤΗ' },
  { value: 'wednesday', label: 'Τετάρτη', greek: 'ΤΕΤΑΡΤΗ' },
  { value: 'thursday', label: 'Πέμπτη', greek: 'ΠΕΜΠΤΗ' },
  { value: 'friday', label: 'Παρασκευή', greek: 'ΠΑΡΑΣΚΕΥΗ' }
];

const buildPreviewHtml = (sectionHtml) => {
  const safeContent = sectionHtml || '<div style="padding:8px;color:#666">Δεν βρέθηκε πρόγραμμα για αυτό το όνομα.</div>';
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
  </style>
  </head><body>${safeContent}</body></html>`;
};

const findTeacherSection = (fullHtml, teacherName) => {
  if (!fullHtml || !teacherName) return '';
  const upperHtml = fullHtml.toUpperCase();
  const nameUpper = teacherName.toUpperCase();

  // Try to find the block starting at the teacher header
  const headerVariants = [
    `ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:  <B>${nameUpper}</B>`,
    `ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:  ${nameUpper}`,
    `ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:${nameUpper}`
  ];

  let startIdx = -1;
  for (const marker of headerVariants) {
    startIdx = upperHtml.indexOf(marker);
    if (startIdx !== -1) break;
  }
  if (startIdx === -1) return '';

  // Cut from a bit before the header to include surrounding styles
  const startCut = Math.max(0, startIdx - 200);

  // Heuristics for section end: before next teacher header or next print date or end
  const nextMarkers = [
    'ΣΤΟΙΧΕΙΑ ΚΑΘΗΓΗΤΗ:',
    'ΗΜΕΡΟΜΗΝΙΑ ΕΚΤΥΠΩΣΗΣ'
  ];
  let endIdx = upperHtml.length;
  for (const marker of nextMarkers) {
    const idx = upperHtml.indexOf(marker, startIdx + 5);
    if (idx !== -1) {
      endIdx = Math.min(endIdx, idx);
    }
  }

  const section = fullHtml.slice(startCut, endIdx);
  return section;
};

// Νέα συνάρτηση για εξαγωγή ημερήσιου προγράμματος
const extractDailySchedule = (fullSection, selectedDay) => {
  if (!fullSection || !selectedDay) return fullSection;

  const dayInfo = daysOfWeek.find(day => day.value === selectedDay);
  if (!dayInfo) return fullSection;

  // Βρίσκουμε την περιοχή με τον πίνακα του προγράμματος
  const tableStartRegex = /<table[^>]*>/i;
  const tableEndRegex = /<\/table>/i;
  
  const tableStart = fullSection.search(tableStartRegex);
  const tableEnd = fullSection.search(tableEndRegex);
  
  if (tableStart === -1 || tableEnd === -1) return fullSection;
  
  const beforeTable = fullSection.substring(0, tableStart);
  const tableContent = fullSection.substring(tableStart, tableEnd + 8);
  const afterTable = fullSection.substring(tableEnd + 8);
  
  // Εξάγουμε τη στήλη της επιλεγμένης ημέρας
  const dayColumnIndex = getDayColumnIndex(selectedDay);
  const filteredTable = filterTableByDay(tableContent, dayColumnIndex, dayInfo.label);
  
  return beforeTable + filteredTable + afterTable;
};

const getDayColumnIndex = (selectedDay) => {
  const dayMapping = {
    'monday': 1,
    'tuesday': 2, 
    'wednesday': 3,
    'thursday': 4,
    'friday': 5
  };
  return dayMapping[selectedDay] || 1;
};

const filterTableByDay = (tableHtml, columnIndex, dayLabel) => {
  // Δημιουργούμε έναν απλοποιημένο πίνακα με μόνο την επιλεγμένη ημέρα
  const rows = tableHtml.match(/<tr[^>]*>.*?<\/tr>/gis) || [];
  
  let filteredRows = [];
  
  rows.forEach((row, index) => {
    const cells = row.match(/<t[hd][^>]*>.*?<\/t[hd]>/gis) || [];
    
    if (index === 0) {
      // Header row - προσθέτουμε ώρα και την επιλεγμένη ημέρα
      filteredRows.push(`<tr><th>Ώρα</th><th>${dayLabel}</th></tr>`);
    } else {
      // Data rows
      if (cells.length > columnIndex) {
        const hourCell = cells[0] || '<td></td>';
        const dayCell = cells[columnIndex] || '<td></td>';
        
        // Καθαρίζουμε τα περιεχόμενα από HTML tags για έλεγχο
        const dayCellText = dayCell.replace(/<[^>]*>/g, '').trim();
        
        // Προσθέτουμε μόνο αν υπάρχει περιεχόμενο στη συγκεκριμένη ημέρα
        if (dayCellText && dayCellText !== '---' && dayCellText !== '***') {
          filteredRows.push(`<tr>${hourCell}${dayCell}</tr>`);
        }
      }
    }
  });
  
  if (filteredRows.length <= 1) {
    return `<table border="1"><tr><th colspan="2">Δεν υπάρχουν μαθήματα για ${dayLabel}</th></tr></table>`;
  }
  
  return `<table border="1">${filteredRows.join('')}</table>`;
};

const TeacherSchedulePreview = ({ teacherName, selectedDay = 'monday' }) => {
  const [fullHtml, setFullHtml] = useState('');
  const [docHtml, setDocHtml] = useState('');
  const iframeRef = useRef(null);

  // Load schedules file once
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchPublic(SCHEDULE_FILE_PATH);
        if (res.ok) {
          const text = await res.text();
          if (!cancelled) setFullHtml(text);
        }
      } catch (_) {}
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Build preview when teacher or day changes - χρησιμοποιούμε απευθείας το selectedDay prop
  useEffect(() => {
    const section = findTeacherSection(fullHtml, teacherName);
    const dailySection = extractDailySchedule(section, selectedDay);
    setDocHtml(buildPreviewHtml(dailySection));
  }, [fullHtml, teacherName, selectedDay]);

  // Resize iframe height to fit container
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      try {
        // no-op; scaling handled with CSS wrapper
      } catch (_) {}
    };
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [docHtml]);

  const selectedDayLabel = daysOfWeek.find(day => day.value === selectedDay)?.label;

  return null;
};

export default TeacherSchedulePreview;