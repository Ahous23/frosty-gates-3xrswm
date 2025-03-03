export class InputHandlers {
  constructor(game) {
    this.game = game;
  }

  // Add a new method to handle combat input
  handleCombatInput(input) {
    this.game.combatSystem.processPlayerAction(input);
  }
  
  // Add method to handle combat item selection
  handleCombatItemInput(input) {
    this.game.combatSystem.useItem(input);
  }
  
  handleInput() {
    if (this.game.isTyping) return; // Don't process input while text is typing

    const rawInput = this.game.gameInput.value.trim();
    this.game.uiManager.clearInput();
    this.game.uiManager.print(`> ${rawInput}`, "player-input");

    const input = this.game.inputMode === "loadGame" ? rawInput : rawInput.toLowerCase();

    switch (this.game.inputMode) {
      case "title":
        this.handleTitleInput(input);
        break;
      case "normal":
        this.handleNormalInput(input);
        break;
      case "choices":
        this.handleChoiceInput(input);
        break;
      case "stats":
        this.handleStatInput(input);
        break;
      case "inventory":
        this.handleInventoryInput(input);
        break;
      case "loadGame":
        this.handleLoadGameInput(rawInput);
        break;
      case "errorRecovery":
        this.handleErrorRecoveryInput(input);
        break;
    }
  }

  handleTitleInput(input) {
    if (input === "1" || input.toLowerCase() === "new game") {
      this.startNewGame();
    } else if (input === "2" || input.toLowerCase() === "load game") {
      this.showLoadGamePrompt();
    } else {
      this.game.uiManager.print("Invalid option. Please type 1 for New Game or 2 for Load Game.", "error-message");
    }
  }

  handleNormalInput(input) {
    if (input === "help") {
      this.showHelp();
    } else if (input === "inventory" || input === "i") {
      this.showInventory();
    } else if (input === "stats" || input === "s") {
      this.showStats();
    } else if (input === "save") {
      this.saveGame();
    } else if (input === "load") {
      this.showLoadGamePrompt();
    } else if (input === "quit" || input === "exit" || input === "title") {
      this.game.uiManager.print("Returning to title screen...", "system-message");
      setTimeout(() => this.game.showTitleScreen(), 1000);
    } else {
      this.game.uiManager.print("I don't understand that command. Type 'help' for a list of commands.", "error-message");
    }
  }

  handleChoiceInput(input) {
    const scene = this.game.storyContent[this.game.currentScene];
    const choiceIndex = parseInt(input) - 1;

    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= scene.choices.length) {
      this.game.uiManager.print(`Please enter a number between 1 and ${scene.choices.length}.`, "error-message");
      return;
    }

    const choice = scene.choices[choiceIndex];
    this.game.uiManager.print(`You chose: ${choice.text}`, "system-message");
    this.makeChoice(choice.nextScene);
  }

  // Update handleStatInput to work with the new stat points from leveling
  handleStatInput(input) {
    const inputLower = input.toLowerCase();
    
    if (inputLower === "back") {
      this.game.inputMode = this.game.previousMode || "normal";
      this.game.uiManager.print("Returning to game.", "system-message");
      return;
    }
    
    if (inputLower === "help") {
      this.showStatHelp();
      return;
    }
    
    const validStats = ["attack", "defense", "charisma", "speed", "luck"];
    
    if (validStats.includes(inputLower)) {
      // Use availableStatPoints from gameState if it exists, otherwise from game object
      const availablePoints = this.game.gameState.availableStatPoints !== undefined 
        ? this.game.gameState.availableStatPoints 
        : this.game.availableStatPoints;
      
      if (availablePoints > 0) {
        this.game.playerStats[inputLower]++;
        
        // Update the correct stat points counter
        if (this.game.gameState.availableStatPoints !== undefined) {
          this.game.gameState.availableStatPoints--;
        } else {
          this.game.availableStatPoints--;
        }
        
        this.game.uiManager.print(`Increased ${inputLower} to ${this.game.playerStats[inputLower]}.`, "system-message");
        this.showStats();
      } else {
        this.game.uiManager.print("You don't have any stat points available.", "error-message");
      }
    } else {
      this.game.uiManager.print("Invalid stat. Try 'attack', 'defense', 'charisma', 'speed', or 'luck'.", "error-message");
    }
  }

  handleInventoryInput(input) {
    if (input === "back" || input === "exit") {
      this.resumeAfterInventory();
      return;
    }

    if (input === "help") {
      this.showInventoryHelp();
      return;
    }

    // Check if trying to use an item
    const useMatch = input.match(/^use\s+(.+)$/);
    if (useMatch) {
      const itemName = useMatch[1].toLowerCase();
      // Find the item by name (case insensitive)
      const item = this.game.inventory.find(
        (i) => i.name.toLowerCase() === itemName || i.id.toLowerCase() === itemName
      );

      if (!item) {
        this.game.uiManager.print(`You don't have an item called "${useMatch[1]}"`, "error-message");
        return;
      }

      this.useItem(item);
      return;
    }

    this.game.uiManager.print("Unknown inventory command. Type 'help' for inventory commands.", "error-message");
  }

  handleLoadGameInput(input) {
    if (input.toLowerCase() === "back") {
      this.game.showTitleScreen();
      return;
    }

    try {
      const saveData = JSON.parse(atob(input));
      this.loadSaveData(saveData);
    } catch (error) {
      this.game.uiManager.print("Invalid save code. Please try again or type 'back' to return.", "error-message");
    }
  }

  handleErrorRecoveryInput(input) {
    if (input === "restart") {
      this.game.showTitleScreen();
    } else if (input === "continue") {
      this.game.uiManager.print("Attempting to continue...", "system-message");
      this.game.playScene();
    } else {
      this.game.uiManager.print("Invalid input. Type 'restart' or 'continue'.", "error-message");
    }
  }

  startNewGame() {
    this.game.uiManager.print("\nStarting new game...\n", "system-message");
    
    // Stop title music
    this.game.audioManager.stopTitleMusic();

    // Clear output before starting new game
    this.game.uiManager.clearOutput();

    // Initialize starting inventory
    this.game.inventory = [];

    // Reset player stats to default
    this.game.playerStats = { ...this.game.initialPlayerStats };
    this.game.availableStatPoints = 10;

    this.game.currentScene = "intro";
    this.game.gameLogic.playScene();
  }

  async showLoadGamePrompt() {
    // Create elements for the typing effect
    const titleElement = document.createElement("div");
    titleElement.className = "load-title";
    this.game.gameOutput.appendChild(titleElement);
    
    // Apply typing effect to the title
    await this.game.uiManager.typeIntoElement(titleElement, "===== LOAD GAME =====", this.game.typingSpeed, this.game.audioManager);
    
    // Create subtitle with typing effect
    const subtitleElement = document.createElement("div");
    subtitleElement.className = "load-subtitle";
    this.game.gameOutput.appendChild(subtitleElement);
    
    await this.game.uiManager.typeIntoElement(subtitleElement, "Paste your save code below or type 'back' to return:", this.game.typingSpeed, this.game.audioManager);
    
    this.game.inputMode = "loadGame";
  }

  makeChoice(nextScene) {
    this.game.uiManager.clearOutput();
    this.game.currentScene = nextScene;
    this.game.awaitingInput = false;
    this.game.inputMode = "normal";
    this.game.gameLogic.playScene();
  }

  showStats() {
    // Display current stats
    this.game.uiManager.print("\nCurrent Stats:", "system-message");
    Object.entries(this.game.playerStats).forEach(([stat, value]) => {
      this.game.uiManager.print(`${stat}: ${value}`, "player-stat");
    });
    
    // Display health separately since it's in gameState
    this.game.uiManager.print(`health: ${this.game.gameState.playerHealth || 100}/100`, "player-stat");
    
    // Show XP and level if they exist
    if (this.game.gameState.playerXp !== undefined) {
      const level = Math.floor(this.game.gameState.playerXp / 100);
      const nextLevelXp = (level + 1) * 100;
      this.game.uiManager.print(`XP: ${this.game.gameState.playerXp}/${nextLevelXp} (Level ${level})`, "player-stat");
    }
    
    // Show available points
    const availablePoints = this.game.gameState.availableStatPoints !== undefined 
      ? this.game.gameState.availableStatPoints 
      : this.game.availableStatPoints;
      
    this.game.uiManager.print(`\nAvailable Points: ${availablePoints}`, "system-message");
    
    if (availablePoints > 0) {
      this.game.uiManager.print("Type a stat name to increase it (e.g., 'attack').", "system-message");
    }
    
    this.game.uiManager.print("Type 'back' to return to the game.", "system-message");
  }

  showHelp() {
    this.game.uiManager.print("\n===== COMMANDS =====", "system-message");
    this.game.uiManager.print("help - Show this help message", "help-text");
    this.game.uiManager.print("inventory, i - Show your inventory", "help-text");
    this.game.uiManager.print("stats, s - Show your stats", "help-text");
    this.game.uiManager.print("save - Save your game", "help-text");
    this.game.uiManager.print("load - Load a saved game", "help-text");
    this.game.uiManager.print("quit, exit, title - Return to title screen", "help-text");
  }

  showStatHelp() {
    this.game.uiManager.print("\n===== STAT ALLOCATION =====", "system-message");
    this.game.uiManager.print("Type a stat name to increase it:", "help-text");
    Object.keys(this.game.playerStats).forEach((stat) => {
      this.game.uiManager.print(`- ${stat}`, "help-text");
    });
    this.game.uiManager.print("Type 'confirm' when finished", "help-text");
    this.game.uiManager.print(`Available points: ${this.game.availableStatPoints}`, "system-message");
  }

  showInventoryHelp() {
    this.game.uiManager.print("\n===== INVENTORY COMMANDS =====", "system-message");
    this.game.uiManager.print("use [item] - Use an item", "help-text");
    this.game.uiManager.print("back, exit - Exit inventory view", "help-text");
  }

  resumeAfterInventory() {
    this.game.inputMode = this.game.previousMode || "normal";
    this.game.previousMode = null;
    this.game.uiManager.clearOutput();
    if (this.game.inputMode === "normal") {
      this.game.gameLogic.playScene();
    }
  }

  showInventory() {
    this.game.previousMode = this.game.inputMode;
    this.game.inputMode = "inventory";
    this.game.uiManager.clearOutput();
    this.game.uiManager.print("===== INVENTORY =====", "system-message");
    
    if (this.game.inventory.length === 0) {
      this.game.uiManager.print("Your inventory is empty.", "system-message");
    } else {
      this.game.inventory.forEach((item) => {
        this.game.uiManager.print(`- ${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ""}`, "item-name");
        if (item.description) {
          this.game.uiManager.print(`  ${item.description}`, "item-description");
        }
      });
    }
    
    this.game.uiManager.print("\nType 'use [item]' to use an item, or 'back' to return", "system-message");
  }

  useItem(item) {
    this.game.uiManager.print(`Using ${item.name}...`, "system-message");
    
    if (item.effect) {
      this.handleCustomItemEffect(item);
      this.game.uiManager.print(item.effectDescription || "Item used.", "system-message");
    } else {
      this.game.uiManager.print("This item has no effect right now.", "system-message");
    }
    
    if (item.consumable) {
      this.removeItemFromInventory(item.id);
    }
    
    this.showInventory(); // Refresh inventory view
  }

  useItemById(itemId) {
    const item = this.game.inventory.find((i) => i.id === itemId);
    if (item) {
      this.useItem(item);
      return true;
    }
    return false;
  }

  removeItemFromInventory(itemId, quantity = 1) {
    const itemIndex = this.game.inventory.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return false;
    
    const item = this.game.inventory[itemIndex];
    item.quantity -= quantity;
    
    if (item.quantity <= 0) {
      this.game.inventory.splice(itemIndex, 1);
    }
    
    return true;
  }

  handleCustomItemEffect(item) {
    switch (item.id) {
      case "healingSalve":
        this.game.gameState.isInjured = false;
        break;
      // Add more custom effects as needed
    }
  }

  adjustStat(stat, change) {
    if (change > 0 && this.game.availableStatPoints < change) {
      this.game.uiManager.print(`You only have ${this.game.availableStatPoints} points available.`, "error-message");
      return false;
    }
    
    this.game.playerStats[stat] += change;
    this.game.availableStatPoints -= change;
    
    this.game.uiManager.print(`${stat} is now ${this.game.playerStats[stat]}`, "system-message");
    this.game.uiManager.print(`Available points: ${this.game.availableStatPoints}`, "system-message");
    
    if (this.game.availableStatPoints <= 0) {
      this.game.uiManager.print("You have used all your stat points. Type 'confirm' to continue.", "system-message");
    }
    
    return true;
  }

  confirmStats() {
    this.game.uiManager.print("Stats confirmed!", "system-message");
    this.game.inputMode = "normal";
    this.game.uiManager.clearOutput();
    this.game.currentScene = this.game.nextScene;
    this.game.gameLogic.playScene();
  }

  saveGame() {
    const saveData = {
      currentScene: this.game.currentScene,
      playerStats: this.game.playerStats,
      inventory: this.game.inventory,
      gameState: this.game.gameState,
    };
    
    const saveCode = btoa(JSON.stringify(saveData));
    this.game.uiManager.clearOutput();
    this.game.uiManager.print("===== SAVE GAME =====", "system-message");
    this.game.uiManager.print("Copy and save this code to load your game later:", "system-message");
    this.game.uiManager.print(saveCode, "save-code");
    this.game.uiManager.print("\nPress Enter to continue", "system-message");
  }

  loadSaveData(saveData) {
    try {
      this.game.currentScene = saveData.currentScene;
      this.game.playerStats = saveData.playerStats;
      this.game.inventory = saveData.inventory;
      this.game.gameState = saveData.gameState;
      
      this.game.uiManager.print("Game loaded successfully!", "system-message");
      setTimeout(() => {
        this.game.uiManager.clearOutput();
        this.game.inputMode = "normal";
        this.game.gameLogic.playScene();
      }, 1500);
    } catch (error) {
      this.game.uiManager.print("Error loading save data: " + error.message, "error-message");
      this.game.showTitleScreen();
    }
  }
}