import { UIPanel } from './uiPanel.js';

export class TalentTreeUI extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('talent-panel');
    super(panel);
    this.game = game;
    this.content = null;
    this.closeButton = null;

    if (document.readyState === 'complete') {
      this.init();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.init());
    }
  }

  init() {
    this.content = document.getElementById('talent-content');
    this.closeButton = document.getElementById('close-talent');
    if (!this.panel || !this.content || !this.closeButton) {
      console.error('Talent panel elements not found');
      return;
    }
    this.panel.classList.add('hidden');
    this.closeButton.addEventListener('click', () => {
      this.toggle(false);
      if (this.game.inputHandlers && typeof this.game.inputHandlers.resumeAfterTalent === 'function') {
        this.game.inputHandlers.resumeAfterTalent();
      }
    });
  }

  toggle(show = !this.visible) {
    if (show) {
      if (this.game.notesManager?.visible) this.game.notesManager.toggle(false);
      if (this.game.mapManager?.visible) this.game.mapManager.toggle(false);
      if (this.game.equipmentManagerUI?.visible) this.game.equipmentManagerUI.toggle(false);
    } else if (this.visible) {
      if (this.game.inputMode === 'talent') {
        this.game.inputMode = this.game.previousMode || 'normal';
        this.game.previousMode = null;
      }
    }
    super.toggle(show);
    if (this.visible) {
      this.updateContent();
    }
  }

  updateContent() {
    if (!this.content || !this.visible) return;
    this.content.innerHTML = '';

    const points = this.game.gameState.talentPoints || 0;
    const pointsEl = document.createElement('div');
    pointsEl.className = 'talent-points';
    pointsEl.textContent = `Talent Points: ${points}`;
    this.content.appendChild(pointsEl);

    const list = document.createElement('div');
    list.className = 'talent-list';

    (this.game.talentManager.talents || []).forEach(talent => {
      const unlocked = this.game.talentManager.isTalentUnlocked(talent.id);
      const item = document.createElement('div');
      item.className = 'talent-item';

      const title = document.createElement('h4');
      title.textContent = talent.name;
      item.appendChild(title);

      const desc = document.createElement('p');
      desc.textContent = talent.description;
      item.appendChild(desc);

      if (unlocked) {
        const status = document.createElement('div');
        status.className = 'talent-status';
        status.textContent = 'Unlocked';
        item.appendChild(status);
      } else {
        const req = document.createElement('div');
        req.className = 'talent-req';
        req.textContent = `Requires level ${talent.requiredLevel}`;
        item.appendChild(req);

        const prereqMet = (talent.prerequisites || []).every(pr => this.game.talentManager.isTalentUnlocked(pr));
        const level = Math.floor(this.game.gameState.playerXp / (this.game.xpPerLevel || 100));
        const canUnlock = prereqMet && level >= (talent.requiredLevel || 0) && points > 0;

        const btn = document.createElement('button');
        btn.textContent = 'Unlock';
        btn.disabled = !canUnlock;
        btn.addEventListener('click', () => {
          if (this.game.talentManager.unlockTalent(talent.id)) {
            this.game.gameState.talentPoints -= 1;
            this.updateContent();
            this.game.uiManager.print(`You unlocked the talent ${talent.name}!`, 'system-message');
          }
        });
        item.appendChild(btn);
      }
      list.appendChild(item);
    });

    this.content.appendChild(list);
  }
}
