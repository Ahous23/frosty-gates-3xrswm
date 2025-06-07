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

    if (!this.visible) {
      this.panel.style.display = 'none';
      this.panel.classList.add('hidden');
    }
    this.closeButton.addEventListener('click', () => {
      this.toggle(false);
      if (this.game.inputHandlers && typeof this.game.inputHandlers.resumeAfterTalent === 'function') {
        this.game.inputHandlers.resumeAfterTalent();
      }
    });
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

    const playerLevel = Math.floor(this.game.gameState.playerXp / (this.game.xpPerLevel || 100));
    const points = this.game.gameState.talentPoints || 0;

    this.content.innerHTML = '';

    const pointsInfo = document.createElement('div');
    pointsInfo.className = 'talent-points';
    pointsInfo.textContent = `Talent Points: ${points}`;
    this.content.appendChild(pointsInfo);

    const grid = document.createElement('div');
    grid.className = 'talent-grid';

    [1,2,3].forEach(tier => {
      const row = document.createElement('div');
      row.className = 'talent-row';
      const talents = this.game.talentManager.talents.filter(t => t.tier === tier);
      talents.forEach(talent => {
        const box = document.createElement('div');
        box.className = 'talent-slot';
        box.title = talent.description;
        box.textContent = talent.name;

        if (this.game.talentManager.isTalentUnlocked(talent.id)) {
          box.classList.add('unlocked');
        } else {
          const tierTaken = this.game.talentManager.acquired.some(id => {
            const t = this.game.talentManager.getTalent(id);
            return t && t.tier === tier;
          });
          const prereqsMet = !talent.prerequisites || talent.prerequisites.every(pr => this.game.talentManager.isTalentUnlocked(pr));
          const levelMet = !talent.requiredLevel || playerLevel >= talent.requiredLevel;
          const canUnlock = points > 0 && !tierTaken && prereqsMet && levelMet;
          if (canUnlock) {
            box.addEventListener('click', () => {
              if (confirm(`Unlock ${talent.name}? This cannot be undone.`)) {
                if (this.game.talentManager.unlockTalent(talent.id)) {
                  this.updateContent();
                } else {
                  this.game.uiManager.print('Unable to unlock talent.', 'error-message');
                }
              }
            });
          } else {
            box.classList.add('disabled');
          }
        }

        row.appendChild(box);
      });
      grid.appendChild(row);
    });

    this.content.appendChild(grid);
  }
}
