export class SpellManager {
  constructor(game) {
    this.game = game;
    this.spells = [];
  }

  async initialize() {
    try {
      const response = await fetch('/spells/spells.json');
      if (!response.ok) throw new Error(`Failed to fetch spell list: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data.spells)) {
        this.spells = data.spells;
      }
    } catch (err) {
      console.error('Failed to load spells:', err);
    }
  }

  getSpell(id) {
    return this.spells.find(s => s.id === id);
  }
}
