export class StatsPointsHandler {
  constructor(game) {
    this.game = game;
  }

  // Get total available points from both gameState and temporary pool
  getTotal() {
    return (this.game.gameState.availableStatPoints || 0) +
           (this.game.availableStatPoints || 0);
  }

  // Adjust a stat with optional initial allocation flag
  adjustStat(stat, change, isInitialAllocation = false) {
    const baseline = isInitialAllocation
      ? (this.game.initialPlayerStats[stat] || 0)
      : (this.game.gameState.confirmedStats?.[stat] ?? (this.game.initialPlayerStats[stat] || 0));

    const available = isInitialAllocation
      ? this.game.availableStatPoints
      : (this.game.gameState.availableStatPoints || 0);

    if (change > 0 && available < change) {
      this.game.uiManager.print(`You only have ${available} points available.`, 'error-message');
      return false;
    }

    if (change < 0 && this.game.playerStats[stat] + change < baseline) {
      this.game.uiManager.print(`Cannot reduce ${stat} below ${baseline}.`, 'error-message');
      return false;
    }

    this.game.playerStats[stat] += change;

    if (isInitialAllocation) {
      this.game.availableStatPoints -= change;
    } else {
      this.game.gameState.availableStatPoints = (this.game.gameState.availableStatPoints || 0) - change;
    }

    return true;
  }

  // Move any temporary points into the persistent game state (used before saving)
  consolidateForSave() {
    const total = this.getTotal();
    this.game.gameState.availableStatPoints = total;
    this.game.availableStatPoints = 0;
  }

  // When loading a game we only use points from gameState
  resetAfterLoad() {
    this.game.availableStatPoints = 0;
  }
}
