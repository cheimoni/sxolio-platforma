import React, { useState, useMemo } from 'react';
import './TextSettings.css';

const TextSettings = ({
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
  textColor,
  onTextColorChange,
  onResetTextSettings,
  windowBgColor = '#FFFFFF',
  onWindowBgColorChange,
  windowBgOpacity = 0.96,
  onWindowBgOpacityChange,
  borderColor = '#000000',
  onBorderColorChange,
  borderOpacity = 0.1,
  onBorderOpacityChange,
  borderWidth = '1px',
  onBorderWidthChange,
  borderStyle = 'solid',
  onBorderStyleChange,
  videoTimeout = 8000,
  onVideoTimeoutChange
}) => {
  const [isPanelVisible, setPanelVisible] = useState(false);
  const windowBgOpacityLabel = useMemo(() => `${Math.round((windowBgOpacity ?? 0.96) * 100)}%`, [windowBgOpacity]);
  const borderOpacityLabel = useMemo(() => `${Math.round((borderOpacity ?? 0.25) * 100)}%`, [borderOpacity]);

  return (
    <div className="text-settings-panel">
      <div
        className="text-edge-zone"
        title="Ρυθμίσεις Κειμένου"
        onMouseEnter={() => setPanelVisible(true)}
      />
      <div
        className={`text-panel ${isPanelVisible ? 'visible' : ''}`}
        onMouseEnter={() => setPanelVisible(true)}
        onMouseLeave={() => setPanelVisible(false)}
      >
        <div className="text-panel-header">
          <h4>📝 Ρυθμίσεις Κειμένου</h4>
        </div>

        <div className="text-section">
          <div className="text-section-title">Μέγεθος Γραμμάτων</div>
          <div className="text-setting-row">
            <input
              id="font-size-input"
              type="range"
              min="4"
              max="20"
              step="1"
              value={fontSize}
              onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
            />
            <span className="text-value">{fontSize}px</span>
          </div>
        </div>

        <div className="text-section">
          <div className="text-section-title">Γραμματοσειρά</div>
          <select
            id="font-family-select"
            className="font-family-select"
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
          >
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
            <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
          </select>
        </div>

        <div className="text-section">
          <div className="text-section-title">Χρώμα Κειμένου</div>
          <div className="text-color-row">
            <div className="color-picker-wrapper">
              <input
                id="text-color-input"
                type="color"
                value={textColor}
                onChange={(e) => onTextColorChange(e.target.value)}
              />
              <span className="color-hex">{textColor.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="text-section">
          <div className="text-section-title">Φόντο Παραθύρων</div>
          <div className="text-color-row">
            <label>Χρώμα:</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={windowBgColor || '#FFFFFF'}
                onChange={(e) => onWindowBgColorChange && onWindowBgColorChange(e.target.value)}
              />
              <span className="color-hex">{(windowBgColor || '#FFFFFF').toUpperCase()}</span>
            </div>
          </div>
          <div className="text-setting-row">
            <div className="slider-label">
              Διαφάνεια: <strong>{windowBgOpacityLabel}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={windowBgOpacity ?? 0.96}
              onChange={(e) => onWindowBgOpacityChange && onWindowBgOpacityChange(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="text-section">
          <div className="text-section-title">Περιγράμματα</div>
          <div className="text-color-row">
            <label>Χρώμα:</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={borderColor || '#667EEA'}
                onChange={(e) => onBorderColorChange && onBorderColorChange(e.target.value)}
              />
              <span className="color-hex">{(borderColor || '#667EEA').toUpperCase()}</span>
            </div>
          </div>
          <div className="text-setting-row">
            <div className="slider-label">
              Διαφάνεια: <strong>{borderOpacityLabel}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={borderOpacity ?? 0.25}
              onChange={(e) => onBorderOpacityChange && onBorderOpacityChange(parseFloat(e.target.value))}
            />
          </div>
          <div className="border-control-row">
            <label className="border-label">Πάχος:</label>
            <select
              className="border-select"
              value={borderWidth || '2px'}
              onChange={(e) => onBorderWidthChange && onBorderWidthChange(e.target.value)}
              onBlur={(e) => e.target.blur()}
            >
              <option value="1px">1px</option>
              <option value="2px">2px</option>
              <option value="3px">3px</option>
              <option value="4px">4px</option>
              <option value="5px">5px</option>
              <option value="6px">6px</option>
              <option value="7px">7px</option>
            </select>
          </div>
          <div className="border-control-row">
            <label className="border-label">Στυλ:</label>
            <select
              className="border-select"
              value={borderStyle || 'solid'}
              onChange={(e) => {
                const newStyle = e.target.value;
                if (onBorderStyleChange) {
                  onBorderStyleChange(newStyle);
                }
                if (newStyle === 'inset' && onBorderWidthChange) {
                  onBorderWidthChange('0.5px');
                }
              }}
              onBlur={(e) => e.target.blur()}
            >
              <option value="solid">1 Γραμμή</option>
              <option value="double">2 Γραμμές</option>
              <option value="inset">Πολύ Λεπτή</option>
              <option value="ridge">3 Γραμμές</option>
              <option value="dashed">Διακεκομμένο</option>
              <option value="dotted">Τελειωμένο</option>
            </select>
          </div>
        </div>

        <button
          className="reset-text-btn"
          onClick={() => {
            if (onResetTextSettings) {
              onResetTextSettings();
            }
            if (onWindowBgColorChange) onWindowBgColorChange('#F8F9FA');
            if (onWindowBgOpacityChange) onWindowBgOpacityChange(0.96);
            if (onBorderColorChange) onBorderColorChange('#667EEA');
            if (onBorderOpacityChange) onBorderOpacityChange(0.25);
            if (onBorderWidthChange) onBorderWidthChange('2px');
            if (onBorderStyleChange) onBorderStyleChange('solid');
            if (onVideoTimeoutChange) onVideoTimeoutChange(8000);
          }}
          title="Επαναφορά όλων των ρυθμίσεων"
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5H5c0 3.9 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7z" />
          </svg>
          Επαναφορά Όλων
        </button>
      </div>
    </div>
  );
};

export default TextSettings;
