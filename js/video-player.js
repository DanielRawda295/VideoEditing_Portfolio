const dialog = document.querySelector('#project-dialog');
const player = document.querySelector('#dialog-video');
const closeButton = dialog.querySelector('.dialog-close');
let collection = [], current = 0, returnFocus;

export function pausePreviews() {
  document.querySelectorAll('.project-image.previewing').forEach(frame => {
    const video = frame.querySelector('video');
    video.pause();
    video.removeAttribute('src');
    video.load();
    frame.classList.remove('previewing');
  });
}

function focusMedia() {
  pausePreviews();
  document.dispatchEvent(new Event('portfolio:foreground-video'));
}

function showProject() {
  const project = collection[current];
  player.pause();
  player.poster = project.poster;
  player.src = project.video;
  player.setAttribute('aria-label', project.title);
  document.querySelector('#dialog-title').textContent = project.title;
  document.querySelector('#dialog-category').textContent = `${project.category} / ${project.width} × ${project.height}`;
  document.querySelector('#dialog-description').textContent = project.description;
  document.querySelector('#dialog-index').textContent = `${String(current + 1).padStart(2, '0')} / ${String(collection.length).padStart(2, '0')}`;
  document.querySelector('#dialog-error').hidden = true;
  document.querySelector('#dialog-direct').href = project.video;
  document.querySelector('#dialog-tags').replaceChildren(...project.techniques.map(text => {
    const tag = document.createElement('span'); tag.textContent = text; return tag;
  }));
  document.querySelector('#previous-project').disabled = collection.length < 2;
  document.querySelector('#next-project').disabled = collection.length < 2;
  focusMedia();
  player.play().catch(() => { /* Native controls remain available if autoplay is denied. */ });
}

export function openProject(project, visibleProjects, trigger) {
  collection = visibleProjects;
  current = collection.findIndex(item => item.id === project.id);
  returnFocus = trigger;
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
  showProject();
  closeButton.focus();
}

function step(direction) { current = (current + direction + collection.length) % collection.length; showProject(); }
closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  player.pause(); player.removeAttribute('src'); player.load();
  document.body.classList.remove('modal-open');
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});
dialog.addEventListener('keydown', event => {
  if (event.target === player || collection.length < 2) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
});
document.querySelector('#previous-project').addEventListener('click', () => step(-1));
document.querySelector('#next-project').addEventListener('click', () => step(1));
player.addEventListener('error', () => {
  if (player.hasAttribute('src')) document.querySelector('#dialog-error').hidden = false;
});
player.addEventListener('play', () => {
  focusMedia(); document.querySelector('#featured-video').pause();
});

export function setupFeatured() {
  const container = document.querySelector('#featured-player');
  const video = document.querySelector('#featured-video');
  const play = document.querySelector('.featured-play');
  play.addEventListener('click', () => {
    if (!video.hasAttribute('src')) video.src = 'assets/videos/promotional.mp4';
    video.controls = true;
    container.classList.add('playing');
    video.focus({ preventScroll: true });
    video.play().catch(() => { /* Controls provide a manual retry. */ });
  });
  video.addEventListener('play', () => { focusMedia(); player.pause(); });
  video.addEventListener('ended', () => { container.classList.remove('playing'); video.controls = false; });
  video.addEventListener('error', () => {
    if (!video.hasAttribute('src')) return;
    container.querySelector('.video-error').hidden = false;
    container.classList.add('playing');
  });
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) video.pause();
  }, { threshold: .12 }).observe(container);
}

export function setupPreview(button, project, preferences) {
  const frame = button.querySelector('.project-image');
  let timer;
  button.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || preferences.reduced.matches || preferences.connection?.saveData || dialog.open) return;
    timer = setTimeout(() => {
      if (!document.querySelector('#featured-video').paused) return;
      pausePreviews();
      let video = frame.querySelector('video');
      if (!video) {
        video = document.createElement('video'); video.muted = true; video.loop = true;
        video.playsInline = true; video.preload = 'none'; video.setAttribute('aria-hidden', 'true');
        video.tabIndex = -1; frame.append(video);
      }
      video.src = project.video;
      video.play().then(() => frame.classList.add('previewing')).catch(() => {
        video.removeAttribute('src'); video.load();
      });
    }, 220);
  });
  button.addEventListener('pointerleave', () => {
    clearTimeout(timer);
    const video = frame.querySelector('video');
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    frame.classList.remove('previewing');
  });
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) {
      clearTimeout(timer);
      const video = frame.querySelector('video');
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
      frame.classList.remove('previewing');
    }
  }, { threshold: .1 }).observe(frame);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pausePreviews(); player.pause(); document.querySelector('#featured-video').pause(); }
});
