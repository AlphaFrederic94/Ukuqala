import { notificationService } from '../services/notificationService';

// Create an in-memory alarm sound using AudioContext
class AlarmSound {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    // Initialize on first play to avoid autoplay restrictions
  }

  private initialize() {
    if (!this.audioContext) {
      try {
        // Use a user interaction to create the audio context (to avoid autoplay restrictions)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();

          // Resume the audio context if it's suspended (needed in some browsers)
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
        } else {
          console.warn('AudioContext not supported in this browser');
        }
      } catch (error) {
        console.error('Web Audio API is not supported in this browser', error);
      }
    } else if (this.audioContext.state === 'suspended') {
      // Resume if suspended
      this.audioContext.resume().catch(err => {
        console.warn('Could not resume audio context:', err);
      });
    }
  }

  public play() {
    this.initialize();
    if (!this.audioContext) return;

    try {
      // Stop if already playing
      this.stop();

      // Create oscillator for the beep sound
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      // Connect nodes
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Configure oscillator
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 800; // Hz

      // Configure gain (volume)
      this.gainNode.gain.value = 0.5;

      // Start sound
      this.oscillator.start();
      this.isPlaying = true;

      // Create a repeating pattern (beep-beep-beep)
      this.createBeepPattern();
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  }

  private createBeepPattern() {
    if (!this.gainNode || !this.audioContext || !this.oscillator) return;

    const now = this.audioContext.currentTime;

    // Create a more complex beep pattern for better alarm recognition
    // First set of beeps (faster)
    this.gainNode.gain.setValueAtTime(0.7, now);
    this.gainNode.gain.setValueAtTime(0, now + 0.2);
    this.gainNode.gain.setValueAtTime(0.7, now + 0.4);
    this.gainNode.gain.setValueAtTime(0, now + 0.6);
    this.gainNode.gain.setValueAtTime(0.7, now + 0.8);
    this.gainNode.gain.setValueAtTime(0, now + 1.0);

    // Pause

    // Second set of beeps (slower)
    this.gainNode.gain.setValueAtTime(0.8, now + 1.5);
    this.gainNode.gain.setValueAtTime(0, now + 2.0);
    this.gainNode.gain.setValueAtTime(0.8, now + 2.5);
    this.gainNode.gain.setValueAtTime(0, now + 3.0);

    // Change frequency for variety
    this.oscillator.frequency.setValueAtTime(800, now);
    this.oscillator.frequency.setValueAtTime(1000, now + 1.5);
    this.oscillator.frequency.setValueAtTime(800, now + 2.5);

    // Repeat the pattern
    if (this.isPlaying) {
      setTimeout(() => this.createBeepPattern(), 4000);
    }
  }

  public stop() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      } catch (error) {
        console.error('Error stopping oscillator:', error);
      }
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
        this.gainNode = null;
      } catch (error) {
        console.error('Error disconnecting gain node:', error);
      }
    }

    this.isPlaying = false;
  }
}

const ALARM_SOUND = new AlarmSound();

interface AlarmOptions {
  time: string;
  label?: string;
  sound?: boolean;
  vibration?: boolean;
  snoozeMinutes?: number;
}

class AlarmService {
  private alarms: Map<string, {
    options: AlarmOptions,
    timerId: number,
    isActive: boolean
  }> = new Map();

  constructor() {
    this.initFromLocalStorage();
    this.setupAlarmCheck();
  }

  private initFromLocalStorage() {
    try {
      const savedAlarms = localStorage.getItem('alarms');
      if (savedAlarms) {
        const alarmOptions = JSON.parse(savedAlarms) as AlarmOptions[];
        alarmOptions.forEach(options => {
          this.setAlarm(options);
        });
      }
    } catch (error) {
      console.error('Error loading alarms from localStorage:', error);
    }
  }

  private saveToLocalStorage() {
    try {
      const alarmOptions = Array.from(this.alarms.values()).map(alarm => alarm.options);
      localStorage.setItem('alarms', JSON.stringify(alarmOptions));
    } catch (error) {
      console.error('Error saving alarms to localStorage:', error);
    }
  }

  private setupAlarmCheck() {
    // Check every minute if any alarms should trigger
    setInterval(() => {
      this.checkAlarms();
    }, 60000); // Check every minute

    // Also check immediately
    this.checkAlarms();
  }

