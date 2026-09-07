/* ==========================================================================
   HEART VISUALIZER & CARDIAC PHYSICS ENGINE
   Handles Particle Canvas, SVG Dynamic Liquid Fill, ECG Waveform, and BPM Sync
   ========================================================================== */

class HeartVisualizer {
  constructor() {
    this.particleCanvas = document.getElementById('particleCanvas');
    this.ctx = this.particleCanvas.getContext('2d');
    
    this.ecgCanvas = document.getElementById('ecgCanvas');
    this.ecgCtx = this.ecgCanvas.getContext('2d');

    this.bpmCounter = document.getElementById('bpmCounter');
    this.occupancyPercent = document.getElementById('occupancyPercent');
    this.emanLiquidFill = document.getElementById('emanLiquidFill');
    this.emanWatermark = document.getElementById('emanHeartWatermark');
    this.heartSvg = document.getElementById('anatomicalHeartSvg');
    this.heartStage = document.getElementById('heartStage');
    this.verdictText = document.getElementById('verdictText');
    this.scanBtn = document.getElementById('scanOccupancyBtn');
    this.scanBtnText = document.getElementById('scanBtnText');
    this.boostBtn = document.getElementById('boostHeartRateBtn');

    // State
    this.bpm = 78;
    this.targetBpm = 78;
    this.occupancy = 0;
    this.isScanning = false;
    this.isFullyOccupied = false;
    this.particles = [];
    this.ambientHearts = [];

    // ECG properties
    this.ecgX = 0;
    this.ecgPoints = [];
    this.lastEcgBeat = 0;

    this.init();
  }

  init() {
    this.resizeCanvases();
    window.addEventListener('resize', () => this.resizeCanvases());

    this.createAmbientParticles();
    this.setupEventListeners();

    // Start animation loops
    requestAnimationFrame((t) => this.render(t));
    this.initEcg();
  }

  resizeCanvases() {
    if (this.particleCanvas && this.heartStage) {
      const rect = this.heartStage.getBoundingClientRect();
      this.particleCanvas.width = rect.width;
      this.particleCanvas.height = rect.height;
    }

    if (this.ecgCanvas) {
      this.ecgCanvas.width = this.ecgCanvas.parentElement.clientWidth - 20;
      this.ecgCanvas.height = 55;
    }
  }

