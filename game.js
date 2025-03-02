class TextGame {
  constructor() {
    this.currentScene = null;
    this.playerStats = {
      attack: 5,
      defense: 5,
      charisma: 5,
      speed: 5,
      luck: 5,
    };
    this.typingSpeed = 30; // milliseconds per character
    this.gameState = {};
    this.availableStatPoints = 10;

    // Inventory system
    this.inventory = [];

    // Story content
    this.storyContent = {};
    this.storyIndex = null;

    // Game state flags
    this.isTyping = false;
    this.awaitingInput = false;
    this.inputMode = "normal"; // Can be: normal, stats, inventory, title, choices, loadGame
    this.previousMode = null; // To track where to return after inventory/stats viewing

    // DOM elements
    this.gameOutput = document.getElementById("gameOutput");
    this.gameInput = document.getElementById("gameInput");
	
	// Audio elements
  this.titleMusic = new Audio('audio/title.mp3');
  this.titleMusic.loop = true;
  this.musicEnabled = false; // Track if music is enabled
  
  // Add a one-time interaction listener to enable audio
  const enableAudio = () => {
    this.musicEnabled = true;
    // Try to play music if we're on the title screen
    if (this.inputMode === "title") {
      this.playTitleMusic();
    }
    // Remove the listener once triggered
    document.removeEventListener('click', enableAudio);
    document.removeEventListener('keydown', enableAudio);
  };
  
  document.addEventListener('click', enableAudio);
  document.addEventListener('keydown', enableAudio);
	
    // Setup event listeners
    this.gameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.handleInput();
      }
      // Add spacebar listener for skipping text
      if (e.code === "Space" && this.isTyping) {
        this.skipTyping();
      }
    });

    // Initialize the game
    this.initialize();
	
	// In your constructor
	this.musicToggleBtn = document.getElementById("musicToggle");
		if (this.musicToggleBtn) {
		this.musicToggleBtn.addEventListener("click", () => {
			this.toggleMusic();
		});
	}

  }

	// Add this method
	toggleMusic() {
	  if (this.titleMusic.paused) {
		this.musicEnabled = true;
		this.playTitleMusic();
	  } else {
		this.stopTitleMusic();
	  }
	}
	playTitleMusic() {
	  // Only play if music is enabled
	  if (this.musicEnabled) {
		this.titleMusic.volume = 0.5; // 50% volume
		this.titleMusic.play().catch(e => {
		  console.log("Error playing title music:", e);
		});
	  }
	}

	stopTitleMusic() {
	  if (!this.musicEnabled) return;
	  
	  // Simple fade out
	  const fadeAudio = setInterval(() => {
		// Only fade if past 0
		if (this.titleMusic.volume > 0.05) {
		  this.titleMusic.volume -= 0.05;
		} else {
		  this.titleMusic.pause();
		  this.titleMusic.currentTime = 0;
		  this.titleMusic.volume = 0.5; // Reset volume for next time
		  clearInterval(fadeAudio);
		}
	  }, 100);
	}
	


  async initialize() {
    // Clear the output
    this.gameOutput.innerHTML = "";

    // Show welcome message
    this.print("Welcome to Olaf vs Bears", "system-message");
    this.print("Loading game content...", "system-message");

    // Load story index
    await this.loadStoryIndex();

    // Show title screen options
    this.showTitleScreen();
  }

	async showTitleScreen() {
	  // Clear any existing content first
	  this.clearOutput();
	  
	  // Create a container div for the title banner with campfire
	  const titleContainer = document.createElement("div");
	  titleContainer.className = "title-banner";
	  
	  // Add the campfire GIF
	  const campfireImg = document.createElement("img");
	  campfireImg.src = "gif/campfire.gif";
	  campfireImg.alt = "Campfire";
	  campfireImg.className = "title-campfire";
	  titleContainer.appendChild(campfireImg);
	  
		// Try to play title music
		this.playTitleMusic();
	  
	  // Add the title content to the container
	  const titleText = document.createElement("div");
	  titleText.className = "title-text";
	  titleContainer.appendChild(titleText);
	  
	  // Append the container to your game output
	  this.gameOutput.appendChild(titleContainer);
	  
	  // Use the typeText method for the title banner, but target the titleText element
	  await this.typeIntoElement(titleText, "\n==== OLAF vs BEARS ====\n== For Shawclops, ❤️ Vanilla-Bear ==\n");
	  
	  // Add the choices without animation
	  this.print("1. New Game", "choice");
	  this.print("2. Load Game", "choice");

	  this.awaitingInput = true;
	  this.inputMode = "title";
	}

	// Add this helper method if you don't already have it
	async typeIntoElement(element, text) {
	  // Clear the element first
	  element.innerHTML = "";
	  this.isTyping = true;
	  
	  // Type character by character
	  for (let i = 0; i < text.length; i++) {
		// Check if typing was interrupted
		if (!this.isTyping) {
		  element.innerHTML = text; // Show the full text immediately
		  break;
		}
		
		element.innerHTML += text.charAt(i);
		await new Promise((resolve) => setTimeout(resolve, this.typingSpeed));
	  }
	  
	  this.isTyping = false;
	}

  async loadStoryIndex() {
    try {
      const response = await fetch("story/index.json");
      if (!response.ok)
        throw new Error(`Failed to fetch story index: ${response.status}`);

      this.storyIndex = await response.json();

      // Load initial chapter
      await this.loadChapter("chapter1");

      return true;
    } catch (error) {
      console.error("Failed to load story index:", error);
      this.print(
        `Error loading story content: ${error.message}. Please refresh the page.`,
        "error-message"
      );
      return false;
    }
  }

	async typeIntoElement(element, text) {
	  // Clear the element first
	  element.innerHTML = "";
	  this.isTyping = true;
	  
	  // Type character by character
	  for (let i = 0; i < text.length; i++) {
		// Check if typing was interrupted
		if (!this.isTyping) {
		  element.textContent = text; // Show the full text immediately
		  break;
		}
		
		element.textContent += text.charAt(i);
		await new Promise((resolve) => setTimeout(resolve, this.typingSpeed));
	  }
	  
	  this.isTyping = false;
	}

  async loadChapter(chapterId) {
    if (!this.storyIndex.chapters[chapterId]) {
      console.error(`Chapter ${chapterId} not found in index`);
      return false;
    }

    try {
      // Show loading screen before loading the chapter
      await this.showLoadingScreen();

      const path = this.storyIndex.chapters[chapterId];
      const response = await fetch(path);
      if (!response.ok)
        throw new Error(`Failed to fetch chapter: ${response.status}`);

      const chapterContent = await response.json();

      // Merge new content with existing content
      this.storyContent = { ...this.storyContent, ...chapterContent.scenes };
      return true;
    } catch (error) {
      console.error(`Failed to load chapter ${chapterId}:`, error);
      return false;
    }
  }

  async ensureSceneLoaded(sceneId) {
    // If scene is already loaded, we're good
    if (this.storyContent[sceneId]) return true;

    // Otherwise, determine which chapter to load
    const chapterId = this.getChapterForScene(sceneId);
    if (!chapterId) {
      console.error(`Cannot determine chapter for scene: ${sceneId}`);
      return false;
    }

    return await this.loadChapter(chapterId);
  }

  getChapterForScene(sceneId) {
    // Check mapping in storyIndex
    for (const [chapterId, info] of Object.entries(
      this.storyIndex.sceneMapping
    )) {
      if (info.scenes.includes(sceneId)) {
        return chapterId;
      }
    }
    return null;
  }

  print(text, className = "") {
    const element = document.createElement("div");
    if (className) element.className = className;
    element.textContent = text;
    this.gameOutput.appendChild(element);
    this.gameOutput.scrollTop = this.gameOutput.scrollHeight;
  }

  clearInput() {
    this.gameInput.value = "";
  }

  clearOutput() {
    this.gameOutput.innerHTML = "";
  }

  async typeText(text) {
    this.isTyping = true;
    this.gameInput.disabled = true;

    // Create a new element for typed text
    const element = document.createElement("div");
    element.className = "typed-text";
    this.gameOutput.appendChild(element);

    // Type character by character
    for (let i = 0; i < text.length; i++) {
      // Check if space was pressed to skip typing
      if (!this.isTyping) {
        // Skip typing and show full text
        element.textContent = text; // Show the full text immediately
        this.gameOutput.scrollTop = this.gameOutput.scrollHeight;
        break;
      }
      
      element.textContent += text.charAt(i);
      this.gameOutput.scrollTop = this.gameOutput.scrollHeight;
      await new Promise((resolve) => setTimeout(resolve, this.typingSpeed));
    }

    this.isTyping = false;
    this.gameInput.disabled = false;
    this.gameInput.focus();
  }

  skipTyping() {
    this.isTyping = false; // Set isTyping to false to stop typing
    this.gameInput.disabled = false; // Enable input again
    this.gameInput.focus(); // Focus back on input
  }

