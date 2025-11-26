import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTickSound } from '../hooks/useTickSound';
import { fetchPublic } from '../utils/pathHelper';
import './SchoolClock.css';

const greekDayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];

const SchoolClock = ({ isHovered: externalHovered = false }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [schedule, setSchedule] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [lastPeriodChange, setLastPeriodChange] = useState(null);
  const [clockMode, setClockMode] = useState(() => {
    return localStorage.getItem('schoolClockMode') || 'digital';
  });
  const [soundsEnabled, setSoundsEnabled] = useState(true); // State to control if sounds should play
  const soundsEnabledRef = useRef(true); // Ref to track current value for use in intervals

  // Initialize sounds as enabled by default
  // User can toggle with the button

  // Χρησιμοποίησε ανεξάρτητο tick sound hook
  // Παίζει μόνο όταν δεν υπάρχει period (τελείωσε το σχολείο) ΚΑΙ τα sounds είναι enabled
  const shouldPlayTick = !currentPeriod && soundsEnabled;
  
  // Debug: log tick sound state
  useEffect(() => {
    console.log('SchoolClock: Tick sound state - currentPeriod:', currentPeriod, 'soundsEnabled:', soundsEnabled, 'shouldPlayTick:', shouldPlayTick);
  }, [currentPeriod, soundsEnabled, shouldPlayTick]);
  
  useTickSound(soundsEnabled, shouldPlayTick);

  // Audio element for playing voice announcements
  const audioRef = useRef(null);

  // Play "ding dong" chime (like airports)
  const playDingDong = useCallback(() => {
    return new Promise((resolve) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create a pleasant two-tone chime (E5 -> C5)
        const notes = [
          { freq: 659.25, time: 0, duration: 0.3 },    // E5 - "Ding"
          { freq: 523.25, time: 0.35, duration: 0.5 }  // C5 - "Dong"
        ];

        notes.forEach(note => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = note.freq;
          oscillator.type = 'sine';

          const startTime = audioContext.currentTime + note.time;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

          oscillator.start(startTime);
          oscillator.stop(startTime + note.duration);
        });

        // Resolve after the ding dong is complete
        setTimeout(resolve, 900);
      } catch (error) {
        console.error('Error playing ding dong:', error);
        resolve();
      }
    });
  }, []);

  // Play voice announcement for period/break change
  const playPeriodChangeSound = useCallback(async (soundType = 'period', periodOrBreakNumber = null) => {
    // Check if sounds are enabled before playing
    if (!soundsEnabledRef.current) {
      console.log('SchoolClock: Sounds disabled, skipping announcement');
      return;
    }

    try {
      // Map sound types to announcement file names
      let announcementFile = null;

      if (soundType === 'morning') {
        announcementFile = 'morning.mp3';
      } else if (soundType === 'period' && periodOrBreakNumber) {
        announcementFile = `period${periodOrBreakNumber}.mp3`;
      } else if (soundType === 'break' && periodOrBreakNumber) {
        announcementFile = `break${periodOrBreakNumber}.mp3`;
      } else if (soundType === 'end') {
        announcementFile = 'end.mp3';
      }

      if (announcementFile) {
        // First play the ding dong chime
        await playDingDong();

        // Then play the voice announcement
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.volume = 1.0; // Set volume to maximum
          audioRef.current.preload = 'auto';
        }

        // Stop any currently playing audio
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        // Set the new source and play
        audioRef.current.src = `/announcements/${announcementFile}`;
        audioRef.current.volume = 1.0; // Ensure volume is set
        
        // Try to play the audio
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`SchoolClock: Playing announcement: ${announcementFile}`);
            })
            .catch(err => {
              console.error('SchoolClock: Could not play announcement:', err, announcementFile);
              // Fallback to beep sound if mp3 fails
              if (soundsEnabledRef.current) {
                playBeepSound(soundType);
              }
            });
        }
      }
    } catch (error) {
      console.error('Error playing announcement:', error);
      // Fallback to beep sound
      playBeepSound(soundType);
    }
  }, [playDingDong]);

  // Tick sound is now handled by useTickSound hook independently

  // Fallback beep sound (original functionality)
  const playBeepSound = useCallback((soundType = 'period') => {
    // Check if sounds are enabled
    if (!soundsEnabledRef.current) {
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      if (soundType === 'break') {
        const melody = [
          { note: 523.25, duration: 0.3 },
          { note: 523.25, duration: 0.3 },
          { note: 783.99, duration: 0.3 },
          { note: 783.99, duration: 0.3 },
          { note: 880.00, duration: 0.3 },
          { note: 880.00, duration: 0.3 },
          { note: 783.99, duration: 0.6 },
          { note: 698.46, duration: 0.3 },
          { note: 698.46, duration: 0.3 },
          { note: 659.25, duration: 0.3 },
          { note: 659.25, duration: 0.3 },
          { note: 587.33, duration: 0.3 },
          { note: 587.33, duration: 0.3 },
          { note: 523.25, duration: 0.6 },
        ];

        melody.forEach((item, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = item.note;
          oscillator.type = 'sine';

          let startTime = audioContext.currentTime;
          for (let i = 0; i < index; i++) {
            startTime += melody[i].duration;
          }

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + item.duration);

          oscillator.start(startTime);
          oscillator.stop(startTime + item.duration);
        });
      } else if (soundType === 'period') {
        const melody = [392.00, 523.25, 659.25, 783.99];
        melody.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';

          const startTime = audioContext.currentTime + (index * 0.15);
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

          oscillator.start(startTime);
          oscillator.stop(startTime + 0.35);
        });
      } else if (soundType === 'end') {
        const melody = [783.99, 698.46, 659.25, 587.33, 523.25];
        melody.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';

          const startTime = audioContext.currentTime + (index * 0.13);
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

          oscillator.start(startTime);
          oscillator.stop(startTime + 0.3);
        });
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Sounds are always enabled - removed listeners that disable sounds
  // Sounds will always play regardless of modals or other components

  // Sounds are always enabled - no need to re-enable when modals close

  // Load schedule
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const response = await fetchPublic('/school-schedule.json');
        if (response.ok) {
          const data = await response.json();
          setSchedule(data);
        }
      } catch (error) {
        console.error('Error loading school schedule:', error);
      }
    };
    loadSchedule();
  }, []);

  const getScheduleForDate = useCallback((date) => {
    if (!schedule) return [];
    const dayName = greekDayNames[date.getDay()];
    if (schedule.daysWith8Periods?.includes(dayName)) {
      return schedule.schedule8 || [];
    }
    if (schedule.daysWith7Periods?.includes(dayName)) {
      return schedule.schedule7 || [];
    }
    // Default fallback
    return schedule.schedule7 || schedule.schedule8 || [];
  }, [schedule]);

  const getLastPeriodNumberForDate = useCallback((date) => {
    const daySchedule = getScheduleForDate(date);
    const lastPeriod = [...daySchedule].reverse().find(item => item.type === 'period');
    return lastPeriod?.period ?? null;
  }, [getScheduleForDate]);

  // Update time and check current period
  useEffect(() => {
    if (!schedule) return;

    const updateTime = () => {
      const now = new Date();
      // Get Athens time correctly using toLocaleString
      const athensTimeParts = now.toLocaleString('en-US', { 
        timeZone: 'Europe/Athens',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Parse the string correctly (format: "MM/DD/YYYY, HH:mm:ss")
      const [datePart, timePart] = athensTimeParts.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');
      
      // Create date in local timezone but with Athens time values
      const athensTime = new Date(year, month - 1, day, parseInt(hour), parseInt(minute), parseInt(second));
      setCurrentTime(athensTime);

      const currentHour = parseInt(hour, 10);
      const currentMinute = parseInt(minute);
      const currentSeconds = parseInt(second);
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const currentTimeTotalSeconds = currentTimeMinutes * 60 + currentSeconds;
      const todaysSchedule = getScheduleForDate(athensTime);
      const dayLastPeriod = getLastPeriodNumberForDate(athensTime);

      // Find current period or break
      let found = null;
      for (let i = 0; i < todaysSchedule.length; i++) {
        const item = todaysSchedule[i];
        const [startHour, startMin] = item.start.split(':').map(Number);
        const [endHour, endMin] = item.end.split(':').map(Number);
        
        const startTimeTotalSeconds = (startHour * 60 + startMin) * 60;
        const endTimeTotalSeconds = (endHour * 60 + endMin) * 60;

        // Check if current time is within this period/break
        // Include start time (>=) but exclude exact end time (<) to prefer next period when they meet
        // However, if we're exactly at the end time and it's the last period, include it
        if (currentTimeTotalSeconds >= startTimeTotalSeconds) {
          if (currentTimeTotalSeconds < endTimeTotalSeconds) {
            found = item;
            break;
          } else if (currentTimeTotalSeconds === endTimeTotalSeconds) {
            const nextItem = todaysSchedule[i + 1];
            if (nextItem) {
              const [nextStartHour, nextStartMin] = nextItem.start.split(':').map(Number);
              const nextStartTimeTotalSeconds = (nextStartHour * 60 + nextStartMin) * 60;
              if (nextStartTimeTotalSeconds === endTimeTotalSeconds) {
                found = nextItem;
                break;
              }
            }
            found = item;
            break;
          }
        }
      }

      // Check if period changed and play appropriate sound
      setLastPeriodChange(prev => {
        const currentPeriodKey = found ? `${found.type}-${found.period || found.name}` : 'none';
        if (currentPeriodKey !== prev && prev !== null) {
          const prevParts = prev.split('-');
          const prevPeriodNumber = parseInt(prevParts[1], 10);

          if (prevParts[0] === 'period') {
            if (soundsEnabled) {
              playPeriodChangeSound('end');
            }

            // Εμφάνισε τα fireworks όταν τελειώνει το σχολείο
            if (dayLastPeriod && prevPeriodNumber === dayLastPeriod && (!found || found.type !== 'period')) {
              setShowFireworks(true);
              // Κλείσε τα fireworks μετά από 12 δευτερόλεπτα
              setTimeout(() => {
                setShowFireworks(false);
              }, 12000);
            }

            setTimeout(() => {
              if (found && soundsEnabled) {
                if (found.type === 'break') {
                  // Extract break number from found object
                  const breakNumber = parseInt(found.period || found.name, 10) || 1;
                  playPeriodChangeSound('break', breakNumber);
                } else {
                  playPeriodChangeSound('period', found.period);
                }
              }
            }, 200);
          } else {
            if (found && soundsEnabled) {
              if (found.type === 'break') {
                // Extract break number from found object
                const breakNumber = parseInt(found.period || found.name, 10) || 1;
                playPeriodChangeSound('break', breakNumber);
              } else {
                playPeriodChangeSound('period', found.period);
              }
            }
          }
        }
        return currentPeriodKey;
      });

      setCurrentPeriod(found);

      // Tick sound is now handled by useTickSound hook independently
      // No need for manual tick control here

      // Calculate time remaining
      if (found) {
        const [endHour, endMin] = found.end.split(':').map(Number);
        const endTimeMinutes = endHour * 60 + endMin;
        const totalEndSeconds = endTimeMinutes * 60;
        const diffSeconds = totalEndSeconds - currentTimeTotalSeconds;
        
        if (diffSeconds > 0) {
          const minutesRemaining = Math.floor(diffSeconds / 60);
          const secondsRemaining = diffSeconds % 60;
          setTimeRemaining({ minutes: minutesRemaining, seconds: secondsRemaining });
        } else {
          setTimeRemaining({ minutes: 0, seconds: 0 });
        }
      } else {
        setTimeRemaining(null);
      }
    };

    // Use a more reliable interval that prevents accumulation
    let timeoutId = null;
    
    const scheduleNextUpdate = () => {
      timeoutId = setTimeout(() => {
        updateTime();
        scheduleNextUpdate();
      }, 1000);
    };
    
    updateTime();
    scheduleNextUpdate();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [schedule, playPeriodChangeSound, getScheduleForDate, getLastPeriodNumberForDate, soundsEnabled]);

  const formatTime = () => {
    const now = new Date();
    // Show seconds only after school has ended (when currentPeriod is null)
    const showSeconds = currentPeriod === null;

    return currentTime.toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit',
      ...(showSeconds && { second: '2-digit' }),
      timeZone: 'Europe/Athens'
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('el-GR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Athens'
    });
  };

  // Always show the clock, even if outside school hours
  const isOutsideHours = !currentPeriod;
  const [isPinned, setIsPinned] = useState(false);
  const [isInBottomRight, setIsInBottomRight] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showSoundTest, setShowSoundTest] = useState(false);

  // Track mouse position to show clock when in bottom right area
  useEffect(() => {
    const handleMouseMove = (e) => {
      const thresholdX = 60;
      const thresholdY = 60;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const isBottomRight = e.clientX >= windowWidth - thresholdX && e.clientY >= windowHeight - thresholdY;
      setIsInBottomRight(isBottomRight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Show clock if pinned OR if mouse is in bottom right
  const shouldShow = isPinned || isInBottomRight;
  
  // Debug: log when clock should be visible
  useEffect(() => {
    if (shouldShow) {
      console.log('SchoolClock: Clock is visible, sound button should be visible too');
    }
  }, [shouldShow]);

  return (
    <>
      {/* Fireworks overlay when school ends - shows with audio message */}
      {showFireworks && (
        <div className="fireworks-overlay">
          <div className="firework firework-1"></div>
          <div className="firework firework-2"></div>
          <div className="firework firework-3"></div>
          <div className="firework firework-4"></div>
          <div className="firework firework-5"></div>
          <div className="firework firework-6"></div>
          <div className="firework firework-7"></div>
          <div className="firework firework-8"></div>
          <div className="firework firework-9"></div>
          <div className="firework firework-10"></div>
          <div className="firework firework-11"></div>
          <div className="firework firework-12"></div>
          <div className="celebration-text">
            <div className="celebration-main">🎉 ΤΕΛΟΣ ΣΧΟΛΙΚΟΥ ΩΡΑΡΙΟΥ! 🎉</div>
            <div className="celebration-sub">Καλό απόγευμα!</div>
          </div>
        </div>
      )}

      {/* Main clock - shows on hover or when pinned */}
      <div
        className={`school-clock ${shouldShow ? 'show' : ''}`}
      >
      {/* Toggle switch for pinning clock */}
      <div className="clock-toggle">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="toggle-label">{isPinned ? 'Καρφιτσωμένο' : 'Κρυφό'}</span>
      </div>

      <div className="clock-mode-toggle">
        <button
          className={`mode-btn ${clockMode === 'digital' ? 'active' : ''}`}
          onClick={() => {
            setClockMode('digital');
            localStorage.setItem('schoolClockMode', 'digital');
          }}
        >
          ⏱️ Ψηφιακό
        </button>
        <button
          className={`mode-btn ${clockMode === 'analog' ? 'active' : ''}`}
          onClick={() => {
            setClockMode('analog');
            localStorage.setItem('schoolClockMode', 'analog');
          }}
        >
          🕒 Δείκτες
        </button>
      </div>

      {/* Sound toggle - ON/OFF button */}
      <div className="sound-toggle">
        <button
          className={`sound-btn ${soundsEnabled ? 'enabled' : 'disabled'}`}
          onClick={(e) => {
            e.stopPropagation();
            const newState = !soundsEnabled;
            setSoundsEnabled(newState);
            soundsEnabledRef.current = newState;
            console.log('SchoolClock: Sounds', newState ? 'enabled' : 'disabled');
          }}
          title={soundsEnabled ? 'Απενεργοποίηση ήχων' : 'Ενεργοποίηση ήχων'}
        >
          {soundsEnabled ? '🔊' : '🔇'} {soundsEnabled ? 'Ήχοι: ON' : 'Ήχοι: OFF'}
        </button>
        <button
          className="sound-test-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowSoundTest(!showSoundTest);
          }}
          title="Δοκιμή ήχων"
        >
          🎵 {showSoundTest ? 'Κλείσιμο' : 'Δοκιμή ήχων'}
        </button>
      </div>

      {/* Sound Test Panel */}
      {showSoundTest && (
        <div className="sound-test-panel" onClick={(e) => e.stopPropagation()}>
          <div className="sound-test-header">
            <h4>🎵 Δοκιμή ήχων</h4>
            <button className="close-test-btn" onClick={() => setShowSoundTest(false)}>✕</button>
          </div>
          <div className="sound-test-buttons">
            <div className="test-group">
              <h5>Γενικά</h5>
              <button onClick={() => playPeriodChangeSound('morning')}>🌅 Καλημέρα</button>
              <button onClick={() => playPeriodChangeSound('end')}>🏁 Τέλος</button>
            </div>
            <div className="test-group">
              <h5>Περίοδοι (1-8)</h5>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <button key={num} onClick={() => playPeriodChangeSound('period', num)}>
                  {num}η Περίοδος
                </button>
              ))}
            </div>
            <div className="test-group">
              <h5>Διαλείμματα (1-3)</h5>
              {[1, 2, 3].map(num => (
                <button key={num} onClick={() => playPeriodChangeSound('break', num)}>
                  {num}ο Διάλειμμα
                </button>
              ))}
            </div>
            <div className="test-group">
              <h5>Tick Sound (Ρολόι)</h5>
              <button onClick={async () => {
                // Test tick sound manually
                try {
                  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                  if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                  }
                  const oscillator = audioContext.createOscillator();
                  const gainNode = audioContext.createGain();
                  oscillator.connect(gainNode);
                  gainNode.connect(audioContext.destination);
                  oscillator.frequency.value = 800;
                  oscillator.type = 'square';
                  const startTime = audioContext.currentTime;
                  gainNode.gain.setValueAtTime(0.08, startTime);
                  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.02);
                  oscillator.start(startTime);
                  oscillator.stop(startTime + 0.02);
                  console.log('Test: Tick sound played');
                } catch (error) {
                  console.error('Test: Could not play tick sound:', error);
                }
              }}>
                ⏰ Δοκιμή Tick Sound
              </button>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', padding: '4px' }}>
                Σημείωση: Το tick παίζει αυτόματα μόνο μετά το τέλος του σχολείου (όταν δεν υπάρχει ενεργή περίοδος)
              </div>
            </div>
          </div>
        </div>
      )}

      {clockMode === 'digital' ? (
        <div className="clock-time">{formatTime()}</div>
      ) : (
        <div className="analog-clock">
          <div className="clock-face">
            <div className="center-dot"></div>
            {[...Array(12)].map((_, idx) => (
              <div
                key={idx}
                className={`hour-marker ${idx % 3 === 0 ? 'main' : ''}`}
                style={{ transform: `rotate(${idx * 30}deg)` }}
              >
                <span style={{ transform: `rotate(-${idx * 30}deg)` }}>
                  {idx === 0 ? 12 : idx}
                </span>
              </div>
            ))}
            {[...Array(60)].map((_, idx) => (
              <div
                key={`tick-${idx}`}
                className={`minute-tick ${idx % 5 === 0 ? 'main' : ''}`}
                style={{ transform: `rotate(${idx * 6}deg)` }}
              />
            ))}
            <div
              className="hand hand-hour"
              style={{
                transform: `rotate(${(currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5}deg)`
              }}
            />
            <div
              className="hand hand-minute"
              style={{ transform: `rotate(${currentTime.getMinutes() * 6}deg)` }}
            />
            <div
              className="hand hand-second"
              style={{ transform: `rotate(${currentTime.getSeconds() * 6}deg)` }}
            />
          </div>
        </div>
      )}

      <div className="clock-date">{formatDate()}</div>

      {isOutsideHours ? (
        <div className="clock-status outside">
          <span className="status-icon">🏫</span>
          <span className="status-text">Εκτός Ωραρίου</span>
        </div>
      ) : (
        <>
          <div className="clock-status">
            {currentPeriod.type === 'break' ? (
              <>
                <span className="status-icon">☕</span>
                <span className="status-text">{currentPeriod.name}</span>
              </>
            ) : (
              <>
                <span className="status-icon">📚</span>
                <span className="status-text">{currentPeriod.period}η Περίοδος</span>
              </>
            )}
          </div>
          {timeRemaining && (
            <div className="time-remaining">
              <span className="remaining-label">Απομένουν:</span>
              <span className="remaining-time">
                {String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
              </span>
            </div>
          )}
          <div className="period-time-range">
            {currentPeriod.start} - {currentPeriod.end}
          </div>
        </>
      )}
    </div>
    </>
  );
};

export default SchoolClock;

