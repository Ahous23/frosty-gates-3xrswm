import { UIPanel } from './uiPanel.js';

export class InventoryPanel extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('inventory-panel');
    super(panel);
    this.game = game;
    this.grid = panel ? panel.querySelector('#inventory-grid') : null;
    this.equipped = panel ? panel.querySelector('#equipped-items') : null;
    this.closeButton = panel ? panel.querySelector('#close-inventory') : null;
    this.init();
  }

  init() {
    if (!this.panel) return;
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.toggle(false);
        if (this.game.inputHandlers) {
          this.game.inputHandlers.resumeAfterInventory();
        }
      });
    }
    if (!this.visible) {
      this.panel.style.display = 'none';
      this.panel.classList.add('hidden');
    }
  }

  update() {
    if (!this.panel) return;
    if (this.grid) {
      this.grid.innerHTML = '';
      const items = this.game.inventory || [];
      const totalSlots = 20;
      for (let i = 0; i < totalSlots; i++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'inventory-slot';
        const item = items[i];
        if (item) {
          slotEl.title = item.name;
          const qty = document.createElement('span');
          qty.className = 'slot-qty';
          qty.textContent = item.quantity > 1 ? item.quantity : '';
          if (item.type === 'weapon' || item.category === 'weapon' || item.slot === 'weapon') {
            slotEl.classList.add('weapon-slot');
          }
          slotEl.appendChild(qty);
        } else {
          slotEl.classList.add('item-slot');
        }
        this.grid.appendChild(slotEl);
      }
    }

    if (this.equipped) {
      this.equipped.innerHTML = '';
      const equipment = this.game.equipmentManager.getAllEquipment();
      const slots = ['weapon','shield','helm','chest','legs','gloves'];
      slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = `equipment-slot ${slot}`;
        const item = equipment[slot];
        slotDiv.textContent = item ? item.name : slot;
        slotDiv.title = item ? item.name : '';
        this.equipped.appendChild(slotDiv);
      });
    }
  }

  toggle(show = !this.visible) {
    super.toggle(show);
    if (show) this.update();
  }
}
