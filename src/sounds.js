/**
 * Módulo de sonidos — Web Audio API, sin archivos externos.
 * Todos los sonidos son generados programáticamente.
 */

const STORAGE_KEY = 'truco-muted';

/** @type {AudioContext|null} */
let ctx = null;

function getCtx() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    return ctx;
}

export function isMuted() {
    return localStorage.getItem(STORAGE_KEY) === '1';
}

/** Alterna silencio. Retorna true si quedó silenciado. */
export function toggleMute() {
    const muted = !isMuted();
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    return muted;
}

/**
 * Reproduce un tono simple.
 * @param {{ freq: number, freqEnd?: number, duration: number, type?: OscillatorType, gain?: number, startDelay?: number }} opts
 */
function playTone({ freq, freqEnd, duration, type = 'triangle', gain = 0.28, startDelay = 0 }) {
    if (isMuted()) return;
    const ac = getCtx();
    const t = ac.currentTime + startDelay;
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();
    osc.connect(gainNode);
    gainNode.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    }
    gainNode.gain.setValueAtTime(gain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.01);
}

/** Toque de UI genérico — navegación, botones de formulario */
export function playTap() {
    playTone({ freq: 520, freqEnd: 380, duration: 0.07, type: 'sine', gain: 0.12 });
}

/** Toggle / selección — radios y checkboxes */
export function playToggle() {
    playTone({ freq: 440, freqEnd: 560, duration: 0.08, type: 'sine', gain: 0.10 });
}

/** +1 punto — pop corto ascendente */
export function playPunto() {
    playTone({ freq: 280, freqEnd: 420, duration: 0.13, type: 'triangle', gain: 0.25 });
}

/** -1 punto — bip descendente suave */
export function playRestar() {
    playTone({ freq: 220, freqEnd: 140, duration: 0.14, type: 'sine', gain: 0.18 });
}

/** Vale cuatro confirmado — fanfarria ascendente (4 notas) */
export function playVale() {
    if (isMuted()) return;
    [261, 330, 392, 523].forEach((freq, i) => {
        playTone({ freq, duration: 0.18, type: 'triangle', gain: 0.28, startDelay: i * 0.13 });
    });
}

/** Fin de partida — melodía corta de victoria */
export function playGanador() {
    if (isMuted()) return;
    const seq = [
        { freq: 261, dur: 0.10 },
        { freq: 330, dur: 0.10 },
        { freq: 392, dur: 0.10 },
        { freq: 523, dur: 0.15 },
        { freq: 392, dur: 0.08 },
        { freq: 523, dur: 0.10 },
        { freq: 659, dur: 0.35 },
    ];
    let t = 0;
    seq.forEach(({ freq, dur }) => {
        playTone({ freq, duration: dur, type: 'triangle', gain: 0.30, startDelay: t });
        t += dur * 0.88;
    });
}
