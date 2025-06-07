export class TalentManager {
  constructor(game) {
    this.game = game;
    this.talents = [];
    this.acquired = [];
  }

  async initialize() {
    try {
      const response = await fetch('/talents/talents.json');
      if (!response.ok) throw new Error(`Failed to fetch talents: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data.talents)) {
        this.talents = data.talents;
      }
    } catch (err) {
      console.error('Failed to load talents:', err);
    }
  }

  getTalent(id) {
    return this.talents.find(t => t.id === id);
  }

  isTalentUnlocked(id) {
    return this.acquired.includes(id);
  }

  unlockTalent(id) {
    const talent = this.getTalent(id);
    if (!talent || this.isTalentUnlocked(id)) return false;

    const level = Math.floor(this.game.gameState.playerXp / (this.game.xpPerLevel || 100));
    if (talent.requiredLevel && level < talent.requiredLevel) return false;
    if (talent.prerequisites && !talent.prerequisites.every(pr => this.isTalentUnlocked(pr))) {
      return false;
    }

    if (talent.tier && this.acquired.some(tId => {
      const t = this.getTalent(tId);
      return t && t.tier === talent.tier;
    })) {
      return false;
    }

    if (!this.game.gameState.talentPoints || this.game.gameState.talentPoints <= 0) {
      return false;
    }

    this.acquired.push(id);
    this.game.gameState.talentPoints--;

    if (talent.effects) {
      if (talent.effects.unlockSpell) {
        const spellId = talent.effects.unlockSpell;
        if (!this.game.playerSpells.includes(spellId)) {
          this.game.playerSpells.push(spellId);
        }
      }
      if (talent.effects.statBonuses) {
        Object.entries(talent.effects.statBonuses).forEach(([stat, val]) => {
          this.game.playerStats[stat] = (this.game.playerStats[stat] || 0) + val;
        });
      }
    }
    return true;
  }

  save() {
    return {
      acquired: this.acquired
    };
  }

  load(data) {
    this.acquired = data?.acquired || [];
  }
}
