export function initAnimations(preferences) {
  const { reduced } = preferences;
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

  const process = document.querySelector('.process-track');
  const journey = document.querySelector('.experience-timeline');
  let scheduled = false;
  function scrollEffects() {
    const rect = process.getBoundingClientRect();
    const progress = Math.max(.01, Math.min(.99, (innerHeight * .85 - rect.top) / (rect.height + innerHeight * .2)));
    process.style.setProperty('--progress', progress);
    const journeyRect = journey.getBoundingClientRect();
    const journeyProgress = Math.max(.02, Math.min(1, (innerHeight * .85 - journeyRect.top) / journeyRect.height));
    journey.style.setProperty('--journey-progress', journeyProgress);
    scheduled = false;
  }
  addEventListener('scroll', () => {
    if (!scheduled) { requestAnimationFrame(scrollEffects); scheduled = true; }
  }, { passive: true });
  scrollEffects();

  const fine = matchMedia('(pointer:fine)');
  const dot = document.querySelector('.cursor'), ring = document.querySelector('.cursor-ring');
  let x = -100, y = -100, rx = -100, ry = -100, cursorFrame = 0;
  function cursorLoop() {
    rx += (x - rx) * .17; ry += (y - ry) * .17;
    dot.style.transform = `translate3d(${x}px,${y}px,0)`;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    cursorFrame = requestAnimationFrame(cursorLoop);
  }
  addEventListener('pointermove', event => {
    if (reduced.matches || !fine.matches) return;
    x = event.clientX; y = event.clientY;
    dot.style.opacity = ring.style.opacity = '1';
    ring.classList.toggle('interactive', Boolean(event.target.closest('a,button,summary')));
    if (!cursorFrame) cursorLoop();
  }, { passive: true });
  function hideCursor() {
    dot.style.opacity = ring.style.opacity = '0'; cancelAnimationFrame(cursorFrame); cursorFrame = 0;
  }
  document.addEventListener('pointerleave', hideCursor);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hideCursor(); });
  reduced.addEventListener('change', hideCursor);
  document.querySelectorAll('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (!fine.matches || reduced.matches) return;
      const rect = button.getBoundingClientRect();
      button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .09}px,${(event.clientY - rect.top - rect.height / 2) * .12}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
  const hero = document.querySelector('.hero'), stage = document.querySelector('.hero-stage');
  hero.addEventListener('pointermove', event => {
    if (!fine.matches || reduced.matches || innerWidth < 960) return;
    stage.style.setProperty('--depth-x', `${(event.clientX / innerWidth - .5) * 9}px`);
    stage.style.setProperty('--depth-y', `${(event.clientY / innerHeight - .5) * 7}px`);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { stage.style.setProperty('--depth-x', '0px'); stage.style.setProperty('--depth-y', '0px'); });
  initParticles(reduced, preferences.connection);
}

function initParticles(reduced, connection) {
  const canvas = document.querySelector('#particles'), context = canvas.getContext('2d');
  if (!context) return;
  let points = [], width, height, frame = 0, last = 0;
  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    width = innerWidth; height = innerHeight;
    canvas.width = width * ratio; canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    points = Array.from({ length: width < 760 ? 9 : 24 }, () => ({ x: Math.random() * width, y: Math.random() * height, dx: (Math.random() - .5) * .12, dy: (Math.random() - .5) * .12 }));
  }
  function draw(now) {
    frame = requestAnimationFrame(draw);
    if (now - last < 48) return;
    last = now;
    context.clearRect(0, 0, width, height);
    points.forEach((point, i) => {
      point.x += point.dx; point.y += point.dy;
      if (point.x < 0 || point.x > width) point.dx *= -1;
      if (point.y < 0 || point.y > height) point.dy *= -1;
      context.fillStyle = '#4d8d9b'; context.beginPath(); context.arc(point.x, point.y, .8, 0, Math.PI * 2); context.fill();
      for (let j = i + 1; j < points.length; j++) {
        const other = points[j], distance = Math.hypot(other.x - point.x, other.y - point.y);
        if (distance > 130) continue;
        context.strokeStyle = `rgba(56,130,145,${(1 - distance / 130) * .2})`;
        context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(other.x, other.y); context.stroke();
      }
    });
  }
  function update() {
    cancelAnimationFrame(frame); frame = 0;
    if (reduced.matches || document.hidden || connection?.saveData) { context.clearRect(0, 0, width, height); return; }
    frame = requestAnimationFrame(draw);
  }
  resize(); update();
  addEventListener('resize', resize, { passive: true });
  reduced.addEventListener('change', update);
  connection?.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
}
