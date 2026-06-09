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
    'note-insalubridade',
    'note-ferias'
  ];

  const CLOUD_DB_URL = 'https://kvdb.io/LCxLp7QF1N4wSwHHDaPXYt/notes';

  let lastInputTime = 0;

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

  // Debounce helper for cloud and local autosave
  let saveTimeout;
  const debounceSave = (data) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      // 1. Autosave to Cloud Database (for sharing between devices/users)
      fetch(CLOUD_DB_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(res => {
        if (!res.ok) throw new Error('Cloud save failed');
        return res.text();
      })
      .then(() => console.log('Notes successfully synced to cloud storage.'))
      .catch(err => console.log('Cloud sync not verified or offline. Saving locally only.'));

      // 2. Autosave to Local Server API (if running locally on dev server)
      if (window.location.protocol.startsWith('http') && window.location.hostname === 'localhost') {
        fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(result => console.log('Notes autosaved to local disk', result))
        .catch(err => console.log('Local server save skipped (not running dev server)'));
      }
    }, 1200); // Debounce save: triggers 1.2s after typing stops
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

  // Load notes helper
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
  // 1. Load static file notes.js (pre-populated templates) if available
  let loadedFromLocalFile = false;
  if (window.savedNotes) {
    loadNotes(window.savedNotes);
    loadedFromLocalFile = true;
  }

  // 2. Load from browser cache (localStorage)
  noteFields.forEach(id => {
    const textarea = document.getElementById(id);
    if (textarea) {
      const savedNote = localStorage.getItem(id);
      if (savedNote) {
        textarea.value = savedNote;
      }
    }
  });

  // 3. Load from Local Server API if on localhost (gets latest disk edits)
  if (window.location.protocol.startsWith('http') && window.location.hostname === 'localhost') {
    fetch('/api/notes')
      .then(res => res.json())
      .then(serverData => {
        console.log('Notes loaded from local server disk:', serverData);
        loadNotes(serverData);
      })
      .catch(err => console.log('Local dev server not detected.'));
  }

  // 4. Load from Cloud Database (syncs the shared live state)
  fetch(CLOUD_DB_URL)
    .then(res => {
      if (!res.ok) throw new Error('Cloud DB not verified or offline');
      return res.json();
    })
    .then(cloudData => {
      console.log('Notes successfully synced from cloud storage:', cloudData);
      loadNotes(cloudData);
    })
    .catch(err => {
      console.log('Using local notes/cache (Cloud storage is pending email verification at thiag.palmeira@gmail.com).');
    });

  // Set up input listeners to trigger debounced saves
  noteFields.forEach(id => {
    const textarea = document.getElementById(id);
    if (textarea) {
      textarea.addEventListener('input', () => {
        // Update last input time to prevent overwriting while typing
        lastInputTime = Date.now();
        // Save immediately to browser cache
        localStorage.setItem(id, textarea.value);
        // Sync to cloud and disk
        debounceSave(getNotesState());
      });
    }
  });

  // Real-time synchronization loop (polls the cloud every 5 seconds)
  setInterval(() => {
    // Only check and update from cloud if the user has not typed in the last 4 seconds
    if (Date.now() - lastInputTime > 4000) {
      fetch(CLOUD_DB_URL)
        .then(res => {
          if (!res.ok) throw new Error('Cloud sync check failed');
          return res.json();
        })
        .then(cloudData => {
          if (cloudData) {
            let updated = false;
            noteFields.forEach(id => {
              const textarea = document.getElementById(id);
              // Only update if not focused and value is different
              if (textarea && textarea !== document.activeElement && cloudData[id] !== undefined && textarea.value !== cloudData[id]) {
                textarea.value = cloudData[id];
                localStorage.setItem(id, cloudData[id]);
                updated = true;
              }
            });
            if (updated) {
              console.log('Notes updated from cloud sync (another device edited them).');
            }
          }
        })
        .catch(err => {
          // Silent catch to avoid console spamming when offline
        });
    }
  }, 5000);

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
        // Clear cloud and local disk
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