import { projects } from './projects.js';
import { initAnimations } from './animations.js';
import { openProject, setupFeatured, setupPreview, pausePreviews } from './video-player.js';

const preferences = { reduced: matchMedia('(prefers-reduced-motion:reduce)'), connection: navigator.connection };
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const grid = document.querySelector('#project-grid');
const cardObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible', 'entering');
    cardObserver.unobserve(entry.target);
  });
}, { threshold: .06 });
let visibleProjects = projects;
const timecode = duration => `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(Math.round(duration % 60)).padStart(2, '0')}`;

function renderProjects(filter = 'All') {
  pausePreviews();
  cardObserver.disconnect();
  visibleProjects = filter === 'All' ? projects : projects.filter(project => project.category === filter);
  const cards = visibleProjects.map((project, index) => {
    const card = document.createElement('article');
    card.className = 'project-card reveal';
    card.style.setProperty('--delay', `${index % 3 * 55}ms`);
    card.innerHTML = `<button class="project-open" aria-label="Watch ${escape(project.title)}"><div class="project-image"><img src="${escape(project.poster)}" width="${project.width}" height="${project.height}" alt="Frame from ${escape(project.title)}" loading="lazy" decoding="async"><span class="project-number">${String(projects.indexOf(project) + 1).padStart(2, '0')}</span><span class="card-play"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 5 11 7-11 7Z"/></svg></span><span class="project-duration">${timecode(project.duration)}</span></div><div class="project-caption"><div><h3>${escape(project.title)}</h3><p>${escape(project.category)} / ${project.width === project.height ? 'Square' : project.width > project.height ? 'Landscape' : 'Portrait'}</p></div><span aria-hidden="true">↗</span></div></button><p class="project-description">${escape(project.description)}</p><div class="tags">${project.techniques.map(tag => `<span>${escape(tag)}</span>`).join('')}</div>`;
    const button = card.querySelector('button');
    button.addEventListener('click', () => openProject(project, visibleProjects, button));
    setupPreview(button, project, preferences);
    return card;
  });
  grid.replaceChildren(...cards);
  cards.forEach(card => cardObserver.observe(card));
  document.querySelector('#project-count').textContent = `${visibleProjects.length} project${visibleProjects.length === 1 ? '' : 's'}`;
}
renderProjects();
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(other => {
    const active = other === button; other.classList.toggle('active', active); other.setAttribute('aria-pressed', active);
  });
  renderProjects(button.dataset.filter);
}));

const header = document.querySelector('.site-header');
const nav = document.querySelector('#navigation');
const toggle = document.querySelector('.menu-toggle');
function closeMenu() { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); }
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', open); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  nav.classList.toggle('open', open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); toggle.focus(); }
});
document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
header.addEventListener('focusout', event => { if (!header.contains(event.relatedTarget)) closeMenu(); });
matchMedia('(min-width:761px)').addEventListener('change', closeMenu);
function updateHeader() { header.classList.toggle('scrolled', scrollY > 25); }
addEventListener('scroll', updateHeader, { passive: true }); updateHeader();
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    nav.querySelectorAll('a').forEach(link => {
      const active = link.hash === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });
setupFeatured(); initAnimations(preferences);

const heroVideo = document.querySelector('#hero-video');
const heroToggle = document.querySelector('#hero-motion-toggle');
let heroVisible = true, userPaused = false, foregroundPlaying = false;
function updateHero() {
  const allowed = !preferences.reduced.matches && !preferences.connection?.saveData;
  heroToggle.hidden = !allowed;
  if (!allowed || !heroVisible || document.hidden || userPaused || foregroundPlaying) { heroVideo.pause(); return; }
  if (!heroVideo.hasAttribute('src')) heroVideo.src = heroVideo.dataset.src;
  heroVideo.play().catch(() => { heroToggle.hidden = true; });
}
heroToggle.addEventListener('click', () => { userPaused = !userPaused; updateHero(); });
heroVideo.addEventListener('play', () => { heroToggle.textContent = 'Ⅱ'; heroToggle.setAttribute('aria-label', 'Pause background video'); });
heroVideo.addEventListener('pause', () => { heroToggle.textContent = '▷'; heroToggle.setAttribute('aria-label', 'Play background video'); });
document.addEventListener('portfolio:foreground-video', () => { foregroundPlaying = true; heroVideo.pause(); });
new IntersectionObserver(entries => {
  heroVisible = entries[0].isIntersecting;
  if (heroVisible) foregroundPlaying = !document.querySelector('#featured-video').paused || !document.querySelector('#dialog-video').paused;
  updateHero();
}, { threshold: .1 }).observe(document.querySelector('.hero-screen'));
preferences.reduced.addEventListener('change', () => { pausePreviews(); updateHero(); });
preferences.connection?.addEventListener('change', updateHero);
document.addEventListener('visibilitychange', updateHero);

const loader = document.querySelector('.preloader');
const heroPoster = document.querySelector('.hero-screen>img');
const essentialImage = heroPoster.complete ? Promise.resolve() : new Promise(resolve => { heroPoster.addEventListener('load', resolve, { once:true }); heroPoster.addEventListener('error', resolve, { once:true }); });
Promise.race([Promise.all([essentialImage, document.fonts.ready]), new Promise(resolve => setTimeout(resolve, 1800))]).then(() => { loader.classList.add('dismissed'); updateHero(); });
