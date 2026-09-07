/* ==========================================================================
   INTERACTION ENGINE & ROMANTIC SOUNDTRACK SYNTHESIZER
   Handles Runaway "No" Button, Confetti Celebrations, Modal, Hotspots, & Web Audio
   ========================================================================== */

class RomanticAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.loopTimer = null;
    this.audioBtn = document.getElementById('audioToggle');
    this.audioLabel = document.getElementById('audioLabel');

    if (this.audioBtn) {
      this.audioBtn.addEventListener('click', () => this.toggle());
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.initContext();
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    this.isPlaying = true;
    this.audioBtn.classList.add('playing');
    this.audioLabel.textContent = "Music: On";
    this.scheduleChordLoop();
  }

  stop() {
    this.isPlaying = false;
    this.audioBtn.classList.remove('playing');
    this.audioLabel.textContent = "Music: Off";
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  // Play a dreamy synth chime note
  playNote(frequency, time, duration = 1.6, gainLevel = 0.08) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Warm sine + triangle blend
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, time);

    // Smooth envelope attack and decay
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(gainLevel, time + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  playChime() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.playNote(freq, now + idx * 0.1, 1.2, 0.12);
    });
  }

  scheduleChordLoop() {
    if (!this.isPlaying) return;

    // Romantic chord progression: Fmaj7 -> Cmaj7 -> Dm7 -> Am
    const chords = [
      [349.23, 440.00, 523.25, 659.25], // F4, A4, C5, E5 (Fmaj7)
      [261.63, 329.63, 392.00, 493.88], // C4, E4, G4, B4 (Cmaj7)
      [293.66, 349.23, 440.00, 523.25], // D4, F4, A4, C5 (Dm7)
      [220.00, 261.63, 329.63, 392.00]  // A3, C4, E4, G4 (Am7)
    ];

    let chordIdx = 0;
    const playChordStep = () => {
      if (!this.isPlaying) return;
      const now = this.ctx.currentTime;
      const chord = chords[chordIdx];

      // Arpeggiate chord gently
      chord.forEach((freq, noteIdx) => {
        this.playNote(freq, now + noteIdx * 0.22, 2.6, 0.05);
      });

      // Add high sparkling bell
      if (Math.random() > 0.4) {
        const sparkle = chord[Math.floor(Math.random() * chord.length)] * 2;
        this.playNote(sparkle, now + 1.1, 1.8, 0.03);
      }

      chordIdx = (chordIdx + 1) % chords.length;
      this.loopTimer = setTimeout(playChordStep, 2600);
    };

    playChordStep();
  }
}

// --------------------------------------------------------------------------
// Interactions, Hotspots, Runaway Button & Modals
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  window.romanticAudio = new RomanticAudio();

  // 1. Hotspot Tooltips
  const hotspots = document.querySelectorAll('.hotspot');
  const tooltip = document.getElementById('hotspotTooltip');
  const tooltipTitle = document.getElementById('tooltipTitle');
  const tooltipText = document.getElementById('tooltipText');
  let tooltipTimeout;

  hotspots.forEach(spot => {
    const showInfo = (e) => {
      e.stopPropagation();
      const title = spot.getAttribute('data-title');
      const desc = spot.getAttribute('data-desc');

      tooltipTitle.textContent = title;
      tooltipText.textContent = desc;
      tooltip.classList.add('visible');

      clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        tooltip.classList.remove('visible');
      }, 4500);

      if (window.heartVisualizer) {
        window.heartVisualizer.triggerMicroBeat();
      }
    };

    spot.addEventListener('mouseenter', showInfo);
    spot.addEventListener('click', showInfo);
  });

  // Hide tooltip when clicking anywhere else
  document.addEventListener('click', () => {
    tooltip.classList.remove('visible');
  });

  // 2. The Playful Runaway "NO" Button
  const noBtn = document.getElementById('noBtn');
  const yesBtn = document.getElementById('yesBtn');
  const choiceContainer = document.getElementById('choiceContainer');
  const runawayFeedback = document.getElementById('runawayFeedback');

  let runawayAttempts = 0;
  const runawayMessages = [
    "Nice try Eman! 😉",
    "Oops! That button is out of order! ❤️",
    "Cardiology Alert: 'No' is physically impossible!",
    "You can't escape my love that easily!",
    "Only YES has FDA (Forever Devoted Abdallah) approval! 💕",
    "My heart just redirected your click to YES! 🚀"
  ];

  const dodgeNoBtn = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    runawayAttempts++;

    // Show funny feedback message
    const msg = runawayMessages[(runawayAttempts - 1) % runawayMessages.length];
    runawayFeedback.textContent = msg;

    // Calculate dynamic safe offsets
    const containerRect = choiceContainer.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();

    // Random coordinates within a wide radius
    const maxOffsetX = Math.min(window.innerWidth * 0.35, 140);
    const maxOffsetY = 70;

    let randX = (Math.random() - 0.5) * 2 * maxOffsetX;
    let randY = (Math.random() - 0.5) * 2 * maxOffsetY;

    // Ensure it noticeably jumps
    if (Math.abs(randX) < 40) randX = randX >= 0 ? 55 : -55;
    if (Math.abs(randY) < 30) randY = randY >= 0 ? 45 : -45;

    noBtn.style.transform = `translate(${randX}px, ${randY}px)`;

    // Slightly increase the size of the YES button each time she tries to click NO!
    const currentScale = 1 + Math.min(runawayAttempts * 0.04, 0.35);
    yesBtn.style.transform = `scale(${currentScale})`;
  };

  // Runaway triggers on mouseover, mouseenter, pointerdown, and touchstart
  noBtn.addEventListener('mouseenter', dodgeNoBtn);
  noBtn.addEventListener('touchstart', dodgeNoBtn, { passive: false });
  noBtn.addEventListener('click', dodgeNoBtn);

  // 3. YES Button Celebration & Love Letter
  const letterModal = document.getElementById('letterModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const replayLoveBtn = document.getElementById('replayLoveBtn');

  const triggerCelebration = () => {
    // If audio is not playing, start it softly
    if (window.romanticAudio && !window.romanticAudio.isPlaying) {
      window.romanticAudio.start();
    }

    runawayFeedback.textContent = "Permanent residency officially approved! ❤️💍";
    runawayFeedback.style.color = "#ffd166";

    // Confetti Cannon
    if (typeof confetti === 'function') {
      // 1. Initial Blast
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.65 },
        colors: ['#ff1493', '#ff69b4', '#ffd166', '#ffffff']
      });

      // 2. Cascading Side Cannons
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 }
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 }
        });
      }, 350);
    }

    // Open Letter Modal
    setTimeout(() => {
      letterModal.classList.add('active');
    }, 600);
  };

  yesBtn.addEventListener('click', triggerCelebration);

  // Modal Close & Replay
  closeModalBtn.addEventListener('click', () => {
    letterModal.classList.remove('active');
  });

  letterModal.addEventListener('click', (e) => {
    if (e.target === letterModal) {
      letterModal.classList.remove('active');
    }
  });

  replayLoveBtn.addEventListener('click', () => {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#ff2a6d', '#ffd166', '#ff758c', '#ffffff']
      });
    }
    if (window.romanticAudio) {
      window.romanticAudio.playChime();
    }
  });
});
