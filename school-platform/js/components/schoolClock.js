/* ========================================
   SCHOOL CLOCK - Σχολικό Ρολόι
   ======================================== */

const SchoolClock = {
  // Schedule based on the school timetable
  schedules: {
    // Monday (1) and Thursday (4) - 8 periods
    long: [
      { type: 'period', num: 1, start: '07:30', end: '08:10', label: '1η Περίοδος' },
      { type: 'period', num: 2, start: '08:10', end: '08:50', label: '2η Περίοδος' },
      { type: 'break', num: 1, start: '08:50', end: '09:10', label: '1ο Διάλειμμα', duration: 20 },
      { type: 'period', num: 3, start: '09:10', end: '09:50', label: '3η Περίοδος' },
      { type: 'period', num: 4, start: '09:50', end: '10:30', label: '4η Περίοδος' },
      { type: 'break', num: 2, start: '10:30', end: '10:45', label: '2ο Διάλειμμα', duration: 15 },
      { type: 'period', num: 5, start: '10:45', end: '11:25', label: '5η Περίοδος' },
      { type: 'period', num: 6, start: '11:25', end: '12:05', label: '6η Περίοδος' },
      { type: 'break', num: 3, start: '12:05', end: '12:15', label: '3ο Διάλειμμα', duration: 10 },
      { type: 'period', num: 7, start: '12:15', end: '12:55', label: '7η Περίοδος' },
      { type: 'period', num: 8, start: '12:55', end: '13:35', label: '8η Περίοδος' }
    ],
    // Tuesday (2), Wednesday (3), Friday (5) - 7 periods
    short: [
      { type: 'period', num: 1, start: '07:30', end: '08:15', label: '1η Περίοδος' },
      { type: 'period', num: 2, start: '08:15', end: '09:00', label: '2η Περίοδος' },
      { type: 'break', num: 1, start: '09:00', end: '09:15', label: '1ο Διάλειμμα', duration: 15 },
      { type: 'period', num: 3, start: '09:15', end: '10:00', label: '3η Περίοδος' },
      { type: 'period', num: 4, start: '10:00', end: '10:45', label: '4η Περίοδος' },
      { type: 'break', num: 2, start: '10:45', end: '11:10', label: '2ο Διάλειμμα', duration: 25 },
      { type: 'period', num: 5, start: '11:10', end: '11:55', label: '5η Περίοδος' },
      { type: 'period', num: 6, start: '11:55', end: '12:40', label: '6η Περίοδος' },
      { type: 'break', num: 3, start: '12:40', end: '12:50', label: '3ο Διάλειμμα', duration: 10 },
      { type: 'period', num: 7, start: '12:50', end: '13:35', label: '7η Περίοδος' }
    ]
  },

  // State
  clockInterval: null,
  soundEnabled: true,
  lastPeriodKey: null,

  // Audio context for bell sounds
  audioContext: null,

  // Get today's schedule
  getTodaySchedule() {
    const day = new Date().getDay(); // 0=Sunday, 1=Monday...
    // Monday (1) and Thursday (4) = long schedule (8 periods)
    if (day === 1 || day === 4) {
      return this.schedules.long;
    }
    // Tuesday, Wednesday, Friday = short schedule (7 periods)
    if (day === 2 || day === 3 || day === 5) {
      return this.schedules.short;
    }
    // Weekend - no school
    return null;
  },

  // Get day type label
  getDayTypeLabel() {
    const day = new Date().getDay();
    if (day === 1 || day === 4) return '8 περίοδοι (Δευτέρα/Πέμπτη)';
    if (day === 2 || day === 3 || day === 5) return '7 περίοδοι (Τρ/Τετ/Παρ)';
    return 'Σαββατοκύριακο';
  },

  // Parse time string to minutes since midnight
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Get current period/break info
  getCurrentPeriod() {
    const schedule = this.getTodaySchedule();
    if (!schedule) return { type: 'weekend', label: 'Σαββατοκύριακο' };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Before school
    const firstStart = this.timeToMinutes(schedule[0].start);
    if (currentMinutes < firstStart) {
      const diff = firstStart - currentMinutes;
      return {
        type: 'before',
        label: 'Πριν το σχολείο',
        next: schedule[0].label,
        timeUntil: diff,
        timeUntilStr: this.formatDuration(diff)
      };
    }

    // After school
    const lastEnd = this.timeToMinutes(schedule[schedule.length - 1].end);
    if (currentMinutes >= lastEnd) {
      return {
        type: 'after',
        label: 'Μετά το σχολείο',
        message: 'Το σχολείο τελείωσε!'
      };
    }

    // During school
    for (let i = 0; i < schedule.length; i++) {
      const slot = schedule[i];
      const start = this.timeToMinutes(slot.start);
      const end = this.timeToMinutes(slot.end);

      if (currentMinutes >= start && currentMinutes < end) {
        const remaining = end - currentMinutes;
        const elapsed = currentMinutes - start;
        const total = end - start;
        const progress = (elapsed / total) * 100;

        return {
          type: slot.type,
          num: slot.num,
          label: slot.label,
          start: slot.start,
          end: slot.end,
          remaining: remaining,
          remainingStr: this.formatDuration(remaining),
          progress: progress,
          next: schedule[i + 1]?.label || 'Τέλος',
          nextType: schedule[i + 1]?.type || 'end',
          key: `${slot.type}-${slot.num}`
        };
      }
    }

    return { type: 'unknown', label: 'Άγνωστο' };
  },

  // Format duration in minutes to readable string
  formatDuration(minutes) {
    if (minutes < 1) return 'λίγα δευτερόλεπτα';
    if (minutes === 1) return '1 λεπτό';
    if (minutes < 60) return `${minutes} λεπτά`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ώρ${hours > 1 ? 'ες' : 'α'}`;
    return `${hours} ώρ${hours > 1 ? 'ες' : 'α'} ${mins} λεπτά`;
  },

  // Format time with seconds
  formatTime(date) {
    return date.toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  // Initialize audio context
  initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  },

  // Play bell sound
  playBell(type = 'start') {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.initAudio();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different bell patterns
      if (type === 'start') {
        // Period start: two quick high beeps
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);

        // Second beep
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.setValueAtTime(880, ctx.currentTime);
          gain2.gain.setValueAtTime(0.3, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.3);
        }, 400);
      } else if (type === 'break') {
        // Break start: longer pleasant tone
        oscillator.frequency.setValueAtTime(660, ctx.currentTime);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
      } else if (type === 'warning') {
        // Warning: soft beep
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  },

  // Render the clock widget
  render(containerId = 'school-clock-widget') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const current = this.getCurrentPeriod();
    const dayType = this.getDayTypeLabel();

    let statusClass = 'clock-normal';
    let icon = '📚';

    if (current.type === 'period') {
      statusClass = 'clock-period';
      icon = '📖';
    } else if (current.type === 'break') {
      statusClass = 'clock-break';
      icon = '☕';
    } else if (current.type === 'before') {
      statusClass = 'clock-before';
      icon = '🌅';
    } else if (current.type === 'after') {
      statusClass = 'clock-after';
      icon = '🏠';
    } else if (current.type === 'weekend') {
      statusClass = 'clock-weekend';
      icon = '🎉';
    }

    container.innerHTML = `
      <div class="school-clock ${statusClass}">
        <div class="clock-header">
          <div class="clock-icon">${icon}</div>
          <div class="clock-time" id="clock-time">${this.formatTime(new Date())}</div>
          <button class="clock-sound-btn ${this.soundEnabled ? 'active' : ''}"
                  onclick="SchoolClock.toggleSound()" title="Ήχος κουδουνιού">
            ${this.soundEnabled ? '🔔' : '🔕'}
          </button>
        </div>

        <div class="clock-status">
          <div class="clock-period-label">${current.label}</div>
          ${current.start && current.end ? `
            <div class="clock-period-time">${current.start} - ${current.end}</div>
          ` : ''}
        </div>

        ${current.progress !== undefined ? `
          <div class="clock-progress-container">
            <div class="clock-progress-bar" style="width: ${current.progress}%"></div>
          </div>
        ` : ''}

        <div class="clock-info">
          ${current.remainingStr ? `
            <div class="clock-remaining">
              <span class="clock-remaining-label">Απομένουν:</span>
              <span class="clock-remaining-time">${current.remainingStr}</span>
            </div>
          ` : ''}
          ${current.timeUntilStr ? `
            <div class="clock-until">
              Ξεκινά σε: ${current.timeUntilStr}
            </div>
          ` : ''}
          ${current.next && current.type !== 'after' && current.type !== 'weekend' ? `
            <div class="clock-next">
              Επόμενο: <strong>${current.next}</strong>
            </div>
          ` : ''}
          ${current.message ? `
            <div class="clock-message">${current.message}</div>
          ` : ''}
        </div>

        <div class="clock-day-type">${dayType}</div>
      </div>
    `;

    // Check for period change and play bell
    if (current.key && current.key !== this.lastPeriodKey) {
      if (this.lastPeriodKey !== null) {
        // Period changed - play appropriate bell
        if (current.type === 'break') {
          this.playBell('break');
        } else if (current.type === 'period') {
          this.playBell('start');
        }
      }
      this.lastPeriodKey = current.key;
    }

    // Warning sound when 2 minutes remaining
    if (current.remaining === 2 && current.type === 'period') {
      this.playBell('warning');
    }
  },

  // Toggle sound
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    // Try to init audio context on user interaction
    if (this.soundEnabled) {
      this.initAudio();
      this.playBell('warning'); // Test sound
    }
    this.render('school-clock-widget');
    showToast(this.soundEnabled ? 'Ήχος ενεργοποιήθηκε' : 'Ήχος απενεργοποιήθηκε', 'info');
  },

  // Start the clock
  start(containerId = 'school-clock-widget') {
    this.render(containerId);

    // Update every second
    this.clockInterval = setInterval(() => {
      const timeEl = document.getElementById('clock-time');
      if (timeEl) {
        timeEl.textContent = this.formatTime(new Date());
      }

      // Full re-render every minute to update remaining time
      const seconds = new Date().getSeconds();
      if (seconds === 0) {
        this.render(containerId);
      }
    }, 1000);
  },

  // Stop the clock
  stop() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  },

  // Get full schedule for display
  getFullSchedule() {
    const schedule = this.getTodaySchedule();
    if (!schedule) return [];
    return schedule;
  }
};

// Export
window.SchoolClock = SchoolClock;
