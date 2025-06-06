import { UIPanel } from './uiPanel.js';

export class EquipmentManagerUI extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('equipment-panel');
    super(panel);
    this.game = game;
    this.content = null;
    this.closeButton = null;
    this.statsCollapsed = false; // Track collapsed state
    
    // Initialize confirmation state from game state if it exists
    this.statPointsConfirmed = this.game.gameState?.statsConfirmed || false;
    
    // Initialize only if document is already loaded
    if (document.readyState === "complete") {
      this.init();
    } else {
      // Otherwise wait for DOM to be ready
      document.addEventListener("DOMContentLoaded", () => this.init());
    }
  }
  
  // Update the init method to add proper close button handling:

  init() {
    // Set up equipment panel
    this.content = document.getElementById('equipment-content');
    this.closeButton = document.getElementById('close-equipment');
    
    // Check if elements exist before proceeding
    if (!this.panel || !this.content || !this.closeButton) {
      console.error("Equipment panel elements not found in the DOM");
      return;
    }
    
    // Ensure the panel is hidden initially
    this.panel.classList.add('hidden');
    
    // Setup event listeners
    this.closeButton.addEventListener('click', () => {
      // Close panel and restore previous input mode
      this.toggle(false);
      
      // Call resumeAfterEquipment to ensure proper input mode restoration
      if (this.game.inputHandlers && typeof this.game.inputHandlers.resumeAfterEquipment === 'function') {
        this.game.inputHandlers.resumeAfterEquipment();
      }
    });
  }
  
  // Ensure the toggle method works properly
  toggle(show = !this.visible) {
    // If we're showing this panel, close others first
    if (show) {
      // Close notes panel if it exists and is open
      if (this.game.notesManager && this.game.notesManager.visible) {
        this.game.notesManager.toggle(false);
      }
      
      // Close map panel if it exists and is open
      if (this.game.mapManager && this.game.mapManager.visible) {
        this.game.mapManager.toggle(false);
      }
    } else if (this.visible) {
      // We're closing the panel, so restore the previous input mode
      if (this.game.inputMode === "equipment") {
        this.game.inputMode = this.game.previousMode || "normal";
        this.game.previousMode = null;
        console.log("Restored input mode to:", this.game.inputMode);
      }
    }
    
    if (show === this.visible) return;

    super.toggle(show);

    if (this.visible) {
      this.updateContent();
    }
  }
  
  updateContent() {
    if (!this.content || !this.visible) return;
    
    // Clear existing content
    this.content.innerHTML = '';
    
    if (!this.game.equipmentManager) {
      this.content.innerHTML = '<p>Equipment manager not available</p>';
      return;
    }
    
    try {
      const equipment = this.game.equipmentManager.getAllEquipment();
      
      // Define sections
      const statsSection = document.createElement('div');
      statsSection.className = 'equipment-section stats-section';
      
      const weaponSection = document.createElement('div');
      weaponSection.className = 'equipment-section';
      
      const armorSection = document.createElement('div');
      armorSection.className = 'equipment-section';
      
      const accessorySection = document.createElement('div');
      accessorySection.className = 'equipment-section';
      
      // Calculate available points here at the beginning
      const availablePoints = (this.game.gameState.availableStatPoints || 0) + (this.game.availableStatPoints || 0);
      
      // ---- Build Combat Stats Section ----
      const statsTitle = document.createElement('h3');
      statsTitle.textContent = 'Combat Stats';
      statsSection.appendChild(statsTitle);
      
      const totalAttack = this.game.inputHandlers.getCalculatedAttack ? 
                          this.game.inputHandlers.getCalculatedAttack() : 
                          "N/A";
      const totalDefense = this.game.inputHandlers.getCalculatedDefense ? 
                           this.game.inputHandlers.getCalculatedDefense() : 
                           "N/A";
      
      const statsInfo = document.createElement('div');
      statsInfo.innerHTML = `
        <p class="player-stat">Total Attack: ${totalAttack}</p>
        <p class="player-stat">Total Defense: ${totalDefense}</p>
      `;
      
      statsSection.appendChild(statsInfo);
      
      // ---- Build Weapon Section ----
      const weaponTitle = document.createElement('h3');
      weaponTitle.textContent = 'Weapon';
      weaponSection.appendChild(weaponTitle);
      
      if (equipment.weapon) {
        const weaponInfo = document.createElement('div');
        weaponInfo.className = 'equipment-item';
        
        const attackBonus = Math.floor(this.game.playerStats.attack / 2);
        const totalAttack = equipment.weapon.damage + attackBonus;
        
        weaponInfo.innerHTML = `
          <p class="item-name">${equipment.weapon.name}</p>
          <p class="item-stat">Damage: ${equipment.weapon.damage}</p>
          <p class="item-stat-detail">Attack Bonus: +${attackBonus}</p>
          <p class="item-stat-detail">Total Attack: ${totalAttack}</p>
          <button class="equipment-action" data-action="examine" data-slot="weapon">Examine</button>
          <button class="equipment-action" data-action="unequip" data-slot="weapon">Unequip</button>
        `;
        
        weaponSection.appendChild(weaponInfo);
      } else {
        const emptySlot = document.createElement('p');
        emptySlot.className = 'empty-slot';
        emptySlot.textContent = 'No weapon equipped';
        
        const attackBonus = Math.floor(this.game.playerStats.attack / 2);
        const fistsInfo = document.createElement('p');
        fistsInfo.className = 'item-stat-detail';
        fistsInfo.textContent = `Using fists: 1 damage + ${attackBonus} bonus = ${1 + attackBonus} total attack`;
        
        weaponSection.appendChild(emptySlot);
        weaponSection.appendChild(fistsInfo);
      }
      
      // ---- Build Armor Section ----
      const armorTitle = document.createElement('h3');
      armorTitle.textContent = 'Armor';
      armorSection.appendChild(armorTitle);
      
      if (equipment.armor) {
        const armorInfo = document.createElement('div');
        armorInfo.className = 'equipment-item';
        
        const defenseBonus = Math.floor(this.game.playerStats.defense / 2);
        const totalDefense = equipment.armor.defense + defenseBonus;
        
        armorInfo.innerHTML = `
          <p class="item-name">${equipment.armor.name}</p>
          <p class="item-stat">Defense: ${equipment.armor.defense}</p>
          <p class="item-stat-detail">Defense Bonus: +${defenseBonus}</p>
          <p class="item-stat-detail">Total Defense: ${totalDefense}</p>
          <button class="equipment-action" data-action="examine" data-slot="armor">Examine</button>
          <button class="equipment-action" data-action="unequip" data-slot="armor">Unequip</button>
        `;
        
        armorSection.appendChild(armorInfo);
      } else {
        const emptySlot = document.createElement('p');
        emptySlot.className = 'empty-slot';
        emptySlot.textContent = 'No armor equipped';
        
        const defenseBonus = Math.floor(this.game.playerStats.defense / 2);
        const defenseInfo = document.createElement('p');
        defenseInfo.className = 'item-stat-detail';
        defenseInfo.textContent = `Base defense: ${defenseBonus}`;
        
        armorSection.appendChild(emptySlot);
        armorSection.appendChild(defenseInfo);
      }
      
      // ---- Build Accessory Section ----
      const accessoryTitle = document.createElement('h3');
      accessoryTitle.textContent = 'Accessory';
      accessorySection.appendChild(accessoryTitle);
      
      if (equipment.accessory) {
        const accessoryInfo = document.createElement('div');
        accessoryInfo.className = 'equipment-item';
        
        let effectsHtml = '';
        if (equipment.accessory.effects) {
          Object.entries(equipment.accessory.effects).forEach(([effect, value]) => {
            const formattedEffect = this.formatEffectName(effect);
            effectsHtml += `<p class="item-stat-detail">${formattedEffect}: ${value > 0 ? '+' : ''}${value}</p>`;
          });
        }
        
        accessoryInfo.innerHTML = `
          <p class="item-name">${equipment.accessory.name}</p>
          ${effectsHtml}
          <button class="equipment-action" data-action="examine" data-slot="accessory">Examine</button>
          <button class="equipment-action" data-action="unequip" data-slot="accessory">Unequip</button>
        `;
        
        accessorySection.appendChild(accessoryInfo);
      } else {
        const emptySlot = document.createElement('p');
        emptySlot.className = 'empty-slot';
        emptySlot.textContent = 'No accessory equipped';
        accessorySection.appendChild(emptySlot);
      }
      
      // ---- Build Player Stats Section (collapsible) ----
      const playerStatsSection = document.createElement('div');
      playerStatsSection.className = 'equipment-section player-stats-section';
      
      // Create collapsible header
      const playerStatsHeader = document.createElement('div');
      playerStatsHeader.className = 'collapsible-header';
      
      const playerStatsTitle = document.createElement('h3');
      playerStatsTitle.textContent = 'Character Stats';
      
      // Add toggle button
      const toggleButton = document.createElement('button');
      toggleButton.className = 'toggle-stats-button';
      toggleButton.innerHTML = '−'; // Minus sign (expanded state)
      toggleButton.title = 'Collapse stats section';
      
      playerStatsHeader.appendChild(playerStatsTitle);
      playerStatsHeader.appendChild(toggleButton);
      playerStatsSection.appendChild(playerStatsHeader);
      
      // Create content container (this will be toggled)
      const statsContentContainer = document.createElement('div');
      statsContentContainer.className = 'stats-content-container';
      
      // Add available points display
      if (availablePoints > 0) {
        const pointsInfo = document.createElement('div');
        pointsInfo.className = 'available-points';
        pointsInfo.textContent = `Available Points: ${availablePoints}`;
        statsContentContainer.appendChild(pointsInfo);
      }
      
      // Create stats container
      const statsContainer = document.createElement('div');
      statsContainer.className = 'stats-container';
      
      // Create stat adjustment controls for each stat
      const stats = Object.entries(this.game.playerStats);
      stats.forEach(([stat, value]) => {
        const statRow = document.createElement('div');
        statRow.className = 'stat-row';
        
        // Stat name
        const statName = document.createElement('span');
        statName.className = 'stat-name';
        statName.textContent = stat.charAt(0).toUpperCase() + stat.slice(1);
        
        // Stat value
        const statValue = document.createElement('span');
        statValue.className = 'stat-value';
        statValue.textContent = value;
        
        // Adjustment buttons 
        // Show them if either points are available OR stats haven't been confirmed yet
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'stat-buttons';
        
        // We want to show the buttons as long as stats haven't been confirmed
        // OR there are points to allocate
        if (availablePoints > 0 || !this.statPointsConfirmed) {
          // Add button - only enabled if points are available
          const addButton = document.createElement('button');
          addButton.className = 'stat-button add-stat';
          addButton.textContent = '+';
          addButton.title = `Increase ${stat}`;
          addButton.dataset.stat = stat;
          addButton.disabled = availablePoints <= 0;
          addButton.addEventListener('click', () => this.adjustStat(stat, 1));
          
          // Subtract button - only enable if stat is above initial value
          const initialValue = this.game.initialPlayerStats[stat] || 0;
          const confirmed = this.game.gameState.confirmedStats?.[stat] ?? initialValue;
          const subtractButton = document.createElement('button');
          subtractButton.className = 'stat-button subtract-stat';
          subtractButton.textContent = '-';
          subtractButton.title = `Decrease ${stat}`;
          subtractButton.dataset.stat = stat;
          subtractButton.disabled = value <= confirmed;
          subtractButton.addEventListener('click', () => this.adjustStat(stat, -1));
          
          buttonContainer.appendChild(subtractButton);
          buttonContainer.appendChild(addButton);
        }
        
        // Assemble the row
        statRow.appendChild(statName);
        statRow.appendChild(statValue);
        statRow.appendChild(buttonContainer);
        statsContainer.appendChild(statRow);
      });
      
      statsContentContainer.appendChild(statsContainer);
      
      // Add notification area for messages regardless of points remaining
      const notificationArea = document.createElement('div');
      notificationArea.className = 'stats-notification-area';
      statsContentContainer.appendChild(notificationArea);
      
      // Calculate remaining points
      const remainingPoints = (this.game.gameState.availableStatPoints || 0) + (this.game.availableStatPoints || 0);
      
      if (remainingPoints > 0) {
        // If points are available, show allocation message
        const allocateMsg = document.createElement('div');
        allocateMsg.className = 'stats-notification';
        allocateMsg.textContent = `You have ${remainingPoints} point${remainingPoints > 1 ? 's' : ''} to allocate. You must use all your points before confirming.`;
        notificationArea.appendChild(allocateMsg);
      } else if (remainingPoints === 0 && !this.statPointsConfirmed) {
        // If all points are used AND not yet confirmed, show confirm message and button
        const confirmMsg = document.createElement('div');
        confirmMsg.className = 'stats-notification ready-to-confirm';
        confirmMsg.textContent = 'All points allocated! Click "Confirm Stats" to finalize.';
        notificationArea.appendChild(confirmMsg);
        
        // Add confirm button only when all points are allocated and not yet confirmed
        const confirmButton = document.createElement('button');
        confirmButton.className = 'confirm-stats-button';
        confirmButton.textContent = 'Confirm Stats';
        confirmButton.addEventListener('click', () => this.confirmStats());
        statsContentContainer.appendChild(confirmButton);
      } else if (this.statPointsConfirmed) {
        // If stats are already confirmed, show a confirmation message
        const confirmedMsg = document.createElement('div');
        confirmedMsg.className = 'stats-notification stats-confirmed';
        confirmedMsg.textContent = 'Stats are confirmed and locked.';
        notificationArea.appendChild(confirmedMsg);
      }
      
      // Add health and XP information
      const healthEl = document.createElement('div');
      healthEl.className = 'player-health-xp';
      
      const health = this.game.gameState.playerHealth || this.game.initialPlayerHealth || 100;
      const maxHealth = this.game.maxPlayerHealth || 100;
      healthEl.innerHTML = `<span class="health-label">Health:</span> <span class="health-value">${health}/${maxHealth}</span>`;
      
      if (this.game.gameState.playerXp !== undefined) {
        const level = Math.floor(this.game.gameState.playerXp / (this.game.xpPerLevel || 100));
        const nextLevelXp = (level + 1) * (this.game.xpPerLevel || 100);
        const xpEl = document.createElement('div');
        xpEl.innerHTML = `<span class="xp-label">XP:</span> <span class="xp-value">${this.game.gameState.playerXp}/${nextLevelXp} (Level ${level})</span>`;
        statsContentContainer.appendChild(xpEl);
      }
      
      statsContentContainer.appendChild(healthEl);
      
      // Add the content container to the stats section
      playerStatsSection.appendChild(statsContentContainer);
      
      // Add event listener to the toggle button
      toggleButton.addEventListener('click', () => {
        if (statsContentContainer.classList.contains('collapsed')) {
          // Expand
          statsContentContainer.classList.remove('collapsed');
          toggleButton.innerHTML = '−'; // Minus sign
          toggleButton.title = 'Collapse stats section';
          this.statsCollapsed = false;
        } else {
          // Collapse
          statsContentContainer.classList.add('collapsed');
          toggleButton.innerHTML = '+'; // Plus sign
          toggleButton.title = 'Expand stats section';
          this.statsCollapsed = true;
        }
      });
      
      // Initialize based on saved state
      if (this.statsCollapsed && availablePoints === 0) {
        statsContentContainer.classList.add('collapsed');
        toggleButton.innerHTML = '+';
        toggleButton.title = 'Expand stats section';
      }
      
      // Add inventory button
      const inventoryBtn = document.createElement('button');
      inventoryBtn.className = 'inventory-button';
      inventoryBtn.textContent = 'Open Inventory';
      inventoryBtn.addEventListener('click', () => {
        this.toggle(false);
        this.game.inputHandlers.showInventory();
      });
      
      // Add all sections to the content in optimal order
      this.content.appendChild(statsSection); // Combat stats at the top
      this.content.appendChild(weaponSection);
      this.content.appendChild(armorSection);
      this.content.appendChild(accessorySection);
      this.content.appendChild(playerStatsSection); // Character stats last
      this.content.appendChild(inventoryBtn);
      
      // Add event listeners to buttons
      const actionButtons = this.content.querySelectorAll('.equipment-action');
      actionButtons.forEach(button => {
        button.addEventListener('click', () => {
          const action = button.dataset.action;
          const slot = button.dataset.slot;
          
          if (action === 'examine') {
            this.game.inputHandlers.examineEquippedItem(slot);
            this.toggle(false);
          } else if (action === 'unequip') {
            this.game.inputHandlers.unequipItem(slot);
            this.updateContent(); // Refresh the panel
          }
        });
      });
    } catch (error) {
      console.error("Error updating equipment content:", error);
      this.content.innerHTML = '<p>Error loading equipment data</p>';
    }
  }
  
  // Helper method to format effect names for display
  formatEffectName(effect) {
    if (!effect) return "";
    
    // Convert camelCase to Title Case With Spaces
    return effect
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }

  // Adjust a stat by the given amount
  adjustStat(stat, change) {
    const baseline = this.statPointsConfirmed
      ? (this.game.gameState.confirmedStats?.[stat] ?? this.game.initialPlayerStats[stat] || 0)
      : (this.game.initialPlayerStats[stat] || 0);

    // Calculate total available points from both sources
    const totalAvailablePoints = (this.game.gameState.availableStatPoints || 0) + (this.game.availableStatPoints || 0);
    
    if (change > 0 && totalAvailablePoints < change) {
      alert(`You only have ${totalAvailablePoints} points available.`);
      return false;
    }
    
    // Don't allow reducing below the baseline
    if (change < 0 && this.game.playerStats[stat] + change < baseline) {
      alert(`Cannot reduce ${stat} below ${baseline}.`);
      return false;
    }
    
    // Adjust the stat
    this.game.playerStats[stat] += change;
    
    // Consume points from gameState first, then from game object if needed
    if (change > 0) {
      if (this.game.gameState.availableStatPoints >= change) {
        this.game.gameState.availableStatPoints -= change;
      } else {
        // If gameState doesn't have enough points, use some from there and some from game object
        const pointsFromGameState = this.game.gameState.availableStatPoints || 0;
        const remainingPoints = change - pointsFromGameState;
        
        this.game.gameState.availableStatPoints = 0;
        this.game.availableStatPoints = Math.max(0, (this.game.availableStatPoints || 0) - remainingPoints);
      }
    } else if (change < 0) {
      // When reducing stats, add points back to gameState
      this.game.gameState.availableStatPoints = (this.game.gameState.availableStatPoints || 0) - change;
    }
    
    // Add notification if all points are used
    const remainingPoints = (this.game.gameState.availableStatPoints || 0) + (this.game.availableStatPoints || 0);
    // Find notification area
    let notificationArea = this.content.querySelector('.stats-notification-area');
    if (notificationArea) {
      // Clear previous notifications
      notificationArea.innerHTML = '';
      
      if (remainingPoints === 0) {
        // Show "ready to confirm" notification
        const confirmMsg = document.createElement('div');
        confirmMsg.className = 'stats-notification ready-to-confirm';
        confirmMsg.textContent = 'All points allocated! Click "Confirm Stats" to finalize.';
        notificationArea.appendChild(confirmMsg);
      } else {
        // Show "points remaining" notification
        const allocateMsg = document.createElement('div');
        allocateMsg.className = 'stats-notification';
        allocateMsg.textContent = `You have ${remainingPoints} point${remainingPoints > 1 ? 's' : ''} to allocate. You must use all your points before confirming.`;
        notificationArea.appendChild(allocateMsg);
      }
      
      // Also update the UI - remove or add confirm button based on remaining points and confirmation state
      const existingConfirmButton = this.content.querySelector('.confirm-stats-button');
      
      if (remainingPoints === 0 && !this.statPointsConfirmed && !existingConfirmButton) {
        // Add confirm button if all points used, not confirmed, and button doesn't exist
        const confirmButton = document.createElement('button');
        confirmButton.className = 'confirm-stats-button';
        confirmButton.textContent = 'Confirm Stats';
        confirmButton.addEventListener('click', () => this.confirmStats());
        // Find parent to append to (should be the statsContentContainer)
        const statsContentContainer = notificationArea.parentNode;
        if (statsContentContainer) {
          statsContentContainer.appendChild(confirmButton);
        }
      } else if ((remainingPoints > 0 || this.statPointsConfirmed) && existingConfirmButton) {
        // Remove confirm button if points are available OR stats are confirmed
        existingConfirmButton.remove();
      }
    }
    
    // Refresh the panel to show updated stats
    this.updateContent();
    return true;
  }

  // Confirm stat allocation
  confirmStats() {
    // Double-check that all points are allocated
    const totalPoints = (this.game.gameState.availableStatPoints || 0) + (this.game.availableStatPoints || 0);
    
    if (totalPoints > 0) {
      alert(`You still have ${totalPoints} point${totalPoints > 1 ? 's' : ''} to allocate. You must use all your points before confirming.`);
      return;
    }
    
    if (confirm("Are you sure you want to confirm these stats? You won't be able to reallocate these points later.")) {
      // Consolidate all available points into gameState before setting to 0
      this.game.gameState.availableStatPoints = 0;
      this.game.availableStatPoints = 0;
      
      // Mark stats as confirmed in both this UI and the game state
      this.statPointsConfirmed = true;
      this.game.gameState.statsConfirmed = true;
      this.game.gameState.confirmedStats = { ...this.game.playerStats };
      
      // Update the UI to reflect confirmed state
      this.updateContent();
      
      // Notify the player
      alert("Stats confirmed!");
    }
  }
}