import React, { useEffect, useState, useMemo } from 'react';
import './ThemeSelector.css';

const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

const colorSwatches = (() => {
  const colors = [];
  for (let hue = 0; hue < 360; hue += 12) {
    [75, 82, 88, 94].forEach((lightness) => {
      colors.push(hslToHex(hue, 45, lightness));
    });
  }
  return colors;
})();

const ThemeSelector = ({
  currentTheme,
  onThemeChange,
  customColor = '#a8d5ff',
  onCustomColorChange,
  customOpacity = 1.0,
  onCustomOpacityChange,
  borderColor = '#000000',
  onBorderColorChange,
  borderOpacity = 0.1,
  onBorderOpacityChange,
  borderWidth = '1px',
  onBorderWidthChange,
  borderStyle = 'solid',
  onBorderStyleChange
}) => {
  const [eyedropperSupported, setEyedropperSupported] = useState(false);
  const [isPanelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    setEyedropperSupported(typeof window !== 'undefined' && 'EyeDropper' in window);
  }, []);

  const transparencyLabel = useMemo(() => `${Math.round((customOpacity ?? 1.0) * 100)}%`, [customOpacity]);
  const borderOpacityLabel = useMemo(() => `${Math.round((borderOpacity || 0.1) * 100)}%`, [borderOpacity]);

  const handlePickColor = (value) => {
    if (onCustomColorChange) {
      onCustomColorChange(value);
    }
    if (onThemeChange) {
      onThemeChange('custom');
    }
  };

  const handleOpacityChange = (value) => {
    if (onCustomOpacityChange) {
      onCustomOpacityChange(value);
    }
    if (currentTheme !== 'custom' && onThemeChange) {
      onThemeChange('custom');
    }
  };

  const handleEyedropper = async () => {
    if (!eyedropperSupported) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      handlePickColor(result.sRGBHex);
    } catch (error) {
      console.warn('EyeDropper cancelled or unavailable', error);
    }
  };

  return (
    <div className="theme-selector-panel">
      <div
        className="theme-edge-zone"
        title="Θέματα"
        onMouseEnter={() => setPanelVisible(true)}
      />
      <div
        className={`theme-panel ${isPanelVisible ? 'visible' : ''}`}
        onMouseEnter={() => setPanelVisible(true)}
        onMouseLeave={() => setPanelVisible(false)}
      >
        <div className="theme-panel-header">
          <h4>🎨 Επιλογή Θέματος</h4>
          <p>Διάλεξε γρήγορα χρώματα ή φτιάξε το δικό σου στυλ</p>
        </div>

        <div className="theme-section">
          <div className="theme-section-title">Πίνακας χρωμάτων</div>
          <div className="swatch-grid">
            {colorSwatches.map((hex, idx) => (
              <button
                key={`swatch-${idx}`}
                className={`swatch-dot ${
                  currentTheme === 'custom' && customColor.toLowerCase() === hex.toLowerCase()
                    ? 'active'
                    : ''
                }`}
                style={{ backgroundColor: hex }}
                onClick={() => handlePickColor(hex)}
                title={hex}
              />
            ))}
          </div>
        </div>

        <div className="theme-section">
          <div className="theme-section-title">Προσαρμοσμένο χρώμα</div>
          <div className="custom-color-row">
            <label htmlFor="custom-color-input">Βάση:</label>
            <button
              className="eyedropper-btn"
              onClick={handleEyedropper}
              disabled={!eyedropperSupported}
              title={eyedropperSupported ? 'Επιλογή χρώματος από την οθόνη' : 'Ο browser δεν υποστηρίζει EyeDropper'}
            >
              🩸
            </button>
            <div className="color-picker-wrapper">
              <input
                id="custom-color-input"
                type="color"
                value={customColor || '#a8d5ff'}
                onChange={(e) => handlePickColor(e.target.value)}
              />
              <span className="color-hex">{(customColor || '#a8d5ff').toUpperCase()}</span>
            </div>
          </div>

            <div className="transparency-row">
              <div className="slider-label">
                Διαφάνεια: <strong>{transparencyLabel}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={customOpacity ?? 1.0}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
              />
            </div>

          <div className="custom-actions">
            <button
              className={`apply-custom-btn ${currentTheme === 'custom' ? 'active' : ''}`}
              onClick={() => onThemeChange && onThemeChange('custom')}
              title="Εφαρμογή"
            >
              <svg viewBox="0 0 24 24">
                <path d="M10 17l-4-4 1.4-1.4L10 14.2l6.6-6.6L18 9l-8 8z" />
              </svg>
            </button>
            <button
              className="reset-theme-btn"
              onClick={() => onThemeChange && onThemeChange('default')}
              title="Επαναφορά"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 5V1L7 6l5 5V7c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5H5c0 3.9 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
