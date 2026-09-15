window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-copyright-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });

  const onLegalPage = location.pathname.includes('/legal/');
  RestaurantCookieConsent.init({ policyUrl: onLegalPage ? 'cookies.html' : 'legal/cookies.html', categories: {} });
  document.querySelectorAll('[data-cookie-settings]').forEach(button => {
    button.addEventListener('click', () => RestaurantCookieConsent.open());
  });

  const header = document.getElementById('site-header');
  const menu = document.getElementById('menu');
  if (header && menu) {
    let scheduled = false;
    const updateHeader = () => {
      header.classList.toggle('is-solid', menu.getBoundingClientRect().top <= header.offsetHeight);
      scheduled = false;
    };
    const schedule = () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(updateHeader); }
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    updateHeader();
  }

  const video = document.querySelector('.hero-video');
  if (video) {
    const playButton = document.querySelector('.video-play');
    video.muted = true;
    video.defaultMuted = true;
    const startVideo = () => {
      if (!video.paused) { playButton.hidden = true; return; }
      const attempt = video.play();
      if (attempt?.then) attempt.then(() => { playButton.hidden = true; }).catch(() => { playButton.hidden = false; });
    };
    video.addEventListener('canplay', startVideo);
    video.addEventListener('playing', () => { playButton.hidden = true; });
    video.addEventListener('error', () => { playButton.hidden = false; });
    window.addEventListener('pageshow', startVideo);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) startVideo(); });
    playButton.addEventListener('click', startVideo);
    startVideo();
  }
});
