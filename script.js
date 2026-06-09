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
  const closeNotesBtn = document.getElementById('close-notes');
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
  if (closeNotesBtn) closeNotesBtn.addEventListener('click', closeSidebar);

  // Close notes sidebar with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && notesSidebar && notesSidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  // Debounce helper for autosave
  let saveTimeout;
  const debounceSave = (data) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      // Autosave to Server API if we are running on a server (e.g. localhost)
      if (window.location.protocol.startsWith('http')) {
        fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(result => console.log('Notes autosaved to server disk', result))
        .catch(err => console.log('Autosave to server not available, using localStorage only'));
      }
    }, 1000); // Wait 1 second after typing stops
  };

  // Collect current notes state
  const getNotesState = () => {
    const data = {};
    noteFields.forEach(id => {
      const textarea = document.getElementById(id);
      if (textarea) {
        data[id] = textarea.value;
      }
    });
    return data;
  };

  // Load notes initially
  const loadNotes = (data) => {
    noteFields.forEach(id => {
      const textarea = document.getElementById(id);
      if (textarea && data && data[id] !== undefined) {
        textarea.value = data[id];
        localStorage.setItem(id, data[id]);
      }
    });
  };

  // Load notes sequence:
  // 1. Load from local notes.js file state (window.savedNotes) if available
  let loadedFromLocalFile = false;
  if (window.savedNotes) {
    loadNotes(window.savedNotes);
    loadedFromLocalFile = true;
  }

  // 2. Load from localStorage browser cache as fallback if notes.js wasn't present
  if (!loadedFromLocalFile) {
    noteFields.forEach(id => {
      const textarea = document.getElementById(id);
      if (textarea) {
        const savedNote = localStorage.getItem(id);
        if (savedNote) {
          textarea.value = savedNote;
        }
      }
    });
  }

  // 3. Fetch from Server API to get the latest disk state if served via HTTP/HTTPS (e.g., local server)
  if (window.location.protocol.startsWith('http')) {
    fetch('/api/notes')
      .then(res => {
        if (!res.ok) throw new Error('Not local server');
        return res.json();
      })
      .then(serverData => {
        console.log('Notes loaded from server disk:', serverData);
        loadNotes(serverData);
      })
      .catch(err => {
        console.log('No local dev server active or API failed, using static assets and localStorage.');
      });
  }

  // Set up listeners for changes to trigger saves
  noteFields.forEach(id => {
    const textarea = document.getElementById(id);
    if (textarea) {
      textarea.addEventListener('input', () => {
        // Immediately save to browser cache
        localStorage.setItem(id, textarea.value);
        // Debounce save to workspace file
        debounceSave(getNotesState());
      });
    }
  });

  // Clear notes
  if (clearNotesBtn) {
    clearNotesBtn.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja limpar todas as anotacoes? Esta acao nao pode ser desfeita.')) {
        noteFields.forEach(id => {
          const textarea = document.getElementById(id);
          if (textarea) {
            textarea.value = '';
          }
          localStorage.removeItem(id);
        });
        // Clear server notes too
        debounceSave(getNotesState());
        alert('Todas as anotacoes foram limpas.');
      }
    });
  }

  // Export notes
  if (exportNotesBtn) {
    exportNotesBtn.addEventListener('click', () => {
      let exportText = '==================================================\n';
      exportText += 'ANOTACOES ESTRATEGICAS DA ADVOGADA - DEFESA DE THIAGO PALMEIRA BARBOSA\n';
      exportText += `Data de Exportacao: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
      exportText += '==================================================\n\n';

      const labels = {
        'note-geral': 'Resumo do Caso & Geral',
        'note-ctps': 'Tese 1: Carteira (CTPS) & Danos Morais',
        'note-rescisao': 'Tese 2: Acordo Rescisorio & Quitacao',
        'note-salarios': 'Tese 3: Salarios & Pix Semanal',
        'note-jornada': 'Tese 4: Jornada de Trabalho & Horas Extras',
        'note-acumulo': 'Tese 5: Acumulo de Funcao',
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
        alert('Nao ha nenhuma anotacao preenchida para ser exportada.');
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