import { UIPanel } from './uiPanel.js';

export class InventoryPanel extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('inventory-panel');
    super(panel);
    this.game = game;
    this.grid = panel ? panel.querySelector('#inventory-grid') : null;
    this.equipped = panel ? panel.querySelector('#equipped-items') : null;
    this.messageBox = panel ? panel.querySelector('#inventory-message') : null;
    this.contextMenu = null;
    this.closeButton = panel ? panel.querySelector('#close-inventory') : null;
    this.init();
  }

  init() {
    if (!this.panel) return;
    this.createContextMenu();
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

  createContextMenu() {
    if (this.contextMenu) return;
    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'inventory-context-menu hidden';
    document.body.appendChild(this.contextMenu);
    document.addEventListener('click', () => this.hideContextMenu());
  }

  showContextMenu(x, y, item, index) {
    if (!this.contextMenu) return;
    this.contextMenu.innerHTML = '';

    const actions = [];
    if (['weapon','shield','helm','chest','legs','gloves','armor'].includes(item.type) ||
        ['weapon','shield','helm','chest','legs','gloves','armor'].includes(item.category) ||
        item.slot) {
      actions.push({ action: 'equip', label: 'Equip' });
    }
    if (item.type === 'consumable' || item.category === 'consumable') {
      actions.push({ action: 'use', label: 'Use' });
    }
    actions.push({ action: 'examine', label: 'Examine' });

    actions.forEach(act => {
      const opt = document.createElement('div');
      opt.className = 'context-option';
      opt.textContent = act.label;
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleContextAction(act.action, item, index);
        this.hideContextMenu();
      });
      this.contextMenu.appendChild(opt);
    });

    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.classList.remove('hidden');
  }

  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.classList.add('hidden');
    }
  }

  clearMessages() {
    if (this.messageBox) {
      this.messageBox.innerHTML = '';
    }
  }

  addMessage(text, className = '') {
    if (!this.messageBox) return;
    const div = document.createElement('div');
    if (className) div.className = className;
    div.textContent = text;
    this.messageBox.appendChild(div);
  }

  showMessages(messages) {
    this.clearMessages();
    messages.forEach(m => this.addMessage(m.text, m.className));
  }

  handleContextAction(action, item, index) {
    if (!item) return;
    if (action === 'equip') {
      this.game.inputHandlers.equipItem(item, index);
      this.update();
    } else if (action === 'use') {
      this.game.inputHandlers.useItem(item);
      this.update();
    } else if (action === 'examine') {
      this.game.inputHandlers.examineItem(item);
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
          slotEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.pageX, e.pageY, item, i);
          });
          slotEl.appendChild(qty);
        } else {
          slotEl.classList.add('empty-slot');
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
    if (show) {
      this.update();
    } else {
      this.hideContextMenu();
    }
  }
}
