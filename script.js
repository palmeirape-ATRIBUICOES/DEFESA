document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs Logic
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all nav items
      navItems.forEach(nav => nav.classList.remove('active'));
      // Add active class to clicked item
      item.classList.add('active');

      // Hide all tab contents
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Get target tab id and show it
      const targetTabId = item.getAttribute('data-tab');
      const targetTab = document.getElementById(targetTabId);
      if (targetTab) {
        targetTab.classList.add('active');
        // Scroll back to top of main content
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Lightbox Zoom Modal Logic
  const lightbox = document.getElementById('zoom-modal');
  const lightboxImg = document.getElementById('zoom-img');
  const zoomTriggers = document.querySelectorAll('.zoomable-image');
  const closeBtn = document.querySelector('.lightbox-close');

  zoomTriggers.forEach(img => {
    img.addEventListener('click', () => {
      lightbox.style.display = 'flex';
      lightboxImg.src = img.src;
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      lightbox.style.display = 'none';
    });
  }

  // Close modal when clicking outside the image
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.style.display = 'none';
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      lightbox.style.display = 'none';
    }
  });
});
