import React, { useState, useEffect, useRef } from 'react';
import './ReplacementBadgeWindow.css';
import { useDraggable } from '../hooks/useDraggable';
import { useWindowLayer } from '../hooks/useWindowLayer';
import { useResizable } from '../hooks/useResizable';

const ReplacementBadgeWindow = ({ replacement, period, absentTeacher, index, isExpanded, totalCount }) => {
  const [isActive, setIsActive] = useState(false);
  const [quotas, setQuotas] = useState({});

  // Window layering - unique ID for each badge
  const { zIndex, bringToFront } = useWindowLayer(`replacementBadge_${replacement}_${period}_${index}`);

  // Draggable functionality - position below availability card, arranged horizontally
  // Calculate position: start from availability card position, then add offset based on index
  const badgeWidth = 150; // Width + gap between badges
  const initialY = 430; // Below availability card

  // Calculate initialX dynamically based on isExpanded
  const initialX = React.useMemo(() => {
    const baseX = isExpanded ? 533 : 493;
    return baseX + (index * badgeWidth);
  }, [isExpanded, index]);

  const { position, setPosition, dragRef, handleMouseDown, resetPosition, isDragging } = useDraggable(initialX, initialY);

  // Resizable functionality - small compact window
  const initialWidth = 140;
  const initialHeight = 80;
  const { size, isResizing, positionDelta, resizeRef, handleResizeStart, resetSize, resetPositionDelta } = useResizable(initialWidth, initialHeight, 100, 60);

  // Track previous isResizing state to detect when resize ends
  const prevIsResizing = useRef(isResizing);
  useEffect(() => {
    // When resize ends, update position with accumulated delta
    if (prevIsResizing.current && !isResizing && (positionDelta.x !== 0 || positionDelta.y !== 0)) {
      setPosition({
        x: position.x + positionDelta.x,
        y: position.y + positionDelta.y
      });
      // Reset delta after updating position
      resetPositionDelta();
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
    const resetKey = `resetReplacementBadge_${replacement}_${period}_${index}`;
    window[resetKey] = () => {
      resetPosition();
      resetSize();
    };
    return () => {
      delete window[resetKey];
    };
  }, [resetPosition, resetSize, replacement, period, index]);

  // Load quotas from localStorage
  useEffect(() => {
    const loadQuotas = () => {
      try {
        const saved = localStorage.getItem('teacherQuotas');
        if (saved) {
          const parsed = JSON.parse(saved);
          setQuotas(parsed);
        }
      } catch (err) {
        console.error('Error loading quotas:', err);
      }
    };

    loadQuotas();
    const interval = setInterval(loadQuotas, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get quota info for this teacher
  const quota = quotas[replacement] || { remaining: 7, entries: [], weeklyMinimum: 0 };
  const total = quota.remaining + quota.entries.length;
  const used = quota.entries.length;
  const remaining = quota.remaining;

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

  return (
    <div
      ref={combinedRef}
      className={`replacement-badge-window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isActive ? 'active' : ''}`}
      style={{
        left: `${position.x + positionDelta.x}px`,
        top: `${position.y + positionDelta.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: zIndex
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {renderResizeHandles()}

      {/* Header */}
      <div className="badge-header draggable-header">
        <span className="badge-title">{replacement}</span>
      </div>

      {/* Content */}
      <div className="badge-content">
        <div className="badge-period">Περίοδος: {period}</div>
        <div className="badge-absent">Απόντας: {absentTeacher}</div>
        <div className={`badge-quota ${remaining === 0 ? 'zero' : ''}`}>
          Υπόλοιπο: {remaining}
        </div>
      </div>
    </div>
  );
};

export default ReplacementBadgeWindow;

