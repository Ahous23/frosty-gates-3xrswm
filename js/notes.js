export class NotesManager {
  constructor(game) {
    this.game = game;
    this.visible = false;
    this.content = "";
    this.panel = null;
    this.editor = null;
    
    this.init();
  }
  
  // Update the init method in NotesManager

  init() {
    // Set up notes panel
    this.panel = document.getElementById('notes-panel');
    this.editor = document.getElementById('notes-editor');
    
    if (!this.panel || !this.editor) {
      console.error("Notes panel elements not found in the DOM");
      return;
    }
    
    const closeNotesBtn = document.getElementById('close-notes');
    if (!closeNotesBtn) {
      console.error("Close notes button not found");
      return;
    }
    
    // Ensure the panel is hidden initially
    if (!this.visible) {
      this.panel.style.display = 'none';
      this.panel.classList.add('hidden');
    }
    
    // Setup event listeners
    closeNotesBtn.addEventListener('click', () => this.toggle(false));
    
    // Setup rich text formatting
    this.setupRichTextEditing();
    
    // Auto-save notes when content changes (with debounce)
    let timeout = null;
    this.editor.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.content = this.editor.innerHTML;
      }, 500);
    });
    
    console.log("Notes manager initialized successfully");
  }

  setupRichTextEditing() {
    // Get all formatting buttons and selects
    const formatButtons = document.querySelectorAll('.format-btn');
    const formatSelects = document.querySelectorAll('.format-select');
    
    // Add event listeners to buttons
    formatButtons.forEach(button => {
      button.addEventListener('click', () => {
        const command = button.dataset.command;
        document.execCommand(command, false, null);
        this.editor.focus();
      });
    });
    
    // Add event listeners to selects
    formatSelects.forEach(select => {
      select.addEventListener('change', () => {
        const command = select.dataset.command;
        const value = select.value;
        document.execCommand(command, false, value);
        select.selectedIndex = 0; // Reset to default option
        this.editor.focus();
      });
    });
    
    // Focus the editor when clicking on it
    this.editor.addEventListener('focus', () => {
      // Ensures we're editing in the correct context
    });
  }

  // Ensure the toggle method works properly

  toggle(show = !this.visible) {
    if (show === this.visible) return; // No change needed
    
    this.visible = show;
    
    if (this.visible) {
      // Show notes
      this.panel.style.display = 'flex';
      // Use requestAnimationFrame to ensure display change takes effect
      requestAnimationFrame(() => {
        this.panel.classList.remove('hidden');
      });
    } else {
      // Hide notes - first start the transition
      this.panel.classList.add('hidden');
      
      // Add transitionend listener to set display to none after animation
      const hidePanel = () => {
        this.panel.style.display = 'none';
        this.panel.removeEventListener('transitionend', hidePanel);
      };
      
      this.panel.addEventListener('transitionend', hidePanel);
    }
  }

  // Method to save notes content
  save() {
    // If editor exists, get its HTML content
    if (this.editor) {
      this.content = this.editor.innerHTML;
    }
    return this.content;
  }

  // Method to load notes content
  load(notesContent) {
    this.content = notesContent || "";
    if (this.editor) {
      this.editor.innerHTML = this.content;
    }
  }

  // Add these getter methods for backward compatibility
  getContent() {
    return this.content;
  }

  getNotes() {
    return this.content;
  }
}