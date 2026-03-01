let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  rampDown = true,
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported — fail silently
  }
}

export function playClick() {
  playTone(800, 0.06, 'sine', 0.12);
}

export function playSelect() {
  playTone(600, 0.05, 'sine', 0.1);
  setTimeout(() => playTone(900, 0.07, 'sine', 0.1), 40);
}

export function playSuccess() {
  playTone(523, 0.12, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 100);
  setTimeout(() => playTone(784, 0.18, 'sine', 0.14), 200);
}

export function playError() {
  playTone(330, 0.15, 'triangle', 0.12);
  setTimeout(() => playTone(260, 0.2, 'triangle', 0.1), 120);
}

export function playNavigate() {
  playTone(440, 0.08, 'sine', 0.08);
  setTimeout(() => playTone(660, 0.06, 'sine', 0.06), 50);
}

export function playToggle(on: boolean) {
  playTone(on ? 700 : 500, 0.06, 'sine', 0.1);
}

export function playExpand() {
  playTone(400, 0.05, 'sine', 0.08);
  setTimeout(() => playTone(550, 0.06, 'sine', 0.08), 40);
}

export function playCollapse() {
  playTone(550, 0.05, 'sine', 0.08);
  setTimeout(() => playTone(400, 0.06, 'sine', 0.08), 40);
}
