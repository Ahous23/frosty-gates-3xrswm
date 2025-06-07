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
    if (show) this.update();
  }

  update() {
    if (!this.content) return;
    this.content.innerHTML = '';

    // ----- Equipped Items Section -----
    const equipSection = document.createElement('div');
    equipSection.className = 'equipment-section';

    const equipment = this.game.equipmentManager?.getAllEquipment?.() || {};
    ['weapon', 'armor', 'accessory'].forEach(slot => {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'equipment-slot';
      slotDiv.dataset.slot = slot;
      const item = equipment[slot];
      slotDiv.textContent = item ? item.name : `Empty ${slot}`;
      slotDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showEquippedContextMenu(e.pageX, e.pageY, slot);
      });
      equipSection.appendChild(slotDiv);
    });

    this.content.appendChild(equipSection);

    // ----- Inventory Items Section -----
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

  showEquippedContextMenu(x, y, slot) {
    const existing = this.panel.querySelector('.equipped-context-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'equipped-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const equipment = this.game.equipmentManager?.getAllEquipment?.() || {};
    const item = equipment[slot];

    if (item) {
      const examine = document.createElement('div');
      examine.className = 'context-menu-option';
      examine.textContent = 'Examine';
      examine.addEventListener('click', () => {
        this.game.inputHandlers.examineEquippedItem(slot);
        menu.remove();
      });
      menu.appendChild(examine);

      const unequip = document.createElement('div');
      unequip.className = 'context-menu-option';
      unequip.textContent = 'Unequip';
      unequip.addEventListener('click', () => {
        if (this.game.inventoryManager.items.length >= 20) {
          this.game.uiManager.print('Your inventory is full.', 'inventory-message');
        } else {
          this.game.inputHandlers.unequipItem(slot);
          this.update();
        }
        menu.remove();
      });
      menu.appendChild(unequip);
    } else {
      const empty = document.createElement('div');
      empty.className = 'context-menu-option disabled';
      empty.textContent = 'Nothing equipped';
      menu.appendChild(empty);
    }

    const closeMenu = () => menu.remove();
    setTimeout(() => {
      document.addEventListener('click', closeMenu, { once: true });
    }, 0);

    this.panel.appendChild(menu);
  }
}
