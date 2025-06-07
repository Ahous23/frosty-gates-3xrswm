import { UIPanel } from './uiPanel.js';

export class InventoryPanel extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('inventory-panel');
    super(panel);
    this.game = game;
    this.content = panel ? panel.querySelector('#inventory-content') : null;
    this.closeButton = panel ? panel.querySelector('#close-inventory') : null;
    this.init();
  }

  init() {
    if (!this.panel) return;
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.game.toggleInventory(false);
        if (this.game.inputHandlers && typeof this.game.inputHandlers.resumeAfterInventory === 'function') {
          this.game.inputHandlers.resumeAfterInventory();
        }
      });
    }
    if (!this.visible) {
      this.panel.style.display = 'none';
      this.panel.classList.add('hidden');
    }
  }

  toggle(show = !this.visible) {
    if (show) {
      if (this.game.equipmentManagerUI?.visible) this.game.equipmentManagerUI.toggle(false);
      if (this.game.statsPanel?.visible) this.game.statsPanel.toggle(false);
      if (this.game.notesManager?.visible) this.game.notesManager.toggle(false);
      if (this.game.mapManager?.visible) this.game.mapManager.toggle(false);
    }
    super.toggle(show);
    if (show) this.updateContent();
  }

  updateContent() {
    if (!this.content) return;
    this.content.innerHTML = '';
    if (!this.game.inventory || this.game.inventory.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'Your inventory is empty.';
      this.content.appendChild(p);
      return;
    }
    this.game.inventory.forEach(item => {
      const div = document.createElement('div');
      div.className = 'inventory-item';
      div.textContent = `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`;
      this.content.appendChild(div);
    });
  }
}
