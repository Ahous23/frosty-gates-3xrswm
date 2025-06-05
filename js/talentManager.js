import { UIPanel } from './uiPanel.js';

export class TalentManager extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('talent-panel');
    super(panel);
    this.game = game;
    this.content = null;

    if (document.readyState === 'complete') {
      this.init();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.init());
    }
  }

  init() {
    this.content = document.getElementById('talent-content');
    this.closeButton = document.getElementById('close-talents');

    if (!this.panel || !this.content || !this.closeButton) {
      console.error('Talent panel elements not found in the DOM');
      return;
    }

    this.closeButton.addEventListener('click', () => this.toggle(false));
    this.panel.classList.add('hidden');
  }

  updateContent() {
    if (!this.content) return;
    this.content.innerHTML = '<p>Talent panel not implemented yet.</p>';
  }

  toggle(show = !this.visible) {
    if (show && this.game) {
      // Close other panels when opening this one
      if (this.game.notesManager && this.game.notesManager.visible) {
        this.game.notesManager.toggle(false);
      }
      if (this.game.mapManager && this.game.mapManager.visible) {
        this.game.mapManager.toggle(false);
      }
      if (this.game.equipmentManagerUI && this.game.equipmentManagerUI.visible) {
        this.game.equipmentManagerUI.toggle(false);
      }
    }
    super.toggle(show);
    if (this.visible) {
      this.updateContent();
    }
  }
}
