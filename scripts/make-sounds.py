#!/usr/bin/env python3
"""
Builds every sound of the game into assets/sounds/*.wav (no samples, pure synthesis).

    python3 scripts/make-sounds.py

Needs numpy + scipy. Re-run after tweaking anything below; the app picks the files up on the next build.
Loudness of each sound inside the app is set in src/lib/sound.ts (SFX_GAIN), so most of the time you only
need to change a number there, not regenerate the files.
"""
import os
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100
MUSIC_SR = 22050
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(29)


# ---- building blocks -------------------------------------------------------------------------------
def t_axis(dur, sr=SR):
    return np.arange(int(dur * sr)) / sr


def decay(n, tau, sr=SR):
    return np.exp(-np.arange(n) / (tau * sr))


def noise(n):
    return rng.standard_normal(n)


def band(x, lo, hi, sr=SR, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=sr, output='sos')
    return signal.sosfilt(sos, x)


def lowpass(x, fc, sr=SR, order=2):
    sos = signal.butter(order, fc, btype='low', fs=sr, output='sos')
    return signal.sosfilt(sos, x)


def highpass(x, fc, sr=SR, order=2):
    sos = signal.butter(order, fc, btype='high', fs=sr, output='sos')
    return signal.sosfilt(sos, x)


def fade(x, ms=3, sr=SR):
    n = min(int(ms / 1000 * sr), len(x) // 2)
    if n > 0:
        x[:n] *= np.linspace(0, 1, n)
        x[-n:] *= np.linspace(1, 0, n)
    return x


def mix(length, parts, sr=SR):
    """parts: list of (start_seconds, signal). Returns one buffer of `length` seconds."""
    out = np.zeros(int(length * sr))
    for start, sig in parts:
        i = int(start * sr)
        j = min(len(out), i + len(sig))
        if i < len(out):
            out[i:j] += sig[: j - i]
    return out


def bell(freq, dur=0.5, gain=1.0, sr=SR):
    """Soft glass/marimba-ish bell: a few inharmonic partials with their own decays."""
    t = t_axis(dur, sr)
    n = len(t)
    y = np.zeros(n)
    for ratio, amp, tau in [(1.0, 1.0, 0.18), (2.0, 0.35, 0.10), (2.76, 0.18, 0.07), (5.4, 0.07, 0.04)]:
        y += amp * np.sin(2 * np.pi * freq * ratio * t) * decay(n, tau, sr)
    y *= np.minimum(1, t / 0.003)  # 3 ms attack so it does not click
    return fade(y * gain, 4, sr)


def pluck(freq, dur=0.6, gain=1.0, sr=SR):
    """Marimba / kalimba pluck."""
    t = t_axis(dur, sr)
    n = len(t)
    y = np.sin(2 * np.pi * freq * t) * decay(n, 0.22, sr)
    y += 0.4 * np.sin(2 * np.pi * freq * 4.0 * t) * decay(n, 0.04, sr)
    y += 0.15 * np.sin(2 * np.pi * freq * 9.2 * t) * decay(n, 0.02, sr)
    y *= np.minimum(1, t / 0.002)
    return fade(y * gain, 4, sr)


def reverb(x, wet=0.25, length=1.2, sr=SR, damp=4500):
    n = int(length * sr)
    ir = noise(n) * np.exp(-np.arange(n) / (0.28 * sr))
    ir = lowpass(ir, damp, sr)
    ir /= np.sqrt(np.sum(ir ** 2))
    tail = signal.fftconvolve(x, ir)[: len(x) + n]
    dry = np.pad(x, (0, len(tail) - len(x)))
    return (1 - wet) * dry + wet * tail * 1.6


def normalize(x, peak=0.8):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def trim_tail(x, sr=SR, floor=0.004, keep=0.03):
    """Cut the near-silent end that the reverb leaves behind, and fade what is left."""
    loud = np.where(np.abs(x) > floor * (np.max(np.abs(x)) or 1.0))[0]
    if len(loud) == 0:
        return x
    end = min(len(x), loud[-1] + int(keep * sr))
    return fade(x[:end].copy(), 12, sr)


def save(name, x, sr=SR, peak=0.8, trim=True):
    if trim:
        x = trim_tail(x, sr)
    x = normalize(x, peak)
    wavfile.write(os.path.join(OUT, f'{name}.wav'), sr, (x * 32767).astype(np.int16))
    print(f'{name:12s} {len(x) / sr:5.2f}s  {os.path.getsize(os.path.join(OUT, name + ".wav")) // 1024:5d} KB')


# ---- UI sounds -------------------------------------------------------------------------------------
def make_tap():
    n = int(0.05 * SR)
    click = band(noise(n), 1400, 5200) * decay(n, 0.005) * 0.55
    tone = np.sin(2 * np.pi * 1050 * t_axis(0.05)) * decay(n, 0.012) * 0.5
    return fade(click + tone, 2)


def make_select():
    n = int(0.06 * SR)
    t = t_axis(0.06)
    tick = np.sin(2 * np.pi * 1850 * t) * decay(n, 0.009) * 0.5
    tick += band(noise(n), 2500, 7000) * decay(n, 0.004) * 0.35
    return fade(tick, 2)


def make_tick():
    n = int(0.05 * SR)
    t = t_axis(0.05)
    wood = np.sin(2 * np.pi * 820 * t) * decay(n, 0.010) + 0.4 * np.sin(2 * np.pi * 1640 * t) * decay(n, 0.006)
    return fade(wood, 2)


# ---- cards -----------------------------------------------------------------------------------------
def make_card_play():
    dur = 0.16
    n = int(dur * SR)
    t = t_axis(dur)
    f = 150 * np.exp(-t * 18) + 60  # thump falls from ~210 Hz to 60 Hz
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(n, 0.035) * 0.85
    snap = band(noise(n), 900, 6000) * decay(n, 0.010) * 0.9
    paper = band(noise(n), 300, 2600) * decay(n, 0.045) * 0.22
    return fade(thump + snap + paper, 2)


def make_card_deal():
    dur = 0.085
    n = int(dur * SR)
    y = np.zeros(n)
    # a short flick: noise band that sweeps upwards, then a tiny landing tap
    seg = 6
    size = n // seg
    for i in range(seg):
        lo = 1200 + i * 600
        chunk = band(noise(size), lo, lo + 2600)
        y[i * size:(i + 1) * size] += chunk * np.hanning(size) * (0.5 + i * 0.08)
    y *= decay(n, 0.05)
    tap = band(noise(int(0.012 * SR)), 700, 3200) * decay(int(0.012 * SR), 0.004) * 0.6
    y[-len(tap):] += tap
    return fade(y, 2)


def make_card_flip():
    dur = 0.075
    n = int(dur * SR)
    y = band(noise(n), 1800, 7500) * np.hanning(n)
    y += band(noise(n), 400, 1500) * decay(n, 0.02) * 0.4
    return fade(y, 2)


def make_trick_win():
    dur = 0.7
    n = int(0.24 * SR)
    sweep = np.zeros(n)
    seg = 10
    size = n // seg
    for i in range(seg):
        lo = 500 + i * 330
        sweep[i * size:(i + 1) * size] += band(noise(size), lo, lo + 1800) * np.hanning(size)
    sweep *= np.hanning(n) ** 0.6 * 0.7
    return mix(dur, [(0.0, sweep), (0.13, bell(1318.5, 0.5, 0.55)), (0.22, bell(1760, 0.45, 0.35))])


# ---- game feedback ---------------------------------------------------------------------------------
def make_your_turn():
    return reverb(mix(0.7, [(0.0, bell(659.25, 0.5, 0.9)), (0.12, bell(880.0, 0.55, 0.9))]), 0.18, 0.6)


def make_bid():
    def clack():
        n = int(0.03 * SR)
        return band(noise(n), 2200, 9000) * decay(n, 0.004) + np.sin(2 * np.pi * 2600 * t_axis(0.03)) * decay(n, 0.005) * 0.5
    return mix(0.3, [(0.0, clack() * 0.8), (0.05, clack() * 0.65), (0.09, bell(1760, 0.25, 0.28))])


def make_chips():
    def clack(g):
        n = int(0.035 * SR)
        return (band(noise(n), 1800, 8500) * decay(n, 0.005) + np.sin(2 * np.pi * rng.uniform(2100, 3100) * t_axis(0.035)) * decay(n, 0.006) * 0.6) * g
    starts = [0.0, 0.045, 0.085, 0.14, 0.18, 0.235]
    return mix(0.4, [(s, clack(rng.uniform(0.5, 0.9))) for s in starts])


def make_illegal():
    dur = 0.2
    n = int(dur * SR)
    t = t_axis(dur)
    buzz = signal.square(2 * np.pi * 105 * t) * 0.4 + np.sin(2 * np.pi * 70 * t) * 0.6
    buzz = lowpass(buzz, 700) * decay(n, 0.07)
    return fade(buzz, 3)


def make_round_end():
    notes = [523.25, 659.25, 783.99]
    parts = [(i * 0.14, pluck(f, 0.7, 0.9)) for i, f in enumerate(notes)]
    return reverb(mix(1.1, parts), 0.25, 0.9)


def make_win():
    arp = [523.25, 659.25, 783.99, 1046.5]
    parts = [(i * 0.12, bell(f, 0.9, 0.8)) for i, f in enumerate(arp)]
    chord_t = 0.52
    for f in [523.25, 659.25, 783.99, 1046.5, 1318.5]:
        parts.append((chord_t, bell(f, 1.3, 0.5)))
    shimmer = highpass(noise(int(1.2 * SR)), 5000) * decay(int(1.2 * SR), 0.5) * 0.05
    parts.append((chord_t, shimmer))
    return reverb(mix(2.0, parts), 0.3, 1.4)


def make_lose():
    parts = [(0.0, bell(329.63, 1.0, 0.7)), (0.28, bell(293.66, 1.0, 0.7)), (0.58, bell(246.94, 1.4, 0.7)), (0.58, bell(196.0, 1.4, 0.45))]
    return reverb(mix(1.8, parts), 0.3, 1.2, damp=3000)


def make_start():
    n = int(0.45 * SR)
    sweep = np.zeros(n)
    seg = 12
    size = n // seg
    for i in range(seg):
        lo = 350 + i * 260
        sweep[i * size:(i + 1) * size] += band(noise(size), lo, lo + 1500) * np.hanning(size) * (0.3 + i / seg)
    sweep *= np.hanning(n) ** 0.5 * 0.5
    return reverb(mix(1.2, [(0.0, sweep), (0.3, bell(523.25, 0.9, 0.8)), (0.3, bell(783.99, 0.9, 0.55)), (0.3, bell(1046.5, 0.9, 0.4))]), 0.22, 0.8)


def make_join():
    return reverb(mix(0.5, [(0.0, bell(783.99, 0.35, 0.7)), (0.09, bell(1046.5, 0.4, 0.7))]), 0.15, 0.5)


def make_leave():
    return reverb(mix(0.5, [(0.0, bell(1046.5, 0.3, 0.5)), (0.09, bell(698.46, 0.4, 0.5))]), 0.15, 0.5)


def make_notify():
    return reverb(mix(0.6, [(0.0, bell(1174.7, 0.4, 0.8)), (0.11, bell(1568.0, 0.5, 0.7))]), 0.2, 0.6)


# ---- menu music: slow lounge loop, seamless (the tails wrap around to the start) ---------------------
def make_music():
    sr = MUSIC_SR
    bpm = 72
    beat = 60 / bpm
    bar = 4 * beat
    bars = 8
    total = bars * bar
    n = int(total * sr)
    buf = np.zeros(n)

    def add(sig, start):
        i = int(start * sr)
        idx = (np.arange(len(sig)) + i) % n  # wraps, so tails and the last pad flow into the first bar
        np.add.at(buf, idx, sig)

    def hz(midi):
        return 440.0 * 2 ** ((midi - 69) / 12)

    # Am9 - Fmaj7 - Cmaj7 - G6, twice
    chords = [
        [45, 57, 60, 64, 67],
        [41, 53, 57, 60, 64],
        [36, 55, 59, 64, 67],
        [43, 55, 59, 62, 64],
    ]
    prog = chords * 2

    def pad(midis, dur):
        t = t_axis(dur, sr)
        y = np.zeros(len(t))
        for m in midis:
            for det in (-0.07, 0.0, 0.07):
                f = hz(m) * 2 ** (det / 12)
                y += signal.sawtooth(2 * np.pi * f * t) * 0.12
        y = lowpass(y, 1000, sr, 2)
        att, rel = 0.9, 1.4
        env = np.minimum(1, t / att) * np.minimum(1, (t[-1] - t) / rel)
        return y * env

    for i, ch in enumerate(prog):
        add(pad(ch, bar + 1.4), i * bar)
        # bass on beats 1 and 3
        for b in (0, 2):
            tb = t_axis(beat * 1.6, sr)
            f = hz(ch[0] - (12 if ch[0] > 40 else 0))
            bass = np.sin(2 * np.pi * f * tb) * decay(len(tb), 0.45, sr) * 0.5
            add(fade(bass, 8, sr), i * bar + b * beat)

    # plucked arpeggio, eighth notes, with a couple of rests so it breathes
    pattern = [0, 2, 3, 2, 1, 3, 2, 4]
    for i, ch in enumerate(prog):
        tones = [m + 12 for m in ch[1:]]  # an octave up from the pad
        for k, idx in enumerate(pattern):
            if (i + k) % 5 == 4:
                continue
            m = tones[idx % len(tones)]
            g = 0.5 if k % 2 == 0 else 0.35
            add(pluck(hz(m), 0.9, g, sr), i * bar + k * beat / 2)

    # brushed shaker on the off-beats
    for b in range(bars * 4):
        nn = int(0.09 * sr)
        sh = highpass(noise(nn), 4500, sr) * np.hanning(nn) * 0.03
        add(sh, b * beat + beat / 2)

    # echo + room
    echo = np.zeros(n)
    delay = int(beat * 0.75 * sr)
    for k, g in enumerate([0.35, 0.18, 0.09], start=1):
        echo += np.roll(buf, delay * k) * g
    buf = buf + echo * 0.6
    tail_len = int(1.6 * sr)
    ir = noise(tail_len) * np.exp(-np.arange(tail_len) / (0.45 * sr))
    ir = lowpass(ir, 3500, sr)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = signal.fftconvolve(buf, ir)
    wrapped = wet[:n].copy()
    wrapped[: len(wet) - n] += wet[n:]
    out = 0.72 * buf + 0.55 * wrapped
    out = highpass(out, 60, sr, 1)
    save('menu_music', out, sr, peak=0.6, trim=False)


SFX = {
    'tap': make_tap, 'select': make_select, 'tick': make_tick,
    'card_play': make_card_play, 'card_deal': make_card_deal, 'card_flip': make_card_flip,
    'trick_win': make_trick_win, 'your_turn': make_your_turn, 'bid': make_bid, 'chips': make_chips,
    'illegal': make_illegal, 'round_end': make_round_end, 'win': make_win, 'lose': make_lose,
    'start': make_start, 'join': make_join, 'leave': make_leave, 'notify': make_notify,
}

if __name__ == '__main__':
    for name, fn in SFX.items():
        save(name, fn())
    make_music()
