// =========================================================
// Un pequeño universo para ti — lógica de la experiencia
// =========================================================

(function () {
  'use strict';

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. CAMPO DE ESTRELLAS + ESTRELLAS FUGACES
     ========================================================= */

  const starsCanvas = document.getElementById('starsCanvas');
  const starsCtx = starsCanvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let stars = [];
  let shootingStars = [];

  function resizeStarsCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    starsCanvas.width = width * dpr;
    starsCanvas.height = height * dpr;
    starsCanvas.style.width = width + 'px';
    starsCanvas.style.height = height + 'px';
    starsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initStars() {
    const count = width < 640 ? 110 : 200;
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.5, 1.8),
        baseAlpha: rand(0.3, 1),
        speed: rand(0.4, 1.4),
        phase: rand(0, Math.PI * 2),
        driftX: rand(-0.003, 0.003),
        driftY: rand(-0.002, 0.002),
      });
    }
  }

  function maybeSpawnShootingStar() {
    if (prefersReducedMotion) return;
    if (Math.random() < 0.006 && shootingStars.length < 2) {
      const startX = rand(width * 0.1, width * 0.8);
      const startY = rand(0, height * 0.3);
      const angle = rand(0.35, 0.55);
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * rand(9, 14),
        vy: Math.sin(angle) * rand(9, 14),
        life: 1,
        len: rand(80, 140),
      });
    }
  }

  let t0 = performance.now();

  function drawStars(now) {
    const elapsed = (now - t0) / 1000;
    starsCtx.clearRect(0, 0, width, height);

    for (const s of stars) {
      s.x += s.driftX * 0.016;
      s.y += s.driftY * 0.016;
      if (s.x < 0) s.x = 1;
      if (s.x > 1) s.x = 0;
      if (s.y < 0) s.y = 1;
      if (s.y > 1) s.y = 0;

      const alpha = prefersReducedMotion
        ? s.baseAlpha
        : Math.max(0, Math.min(1, s.baseAlpha + Math.sin(elapsed * s.speed + s.phase) * 0.35));

      starsCtx.beginPath();
      starsCtx.fillStyle = `rgba(245, 243, 255, ${alpha})`;
      starsCtx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      starsCtx.fill();
    }

    maybeSpawnShootingStar();

    shootingStars = shootingStars.filter((sh) => sh.life > 0 && sh.x < width + 200 && sh.y < height + 200);
    for (const sh of shootingStars) {
      const tailX = sh.x - sh.vx * 6;
      const tailY = sh.y - sh.vy * 6;
      const grad = starsCtx.createLinearGradient(sh.x, sh.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${sh.life})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      starsCtx.strokeStyle = grad;
      starsCtx.lineWidth = 2;
      starsCtx.beginPath();
      starsCtx.moveTo(sh.x, sh.y);
      starsCtx.lineTo(tailX, tailY);
      starsCtx.stroke();

      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.life -= 0.012;
    }

    requestAnimationFrame(drawStars);
  }

  resizeStarsCanvas();
  initStars();
  requestAnimationFrame(drawStars);
  window.addEventListener('resize', () => {
    resizeStarsCanvas();
    initStars();
    resizeHeartCanvas();
  });

  /* =========================================================
     2. PARALLAX DE GALAXIA CON EL MOUSE
     ========================================================= */

  const galaxies = document.querySelectorAll('.galaxy');
  window.addEventListener('mousemove', (e) => {
    if (prefersReducedMotion) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    galaxies.forEach((g, i) => {
      const factor = (i + 1) * 6;
      g.style.marginLeft = `${nx * factor}px`;
      g.style.marginTop = `${ny * factor}px`;
    });
  });

  /* =========================================================
     3. PARTÍCULAS QUE SIGUEN LIGERAMENTE AL MOUSE
     ========================================================= */

  const clickLayer = document.getElementById('clickLayer');
  let lastTrailTime = 0;

  window.addEventListener('mousemove', (e) => {
    if (prefersReducedMotion) return;
    const now = performance.now();
    if (now - lastTrailTime < 90) return;
    lastTrailTime = now;

    const dot = document.createElement('div');
    dot.style.position = 'fixed';
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    dot.style.width = '4px';
    dot.style.height = '4px';
    dot.style.borderRadius = '50%';
    dot.style.background = 'rgba(244, 114, 182, 0.8)';
    dot.style.boxShadow = '0 0 8px rgba(244, 114, 182, 0.8)';
    dot.style.pointerEvents = 'none';
    dot.style.zIndex = '15';
    dot.style.transition = 'transform 1s ease, opacity 1s ease';
    clickLayer.appendChild(dot);

    requestAnimationFrame(() => {
      dot.style.transform = `translate(${rand(-10, 10)}px, ${rand(10, 30)}px) scale(0.3)`;
      dot.style.opacity = '0';
    });

    setTimeout(() => dot.remove(), 1050);
  });

  /* =========================================================
     4. CORAZONES AL HACER CLIC (fuera de la caja)
     ========================================================= */

  document.addEventListener('click', (e) => {
    if (e.target.closest('#giftBox') || e.target.closest('.replay-btn') || e.target.closest('.music-toggle')) {
      return;
    }
    const heart = document.createElement('div');
    heart.className = 'click-heart';
    heart.textContent = '❤';
    heart.style.left = e.clientX - 8 + 'px';
    heart.style.top = e.clientY - 8 + 'px';
    clickLayer.appendChild(heart);
    setTimeout(() => heart.remove(), 1700);
  });

  /* =========================================================
     5. MÚSICA DE FONDO
     ========================================================= */

  const music = document.getElementById('bg-music');
  const musicToggle = document.getElementById('musicToggle');
  const musicIcon = document.getElementById('musicIcon');
  let musicPlaying = false;

  musicToggle.addEventListener('click', () => {
    if (!musicPlaying) {
      music.play().then(() => {
        musicPlaying = true;
        musicIcon.textContent = '♫';
        musicToggle.classList.remove('muted');
      }).catch(() => {
        // El navegador bloqueó la reproducción o no existe musica.mp3 todavía.
      });
    } else {
      music.pause();
      musicPlaying = false;
      musicIcon.textContent = '♫';
      musicToggle.classList.add('muted');
    }
  });

  /* =========================================================
     6. APERTURA DEL REGALO
     ========================================================= */

  const giftBox = document.getElementById('giftBox');
  const bow = document.getElementById('bow');
  const hintText = document.getElementById('hintText');
  const phrasesLayer = document.getElementById('phrasesLayer');
  const universeScene = document.getElementById('universeScene');

  const phrases = [
    'Eres de las cosas más bonitas que la vida puso en mi camino.',
    'Admiro profundamente la mujer que eres y todo lo que llevas dentro.',
    'Tú puedes con todo. Nunca olvides lo fuerte, valiente y capaz que eres.',
    'Eres una mujer maravillosa, y me siento muy afortunado de compartir mi vida contigo.',
    'Me encanta tu forma de ser, incluso esas pequeñas cosas que quizá tú misma no notas.',
    'Quiero que nunca olvides lo increíble que eres.',
    'Admiro tu manera de luchar por lo que quieres y seguir adelante.',
    'Ojalá pudieras verte con mis ojos para entender lo especial que eres para mí.',
    'Gracias por llegar a mi vida y hacerla mucho más bonita.',
    'No quiero que olvides nunca que creo en ti.',
    'Cuando tengas un día difícil, recuerda que hay alguien que te admira, te quiere y cree muchísimo en ti.',
    'Eres mucho más fuerte de lo que a veces piensas.',
    'Me encanta poder compartir momentos, risas y sueños contigo.',
    'Si pudiera elegir nuevamente, volvería a elegir encontrarte.',
    'Contigo hasta los días grises se sienten más ligeros.',
    'Eres mi lugar favorito para volver, sin importar el día.',
    'Cada vez que dudes de ti, yo voy a estar aquí recordándote quién eres.',
    'Gracias por ser exactamente como eres, sin filtros ni máscaras.',
  ];

  function spawnBurstParticles() {
    const rect = giftBox.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height * 0.25;
    const symbols = ['✦', '✧', '❤', '·', '✷'];
    const total = prefersReducedMotion ? 10 : 34;

    for (let i = 0; i < total; i++) {
      const el = document.createElement('div');
      el.className = 'burst-particle';
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      const angle = rand(0, Math.PI * 2);
      const dist = rand(60, 220);
      el.style.left = originX + 'px';
      el.style.top = originY + 'px';
      el.style.fontSize = rand(10, 22) + 'px';
      el.style.color = Math.random() > 0.5 ? 'var(--gold-soft)' : 'var(--pink-soft)';
      el.style.textShadow = '0 0 10px rgba(255,255,255,0.6)';
      el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--dy', Math.sin(angle) * dist - 40 + 'px');
      el.style.setProperty('--rot', rand(-180, 180) + 'deg');
      el.style.animationDelay = rand(0, 0.25) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1900);
    }
  }

  function playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.9);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.95);
      });
      setTimeout(() => ctx.close(), 1500);
    } catch (err) {
      // Sonido opcional: si el navegador lo bloquea, seguimos sin música de apertura.
    }
  }

  function placePhraseCard(text, index) {
    const card = document.createElement('div');
    card.className = 'phrase-card';

    const isMobile = window.innerWidth < 640;
    // El card se centra en (left, top) vía translate(-50%, ..), así que estos
    // márgenes garantizan que ni el ancho (max-width) ni el alto se salgan del viewport.
    const left = isMobile ? rand(42, 58) : rand(18, 82);
    const top = isMobile ? rand(10, 85) : rand(8, 85);
    const rotation = rand(-7, 7);

    card.style.left = left + 'vw';
    card.style.top = top + 'vh';
    card.style.setProperty('--r', rotation + 'deg');

    const inner = document.createElement('span');
    inner.className = 'phrase-card-inner';
    inner.textContent = text;
    inner.style.animationDelay = rand(0, 2) + 's';
    card.appendChild(inner);

    phrasesLayer.appendChild(card);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => card.classList.add('visible'));
    });

    return card;
  }

  async function revealPhrases() {
    const order = [...phrases];
    for (let i = 0; i < order.length; i++) {
      placePhraseCard(order[i], i);
      await wait(prefersReducedMotion ? 250 : 950);
    }
  }

  let boxOpened = false;

  async function openGift() {
    if (boxOpened) return;
    boxOpened = true;

    hintText.classList.add('hidden');
    giftBox.classList.add('opened');
    playChime();

    bow.classList.add('untied');
    await wait(750);

    giftBox.classList.add('lid-open');
    await wait(1400);

    spawnBurstParticles();

    await wait(900);
    await revealPhrases();

    await wait(2200);
    startFinale();
  }

  giftBox.addEventListener('click', openGift);
  giftBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      openGift();
    }
  });

  /* =========================================================
     7. CANVAS DE CORAZÓN DE ESTRELLAS
     ========================================================= */

  const heartCanvas = document.getElementById('heartCanvas');
  const heartCtx = heartCanvas.getContext('2d');
  let heartParticles = [];

  function resizeHeartCanvas() {
    heartCanvas.width = window.innerWidth * dpr;
    heartCanvas.height = window.innerHeight * dpr;
    heartCanvas.style.width = window.innerWidth + 'px';
    heartCanvas.style.height = window.innerHeight + 'px';
    heartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeHeartCanvas();

  function heartPoint(t, scale, cx, cy) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: cx + x * scale, y: cy - y * scale };
  }

  function buildHeartParticles() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / 34;
    const count = prefersReducedMotion ? 60 : 150;

    heartParticles = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const target = heartPoint(t, scale, cx, cy);
      heartParticles.push({
        x: rand(0, w),
        y: rand(0, h),
        tx: target.x,
        ty: target.y,
        r: rand(1.2, 2.6),
        phase: rand(0, Math.PI * 2),
      });
    }
  }

  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function animateHeartFormation(duration) {
    return new Promise((resolve) => {
      const start = performance.now();

      function frame(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = easeInOutCubic(progress);

        heartCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (const p of heartParticles) {
          const x = p.x + (p.tx - p.x) * eased;
          const y = p.y + (p.ty - p.y) * eased;
          const twinkle = 0.6 + Math.sin(now / 400 + p.phase) * 0.4;
          heartCtx.beginPath();
          heartCtx.fillStyle = `rgba(244, 114, 182, ${0.5 + twinkle * 0.5})`;
          heartCtx.shadowColor = 'rgba(244, 114, 182, 0.8)';
          heartCtx.shadowBlur = 8;
          heartCtx.arc(x, y, p.r, 0, Math.PI * 2);
          heartCtx.fill();
        }

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          keepHeartTwinkling();
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  function keepHeartTwinkling() {
    function loop(now) {
      if (!heartCanvas.classList.contains('visible')) return;
      heartCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of heartParticles) {
        const twinkle = 0.6 + Math.sin(now / 400 + p.phase) * 0.4;
        heartCtx.beginPath();
        heartCtx.fillStyle = `rgba(244, 114, 182, ${0.5 + twinkle * 0.5})`;
        heartCtx.shadowColor = 'rgba(244, 114, 182, 0.8)';
        heartCtx.shadowBlur = 8;
        heartCtx.arc(p.tx, p.ty, p.r, 0, Math.PI * 2);
        heartCtx.fill();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* =========================================================
     8. GRAN FINAL
     ========================================================= */

  const finale = document.getElementById('finale');
  const finaleMessage = document.getElementById('finaleMessage');
  const replayBtn = document.getElementById('replayBtn');

  async function showFinaleLine(text, opts = {}) {
    finaleMessage.innerHTML = '';
    const line = document.createElement('div');
    line.className = 'finale-line' + (opts.small ? ' small' : '') + (opts.name ? ' name' : '');
    line.textContent = text;
    finaleMessage.appendChild(line);

    if (opts.subtitle) {
      const sub = document.createElement('div');
      sub.className = 'finale-line small';
      sub.textContent = opts.subtitle;
      finaleMessage.appendChild(sub);
    }

    await wait(50);
    line.classList.add('show');
    if (opts.subtitle) {
      await wait(600);
      finaleMessage.querySelector('.finale-line.small').classList.add('show');
    }
  }

  async function fadeOutFinaleLine() {
    const lines = finaleMessage.querySelectorAll('.finale-line');
    lines.forEach((l) => l.classList.remove('show'));
    await wait(1400);
  }

  async function startFinale() {
    universeScene.classList.add('zooming');
    await wait(1500);
    universeScene.classList.add('fading-out');
    await wait(1200);

    buildHeartParticles();
    heartCanvas.classList.add('visible');
    finale.classList.add('visible');

    await animateHeartFormation(prefersReducedMotion ? 400 : 2400);
    await wait(400);

    await showFinaleLine('Andrea', { name: true });
    await wait(2200);
    await fadeOutFinaleLine();

    await showFinaleLine('Y entre tantos universos posibles…');
    await wait(1900);
    await fadeOutFinaleLine();

    await showFinaleLine('…qué bonito que el mío te haya encontrado a ti. ❤');
    await wait(2300);
    await fadeOutFinaleLine();

    await showFinaleLine('Te quiero muchísimo.', {
      subtitle: 'Siempre voy a estar orgulloso de la mujer que eres.',
    });
    await wait(1400);

    replayBtn.classList.add('show');
  }

  replayBtn.addEventListener('click', () => {
    location.reload();
  });

})();