handleInput() {
  if (this.isTyping) return; // Don't process input while text is typing

  // Get input but DON'T force lowercase for everything
  const rawInput = this.gameInput.value.trim();
  this.clearInput();

  // Print the input with prompt
  this.print(`> ${rawInput}`, "player-input");

  // For most input modes, convert to lowercase for processing
  // BUT preserve original case for loadGame mode
  const input = this.inputMode === "loadGame" ? rawInput : rawInput.toLowerCase();

  // Process based on current input mode
  switch (this.inputMode) {
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
      this.handleLoadGameInput(rawInput); // Use rawInput to preserve case
      break;
    case "errorRecovery":
      this.handleErrorRecoveryInput(input);
      break;
  }
}

  handleTitleInput(input) {
    if (input === "1" || input === "new" || input === "new game") {
      this.startNewGame();
    } else if (input === "2" || input === "load" || input === "load game") {
      this.showLoadGamePrompt();
    } else {
      this.print(
        "Invalid option. Please type 1 for New Game or 2 for Load Game.",
        "error-message"
      );
    }
  }

  handleNormalInput(input) {
    // Global commands available in normal mode
    if (input === "save") {
      this.saveGame();
    } else if (input === "inventory" || input === "i") {
      this.showInventory();
    } else if (input === "stats" || input === "s") {
      this.showStats();
    } else if (input === "help" || input === "h" || input === "?") {
      this.showHelp();
    } else {
      this.print(
        "Type a command or a number to select a choice.",
        "system-message"
      );
    }
  }

  handleChoiceInput(input) {
    // Try to parse as a choice number
    const choiceNum = parseInt(input);
    const currentScene = this.storyContent[this.currentScene];

    if (
      !isNaN(choiceNum) &&
      choiceNum > 0 &&
      choiceNum <= currentScene.choices.length
    ) {
      const choice = currentScene.choices[choiceNum - 1];

      // Check if this choice has requirements
      let canChoose = true;

      if (choice.requires) {
        if (choice.requires.item) {
          const hasItem = this.inventory.some(
            (item) => item.id === choice.requires.item
          );
          if (!hasItem) {
            canChoose = false;
            this.print(
              `You need ${
                choice.requires.itemName || choice.requires.item
              } for this choice.`,
              "error-message"
            );
          }
        }

        if (choice.requires.stat) {
          for (const [statName, requiredValue] of Object.entries(
            choice.requires.stat
          )) {
            if (this.playerStats[statName] < requiredValue) {
              canChoose = false;
              this.print(
                `You need ${statName}: ${requiredValue} for this choice.`,
                "error-message"
              );
              break;
            }
          }
        }
      }

      if (canChoose) {
        // Use item if required
        if (choice.useItem) {
          this.useItemById(choice.useItem);
        }

        // Clear output before moving to next scene
        this.clearOutput();
        this.makeChoice(choice.nextScene);
      }
    }
    // Also handle global commands
    else if (input === "save") {
      this.saveGame();
    } else if (input === "inventory" || input === "i") {
      this.showInventory();
    } else if (input === "stats" || input === "s") {
      this.showStats();
    } else if (input === "help" || input === "h" || input === "?") {
      this.showHelp();
    } else {
      this.print(
        `Please enter a number between 1 and ${currentScene.choices.length} to make a choice.`,
        "error-message"
      );
    }
  }

  handleStatInput(input) {
    if (input === "done" || input === "confirm") {
      // Check if there are remaining stat points before confirming
      if (this.availableStatPoints > 0) {
        this.print(
          `You still have ${this.availableStatPoints} point(s) remaining. Please allocate all points before confirming.`,
          "error-message"
        );
        return; // Prevent confirmation
      }
      // Clear output before moving to next scene
      this.clearOutput();
      this.confirmStats();
    } else if (input === "back" || input === "b") {
      // Show the current stats and stay on stat allocation screen
      this.showStatAllocation(this.nextScene);
    } else {
      // Format should be: "stat +/-N" (e.g., "attack +2" or "defense -1")
      const match = input.match(/^(\w+)\s*([+-])(\d+)$/);
      if (match) {
        const [, stat, sign, numStr] = match;
        const num = parseInt(numStr);

        if (this.playerStats.hasOwnProperty(stat)) {
          if (sign === "+") {
            // Check if enough points are available
            if (num > this.availableStatPoints) {
              this.print(
                `Not enough points available. You only have ${this.availableStatPoints} point(s) remaining.`,
                "error-message"
              );
            } else {
              this.adjustStat(stat, num);
            }
          } else {
            // sign is '-'
            // Check if stat would go below 1
            if (this.playerStats[stat] - num < 1) {
              this.print(`Cannot reduce ${stat} below 1.`, "error-message");
            } else {
              this.adjustStat(stat, -num);
            }
          }
        } else {
          this.print(
            `Unknown stat: ${stat}. Valid stats are: attack, defense, charisma, speed, luck.`,
            "error-message"
          );
        }
      } else if (input === "help" || input === "h" || input === "?") {
        this.showStatHelp();
      } else {
        this.print(
          "Invalid format. Use 'stat +/-N' (e.g., 'attack +2') or 'done' to confirm.",
          "error-message"
        );
      }
    }
  }

  handleInventoryInput(input) {
    if (input === "back" || input === "exit" || input === "b") {
      // Go back to previous mode
      this.print("Closed inventory.", "system-message");
      this.resumeAfterInventory();
    } else if (input === "help" || input === "h" || input === "?") {
      this.showInventoryHelp();
    } else {
      // Check if it's an item use command: "use X" or just "X"
      const itemIndex = parseInt(input.replace("use ", "")) - 1;

      if (
        !isNaN(itemIndex) &&
        itemIndex >= 0 &&
        itemIndex < this.inventory.length
      ) {
        const item = this.inventory[itemIndex];
        if (item.usable) {
          this.useItem(item);
          this.showInventory(); // Refresh inventory after using item
        } else {
          this.print(`${item.name} cannot be used.`, "system-message");
        }
      } else {
        this.print(
          "Invalid item number. Type 'back' to return.",
          "error-message"
        );
      }
    }
  }

 handleLoadGameInput(input) {
  if (input.toLowerCase() === "back" || input.toLowerCase() === "b") {
    this.print("Returning to title screen...", "system-message");
    this.showTitleScreen();
    return;
  }

  try {
    // Clean the input string of any whitespace
    const cleanInput = input.trim();
 
	// Stop title music when loading a game
	this.stopTitleMusic();	
	
    // Attempt to parse the save code
    const saveData = JSON.parse(atob(cleanInput));

    // Restore game state
    this.currentScene = saveData.currentScene;
    this.playerStats = saveData.playerStats;
    this.gameState = saveData.gameState;
    this.availableStatPoints = saveData.availableStatPoints || 0;

    // Restore inventory if it exists
    if (saveData.inventory) {
      this.inventory = saveData.inventory;
    }

    this.print("Game loaded successfully!", "system-message");

    // Clear output before starting loaded game
    this.clearOutput();

    // Use a flag to prevent double playback
    this.isLoading = true;
    
    // Start the game from the loaded scene once
    this.ensureSceneLoaded(this.currentScene).then((loaded) => {
      if (loaded && this.isLoading) {
        this.isLoading = false; // Reset the flag
        this.playScene(); // Play the scene just once
      } else if (!loaded) {
        this.handleSceneLoadError();
      }
    });
  } catch (error) {
    console.error("Load game error:", error);
    this.print(
      "Invalid save code. Please try again or type 'back' to return to title screen.",
      "error-message"
    );
  }
}


