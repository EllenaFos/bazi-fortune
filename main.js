// Highlight today in daily cards
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const todayStr = `${today.getMonth()+1}/${today.getDate()}`;
  
  document.querySelectorAll('.dc-date').forEach(el => {
    // Match "6/23" format
    const text = el.textContent.trim().split(' ')[0];
    if (text === todayStr) {
      el.closest('.day-card')?.classList.add('today');
    }
  });
});

// Fade-in animation on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .domain, .day-card, .sug-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'all 0.6s ease-out';
  observer.observe(el);
});
