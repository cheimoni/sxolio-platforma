import React, { useEffect, useRef } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

const HEADER_HEIGHT = 30;

const getDefaultPosition = (width) => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }
  const centerX = Math.max(20, (window.innerWidth - width) / 2);
  const visibleY = window.innerHeight - HEADER_HEIGHT - 5;
  return { x: centerX, y: visibleY };
};

const SwapPanelWindow = ({
  swapSlotA,
  swapSlotB,
  setSwapSlotA,
  setSwapSlotB,
  dragOverSwapSlot,
  onDrop,
  onDragOver,
  onDragLeave,
  onSwapSlots,
  onConfirmSwap,
  onClearAllSlots,
  onClearSlotA,
  onClearSlotB,
  onClose
}) => {
  const initialWidth = 500;
  const initialHeight = 250;
  const defaultPosition = getDefaultPosition(initialWidth);

  const {
    position,
    setPosition,
    dragRef,
    handleMouseDown,
    resetPosition,
    isDragging
  } = useDraggable(defaultPosition.x, defaultPosition.y, 'swapPanel');

  const {
    size,
    isResizing,
    positionDelta,
    resizeRef,
    handleResizeStart,
    resetSize,
    resetPositionDelta
  } = useResizable(initialWidth, initialHeight, 400, 200, 'swapPanel');

  const prevIsResizing = useRef(isResizing);

  useEffect(() => {
    if (prevIsResizing.current && !isResizing && (positionDelta.x !== 0 || positionDelta.y !== 0)) {
      setPosition(prev => ({
        x: prev.x + positionDelta.x,
        y: prev.y + positionDelta.y
      }));
      resetPositionDelta();
    }
    prevIsResizing.current = isResizing;
  }, [isResizing, positionDelta.x, positionDelta.y, setPosition, resetPositionDelta]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWindowResize = () => {
      if (isDragging || isResizing) {
        setPosition(prev => ({
          x: Math.min(prev.x, window.innerWidth - size.width - 20),
          y: Math.min(prev.y, window.innerHeight - size.height - 20)
        }));
        return;
      }
      const updated = getDefaultPosition(size.width);
      setPosition(updated);
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [size.width, size.height, isDragging, isResizing, setPosition]);

  const combinedRef = (node) => {
    dragRef.current = node;
    resizeRef.current = node;
  };

  const handleClose = (e) => {
    e.stopPropagation();
    resetPosition();
    resetSize();
    resetPositionDelta();
    onClose();
  };

  return (
    <div
      ref={combinedRef}
      className={`swap-panel-dropup ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        left: `${position.x + positionDelta.x}px`,
        top: `${position.y + positionDelta.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
    >
      {/* Resize Handles */}
      <div className="resize-handle resize-handle-n" onMouseDown={(e) => { e.stopPropagation(); handleResizeStart('n', e); }}></div>
      <div className="resize-handle resize-handle-s" onMouseDown={(e) => { e.stopPropagation(); handleResizeStart('s', e); }}></div>
      <div className="resize-handle resize-handle-e" onMouseDown={(e) => { e.stopPropagation(); handleResizeStart('e', e); }}></div>
      <div className="resize-handle resize-handle-w" onMouseDown={(e) => { e.stopPropagation(); handleResizeStart('w', e); }}></div>
      <div className="resize-handle resize-handle-ne" onMouseDown={(e) => { e.stopPropagation(); handleResizeStart('ne', e); }}></div>
      <div className="resize-handle resize-handle-nw" onMouseDown={(e) => { e.stopPropagation(); handleResizeStart('nw', e); }}></div>
      <div className="resize-handle resize-handle-se" onMouseDown={(e) => { e.stopPropagation(); handleResizeStart('se', e); }}></div>
      <div className="resize-handle resize-handle-sw" onMouseDown={(e) => { e.stopPropagation(); handleResizeStart('sw', e); }}></div>

      <div
        className="swap-panel-tab draggable-header"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e);
        }}
      >
        <span className="tab-text">Αλλαγές Ωραρίου</span>
        {(swapSlotA || swapSlotB) && (
          <span className="tab-badge">{(swapSlotA ? 1 : 0) + (swapSlotB ? 1 : 0)}</span>
        )}
        <button
          className="swap-panel-close-btn"
          onClick={handleClose}
          title="Κλείσιμο"
        >
          ✕
        </button>
      </div>

      <div className="swap-panel-content">
        <div className="swap-manager">
          <div className="swap-slots-container">
            <div
              className={`swap-slot ${swapSlotA ? 'filled' : 'empty'} ${dragOverSwapSlot === 'A' ? 'drag-over' : ''}`}
              onDrop={(e) => onDrop(e, 'A')}
              onDragOver={(e) => onDragOver(e, 'A')}
              onDragLeave={onDragLeave}
            >
              <div className="swap-slot-header">
                <span className="slot-label">Θέση A</span>
                {swapSlotA && (
                  <button
                    className="clear-slot-btn"
                    onClick={onClearSlotA}
                    title="Καθαρισμός θέσης A"
                  >
                    ✕
                  </button>
                )}
              </div>
              {swapSlotA ? (
                <div className="slot-content-compact">
                  <input
                    type="text"
                    value={swapSlotA.teacherName}
                    onChange={(e) => setSwapSlotA({ ...swapSlotA, teacherName: e.target.value })}
                    className="teacher-input"
                    placeholder="Όνομα καθηγητή"
                  />
                  <div className="slot-info-editable">
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={swapSlotA.period}
                      onChange={(e) => setSwapSlotA({ ...swapSlotA, period: e.target.value })}
                      className="period-input"
                    />
                    <span className="period-label">η</span>
                  </div>
                  <div className="slot-subject-full">{swapSlotA.subject || '-'}</div>
                </div>
              ) : (
                <div className="slot-placeholder">Σύρετε περίοδο εδώ</div>
              )}
            </div>

            <button
              className="swap-btn"
              onClick={onSwapSlots}
              disabled={!swapSlotA || !swapSlotB}
              title="Εναλλαγή θέσεων A και B"
            >
              ⇅
            </button>

            <div
              className={`swap-slot ${swapSlotB ? 'filled' : 'empty'} ${dragOverSwapSlot === 'B' ? 'drag-over' : ''}`}
              onDrop={(e) => onDrop(e, 'B')}
              onDragOver={(e) => onDragOver(e, 'B')}
              onDragLeave={onDragLeave}
            >
              <div className="swap-slot-header">
                <span className="slot-label">Θέση B</span>
                {swapSlotB && (
                  <button
                    className="clear-slot-btn"
                    onClick={onClearSlotB}
                    title="Καθαρισμός θέσης B"
                  >
                    ✕
                  </button>
                )}
              </div>
              {swapSlotB ? (
                <div className="slot-content-compact">
                  <input
                    type="text"
                    value={swapSlotB.teacherName}
                    onChange={(e) => setSwapSlotB({ ...swapSlotB, teacherName: e.target.value })}
                    className="teacher-input"
                    placeholder="Όνομα καθηγητή"
                  />
                  <div className="slot-info-editable">
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={swapSlotB.period}
                      onChange={(e) => setSwapSlotB({ ...swapSlotB, period: e.target.value })}
                      className="period-input"
                    />
                    <span className="period-label">η</span>
                  </div>
                  <div className="slot-subject-full">{swapSlotB.subject || '-'}</div>
                </div>
              ) : (
                <div className="slot-placeholder">Σύρετε περίοδο εδώ</div>
              )}
            </div>
          </div>

          <div className="swap-actions">
            <button
              className="confirm-swap-btn"
              onClick={onConfirmSwap}
              disabled={!swapSlotA || !swapSlotB}
            >
              ✓ Επιβεβαίωση Αλλαγής
            </button>
            <button
              className="clear-all-btn"
              onClick={onClearAllSlots}
              disabled={!swapSlotA && !swapSlotB}
            >
              Καθαρισμός Όλων
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SwapPanelWindow);

