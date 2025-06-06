import { UIPanel } from './uiPanel.js';

export class StatsPanel extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('stats-panel');
    super(panel);
    this.game = game;
    this.content = panel ? panel.querySelector('#stats-content') : null;
    this.closeButton = panel ? panel.querySelector('#close-stats') : null;
    this.init();
  }

  init() {
    if (!this.panel) return;
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.game.toggleStats(false);
        if (this.game.inputHandlers && typeof this.game.inputHandlers.resumeAfterStats === 'function') {
          this.game.inputHandlers.resumeAfterStats();
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
      if (this.game.notesManager?.visible) this.game.notesManager.toggle(false);
      if (this.game.mapManager?.visible) this.game.mapManager.toggle(false);
    }
    super.toggle(show);
    if (show) this.updateContent();
  }

  updateContent() {
    if (!this.content) return;
    const content = this.content;
    content.innerHTML = '';

    const availablePoints = this.game.statPointsHandler.getTotal();
    const pointsInfo = document.createElement('div');
    pointsInfo.className = 'available-points';
    pointsInfo.textContent = `Available Points: ${availablePoints}`;
    content.appendChild(pointsInfo);

    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-container';

    Object.entries(this.game.playerStats).forEach(([stat, value]) => {
      const row = document.createElement('div');
      row.className = 'stat-row';

      const name = document.createElement('span');
      name.className = 'stat-name';
      name.textContent = stat.charAt(0).toUpperCase() + stat.slice(1);

      const val = document.createElement('span');
      val.className = 'stat-value';
      val.textContent = value;

      const buttons = document.createElement('div');
      buttons.className = 'stat-buttons';

      const addBtn = document.createElement('button');
      addBtn.className = 'stat-button add-stat';
      addBtn.textContent = '+';
      addBtn.disabled = availablePoints <= 0;
      addBtn.addEventListener('click', () => {
        if (this.game.statPointsHandler.adjustStat(stat, 1, this.game.inputHandlers.isInitialAllocation)) {
          if (this.game.inputHandlers.isInitialAllocation) {
            this.game.uiManager.clearOutput();
            this.game.inputHandlers.showInitialStatAllocation();
          } else {
            this.updateContent();
          }
        }
      });

      const subBtn = document.createElement('button');
      subBtn.className = 'stat-button subtract-stat';
      subBtn.textContent = '-';
      const baseline = this.game.inputHandlers.isInitialAllocation
        ? (this.game.initialPlayerStats[stat] || 0)
        : (this.game.gameState.confirmedStats?.[stat] ?? (this.game.initialPlayerStats[stat] || 0));
      subBtn.disabled = value <= baseline;
      subBtn.addEventListener('click', () => {
        if (this.game.statPointsHandler.adjustStat(stat, -1, this.game.inputHandlers.isInitialAllocation)) {
          if (this.game.inputHandlers.isInitialAllocation) {
            this.game.uiManager.clearOutput();
            this.game.inputHandlers.showInitialStatAllocation();
          } else {
            this.updateContent();
          }
        }
      });

      buttons.appendChild(subBtn);
      buttons.appendChild(addBtn);

      row.appendChild(name);
      row.appendChild(val);
      row.appendChild(buttons);
      statsContainer.appendChild(row);
    });

    content.appendChild(statsContainer);

    if (!this.game.gameState.statsConfirmed) {
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'confirm-stats-button';
      confirmBtn.textContent = 'Confirm Stats';
      confirmBtn.disabled = availablePoints > 0;
      confirmBtn.title = availablePoints > 0 ? 'Spend all points to enable' : '';
      confirmBtn.addEventListener('click', () => {
        // Once confirmed, prevent reducing below current values
        this.game.gameState.statsConfirmed = true;
        this.game.gameState.confirmedStats = { ...this.game.playerStats };
        if (this.game.inputHandlers.isInitialAllocation) {
          this.game.inputHandlers.proceedAfterStatAllocation();
        } else {
          this.game.inputHandlers.confirmStats();
        }
        this.game.toggleStats(false);
      });
      content.appendChild(confirmBtn);
    } else if (this.game.gameState.statsConfirmed) {
      const msg = document.createElement('div');
      msg.className = 'stats-notification stats-confirmed';
      msg.textContent = 'Stats are confirmed and locked.';
      content.appendChild(msg);
    }
  }
}
