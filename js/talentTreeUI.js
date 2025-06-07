import { UIPanel } from './uiPanel.js';

export class TalentTreeUI extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('talent-panel');
    super(panel);
    this.game = game;
    this.content = null;
    this.closeButton = null;
    this.pointsEl = null;
    this.gridEl = null;
    this.init();
  }

  init() {
    this.content = document.getElementById('talent-content');
    this.closeButton = document.getElementById('close-talent');
    this.pointsEl = document.getElementById('talent-points');
    this.gridEl = document.getElementById('talent-grid');

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
    if (!this.gridEl || !this.pointsEl) return;

    this.pointsEl.textContent = `Available points: ${this.game.gameState.talentPoints || 0}`;

    this.gridEl.innerHTML = '';
    const tiers = [...new Set(this.game.talentManager.talents.map(t => t.tier))].sort();
    tiers.forEach(tier => {
      const wrapper = document.createElement('div');
      wrapper.className = 'talent-tier';

      const label = document.createElement('div');
      label.className = 'tier-label';
      const tExample = this.game.talentManager.talents.find(t => t.tier === tier);
      label.textContent = `Level ${tExample?.requiredLevel || tier}`;
      wrapper.appendChild(label);

      const row = document.createElement('div');
      row.className = 'talent-row';

      const acquiredInTier = this.game.talentManager.acquired.some(id => {
        const t = this.game.talentManager.getTalent(id);
        return t && t.tier === tier;
      });

      this.game.talentManager.talents
        .filter(t => t.tier === tier)
        .forEach(talent => {
          const box = document.createElement('div');
          box.className = 'talent-option';
          box.title = `${talent.name}: ${talent.description}`;
          if (this.game.talentManager.isTalentUnlocked(talent.id)) {
            box.classList.add('active');
          } else if (acquiredInTier) {
            box.classList.add('disabled');
          }
          box.addEventListener('click', () => this.handleTalentClick(talent));
          row.appendChild(box);
        });

      wrapper.appendChild(row);
      this.gridEl.appendChild(wrapper);
    });
  }

  handleTalentClick(talent) {
    if (this.game.talentManager.isTalentUnlocked(talent.id)) return;

    if ((this.game.gameState.talentPoints || 0) <= 0) {
      this.game.uiManager.print('You do not have any talent points.', 'error-message');
      return;
    }

    const tierTaken = this.game.talentManager.acquired.some(id => {
      const t = this.game.talentManager.getTalent(id);
      return t && t.tier === talent.tier;
    });
    if (tierTaken) {
      this.game.uiManager.print('You have already selected a talent for this tier.', 'system-message');
      return;
    }

    const success = this.game.talentManager.unlockTalent(talent.id);
    if (success) {
      this.game.gameState.talentPoints -= 1;
      this.updateContent();
      this.game.uiManager.print(`Unlocked talent: ${talent.name}`, 'system-message');
    } else {
      this.game.uiManager.print('Cannot unlock this talent.', 'error-message');
    }
  }
}