  private checkAlarms() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    this.alarms.forEach((alarm, id) => {
      if (alarm.isActive && alarm.options.time === currentTimeString) {
        this.triggerAlarm(id);
      }
    });
  }

  private triggerAlarm(alarmId: string) {
    const alarm = this.alarms.get(alarmId);
    if (!alarm) return;

    // Play sound if enabled
    if (alarm.options.sound !== false) {
      this.playAlarmSound();
    }

    // Show notification
    notificationService.showNotification({
      title: 'Wake Up!',
      body: alarm.options.label || 'Your alarm is ringing',
      sound: 'general',
      onClick: () => {
        this.stopAlarm();
        window.focus();
      }
    });

    // Vibrate if supported and enabled
    if (alarm.options.vibration !== false && 'vibrate' in navigator) {
      // Vibrate pattern: 500ms vibration, 200ms pause, repeat
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }

  public playAlarmSound() {
    try {
      // Play the alarm sound
      ALARM_SOUND.play();

      // Stop after 1 minute if not stopped manually
      setTimeout(() => {
        this.stopAlarmSound();
      }, 60000);
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  }

  public stopAlarmSound() {
    try {
      ALARM_SOUND.stop();
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
  }

  public stopAlarm() {
    this.stopAlarmSound();

    // Stop vibration if active
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }

  public setAlarm(options: AlarmOptions): string {
    const id = `alarm-${Date.now()}`;

    // Calculate time until alarm
    const timerId = this.scheduleAlarmCheck(options.time);

    this.alarms.set(id, {
      options,
      timerId,
      isActive: true
    });

    this.saveToLocalStorage();
    return id;
  }

  private scheduleAlarmCheck(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const alarmTime = new Date();

    alarmTime.setHours(hours, minutes, 0, 0);

    // If the alarm time is in the past, schedule for tomorrow
    if (alarmTime < now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    const timeUntilAlarm = alarmTime.getTime() - now.getTime();

    // Schedule the alarm
    return window.setTimeout(() => {
      this.playAlarmSound();

      // Show notification
      notificationService.showNotification({
        title: 'Wake Up!',
        body: 'Your alarm is ringing',
        sound: 'general',
        onClick: () => {
          this.stopAlarm();
          window.focus();
        }
      });

      // Reschedule for tomorrow
      this.scheduleAlarmCheck(timeString);
    }, timeUntilAlarm);
  }

  public updateAlarm(id: string, options: Partial<AlarmOptions>): boolean {
    const alarm = this.alarms.get(id);
    if (!alarm) return false;

    // Clear existing timer
    clearTimeout(alarm.timerId);

    // Update options
    alarm.options = { ...alarm.options, ...options };

    // Reschedule
    alarm.timerId = this.scheduleAlarmCheck(alarm.options.time);

    this.saveToLocalStorage();
    return true;
  }

  public deleteAlarm(id: string): boolean {
    const alarm = this.alarms.get(id);
    if (!alarm) return false;

    // Clear timer
    clearTimeout(alarm.timerId);

    // Remove from map
    this.alarms.delete(id);

    this.saveToLocalStorage();
    return true;
  }

  public getAlarms(): { id: string, options: AlarmOptions, isActive: boolean }[] {
    return Array.from(this.alarms.entries()).map(([id, alarm]) => ({
      id,
      options: alarm.options,
      isActive: alarm.isActive
    }));
  }

  public toggleAlarm(id: string, active?: boolean): boolean {
    const alarm = this.alarms.get(id);
    if (!alarm) return false;

    alarm.isActive = active !== undefined ? active : !alarm.isActive;

    this.saveToLocalStorage();
    return true;
  }

  public snoozeAlarm(id: string, minutes: number = 5): boolean {
    const alarm = this.alarms.get(id);
    if (!alarm) return false;

    // Stop current alarm
    this.stopAlarm();

    // Calculate new time
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const newTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Create temporary alarm
    this.setAlarm({
      time: newTime,
      label: `${alarm.options.label || 'Alarm'} (Snoozed)`,
      sound: alarm.options.sound,
      vibration: alarm.options.vibration
    });

    return true;
  }
}

export const alarmService = new AlarmService();
