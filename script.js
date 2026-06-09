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

  // --- LAWYER'S NOTES LOGIC ---
  const btnNotesFloat = document.getElementById('btn-notes-float');
  const btnNotesSidebar = document.getElementById('btn-notes-sidebar');
  const notesSidebar = document.getElementById('notes-sidebar');
  const closeNotes = document.getElementById('close-notes');
  const clearNotesBtn = document.getElementById('clear-notes-btn');
  const exportNotesBtn = document.getElementById('export-notes-btn');
  
  const noteFields = [
    'note-geral',
    'note-ctps',
    'note-rescisao',
    'note-salarios',
    'note-jornada',
    'note-acumulo',
    'note-insalubridade'
  ];

  const openSidebar = () => {
    if (notesSidebar) notesSidebar.classList.add('open');
  };

  const closeSidebar = () => {
    if (notesSidebar) notesSidebar.classList.remove('open');
  };

  if (btnNotesFloat) btnNotesFloat.addEventListener('click', openSidebar);
  if (btnNotesSidebar) btnNotesSidebar.addEventListener('click', openSidebar);
  if (closeNotes) closeNotes.addEventListener('click', closeSidebar);

  // Close notes sidebar with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && notesSidebar && notesSidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  // Load notes from localStorage
  noteFields.forEach(id => {
    const textarea = document.getElementById(id);
    if (textarea) {
      const savedNote = localStorage.getItem(id);
      if (savedNote) {
        textarea.value = savedNote;
      }
      textarea.addEventListener('input', () => {
        localStorage.setItem(id, textarea.value);
      });
    }
  });

  // Clear notes
  if (clearNotesBtn) {
    clearNotesBtn.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja limpar todas as anotaÃ§Ãµes? Esta aÃ§Ã£o nÃ£o pode ser desfeita.')) {
        noteFields.forEach(id => {
          const textarea = document.getElementById(id);
          if (textarea) {
            textarea.value = '';
          }
          localStorage.removeItem(id);
        });
        alert('Todas as anotaÃ§Ãµes foram limpas.');
      }
    });
  }

  // Export notes
  if (exportNotesBtn) {
    exportNotesBtn.addEventListener('click', () => {
      let exportText = '==================================================\n';
      exportText += 'ANOTAÃ‡Ã•ES ESTRATÃ‰GICAS DA ADVOGADA - DEFESA DE THIAGO PALMEIRA BARBOSA\n';
      exportText += `Data de ExportaÃ§Ã£o: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
      exportText += '==================================================\n\n';

      const labels = {
        'note-geral': 'Resumo do Caso & Geral',
        'note-ctps': 'Tese 1: Carteira (CTPS) & Danos Morais',
        'note-rescisao': 'Tese 2: Acordo RescisÃ³rio & QuitaÃ§Ã£o',
        'note-salarios': 'Tese 3: SalÃ¡rios & Pix Semanal',
        'note-jornada': 'Tese 4: Jornada de Trabalho & Horas Extras',
        'note-acumulo': 'Tese 5: AcÃºmulo de FunÃ§Ã£o',
        'note-insalubridade': 'Tese 6: Insalubridade'
      };

      let hasNotes = false;
      noteFields.forEach(id => {
        const val = document.getElementById(id)?.value || '';
        if (val.trim()) {
          hasNotes = true;
          exportText += `--- ${labels[id].toUpperCase()} ---\n`;
          exportText += `${val}\n\n`;
        }
      });

      if (!hasNotes) {
        alert('NÃ£o hÃ¡ nenhuma anotaÃ§Ã£o preenchida para ser exportada.');
        return;
      }

      const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Anotacoes_Defesa_Trabalhista.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
});