// Add this helper method to handle the save data loading
loadSaveData(saveData) {
  // Restore game state
  this.currentScene = saveData.currentScene;
  this.playerStats = saveData.playerStats;
  this.gameState = saveData.gameState;
  this.availableStatPoints = saveData.availableStatPoints || 0;

  // Restore inventory if it exists
  if (saveData.inventory) {
    this.inventory = saveData.inventory;
  }

  this.print("Game loaded successfully!", "system-message");

  // Clear output before starting loaded game
  this.clearOutput();

  // Start the game from the loaded scene
  this.ensureSceneLoaded(this.currentScene).then((loaded) => {
    if (loaded) {
      this.playScene();
    } else {
      this.handleSceneLoadError();
    }
  });
}

  // New method to handle error recovery input
  handleErrorRecoveryInput(input) {
    if (
      input.toLowerCase() === "back" ||
      input.toLowerCase() === "b" ||
      input.toLowerCase() === "title" ||
      input.toLowerCase() === "menu"
    ) {
      this.print("Returning to title screen...", "system-message");
      this.showTitleScreen();
    } else if (input.toLowerCase() === "retry" || input.toLowerCase() === "r") {
      this.print("Retrying to load the scene...", "system-message");
      this.ensureSceneLoaded(this.currentScene).then((loaded) => {
        if (loaded) {
          this.playScene();
        } else {
          this.handleSceneLoadError();
        }
      });
    } else if (input.toLowerCase() === "save") {
      this.saveGame();
    } else {
      this.print(
        "Please type 'back' to return to title screen, 'retry' to try again, or 'save' to save your game.",
        "error-message"
      );
    }
  }

  // New method to handle scene load errors
  handleSceneLoadError() {
    this.print(
      "Error loading scene content. This may be due to a missing file or network issue.",
      "error-message"
    );
    this.print(
      "Your progress up to this point has been preserved.",
      "system-message"
    );
    this.print(
      "Type 'back' to return to title screen, 'retry' to try again, or 'save' to save your game.",
      "system-message"
    );

    // Change to error recovery mode
    this.inputMode = "errorRecovery";
    this.awaitingInput = true;
  }

  startNewGame() {
    this.print("\nStarting new game...\n", "system-message");
	
	// Stop title music
	this.stopTitleMusic();

    // Clear output before starting new game
    this.clearOutput();

    // Initialize starting inventory
    this.inventory = [];

    // Reset player stats to default
    this.playerStats = {
      attack: 5,
      defense: 5,
      charisma: 5,
      speed: 5,
      luck: 5,
    };
    this.availableStatPoints = 10;

    this.currentScene = "intro";
    this.playScene();
  }

	async showLoadGamePrompt() {
	  // Create elements for the typing effect
	  const titleElement = document.createElement("div");
	  titleElement.className = "load-title";
	  this.gameOutput.appendChild(titleElement);
	  
	  // Apply typing effect to the title
	  await this.typeIntoElement(titleElement, "===== LOAD GAME =====");
	  
	  // Create subtitle with typing effect
	  const subtitleElement = document.createElement("div");
	  subtitleElement.className = "load-subtitle";
	  this.gameOutput.appendChild(subtitleElement);
	  
	  await this.typeIntoElement(subtitleElement, "Paste your save code below or type 'back' to return:");
	  
	  this.inputMode = "loadGame";
	}

 async playScene() {
  // Ensure the scene is loaded
  const sceneLoaded = await this.ensureSceneLoaded(this.currentScene);
  if (!sceneLoaded) {
    this.handleSceneLoadError();
    return;
  }

  const scene = this.storyContent[this.currentScene];

  // Show loading screen before playing the scene
  await this.showLoadingScreen();

  // Type out the scene text
  await this.typeText(scene.text);

  // Check if this scene gives the player items
  if (scene.items) {
    this.addItemsToInventory(scene.items);

    // Notify about acquired items
    this.print("\nAcquired items:", "system-message");
    scene.items.forEach((item) => {
      this.print(
        `- ${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ""}`,
        "item-name"
      );
    });
    this.print("", ""); // Add a blank line
  }

  // Handle the next step based on scene type
  if (scene.type === "stats") {
    this.showStatAllocation(scene.nextScene);
  } else if (scene.choices) {
    this.showChoices(scene.choices);
  } else if (scene.nextScene) {
    // Automatically advance to the next scene after a delay
    setTimeout(() => {
      this.clearOutput();
      this.currentScene = scene.nextScene;
      this.playScene();
    }, 2000);
  }
}

  addItemsToInventory(items) {
    for (const itemData of items) {
      // Check if the item already exists in inventory
      const existingItem = this.inventory.find((i) => i.id === itemData.id);

      if (existingItem && itemData.stackable !== false) {
        // If the item is stackable, increment the quantity
        existingItem.quantity =
          (existingItem.quantity || 1) + (itemData.quantity || 1);
      } else {
        // Otherwise add as a new item
        const newItem = {
          id: itemData.id,
          name: itemData.name,
          description: itemData.description,
          category: itemData.category || "consumable", // Default to consumable
          icon: itemData.icon || "📦", // Default icon
          quantity: itemData.quantity || 1,
          stackable: itemData.stackable !== false, // Default to stackable
          usable: itemData.usable !== false, // Default to usable
          effects: itemData.effects || {},
        };

        this.inventory.push(newItem);
      }
    }
  }

  showChoices(choices) {
    this.print("\nWhat will you do?", "system-message");

    choices.forEach((choice, index) => {
      // Check if this choice has requirements
      let canChoose = true;
      let requirementText = "";

      if (choice.requires) {
        if (choice.requires.item) {
          const hasItem = this.inventory.some(
            (item) => item.id === choice.requires.item
          );
          if (!hasItem) {
            canChoose = false;
            requirementText = ` (Requires: ${ choice.requires.itemName || choice.requires.item })`;
          }
        }

        if (choice.requires.stat) {
          for (const [statName, requiredValue] of Object.entries(
            choice.requires.stat
          )) {
            if (this.playerStats[statName] < requiredValue) {
              canChoose = false;
              requirementText = ` (Requires ${statName}: ${requiredValue})`;
              break;
            }
          }
        }
      }

      if (canChoose) {
        this.print(`${index + 1}. ${choice.text}`, "choice");
      } else {
        this.print(
          `${index + 1}. ${choice.text}${requirementText} (Not available)`,
          "choice disabled"
        );
      }
    });

    this.print(
      "\nType a number to choose, 'inventory' to check items, 'stats' to view stats, or 'save' to save game.",
      "system-message"
    );

    this.inputMode = "choices";
    this.awaitingInput = true;
  }

  makeChoice(nextScene) {
    this.currentScene = nextScene;
    this.playScene();
  }

  showStatAllocation(nextScene) {
    this.print("\n===== CHARACTER STATS =====", "system-message");
    this.print(
      `Remaining points: ${this.availableStatPoints}`,
      "system-message"
    );

    for (const [stat, value] of Object.entries(this.playerStats)) {
      this.print(
        `${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${value}`,
        "player-stat"
      );
    }

    this.print(
      "\nAdjust your stats using 'stat +/-N' (e.g., 'attack +2' or 'defense -1')",
      "system-message"
    );
    this.print("Type 'done' or 'confirm' when finished.", "system-message");

    this.nextScene = nextScene;
    this.inputMode = "stats";
    this.awaitingInput = true;
  }

  adjustStat(stat, change) {
    // Handle positive and negative changes
    if (change > 0) {
      // Add points to the stat
      this.playerStats[stat] += change;
      this.availableStatPoints -= change;
    } else {
      // Remove points from the stat
      this.playerStats[stat] += change; // change is already negative
      this.availableStatPoints += Math.abs(change);
    }

    // Show updated stats
    this.print(
      `Updated ${stat} to ${this.playerStats[stat]}. Remaining points: ${this.availableStatPoints}`,
      "system-message"
    );
  }

  confirmStats() {
    this.print("Stats confirmed!", "system-message");
    this.currentScene = this.nextScene;
    this.playScene();
  }

	async saveGame() {
	  const saveData = {
		currentScene: this.currentScene,
		playerStats: this.playerStats,
		gameState: this.gameState,
		inventory: this.inventory,
		availableStatPoints: this.availableStatPoints,
	  };

	  // Convert to base64 for a more compact representation
	  const saveString = btoa(JSON.stringify(saveData));

	  this.print("\n===== SAVE GAME =====", "system-message");
	  
	  // Create elements for the typing effect
	  const titleElement = document.createElement("div");
	  titleElement.className = "save-title";
	  this.gameOutput.appendChild(titleElement);
	  
	  // Apply typing effect to the title
	  await this.typeIntoElement(titleElement, "Copy the code below to save your game:");
	  
	  this.print(saveString, "save-code");
	  this.print("\nType any key to continue...", "system-message");
	}

  showInventory() {
    // Store current mode to return to later
    this.previousMode = this.inputMode;

    this.print("\n===== INVENTORY =====", "system-message");

    if (this.inventory.length === 0) {
      this.print("Your inventory is empty.", "system-message");
    } else {
      this.inventory.forEach((item, index) => {
        this.print(
          `${index + 1}. ${item.icon} ${item.name} ${
            item.quantity > 1 ? `(x${item.quantity})` : ""
          }`,
          "item-name"
        );
        this.print(`   ${item.description}`, "");
      });
    }

    this.print(
      "\nType an item number to use it, or 'back' to return.",
      "system-message"
    );
    this.inputMode = "inventory";
  }

  showStats() {
    this.print("\n===== CHARACTER STATS =====", "system-message");

    for (const [stat, value] of Object.entries(this.playerStats)) {
      this.print(
        `${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${value}`,
        "player-stat"
      );
    }

    this.print("", ""); // Add a blank line
  }

  showHelp() {
    this.print("\n===== HELP =====", "system-message");
    this.print("Available commands:", "system-message");
    this.print("- [number]: Select a choice", "");
    this.print("- inventory (or i): View your inventory", "");
    this.print("- stats (or s): View your character stats", "");
    this.print("- save: Save your game", "");
    this.print("- help (or ? or h): Show this help", "");
  }

  showStatHelp() {
    this.print("\n===== STAT ALLOCATION HELP =====", "system-message");
    this.print("- Use 'stat +N' to add points (e.g., 'attack +2')", "");
    this.print("- Use 'stat -N' to remove points (e.g., 'defense -1')", "");
    this.print("- Type 'done' or 'confirm' when finished", "");
    this.print("- Stats cannot go below 1", "");
  }

  showInventoryHelp() {
    this.print("\n===== INVENTORY HELP =====", "system-message");
    this.print("- Type an item number to use that item", "");
    this.print("- Type 'back' (or 'b' or 'exit') to return", "");
  }

  resumeAfterInventory() {
    // Return to previous input mode
    this.inputMode = this.previousMode;
  }

  useItem(item) {
    // Apply item effects
    if (item.effects) {
      // Heal effect
      if (item.effects.heal) {
        // In a real game, you'd have health and would apply healing here
        this.print(
          `Used ${item.name} and healed for ${item.effects.heal} points.`,
          "system-message"
        );
      }

      // Stat boost
      if (item.effects.statBoost) {
        for (const [stat, value] of Object.entries(item.effects.statBoost)) {
          if (this.playerStats[stat] !== undefined) {
            this.playerStats[stat] += value;
            this.print(`Boosted ${stat} by ${value}.`, "system-message");
          }
        }
      }

      // Custom effects can be added for specific items
      if (item.effects.custom) {
        // Call a custom function based on the item
        this.handleCustomItemEffect(item);
      }
    }

    // Reduce quantity or remove item
    this.removeItemFromInventory(item.id, 1);
  }

  useItemById(itemId) {
    const item = this.inventory.find((i) => i.id === itemId);
    if (item) {
      this.removeItemFromInventory(itemId, 1);
    }
  }

  removeItemFromInventory(itemId, quantity = 1) {
    const itemIndex = this.inventory.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      const item = this.inventory[itemIndex];

      if (item.quantity > quantity) {
        // Reduce quantity
        item.quantity -= quantity;
        this.print(
          `${quantity} ${item.name} used. ${item.quantity} remaining.`,
          "system-message"
        );
      } else {
        // Remove item completely
        this.inventory.splice(itemIndex, 1);
        this.print(`Used last ${item.name}.`, "system-message");
      }
    }
  }

  handleCustomItemEffect(item) {
    // Handle special item effects here
    switch (item.id) {
      case "map":
        this.print(
          "You studied the map carefully, making mental notes of the paths ahead.",
          "system-message"
        );
        this.gameState.hasStudiedMap = true;
        break;
      case "healingSalve":
        this.print(
          "You applied the healing salve to your wounds. They begin to close almost immediately.",
          "system-message"
        );
        this.gameState.isInjured = false;
        break;
      // Add more custom effects as needed
    }
  }

  async showLoadingScreen() {
    // Clear the output
    this.clearOutput();

    // Define the number of loading GIFs available
    const numberOfLoadingGifs = 5; // Update this number based on the actual number of GIFs you have

    // Randomly select one of the GIFs
    const randomGifIndex = Math.floor(Math.random() * numberOfLoadingGifs) + 1;
    const loadingGifPath = `gif/loading/loading${randomGifIndex}.gif`;

    // Create a container div for the loading screen
    const loadingContainer = document.createElement("div");
    loadingContainer.className = "loading-screen";

    // Add the loading GIF
    const loadingGif = document.createElement("img");
    loadingGif.src = loadingGifPath; // Path to the randomly selected loading GIF
    loadingGif.alt = "Loading...";
    loadingGif.className = "loading-gif";
    loadingContainer.appendChild(loadingGif);

    // Add the loading text container
    const loadingTextContainer = document.createElement("div");
    loadingTextContainer.className = "loading-text";
    loadingContainer.appendChild(loadingTextContainer);

    // Append the container to your game output
    this.gameOutput.appendChild(loadingContainer);

    // Load the loading quips
    const quips = await this.loadLoadingQuips();

    // Randomly select a quip
    const randomQuip = quips[Math.floor(Math.random() * quips.length)];

    // Start the typing effect for the loading text
    this.typeLoadingText(loadingTextContainer, randomQuip);

    // Wait for a random duration between 3 to 5 seconds
    const randomDuration = Math.floor(Math.random() * 2000) + 3000;
    await new Promise((resolve) => setTimeout(resolve, randomDuration));

    // Clear the loading screen
    this.clearOutput();
  }

  async loadLoadingQuips() {
    try {
      const response = await fetch("loadingQuips.json");
      if (!response.ok) throw new Error(`Failed to fetch loading quips: ${response.status}`);
      const data = await response.json();
      return data.quips;
    } catch (error) {
      console.error("Failed to load loading quips:", error);
      return ["Loading..."]; // Fallback text
    }
  }

  async typeLoadingText(element, text) {
    const typingSpeed = 50; // milliseconds per character (faster typing speed)
    const backspaceSpeed = 50; // milliseconds per character (faster backspacing speed)
    const pauseDuration = 300; // milliseconds to pause before backspacing (shorter pause duration)

    while (true) {
      // Type the text
      for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise((resolve) => setTimeout(resolve, typingSpeed));
      }

      // Pause before backspacing
      await new Promise((resolve) => setTimeout(resolve, pauseDuration));

      // Backspace the text
      for (let i = text.length; i > 0; i--) {
        element.textContent = element.textContent.slice(0, -1);
        await new Promise((resolve) => setTimeout(resolve, backspaceSpeed));
      }

      // Pause before typing again
      await new Promise((resolve) => setTimeout(resolve, pauseDuration));
    }
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const game = new TextGame();
});