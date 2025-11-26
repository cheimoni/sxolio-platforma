import React, { useState } from 'react';

/**
 * Utility component για capture των τρεχουσών θέσεων παραθύρων
 * Διαβάζει από localStorage και εμφανίζει τον κώδικα για copy-paste
 */
const PositionCapture = () => {
  const [capturedPositions, setCapturedPositions] = useState(null);

  const capturePositions = () => {
    const positions = {
      mainWindow: {
        position: JSON.parse(localStorage.getItem('windowPosition_mainWindow') || '{"x": 892, "y": -1}'),
        size: JSON.parse(localStorage.getItem('windowSize_mainWindow') || '{}')
      },
      teacherSchedule: {
        position: JSON.parse(localStorage.getItem('windowPosition_teacherSchedule') || '{"x": 216, "y": -1}'),
        size: JSON.parse(localStorage.getItem('windowSize_teacherSchedule') || '{}')
      },
      teacherAvailability: {
        position: JSON.parse(localStorage.getItem('windowPosition_teacherAvailability') || '{"x": 542, "y": -2}'),
        size: JSON.parse(localStorage.getItem('windowSize_teacherAvailability') || '{}')
      },
      newWindow: {
        position: JSON.parse(localStorage.getItem('windowPosition_newWindow') || '{"x": 225, "y": 421}'),
        size: JSON.parse(localStorage.getItem('windowSize_newWindow') || '{}')
      },
      smartScheduler: {
        position: JSON.parse(localStorage.getItem('windowPosition_smartScheduler') || '{"x": 542, "y": 428}'),
        size: JSON.parse(localStorage.getItem('windowSize_smartScheduler') || '{}')
      }
    };

    setCapturedPositions(positions);
    console.log('📸 Captured positions:', positions);
  };

  const generateCode = () => {
    if (!capturedPositions) return '';

    return `// Default Positions - Captured at ${new Date().toLocaleString('el-GR')}

// MainWindow
const initialX = ${capturedPositions.mainWindow.position.x};
const initialY = ${capturedPositions.mainWindow.position.y};

// TeacherScheduleCard
const initialX = ${capturedPositions.teacherSchedule.position.x};
const initialY = ${capturedPositions.teacherSchedule.position.y};

// TeacherAvailabilityCard
const initialX = ${capturedPositions.teacherAvailability.position.x};
const initialY = ${capturedPositions.teacherAvailability.position.y};

// NewWindow
const initialX = ${capturedPositions.newWindow.position.x};
const initialY = ${capturedPositions.newWindow.position.y};

// SmartScheduler
const initialX = ${capturedPositions.smartScheduler.position.x};
const initialY = ${capturedPositions.smartScheduler.position.y};
`;
  };

  const copyToClipboard = () => {
    const code = generateCode();
    navigator.clipboard.writeText(code);
    alert('✅ Κώδικας αντιγράφηκε στο clipboard!');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#fff',
      padding: '20px',
      borderRadius: '10px',
      zIndex: 999999,
      maxWidth: '500px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>📸 Position Capture Tool</h3>

      <button
        onClick={capturePositions}
        style={{
          background: '#4CAF50',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}
      >
        📷 Capture Τρέχουσες Θέσεις
      </button>

      {capturedPositions && (
        <>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '10px',
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            <h4>Τρέχουσες Θέσεις:</h4>
            {Object.entries(capturedPositions).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '10px' }}>
                <strong>{key}:</strong><br />
                x: {value.position.x}, y: {value.position.y}
                {value.size.width && ` | size: ${value.size.width}x${value.size.height}`}
              </div>
            ))}
          </div>

          <button
            onClick={copyToClipboard}
            style={{
              background: '#2196F3',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            📋 Αντιγραφή Κώδικα
          </button>
        </>
      )}
    </div>
  );
};

export default PositionCapture;
