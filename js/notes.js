export class NotesManager {
  constructor(game) {
    this.game = game;
    this.visible = false;
    this.content = "";
    this.panel = null;
    this.editor = null;
    
    this.init();
  }
  
  init() {
    // Set up notes panel
    this.panel = document.getElementById('notes-panel');
    this.editor = document.getElementById('notes-editor');
    const closeNotesBtn = document.getElementById('close-notes');
    
    // Ensure the panel is hidden initially
    if (!this.visible) {
      this.panel.style.display = 'none';
    }
    
    // Setup event listeners
    closeNotesBtn.addEventListener('click', () => this.toggle());
    
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

  toggle() {
    this.visible = !this.visible;
    
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

  save() {
    // Capture current notes content
    const notesContent = this.editor.innerHTML;
    console.log("Notes content before saving:", notesContent);
    this.content = notesContent;
    return this.content;
  }

  load(notesContent) {
    if (notesContent) {
      this.content = notesContent;
      this.editor.innerHTML = this.content;
      console.log("Notes loaded:", notesContent.substring(0, 50) + "..."); // Debug log
    }
  }
}