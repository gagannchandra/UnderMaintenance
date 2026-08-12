/* Plug Connect Arcade v2.0 - Ultra Polish Edition
   Pro-Luce Maintenance Mini-Game with Power-ups, Electrical Arcs, Particles & Web Audio Synthesizer
*/

(function () {
  'use strict';

  // Web Audio Synthesizer for Zero-Asset Sound Effects
  class SoundFX {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playConnect() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    playSpark() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    playPowerUp() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    playHit() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  const sfx = new SoundFX();

  // Game Engine Variables
  let modal, canvas, ctx;
  let animId = null;
  let isPlaying = false;
  let isGameOver = false;

  let score = 0;
  let highScore = parseInt(localStorage.getItem('proluce_plug_highscore') || '0', 10);
  let lives = 3;
  let combo = 1;
  let level = 1;

  // Active Power-up Statuses
  let activePowerUps = {
    shield: false,
    magnetTimer: 0,
    slowTimer: 0,
    doubleTimer: 0
  };

  // Player State
  let player = {
    x: 365,
    y: 440,
    width: 70,
    height: 45,
    speed: 9.5
  };

  // Dynamic Game Collections
  let items = [];
  let particles = [];
  let floatingTexts = [];
  let electricalArcs = [];
  let playerTrail = [];

  let keys = { left: false, right: false };
  let spawnTimer = 0;
  let screenShakeTimer = 0;

  // Initialize UI & Event Listeners
  function initGameUI() {
    modal = document.getElementById('game-modal');
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    const openBtn = document.getElementById('open-game-btn');
    const illustration = document.querySelector('.illustration-container');
    const closeBtn = document.getElementById('close-game-btn');
    const restartBtn = document.getElementById('restart-game-btn');

    if (openBtn) openBtn.addEventListener('click', openGameModal);
    if (illustration) {
      illustration.style.cursor = 'pointer';
      illustration.addEventListener('click', openGameModal);
    }
    if (closeBtn) closeBtn.addEventListener('click', closeGameModal);
    if (restartBtn) restartBtn.addEventListener('click', startGame);

    // Keyboard Input
    window.addEventListener('keydown', (e) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
      if (e.key === 'Escape') closeGameModal();
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    });

    // Pointer & Touch Controls
    canvas.addEventListener('mousemove', (e) => {
      if (!isPlaying || isGameOver) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const scaleX = canvas.width / rect.width;
      player.x = mouseX * scaleX - player.width / 2;
    });

    canvas.addEventListener('touchmove', (e) => {
      if (!isPlaying || isGameOver) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const scaleX = canvas.width / rect.width;
      player.x = touchX * scaleX - player.width / 2;
    }, { passive: false });

    // Touch Buttons for Mobile
    const leftTouch = document.getElementById('touch-left');
    const rightTouch = document.getElementById('touch-right');

    if (leftTouch) {
      leftTouch.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
      leftTouch.addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; });
    }
    if (rightTouch) {
      rightTouch.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
      rightTouch.addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; });
    }

    updateHighScoreUI();
  }

  function openGameModal() {
    sfx.init();
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    startGame();
  }

  function closeGameModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
  }

  function startGame() {
    score = 0;
    lives = 3;
    combo = 1;
    level = 1;
    isGameOver = false;
    isPlaying = true;
    items = [];
    particles = [];
    floatingTexts = [];
    electricalArcs = [];
    playerTrail = [];
    spawnTimer = 0;
    screenShakeTimer = 0;

    activePowerUps = {
      shield: false,
      magnetTimer: 0,
      slowTimer: 0,
      doubleTimer: 0
    };

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 60;

    document.getElementById('game-over-screen').classList.remove('active');
    updateScoreUI();

    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(gameLoop);
  }

  function updateScoreUI() {
    document.getElementById('score-val').textContent = score;
    document.getElementById('combo-val').textContent = 'x' + (activePowerUps.doubleTimer > 0 ? combo * 2 : combo);
    document.getElementById('lives-val').textContent = '❤️'.repeat(Math.max(0, lives));
  }

  function updateHighScoreUI() {
    const el = document.getElementById('highscore-val');
    if (el) el.textContent = highScore;
  }

  function addFloatingText(x, y, text, color = '#009FE3') {
    floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1,
      vy: -1.5
    });
  }

  function addElectricalArc(x1, y1, x2, y2, color = '#00E65C') {
    electricalArcs.push({
      x1, y1, x2, y2,
      color: color,
      life: 0.15
    });
  }

  function spawnItem() {
    const rand = Math.random();
    let type = 'socket';

    if (rand < 0.45) {
      type = 'socket'; // 45% Green Socket
    } else if (rand < 0.72) {
      type = 'spark'; // 27% Cyan Spark
    } else if (rand < 0.88) {
      type = 'red_spark'; // 16% Red Obstacle
    } else {
      // 12% Power-up Drop
      const pRand = Math.random();
      if (pRand < 0.35) type = 'p_shield';
      else if (pRand < 0.70) type = 'p_magnet';
      else type = 'p_double';
    }

    const baseSpeed = 2.5 + Math.random() * 2 + Math.min(score / 600, 3.5);
    const speed = activePowerUps.slowTimer > 0 ? baseSpeed * 0.5 : baseSpeed;

    items.push({
      x: Math.random() * (canvas.width - 60) + 30,
      y: -30,
      radius: type === 'socket' ? 22 : (type.startsWith('p_') ? 16 : 14),
      type: type,
      speed: speed
    });
  }

  function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        radius: Math.random() * 4 + 2,
        color: color,
        alpha: 1,
        life: 0.04
      });
    }
  }

  // 60 FPS Game Render Loop
  function gameLoop() {
    if (!isPlaying) return;

    // Apply Screen Shake if active
    ctx.save();
    if (screenShakeTimer > 0) {
      const shakeX = (Math.random() - 0.5) * 8;
      const shakeY = (Math.random() - 0.5) * 8;
      ctx.translate(shakeX, shakeY);
      screenShakeTimer--;
    }

    // Clear and Draw Light Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

    // Subtle background grid pattern
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Update Power-up Timers
    if (activePowerUps.magnetTimer > 0) activePowerUps.magnetTimer--;
    if (activePowerUps.slowTimer > 0) activePowerUps.slowTimer--;
    if (activePowerUps.doubleTimer > 0) activePowerUps.doubleTimer--;

    // Move Player
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    player.x = Math.max(10, Math.min(canvas.width - player.width - 10, player.x));

    // Player Motion Trail
    playerTrail.push({ x: player.x + player.width / 2, y: player.y + player.height / 2, alpha: 0.4 });
    if (playerTrail.length > 8) playerTrail.shift();

    for (let i = 0; i < playerTrail.length; i++) {
      const t = playerTrail[i];
      t.alpha -= 0.04;
      if (t.alpha > 0) {
        ctx.fillStyle = `rgba(0, 159, 227, ${t.alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 16 * (i / playerTrail.length), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Player Plug
    drawPlayerPlug(player.x, player.y);

    // Magnet Power-up Ring Effect
    if (activePowerUps.magnetTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 159, 227, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + 10, 160, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Item Spawning
    spawnTimer++;
    if (spawnTimer > Math.max(22, 45 - Math.floor(score / 300))) {
      spawnItem();
      spawnTimer = 0;
    }

    // Update and Draw Items
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];

      // Magnet pull logic
      if (activePowerUps.magnetTimer > 0 && (item.type === 'socket' || item.type === 'spark' || item.type.startsWith('p_'))) {
        const dx = (player.x + player.width / 2) - item.x;
        const dy = player.y - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 220) {
          item.x += (dx / dist) * 5;
          item.y += (dy / dist) * 5;
        }
      }

      item.y += item.speed;

      // Draw Specific Item Type
      if (item.type === 'socket') {
        // Green Socket Body
        ctx.save();
        ctx.fillStyle = '#00E65C';
        ctx.shadowColor = 'rgba(0, 230, 92, 0.4)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(item.x - 18, item.y - 15, 36, 30, 6);
        ctx.fill();
        ctx.fillStyle = '#005824';
        ctx.fillRect(item.x - 9, item.y - 9, 5, 18);
        ctx.fillRect(item.x + 4, item.y - 9, 5, 18);
        ctx.restore();
      } else if (item.type === 'spark') {
        // Cyan Spark
        ctx.save();
        ctx.fillStyle = '#009FE3';
        ctx.shadowColor = 'rgba(0, 159, 227, 0.5)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (item.type === 'red_spark') {
        // Red Obstacle
        ctx.save();
        ctx.fillStyle = '#FF3355';
        ctx.shadowColor = 'rgba(255, 51, 85, 0.5)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (item.type.startsWith('p_')) {
        // Power-Up Drops
        ctx.save();
        let badgeColor = '#009FE3';
        let badgeIcon = '🛡️';

        if (item.type === 'p_magnet') { badgeColor = '#9B51E0'; badgeIcon = '🧲'; }
        if (item.type === 'p_double') { badgeColor = '#F2994A'; badgeIcon = '⭐'; }

        ctx.fillStyle = badgeColor;
        ctx.shadowColor = badgeColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeIcon, item.x, item.y);
        ctx.restore();
      }

      // Collision Detection
      const px = player.x + player.width / 2;
      const py = player.y + 10;
      const dist = Math.hypot((item.x - px), (item.y - py));

      if (dist < item.radius + player.width / 2.2) {
        const scoreMult = activePowerUps.doubleTimer > 0 ? 2 : 1;

        if (item.type === 'socket') {
          const points = 100 * combo * scoreMult;
          score += points;
          combo++;
          sfx.playConnect();
          createParticles(item.x, item.y, '#00E65C', 14);
          addFloatingText(item.x, item.y - 10, '+' + points, '#00C853');
          addElectricalArc(px, py, item.x, item.y, '#00E65C');
        } else if (item.type === 'spark') {
          const points = 50 * combo * scoreMult;
          score += points;
          sfx.playSpark();
          createParticles(item.x, item.y, '#009FE3', 10);
          addFloatingText(item.x, item.y - 10, '+' + points, '#009FE3');
        } else if (item.type === 'red_spark') {
          if (activePowerUps.shield) {
            activePowerUps.shield = false;
            sfx.playSpark();
            createParticles(item.x, item.y, '#009FE3', 16);
            addFloatingText(item.x, item.y - 10, 'SHIELD BROKEN!', '#009FE3');
          } else {
            lives--;
            combo = 1;
            screenShakeTimer = 12;
            sfx.playHit();
            createParticles(item.x, item.y, '#FF3355', 18);
            addFloatingText(item.x, item.y - 10, 'HIT!', '#FF3355');
            if (lives <= 0) triggerGameOver();
          }
        } else if (item.type.startsWith('p_')) {
          sfx.playPowerUp();
          if (item.type === 'p_shield') {
            activePowerUps.shield = true;
            addFloatingText(item.x, item.y - 10, 'SHIELD ACTIVE! 🛡️', '#009FE3');
          } else if (item.type === 'p_magnet') {
            activePowerUps.magnetTimer = 300; // ~5 seconds
            addFloatingText(item.x, item.y - 10, 'MAGNET ACTIVE! 🧲', '#9B51E0');
          } else if (item.type === 'p_double') {
            activePowerUps.doubleTimer = 360; // ~6 seconds
            addFloatingText(item.x, item.y - 10, '2X POINTS! ⭐', '#F2994A');
          }
        }

        // Level Up Threshold Check
        const newLevel = Math.floor(score / 1000) + 1;
        if (newLevel > level) {
          level = newLevel;
          addFloatingText(canvas.width / 2, 100, 'LEVEL ' + level + '!', '#111111');
        }

        updateScoreUI();
        items.splice(i, 1);
        continue;
      }

      // Remove Items Off Screen
      if (item.y > canvas.height + 40) {
        if (item.type === 'socket') {
          combo = 1;
          updateScoreUI();
        }
        items.splice(i, 1);
      }
    }

    // Render Electrical Arcs
    for (let i = electricalArcs.length - 1; i >= 0; i--) {
      const arc = electricalArcs[i];
      arc.life -= 0.02;
      if (arc.life <= 0) {
        electricalArcs.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = arc.life * 5;
      ctx.beginPath();
      ctx.moveTo(arc.x1, arc.y1);
      const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 20;
      const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 20;
      ctx.lineTo(midX, midY);
      ctx.lineTo(arc.x2, arc.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.life;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Floating Text Effects
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;

      if (ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore(); // Restore screen shake state

    if (isPlaying && !isGameOver) {
      animId = requestAnimationFrame(gameLoop);
    }
  }

  // Draw Player Blue Male Plug
  function drawPlayerPlug(x, y) {
    ctx.save();

    // Shield Aura if active
    if (activePowerUps.shield) {
      ctx.strokeStyle = '#009FE3';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#009FE3';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x + player.width / 2, y + player.height / 2, player.width / 1.4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Plug Body
    ctx.fillStyle = '#0077E6';
    ctx.shadowColor = 'rgba(0, 119, 230, 0.2)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(x, y, player.width, player.height, 8);
    ctx.fill();

    // Front Accent Block
    ctx.fillStyle = '#009FE3';
    ctx.beginPath();
    ctx.roundRect(x + 14, y - 8, player.width - 28, 18, 4);
    ctx.fill();

    // Prongs (sticking up)
    ctx.fillStyle = '#009FE3';
    ctx.fillRect(x + 16, y - 24, 9, 16);
    ctx.fillRect(x + player.width - 25, y - 24, 9, 16);

    // Glow Accent Inner
    ctx.fillStyle = '#42C0FB';
    ctx.fillRect(x + 20, y + 12, player.width - 40, 14);
    ctx.restore();
  }

  function triggerGameOver() {
    isGameOver = true;
    isPlaying = false;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('proluce_plug_highscore', highScore.toString());
      updateHighScoreUI();
    }

    document.getElementById('final-score').textContent = score;
    document.getElementById('final-highscore').textContent = highScore;
    document.getElementById('game-over-screen').classList.add('active');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGameUI);
  } else {
    initGameUI();
  }
})();