  createAmbientParticles() {
    const count = 45;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * (this.particleCanvas.width || 400),
        y: Math.random() * (this.particleCanvas.height || 480),
        size: Math.random() * 2.5 + 0.8,
        speedY: -(Math.random() * 0.7 + 0.2),
        speedX: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.4 ? '#ff758c' : '#ffd166'
      });
    }
  }

  setupEventListeners() {
    // Tap or click on heart stage to produce romantic particle burst
    this.heartStage.addEventListener('click', (e) => {
      const rect = this.heartStage.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.spawnHeartBurst(x, y);
      this.triggerMicroBeat();
    });

    // Scan Occupancy Button
    if (this.scanBtn) {
      this.scanBtn.addEventListener('click', () => {
        this.runOccupancyScan();
      });
    }

    // Boost Heart Rate Button
    if (this.boostBtn) {
      this.boostBtn.addEventListener('click', () => {
        this.accelerateBpm();
      });
    }
  }

  spawnHeartBurst(x, y) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = Math.random() * 3 + 1.5;
      this.ambientHearts.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() * 14 + 10,
        alpha: 1,
        rotation: Math.random() * Math.PI,
        color: Math.random() > 0.5 ? '#ff2a6d' : '#ff758c'
      });
    }
  }

  triggerMicroBeat() {
    // Micro scale bounce on tap
    this.heartSvg.style.transform = 'scale(1.08)';
    setTimeout(() => {
      this.heartSvg.style.transform = '';
    }, 180);
  }

  accelerateBpm() {
    const stages = [
      { bpm: 105, label: "Resting rate while thinking of Eman: 105 BPM" },
      { bpm: 135, label: "Heart rate when Eman texts: 135 BPM!" },
      { bpm: 160, label: "Heart rate when Eman smiles: 160 BPM!!" },
      { bpm: 185, label: "MAX TACHYCARDIA: Eman is near! 185 BPM! ❤️" }
    ];

    // Find next stage
    const next = stages.find(s => s.bpm > this.bpm) || stages[0];
    this.setBpm(next.bpm);

    if (this.verdictText) {
      this.verdictText.innerHTML = `<strong>Cardiac Update:</strong> ${next.label}`;
    }

    // Spawn celebration particles
    if (this.particleCanvas) {
      this.spawnHeartBurst(this.particleCanvas.width / 2, this.particleCanvas.height / 2);
    }
  }

  setBpm(newBpm) {
    this.bpm = newBpm;
    this.bpmCounter.textContent = newBpm;

    // Adjust CSS animation duration: 60s / bpm = seconds per beat
    const beatDuration = (60 / newBpm).toFixed(2);
    this.heartSvg.style.animationDuration = `${beatDuration}s`;
  }

  runOccupancyScan() {
    if (this.isScanning) return;
    this.isScanning = true;
    this.scanBtn.disabled = true;
    this.scanBtnText.textContent = "Scanning Chambers...";

    let progress = 0;
    const duration = 2400; // ms
    const startTime = performance.now();

    // Sound effect trigger if interaction engine has audio
    if (window.romanticAudio && window.romanticAudio.playChime) {
      window.romanticAudio.playChime();
    }

    const scanStep = (time) => {
      const elapsed = time - startTime;
      progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentPercent = Math.floor(eased * 100);

      // Update counter
      this.occupancyPercent.textContent = `${currentPercent}%`;

      // Update liquid Y: from 520 (empty) to 120 (fully flooded)
      const targetY = 520 - (400 * eased);
      this.emanLiquidFill.setAttribute('y', targetY);

      if (progress < 1) {
        requestAnimationFrame(scanStep);
      } else {
        this.completeScan();
      }
    };

    requestAnimationFrame(scanStep);
  }

  completeScan() {
    this.isScanning = false;
    this.isFullyOccupied = true;
    this.occupancyPercent.textContent = '100%';
    this.scanBtnText.textContent = '100% Fully Occupied';
    this.scanBtn.classList.remove('pulse-btn');
    this.scanBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

    // Glowing watermark highlight
    if (this.emanWatermark) {
      this.emanWatermark.style.fill = 'rgba(255, 255, 255, 0.85)';
      this.emanWatermark.style.filter = 'drop-shadow(0 0 12px #ff2a6d)';
    }

    // Update Verdict
    if (this.verdictText) {
      this.verdictText.innerHTML = `
        <strong>Scan Complete:</strong> Inhabitant confirmed as <span style="color:#ffd166; font-weight:700;">Eman</span>. 
        She occupies <strong>100.0%</strong> of the heart's volume (0.0% free space). 
        <br/><em>Note: Abdallah only generates the beat; Eman owns every chamber.</em>
      `;
    }

    // Fireworks confetti burst
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff2a6d', '#ff758c', '#ffd166', '#ffffff']
      });
    }

    // Bump BPM to excited rate
    this.setBpm(120);
  }

  // Real-time Canvas Rendering
  render(timestamp) {
    const w = this.particleCanvas.width;
    const h = this.particleCanvas.height;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Render ambient floating particles
    for (let p of this.particles) {
      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y < 0) p.y = h;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();
    }

    // 2. Render Heart Particles (Burst effects)
    for (let i = this.ambientHearts.length - 1; i >= 0; i--) {
      const hObj = this.ambientHearts[i];
      hObj.x += hObj.vx;
      hObj.y += hObj.vy;
      hObj.alpha -= 0.018;

      if (hObj.alpha <= 0) {
        this.ambientHearts.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(hObj.x, hObj.y);
      this.ctx.scale(hObj.size / 20, hObj.size / 20);
      this.ctx.globalAlpha = Math.max(0, hObj.alpha);
      this.ctx.fillStyle = hObj.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = hObj.color;

      // Draw mini heart shape
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.bezierCurveTo(-5, -7, -12, -2, -12, 5);
      this.ctx.bezierCurveTo(-12, 12, -3, 18, 0, 22);
      this.ctx.bezierCurveTo(3, 18, 12, 12, 12, 5);
      this.ctx.bezierCurveTo(12, -2, 5, -7, 0, 0);
      this.ctx.fill();

      this.ctx.restore();
    }

    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;

    requestAnimationFrame((t) => this.render(t));
  }

  // ECG Line Simulation
  initEcg() {
    const w = this.ecgCanvas.width;
    const h = this.ecgCanvas.height;
    const midY = h / 2;

    let x = 0;
    const speed = 2.2;
    const points = [];
    const maxPoints = Math.floor(w / speed);

    let cyclePos = 0;

    const drawEcg = () => {
      this.ecgCtx.fillStyle = 'rgba(5, 2, 8, 0.18)';
      this.ecgCtx.fillRect(0, 0, w, h);

      // Draw subtle phosphor grid
      this.ecgCtx.strokeStyle = 'rgba(255, 42, 109, 0.06)';
      this.ecgCtx.lineWidth = 1;
      this.ecgCtx.beginPath();
      for (let gridX = 0; gridX < w; gridX += 20) {
        this.ecgCtx.moveTo(gridX, 0);
        this.ecgCtx.lineTo(gridX, h);
      }
      for (let gridY = 0; gridY < h; gridY += 15) {
        this.ecgCtx.moveTo(0, gridY);
        this.ecgCtx.lineTo(w, gridY);
      }
      this.ecgCtx.stroke();

      // Cycle calculation based on BPM
      const cycleLength = (60 / this.bpm) * 60; // frames per beat
      cyclePos = (cyclePos + 1) % cycleLength;
      const progress = cyclePos / cycleLength;

      let y = midY;

      // P-Q-R-S-T Waveform approximation
      if (progress > 0.15 && progress < 0.22) {
        // P Wave (Atrial depolarization)
        y = midY - Math.sin((progress - 0.15) / 0.07 * Math.PI) * 5;
      } else if (progress >= 0.25 && progress < 0.27) {
        // Q Dip
        y = midY + 4;
      } else if (progress >= 0.27 && progress < 0.32) {
        // R Peak (Ventricles pumping for Eman!)
        y = midY - 24;
      } else if (progress >= 0.32 && progress < 0.35) {
        // S Dip
        y = midY + 8;
      } else if (progress > 0.42 && progress < 0.55) {
        // T Wave
        y = midY - Math.sin((progress - 0.42) / 0.13 * Math.PI) * 7;
      }

      points.push(y);
      if (points.length > maxPoints) {
        points.shift();
      }

      // Render ECG Glowing Trace
      this.ecgCtx.beginPath();
      this.ecgCtx.strokeStyle = '#ff2a6d';
      this.ecgCtx.lineWidth = 2;
      this.ecgCtx.shadowBlur = 8;
      this.ecgCtx.shadowColor = '#ff2a6d';

      for (let i = 0; i < points.length; i++) {
        const px = i * speed;
        const py = points[i];
        if (i === 0) {
          this.ecgCtx.moveTo(px, py);
        } else {
          this.ecgCtx.lineTo(px, py);
        }
      }
      this.ecgCtx.stroke();
      this.ecgCtx.shadowBlur = 0;

      // Leading Glowing Scanning Dot
      if (points.length > 0) {
        const headX = (points.length - 1) * speed;
        const headY = points[points.length - 1];
        this.ecgCtx.beginPath();
        this.ecgCtx.arc(headX, headY, 3, 0, Math.PI * 2);
        this.ecgCtx.fillStyle = '#ffd166';
        this.ecgCtx.shadowBlur = 10;
        this.ecgCtx.shadowColor = '#ffd166';
        this.ecgCtx.fill();
        this.ecgCtx.shadowBlur = 0;
      }

      requestAnimationFrame(drawEcg);
    };

    drawEcg();
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.heartVisualizer = new HeartVisualizer();
});
