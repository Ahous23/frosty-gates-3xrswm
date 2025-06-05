import { UIPanel } from './uiPanel.js';

export class TalentTreeUI extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('talent-panel');
    super(panel);
    this.game = game;
    this.content = null;
    this.closeButton = null;
    this.init();
  }

  init() {
    this.content = document.getElementById('talent-content');
    this.closeButton = document.getElementById('close-talent');

    if (!this.panel || !this.content || !this.closeButton) {
      console.error('Talent panel elements not found in the DOM');
      return;
    }

    this.panel.classList.add('hidden');
    this.closeButton.addEventListener('click', () => this.toggle(false));
  }

  toggle(show = !this.visible) {
    if (show && this.game.equipmentManagerUI?.visible) {
      this.game.equipmentManagerUI.toggle(false);
    }
    super.toggle(show);
    if (show) {
      this.updateContent();
    }
  }

  updateContent() {
    if (!this.content) return;
    this.content.innerHTML = '<p>Here you will be able to spend talent points.</p>';
  }
}
