/* ==========================================================================
   INTERACTION ENGINE, TAMER ASHOUR AUDIO & REALTIME ANDROID <-> IPHONE SYNC
   - Tamer Ashour "سيب ايدك والباقي عليا" 30-sec official clip
   - Real-time MQTT WebSocket presence (Connected only when both are on)
   - Real-time two-way Vibrate / Heartbeat pulse (Android & iPhone haptics)
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. Tamer Ashour Audio Player
// --------------------------------------------------------------------------
class TamerAshourPlayer {
  constructor() {
    this.audio = document.getElementById('bgMusic');
    this.btn = document.getElementById('audioToggle');
    this.label = document.getElementById('audioLabel');
    this.isPlaying = false;

    if (this.btn && this.audio) {
      this.btn.addEventListener('click', () => this.toggle());
      this.audio.addEventListener('play', () => this.onPlay());
      this.audio.addEventListener('pause', () => this.onPause());
      this.audio.addEventListener('ended', () => this.onPause());
    }
  }

  toggle() {
    if (!this.audio) return;
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.audio) return;
    this.audio.play().then(() => {
      this.onPlay();
    }).catch(err => {
      console.log('Audio autoplay prevented, user interaction required:', err);
    });
  }

  onPlay() {
    this.isPlaying = true;
    if (this.btn) this.btn.classList.add('playing');
    if (this.label) this.label.textContent = "تامر عاشور 🎵 (شغال)";
  }

  onPause() {
    this.isPlaying = false;
    if (this.btn) this.btn.classList.remove('playing');
    if (this.label) this.label.textContent = "تامر عاشور 🎵";
  }
}

// --------------------------------------------------------------------------
// 2. Heavy Physical Vibration & Intense Site Vibration Engine
// --------------------------------------------------------------------------
function playIntenseSubBassHaptic() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Dual lub-DUB heavy sub-bass acoustic rumble
    const now = ctx.currentTime;
    [
      { freq: 48, start: now, dur: 0.28, gain: 1.2 },
      { freq: 36, start: now + 0.32, dur: 0.45, gain: 1.4 }
    ].forEach(p => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(p.freq, p.start);
      osc.frequency.exponentialRampToValueAtTime(20, p.start + p.dur);

      gain.gain.setValueAtTime(p.gain, p.start);
      gain.gain.exponentialRampToValueAtTime(0.001, p.start + p.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(p.start);
      osc.stop(p.start + p.dur);
    });
  } catch (e) {
    console.log('Sub-bass haptic note:', e);
  }
}

function triggerIntenseVibrationAndSiteShake() {
  // 1. Heavy Physical Vibration (Android navigator.vibrate)
  if ('vibrate' in navigator) {
    try {
      // Powerful multi-pulse heartbeat pattern lasting nearly 3 seconds
      navigator.vibrate([450, 120, 450, 120, 700, 150, 900]);
    } catch (e) {
      console.log('Vibration API error:', e);
    }
  }

  // 2. Mechanical Acoustic Speaker Rumble (iPhone and all devices)
  playIntenseSubBassHaptic();

  // 3. Heavy Site Vibration (Screen & Viewport Shake)
  const appContainer = document.querySelector('.app-container');
  document.body.classList.remove('site-vibrating');
  if (appContainer) appContainer.classList.remove('site-vibrating');

  void document.body.offsetWidth; // Force reflow
  document.body.classList.add('site-vibrating');
  if (appContainer) appContainer.classList.add('site-vibrating');

  // 4. Full-Screen Visual Cardiac Flash
  const flash = document.getElementById('vibrationFlash');
  if (flash) {
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 280);
  }

  // 5. Anatomical Heart Expansion & Shimmer
  const heart = document.getElementById('anatomicalHeartSvg');
  if (heart) {
    heart.classList.add('heart-vibrating');
    setTimeout(() => heart.classList.remove('heart-vibrating'), 1400);
  }

  setTimeout(() => {
    document.body.classList.remove('site-vibrating');
    if (appContainer) appContainer.classList.remove('site-vibrating');
  }, 1450);

  // 6. Particle Burst on Heart Stage
  if (window.heartVisualizer && window.heartVisualizer.spawnHeartBurst) {
    const stage = document.getElementById('heartStage');
    if (stage) {
      const rect = stage.getBoundingClientRect();
      window.heartVisualizer.spawnHeartBurst(rect.width / 2, rect.height / 2);
    }
  }
}

// --------------------------------------------------------------------------
// 3. Real-Time Peer Sync Network (Android <-> iPhone via MQTT WebSocket)
// --------------------------------------------------------------------------
class HeartSyncNetwork {
  constructor() {
    this.syncDot = document.getElementById('syncDot');
    this.syncStatusText = document.getElementById('syncStatusText');
    this.roleToggleBtn = document.getElementById('roleToggleBtn');
    this.roleName = document.getElementById('roleName');
    this.sendPulseBtn = document.getElementById('sendPulseBtn');
    this.pulseBtnText = document.getElementById('pulseBtnText');
    this.pulseToast = document.getElementById('pulseToast');
    this.pulseToastTitle = document.getElementById('pulseToastTitle');
    this.pulseToastDesc = document.getElementById('pulseToastDesc');

    // Channels
    this.TOPIC_PRESENCE = 'eman_abdallah_heart_2026/presence';
    this.TOPIC_PULSE = 'eman_abdallah_heart_2026/pulse';

    // State
    this.myRole = this.detectRole();
    this.partnerRole = this.myRole === 'abdallah' ? 'eman' : 'abdallah';
    this.partnerOnline = false;
    this.lastPartnerPing = 0;
    this.client = null;
    this.toastTimer = null;

    this.initUI();
    this.connectMQTT();
  }

  detectRole() {
    // 1. URL parameter check
    const params = new URLSearchParams(window.location.search);
    if (params.get('user') === 'abdallah' || params.get('role') === 'abdallah') {
      localStorage.setItem('heart_user_role', 'abdallah');
      return 'abdallah';
    }
    if (params.get('user') === 'eman' || params.get('role') === 'eman') {
      localStorage.setItem('heart_user_role', 'eman');
      return 'eman';
    }

    // 2. Saved local storage
    const saved = localStorage.getItem('heart_user_role');
    if (saved === 'abdallah' || saved === 'eman') {
      return saved;
    }

    // 3. User-Agent detection (Android -> Abdallah, iPhone/other -> Eman)
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) {
      localStorage.setItem('heart_user_role', 'abdallah');
      return 'abdallah';
    } else {
      localStorage.setItem('heart_user_role', 'eman');
      return 'eman';
    }
  }

  initUI() {
    this.updateRoleDisplay();

    // Tap role badge to switch between Abdallah & Eman
    if (this.roleToggleBtn) {
      this.roleToggleBtn.addEventListener('click', () => {
        this.myRole = this.myRole === 'abdallah' ? 'eman' : 'abdallah';
        this.partnerRole = this.myRole === 'abdallah' ? 'eman' : 'abdallah';
        localStorage.setItem('heart_user_role', this.myRole);
        this.updateRoleDisplay();
        this.sendPresence('online');
      });
    }

    // Send Heartbeat / Vibrate button
    if (this.sendPulseBtn) {
      this.sendPulseBtn.addEventListener('click', () => this.sendHeartbeatPulse());
    }
  }

  updateRoleDisplay() {
    if (this.roleName) {
      if (this.myRole === 'abdallah') {
        this.roleName.textContent = "عبدالله (Android)";
      } else {
        this.roleName.textContent = "إيمان (iPhone)";
      }
    }

    if (this.pulseBtnText) {
      if (this.myRole === 'abdallah') {
        this.pulseBtnText.textContent = "ابعت نبضة لـ Eman 💓";
      } else {
        this.pulseBtnText.textContent = "ابعتي نبضة لـ Abdallah 💓";
      }
    }
  }

  connectMQTT() {
    if (typeof mqtt === 'undefined') {
      console.warn('MQTT library loading, retrying in 500ms...');
      setTimeout(() => this.connectMQTT(), 500);
      return;
    }

    const clientId = 'heart_' + this.myRole + '_' + Math.random().toString(16).substr(2, 6);
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

    this.client = mqtt.connect(brokerUrl, {
      clientId: clientId,
      clean: true,
      connectTimeout: 5000,
      keepalive: 15,
      will: {
        topic: this.TOPIC_PRESENCE,
        payload: JSON.stringify({ user: this.myRole, status: 'offline', ts: Date.now() }),
        qos: 1,
        retain: false
      }
    });

    this.client.on('connect', () => {
      console.log('Connected to Heart Sync Network');
      this.client.subscribe([this.TOPIC_PRESENCE, this.TOPIC_PULSE], (err) => {
        if (!err) {
          this.sendPresence('online');
        }
      });
    });

    this.client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (topic === this.TOPIC_PRESENCE) {
          this.handlePresence(payload);
        } else if (topic === this.TOPIC_PULSE) {
          this.handleIncomingPulse(payload);
        }
      } catch (e) {
        console.error('Message parse error:', e);
      }
    });

    // Periodic heartbeat ping every 2.2 seconds
    setInterval(() => {
      this.sendPresence('online');
      this.checkPartnerLiveness();
    }, 2200);

    // Browser close / navigation cleanup
    window.addEventListener('beforeunload', () => {
      this.sendPresence('offline');
    });
    window.addEventListener('pagehide', () => {
      this.sendPresence('offline');
    });
  }

  sendPresence(status) {
    if (this.client && this.client.connected) {
      const data = JSON.stringify({
        user: this.myRole,
        status: status,
        ts: Date.now()
      });
      this.client.publish(this.TOPIC_PRESENCE, data);
    }
  }

  handlePresence(data) {
    if (data.user === this.partnerRole) {
      if (data.status === 'online') {
        this.partnerOnline = true;
        this.lastPartnerPing = Date.now();
        this.updateConnectionState(true);
      } else if (data.status === 'offline') {
        this.partnerOnline = false;
        this.updateConnectionState(false, true);
      }
    }
  }

  checkPartnerLiveness() {
    // If no heartbeat received for > 5 seconds, mark disconnected
    if (this.partnerOnline && (Date.now() - this.lastPartnerPing > 5200)) {
      this.partnerOnline = false;
      this.updateConnectionState(false, true);
    }
  }

  updateConnectionState(isConnected, wasLeft = false) {
    const partnerArabic = this.myRole === 'abdallah' ? 'إيمان' : 'عبدالله';

    if (isConnected) {
      this.syncDot.className = 'sync-dot connected';
      this.syncStatusText.textContent = `🟢 متصلين! قلوبكم بتنبض سوا سوا ❤️`;

      // Turns LIVE (glowing neon gradient) only when TWO devices are connected
      if (this.sendPulseBtn) {
        this.sendPulseBtn.classList.remove('is-idle');
        this.sendPulseBtn.classList.add('is-live');
      }
      if (this.pulseBtnText) {
        this.pulseBtnText.textContent = this.myRole === 'abdallah' ? "ابعت نبضة لـ Eman 💓" : "ابعتي نبضة لـ Abdallah 💓";
      }
    } else {
      this.syncDot.className = wasLeft ? 'sync-dot disconnected' : 'sync-dot';
      if (wasLeft) {
        this.syncStatusText.textContent = `🔴 غير متصل: ${partnerArabic} قفلت الموقع`;
      } else {
        this.syncStatusText.textContent = `🟡 في انتظار دخول ${partnerArabic}... ⏳`;
      }

      // Reverts to GREY / IDLE when not both connected
      if (this.sendPulseBtn) {
        this.sendPulseBtn.classList.remove('is-live');
        this.sendPulseBtn.classList.add('is-idle');
      }
      if (this.pulseBtnText) {
        this.pulseBtnText.textContent = `ابعت نبضة (في انتظار ${partnerArabic}...) ⏳`;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Send Heartbeat Pulse (Only active when both connected, or prompts user)
  // --------------------------------------------------------------------------
  sendHeartbeatPulse() {
    const partnerArabic = this.myRole === 'abdallah' ? 'إيمان' : 'عبدالله';

    // If button is grey (waiting for partner), guide the user
    if (!this.partnerOnline) {
      this.showPulseToast(this.myRole);
      this.pulseToastTitle.textContent = `في انتظار ${partnerArabic}... ⏳`;
      this.pulseToastDesc.textContent = `الزرار لونه رصاصي.. هينور ويبقى لايف أول ما ${partnerArabic} تفتح الموقع معاك!`;
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      return;
    }

    // Both are connected! Trigger full intense phone vibration and site shake
    triggerIntenseVibrationAndSiteShake();

    if (this.client && this.client.connected) {
      const msg = JSON.stringify({
        from: this.myRole,
        to: this.partnerRole,
        ts: Date.now()
      });
      this.client.publish(this.TOPIC_PULSE, msg);
    }

    const originalText = this.pulseBtnText.textContent;
    this.pulseBtnText.textContent = "تم إرسال النبضة واهتزاز الموقع! 🚀";
    this.sendPulseBtn.style.transform = "scale(0.95)";

    setTimeout(() => {
      this.sendPulseBtn.style.transform = "";
      this.pulseBtnText.textContent = originalText;
    }, 1800);
  }

  // --------------------------------------------------------------------------
  // Handle Incoming Pulse from Partner (Vibrates Phone & Shakes Site!)
  // --------------------------------------------------------------------------
  handleIncomingPulse(data) {
    if (data.from === this.partnerRole) {
      console.log('Incoming heartbeat pulse from partner!');

      // Trigger full heavy vibration (phone + site)
      triggerIntenseVibrationAndSiteShake();

      // Show Romantic Toast
      this.showPulseToast(data.from);
    }
  }

  showPulseToast(fromRole) {
    const sender = fromRole === 'abdallah' ? 'عبدالله' : 'إيمان';
    this.pulseToastTitle.textContent = `نبضة قلب قوية من ${sender}! 💓`;
    this.pulseToastDesc.textContent = `${sender} بعتلك نبضة قلب هزت الموقع وتليفونك دلوقتي حالا!`;
    
    this.pulseToast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.pulseToast.classList.remove('show');
    }, 4500);
  }
}

// --------------------------------------------------------------------------
// 4. Hotspots, Runaway Button & Proposal Modal
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  window.tamerPlayer = new TamerAshourPlayer();
  window.heartSync = new HeartSyncNetwork();

  // Hotspots
  const hotspots = document.querySelectorAll('.hotspot');
  const tooltip = document.getElementById('hotspotTooltip');
  const tooltipTitle = document.getElementById('tooltipTitle');
  const tooltipText = document.getElementById('tooltipText');
  let tooltipTimeout;

  hotspots.forEach(spot => {
    const showInfo = (e) => {
      if (e) e.stopPropagation();
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
    spot.addEventListener('touchend', showInfo, { passive: true });
  });

  document.addEventListener('click', () => {
    if (tooltip) tooltip.classList.remove('visible');
  });

  // Playful Runaway "NO" Button
  const noBtn = document.getElementById('noBtn');
  const yesBtn = document.getElementById('yesBtn');
  const choiceContainer = document.getElementById('choiceContainer');
  const runawayFeedback = document.getElementById('runawayFeedback');

  let runawayAttempts = 0;
  const runawayMessages = [
    "سيب ايدك والباقي عليا.. الزرار ده مش شغال 😉",
    "Cardiology Alert: 'No' is physically impossible!",
    "مش هتعرفي تهربي من قلبي يا إيمان! ❤️",
    "زرار الـ NO عطلان.. مفيش غير YES! 💕",
    "قلبي حول اختيارك لـ YES أوتوماتيك! 🚀"
  ];

  const dodgeNoBtn = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    runawayAttempts++;
    const msg = runawayMessages[(runawayAttempts - 1) % runawayMessages.length];
    runawayFeedback.textContent = msg;

    const isMobile = window.innerWidth <= 430;
    const maxOffsetX = isMobile 
      ? Math.min((window.innerWidth - 120) / 2, 75)
      : Math.min((window.innerWidth * 0.35), 140);
    const maxOffsetY = isMobile ? 45 : 65;

    let randX = (Math.random() - 0.5) * 2 * maxOffsetX;
    let randY = (Math.random() - 0.5) * 2 * maxOffsetY;

    if (Math.abs(randX) < 30) randX = randX >= 0 ? 45 : -45;
    if (Math.abs(randY) < 22) randY = randY >= 0 ? 35 : -35;

    noBtn.style.transform = `translate3d(${randX}px, ${randY}px, 0)`;

    const currentScale = 1 + Math.min(runawayAttempts * 0.04, 0.3);
    yesBtn.style.transform = `scale(${currentScale})`;
  };

  noBtn.addEventListener('mouseenter', dodgeNoBtn);
  noBtn.addEventListener('touchstart', dodgeNoBtn, { passive: false });
  noBtn.addEventListener('pointerdown', dodgeNoBtn);
  noBtn.addEventListener('click', dodgeNoBtn);

  // YES Button Celebration & Love Letter
  const letterModal = document.getElementById('letterModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const replayLoveBtn = document.getElementById('replayLoveBtn');

  const triggerCelebration = () => {
    // Start Tamer Ashour song!
    if (window.tamerPlayer) {
      window.tamerPlayer.play();
    }

    runawayFeedback.textContent = "سيب ايدك والباقي عليا.. حبك انت في حتة لوحده ❤️💍";
    runawayFeedback.style.color = "#ffd166";

    // Confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.65 },
        colors: ['#ff1493', '#ff69b4', '#ffd166', '#ffffff']
      });

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

    setTimeout(() => {
      letterModal.classList.add('active');
    }, 550);
  };

  yesBtn.addEventListener('click', triggerCelebration);
  yesBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    triggerCelebration();
  });

  // Modal Controls
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
        particleCount: 90,
        spread: 75,
        origin: { y: 0.5 },
        colors: ['#ff2a6d', '#ffd166', '#ff758c', '#ffffff']
      });
    }
    if (window.tamerPlayer) {
      window.tamerPlayer.play();
    }
  });
});
