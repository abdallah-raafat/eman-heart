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
    this.emanBoldPlate = document.getElementById('emanBoldPlate');
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
    window.addEventListener('orientationchange', () => setTimeout(() => this.resizeCanvases(), 200));

    this.createAmbientParticles();
    this.setupEventListeners();

    // Start animation loops
    requestAnimationFrame((t) => this.render(t));
    this.initEcg();
  }

  resizeCanvases() {
    if (this.particleCanvas && this.heartStage) {
      const rect = this.heartStage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.particleCanvas.width = rect.width * dpr;
      this.particleCanvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.canvasWidth = rect.width;
      this.canvasHeight = rect.height;
    }

    if (this.ecgCanvas) {
      const containerWidth = this.ecgCanvas.parentElement.clientWidth - 20;
      this.ecgCanvas.width = containerWidth;
      this.ecgCanvas.height = 48;
    }
  }

  createAmbientParticles() {
    const isMobile = window.innerWidth <= 430;
    const count = isMobile ? 28 : 45;
    this.particles = [];
    const w = this.canvasWidth || 380;
    const h = this.canvasHeight || 450;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.2 + 0.8,
        speedY: -(Math.random() * 0.6 + 0.2),
        speedX: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.6 + 0.25,
        color: Math.random() > 0.4 ? '#ff758c' : '#ffd166'
      });
    }
  }

  setupEventListeners() {
    // Tap or click on heart stage to produce romantic particle burst
    const handleStageTouch = (e) => {
      const rect = this.heartStage.getBoundingClientRect();
      let clientX = e.clientX;
      let clientY = e.clientY;

      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }

      if (clientX !== undefined && clientY !== undefined) {
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        this.spawnHeartBurst(x, y);
      }
      this.triggerMicroBeat();
    };

    this.heartStage.addEventListener('click', handleStageTouch);
    this.heartStage.addEventListener('touchstart', handleStageTouch, { passive: true });

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
        size: Math.random() * 12 + 8,
        alpha: 1,
        color: Math.random() > 0.5 ? '#ff2a6d' : '#ffd166'
      });
    }
  }

  triggerMicroBeat() {
    this.heartSvg.style.transform = 'scale(1.06)';
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

    const next = stages.find(s => s.bpm > this.bpm) || stages[0];
    this.setBpm(next.bpm);

    if (this.verdictText) {
      this.verdictText.innerHTML = `<strong>Cardiac Update:</strong> ${next.label}`;
    }

    this.spawnHeartBurst((this.canvasWidth || 380) / 2, (this.canvasHeight || 450) / 2);
  }

  setBpm(newBpm) {
    this.bpm = newBpm;
    this.bpmCounter.textContent = newBpm;

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

    if (window.romanticAudio && window.romanticAudio.playChime) {
      window.romanticAudio.playChime();
    }

    const scanStep = (time) => {
      const elapsed = time - startTime;
      progress = Math.min(elapsed / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);
      const currentPercent = Math.floor(eased * 100);

      this.occupancyPercent.textContent = `${currentPercent}%`;

      // Fill liquid from 520 to 110
      const targetY = 520 - (410 * eased);
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

    // Highlight the bold Eman plate
    if (this.emanBoldPlate) {
      this.emanBoldPlate.classList.add('scan-complete');
    }

    if (this.verdictText) {
      this.verdictText.innerHTML = `
        <strong>Scan Complete:</strong> Inhabitant confirmed as <span style="color:#ffd166; font-weight:800;">EMAN</span>. 
        She occupies <strong>100.0%</strong> of the heart's volume (0.0% free space). 
        <br/><em>Abdallah provides the beat; Eman owns the entire heart.</em>
      `;
    }

    if (typeof confetti === 'function') {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff2a6d', '#ff758c', '#ffd166', '#ffffff']
      });
    }

    this.setBpm(120);
  }

  render(timestamp) {
    const w = this.canvasWidth || 380;
    const h = this.canvasHeight || 450;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Ambient particles
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
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();
    }

    // 2. Heart Burst particles
    for (let i = this.ambientHearts.length - 1; i >= 0; i--) {
      const hObj = this.ambientHearts[i];
      hObj.x += hObj.vx;
      hObj.y += hObj.vy;
      hObj.alpha -= 0.02;

      if (hObj.alpha <= 0) {
        this.ambientHearts.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(hObj.x, hObj.y);
      this.ctx.scale(hObj.size / 20, hObj.size / 20);
      this.ctx.globalAlpha = Math.max(0, hObj.alpha);
      this.ctx.fillStyle = hObj.color;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = hObj.color;

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

  initEcg() {
    const w = this.ecgCanvas.width;
    const h = this.ecgCanvas.height;
    const midY = h / 2;

    const speed = 2.0;
    const points = [];
    const maxPoints = Math.floor(w / speed);

    let cyclePos = 0;

    const drawEcg = () => {
      this.ecgCtx.fillStyle = 'rgba(5, 2, 8, 0.2)';
      this.ecgCtx.fillRect(0, 0, w, h);

      // Phosphor grid
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

      const cycleLength = (60 / this.bpm) * 60;
      cyclePos = (cyclePos + 1) % cycleLength;
      const progress = cyclePos / cycleLength;

      let y = midY;

      if (progress > 0.15 && progress < 0.22) {
        y = midY - Math.sin((progress - 0.15) / 0.07 * Math.PI) * 4.5;
      } else if (progress >= 0.25 && progress < 0.27) {
        y = midY + 4;
      } else if (progress >= 0.27 && progress < 0.32) {
        y = midY - 21;
      } else if (progress >= 0.32 && progress < 0.35) {
        y = midY + 7;
      } else if (progress > 0.42 && progress < 0.55) {
        y = midY - Math.sin((progress - 0.42) / 0.13 * Math.PI) * 6;
      }

      points.push(y);
      if (points.length > maxPoints) {
        points.shift();
      }

      this.ecgCtx.beginPath();
      this.ecgCtx.strokeStyle = '#ff2a6d';
      this.ecgCtx.lineWidth = 2;
      this.ecgCtx.shadowBlur = 7;
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

      if (points.length > 0) {
        const headX = (points.length - 1) * speed;
        const headY = points[points.length - 1];
        this.ecgCtx.beginPath();
        this.ecgCtx.arc(headX, headY, 2.8, 0, Math.PI * 2);
        this.ecgCtx.fillStyle = '#ffd166';
        this.ecgCtx.shadowBlur = 8;
        this.ecgCtx.shadowColor = '#ffd166';
        this.ecgCtx.fill();
        this.ecgCtx.shadowBlur = 0;
      }

      requestAnimationFrame(drawEcg);
    };

    drawEcg();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.heartVisualizer = new HeartVisualizer();
});
