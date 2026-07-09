import type { AppNotification } from '@/features/notifications/notification-types';
import { shouldPlaySound } from '@/features/notifications/notification-center';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  audioContext ??= new AudioContext();
  return audioContext;
}

function beep(frequency: number, durationMs: number, volume = 0.08): void {
  const ctx = getAudioContext();
  if (ctx === null) {
    return;
  }
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + durationMs / 1000);
}

export function playNotificationSound(notification: AppNotification): void {
  if (!shouldPlaySound(notification)) {
    return;
  }
  switch (notification.kind) {
    case 'win':
      beep(880, 120);
      window.setTimeout(() => {
        beep(1175, 150);
      }, 130);
      break;
    case 'plan-finished':
      beep(440, 180);
      break;
    case 'collector-offline':
      beep(220, 250);
      break;
    default:
      break;
  }
}
