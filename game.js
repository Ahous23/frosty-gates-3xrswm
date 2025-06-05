import { 
  initialPlayerStats, 
  typingSpeed, 
  availableStatPoints,
  initialPlayerHealth, 
  maxPlayerHealth,
  initialPlayerXp,
  xpPerLevel
} from './js/constants.js';
import { AudioManager } from './js/audio.js';
import { UIManager } from './js/ui.js';
import { GameLogic } from './js/gameLogic.js';
import { InputHandlers } from './js/inputHandlers.js';
import { CombatSystem } from './js/combat.js';
import { LootSystem } from './js/lootSystem.js';
import { NotesManager } from './js/notes.js';
import { MapManager } from './js/map.js';
import { InventoryManager } from './js/inventoryManager.js';
import { EquipmentManager } from './js/equipmentManager.js';
import { WeaponManager } from './js/weaponManager.js';
import { SpellManager } from './js/spellManager.js';
import { EquipmentManagerUI } from './js/equipmentManagerUI.js';

class TextGame {
  constructor() {
    this.currentScene = null;
    this.playerStats = { ...initialPlayerStats };
    this.typingSpeed = typingSpeed;
    this.gameState = {
      playerHealth: initialPlayerHealth,
      playerXp: initialPlayerXp,
      availableStatPoints: 0
    };
    this.availableStatPoints = availableStatPoints;
    this.initialPlayerStats = initialPlayerStats;
    this.initialPlayerHealth = initialPlayerHealth;
    this.maxPlayerHealth = maxPlayerHealth;
    this.initialPlayerXp = initialPlayerXp;
    this.xpPerLevel = xpPerLevel;
    
    // Initialize inventory and equipment managers
    this.inventoryManager = new InventoryManager(this);
    this.equipmentManager = new EquipmentManager(this);
    
    // For backward compatibility
    this.inventory = [];
    
    // Define a property that syncs the inventory array with the inventoryManager
    Object.defineProperty(this, 'inventory', {
      get: () => this.inventoryManager ? this.inventoryManager.items : [],
      set: (items) => {
        if (this.inventoryManager) {
          this.inventoryManager.items = items || [];
        }
      }
    });
    
    this.storyContent = {};
    this.storyIndex = null;
    this.isTyping = false;
    this.awaitingInput = false;
    this.inputMode = "normal";
    this.previousMode = null;
    this.continueCallback = null;
    this.isLoading = false;
    this.gameOutput = document.getElementById("gameOutput");
    this.gameInput = document.getElementById("gameInput");
    this.audioManager = new AudioManager();
    this.uiManager = new UIManager(this.gameOutput, this.gameInput);
    this.lootSystem = new LootSystem(this);
    this.gameLogic = new GameLogic(this);
    this.inputHandlers = new InputHandlers(this);
    this.combatSystem = new CombatSystem(this);
    this.weaponManager = new WeaponManager(this);
    this.spellManager = new SpellManager(this);
    this.playerSpells = [];

    const enableAudio = () => {
      this.audioManager.enableAudio();
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);

    this.gameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.handleInput();
      }
      if (e.code === "Space" && this.isTyping) {
        this.skipTyping();
      }
    });

    // Add document-level event listener for spacebar to skip typing
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && this.isTyping) {
        e.preventDefault(); // Prevent page scrolling
        this.skipTyping();
      }
    });

    this.initialize();

    this.musicToggleBtn = document.getElementById("musicToggle");
    if (this.musicToggleBtn) {
      this.musicToggleBtn.addEventListener("click", () => {
        this.toggleMusic();
      });
    }

    this.uiManager.focusInput();

    // Initialize the managers
    this.notesManager = new NotesManager(this);
    this.mapManager = new MapManager(this);
    this.equipmentManagerUI = new EquipmentManagerUI(this);
    
    // Initialize everything
    this.init();
  }

  async init() {
    // Initialize other systems
    await this.weaponManager.initialize();
    await this.spellManager.initialize();
    // Rest of your initialization code
  }

  toggleMusic() {
    if (this.audioManager.titleMusic.paused) {
      this.audioManager.musicEnabled = true;
      this.audioManager.playTitleMusic();
    } else {
      this.audioManager.stopTitleMusic();
    }
  }

  async initialize() {
    this.uiManager.clearOutput();
    this.uiManager.print("Welcome to Olaf vs Bears", "system-message");
    this.uiManager.print("Loading game content...", "system-message");
    
    try {
      // Initialize loot system first
      await this.lootSystem.initialize();
      console.log("Loot system initialized with enemies:", Object.keys(this.lootSystem.enemies));
      
      // Then load story content
      await this.loadStoryIndex();
      
      this.showTitleScreen();
    } catch (error) {
      console.error("Error during initialization:", error);
      this.uiManager.print("Error loading game resources. Please refresh the page.", "error-message");
    }
  }

  async showTitleScreen() {
    this.uiManager.clearOutput();
    const titleContainer = document.createElement("div");
    titleContainer.className = "title-banner";
    const campfireImg = document.createElement("img");
    campfireImg.src = "gif/campfire.gif";
    campfireImg.alt = "Campfire";
    campfireImg.className = "title-campfire";
    titleContainer.appendChild(campfireImg);
    this.audioManager.playTitleMusic();
    const titleText = document.createElement("div");
    titleText.className = "title-text";
    titleContainer.appendChild(titleText);
    this.gameOutput.appendChild(titleContainer);
    await this.uiManager.typeIntoElement(titleText, "\n==== OLAF vs BEARS ====\n== For Shawclops, ❤️ Vanilla-Bear ==\n", this.typingSpeed, this.audioManager);
    this.uiManager.print("1. New Game", "choice");
    this.uiManager.print("2. Load Game", "choice");
    this.awaitingInput = true;
    this.inputMode = "title";
  }

  async loadStoryIndex() {
    try {
      const response = await fetch("story/index.json");
      if (!response.ok) throw new Error(`Failed to fetch story index: ${response.status}`);
      this.storyIndex = await response.json();
      await this.loadChapter("chapter1");
      return true;
    } catch (error) {
      console.error("Failed to load story index:", error);
      this.uiManager.print(`Error loading story content: ${error.message}. Please refresh the page.`, "error-message");
      return false;
    }
  }

  async loadChapter(chapterId) {
    if (!this.storyIndex.chapters[chapterId]) {
      console.error(`Chapter ${chapterId} not found in index`);
      return false;
    }
    try {
      await this.showLoadingScreen();
      const path = this.storyIndex.chapters[chapterId];
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to fetch chapter: ${response.status}`);
      const chapterContent = await response.json();
      this.storyContent = { ...this.storyContent, ...chapterContent.scenes };
      return true;
    } catch (error) {
      console.error(`Failed to load chapter ${chapterId}:`, error);
      return false;
    }
  }

  // This method needs to exist in game.js but delegate to gameLogic
  playScene() {
    this.gameLogic.playScene();
  }



  // Add the showLoadGamePrompt method that was missing
  async showLoadGamePrompt() {
    // Create elements for the typing effect
    const titleElement = document.createElement("div");
    titleElement.className = "load-title";
    this.gameOutput.appendChild(titleElement);
    
    // Apply typing effect to the title
    await this.uiManager.typeIntoElement(titleElement, "===== LOAD GAME =====", this.typingSpeed, this.audioManager);
    
    // Create subtitle with typing effect
    const subtitleElement = document.createElement("div");
    subtitleElement.className = "load-subtitle";
    this.gameOutput.appendChild(subtitleElement);
    
    await this.uiManager.typeIntoElement(subtitleElement, "Paste your save code below or type 'back' to return:", this.typingSpeed, this.audioManager);
    
    this.inputMode = "loadGame";
  }

  async ensureSceneLoaded(sceneId) {
    if (this.storyContent[sceneId]) return true;
    const chapterId = this.getChapterForScene(sceneId);
    if (!chapterId) {
      console.error(`Cannot determine chapter for scene: ${sceneId}`);
      return false;
    }
    return await this.loadChapter(chapterId);
  }

  getChapterForScene(sceneId) {
    for (const [chapterId, info] of Object.entries(this.storyIndex.sceneMapping)) {
      if (info.scenes.includes(sceneId)) {
        return chapterId;
      }
    }
    return null;
  }

  print(text, className = "") {
    this.uiManager.print(text, className);
  }

  clearInput() {
    this.uiManager.clearInput();
  }

  clearOutput() {
    this.uiManager.clearOutput();
  }

  async typeText(text) {
    this.isTyping = true;
    this.gameInput.disabled = true;

    const element = document.createElement("div");
    element.className = "typed-text";
    this.gameOutput.appendChild(element);

    for (let i = 0; i < text.length; i++) {
      if (!this.isTyping) {
        element.textContent = text;
        this.gameOutput.scrollTop = this.gameOutput.scrollHeight;
        break;
      }
      element.textContent += text.charAt(i);
      this.gameOutput.scrollTop = this.gameOutput.scrollHeight;
      await new Promise((resolve) => setTimeout(resolve, this.typingSpeed));
    }

    this.isTyping = false;
    this.gameInput.disabled = false;
    this.uiManager.focusInput();
  }

  skipTyping() {
    this.isTyping = false;
    this.gameInput.disabled = false;
    this.uiManager.focusInput();
  }

  handleInput() {
    if (this.isTyping) return;
    const rawInput = this.gameInput.value.trim();
    this.uiManager.clearInput();
    this.uiManager.print(`> ${rawInput}`, "player-input");
    const input = this.inputMode === "loadGame" ? rawInput : rawInput.toLowerCase();
    
    switch (this.inputMode) {
      case "title":
        this.inputHandlers.handleTitleInput(input);
        break;
      case "normal":
        this.inputHandlers.handleNormalInput(input);
        break;
      case "choices":
        this.inputHandlers.handleChoiceInput(input);
        break;
      case "stats":
        this.inputHandlers.handleStatInput(input);
        break;
      case "inventory":
        this.inputHandlers.handleInventoryInput(input);
        break;
      case "loadGame":
        this.inputHandlers.handleLoadGameInput(rawInput);
        break;
      case "errorRecovery":
        this.inputHandlers.handleErrorRecoveryInput(input);
        break;
      case "combat":
        this.inputHandlers.handleCombatInput(input);
        break;
      case "await-continue":
        this.inputHandlers.handleAwaitContinueInput(input);
        break;
      case "await-combat":
        this.inputHandlers.handleAwaitCombatInput(input);
        break;
      case "combat-item":
        this.inputHandlers.handleCombatItemInput(input);
        break;
      case "combat-spell":
        this.inputHandlers.handleCombatSpellInput(input);
        break;
      case "equipment":
        this.inputHandlers.handleEquipmentInput(input);
        break;
      case "equip-confirm":
        // This is handled by the equipItem method
        break;
    }
  }

  async showLoadingScreen() {
    this.uiManager.clearOutput();
    const numberOfLoadingGifs = 5;
    const randomGifIndex = Math.floor(Math.random() * numberOfLoadingGifs) + 1;
    const loadingGifPath = `gif/loading/loading${randomGifIndex}.gif`;
    const loadingContainer = document.createElement("div");
    loadingContainer.className = "loading-screen";
    const loadingGif = document.createElement("img");
    loadingGif.src = loadingGifPath;
    loadingGif.alt = "Loading...";
    loadingGif.className = "loading-gif";
    loadingContainer.appendChild(loadingGif);
    const loadingTextContainer = document.createElement("div");
    loadingTextContainer.className = "loading-text";
    loadingContainer.appendChild(loadingTextContainer);
    this.gameOutput.appendChild(loadingContainer);
    const quips = await this.loadLoadingQuips();
    const randomQuip = quips[Math.floor(Math.random() * quips.length)];
    this.isLoading = true;
    const typingPromise = this.typeLoadingText(loadingTextContainer, randomQuip);
    const randomDuration = Math.floor(Math.random() * 2000) + 3000;
    await new Promise((resolve) => setTimeout(resolve, randomDuration));
    this.isLoading = false;
    await typingPromise;
    this.uiManager.clearOutput();
  }

  async loadLoadingQuips() {
    try {
      const response = await fetch("loadingQuips.json");
      if (!response.ok) throw new Error(`Failed to fetch loading quips: ${response.status}`);
      const data = await response.json();
      return data.quips;
    } catch (error) {
      console.error("Failed to load loading quips:", error);
      return ["Loading..."];
    }
  }

  async typeLoadingText(element, text) {
    const typingSpeed = 50;
    const backspaceSpeed = 50;
    const pauseDuration = 300;
    this.audioManager.playTypingSound();
    while (this.isLoading) {
      for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise((resolve) => setTimeout(resolve, typingSpeed));
      }
      await new Promise((resolve) => setTimeout(resolve, pauseDuration));
      for (let i = text.length; i > 0; i--) {
        element.textContent = element.textContent.slice(0, -1);
        await new Promise((resolve) => setTimeout(resolve, backspaceSpeed));
      }
      await new Promise((resolve) => setTimeout(resolve, pauseDuration));
    }
    this.audioManager.stopTypingSound();
  }

  // Add this method to handle consumable usage
  useConsumable(item) {
    if (!item) return { success: false, message: "No item to use." };
    
    // Handle different item types
    if (item.type === "consumable" || item.category === "consumable") {
      if (item.effect === "heal" || (item.effects && item.effects.heal)) {
        const healAmount = item.effects?.heal || item.value;
        const oldHealth = this.gameState.playerHealth;
        this.gameState.playerHealth = Math.min(
          this.gameState.playerMaxHealth || 100,
          this.gameState.playerHealth + healAmount
        );
        const actualHeal = this.gameState.playerHealth - oldHealth;
        
        return {
          success: true,
          message: `You used ${item.name} and restored ${actualHeal} health!`,
          effect: { type: "heal", value: actualHeal }
        };
      }
      
      // Generic consumable response if no specific effect is defined
      return { 
        success: true, 
        message: item.useMessage || `You used ${item.name}.` 
      };
    }
    
    // Add specific messaging for different item types
    else if (item.type === "weapon" || item.category === "weapon") {
      return { 
        success: false, 
        message: `You examine the ${item.name}. Try equipping it instead of using it.` 
      };
    }
    
    else if (item.type === "armor" || item.category === "armor") {
      return { 
        success: false, 
        message: `You examine the ${item.name}. Try equipping it instead of using it.` 
      };
    }
    
    else if (item.type === "material" || item.category === "material") {
      return { 
        success: false, 
        message: `${item.name} is a crafting material. Nothing interesting happens.` 
      };
    }
    
    else if (item.type === "key" || item.category === "key") {
      return { 
        success: false, 
        message: `The ${item.name} might be useful somewhere specific.` 
      };
    }
    
    // Default response for any other item type
    return { 
      success: false, 
      message: `Nothing interesting happens when you try to use the ${item.name}.` 
    };
  }

  // Toggle equipment panel
  toggleEquipment() {
    if (this.equipmentManagerUI) {
      // Initialize if not already initialized
      if (!this.equipmentManagerUI.panel) {
        this.equipmentManagerUI.init();
      }
      // Store the current input mode to return to it later
      this.previousMode = this.inputMode;
      // Set mode to equipment
      this.inputMode = "equipment";
      // Toggle the equipment panel
      this.equipmentManagerUI.toggle();
    } else {
      console.error("Equipment manager UI not initialized");
      this.uiManager.print("Equipment panel is not available.", "error-message");
    }
  }

  // Rest of the TextGame class methods...
  // (Keep all the other methods that aren't related to notes or map)

  // Update loadSaveData to load stat confirmation state
  loadSaveData(saveData) {
    try {
      const data = JSON.parse(atob(saveData));
      this.currentScene = data.currentScene;
      this.playerStats = data.playerStats;
      this.inventory = data.inventory || [];
      this.gameState = data.gameState || {};
      this.playerSpells = data.playerSpells || [];
      
      // Ensure health is set if not in save data
      if (this.gameState.playerHealth === undefined) {
        this.gameState.playerHealth = 100;
      }
      
      // Ensure XP is set if not in save data
      if (this.gameState.playerXp === undefined) {
        this.gameState.playerXp = 0;
      }
      
      // Consolidate stat points
      this.availableStatPoints = 0; // Reset this value
      if (this.gameState.availableStatPoints === undefined) {
        this.gameState.availableStatPoints = 0;
      }
      
      // Apply stat confirmation state to equipment manager
      if (this.equipmentManagerUI) {
        this.equipmentManagerUI.statPointsConfirmed = this.gameState.statsConfirmed || false;
      }
      
      // Load notes
      if (data.notes) {
        this.loadNotes(data.notes);
      }
      
      this.uiManager.print("Game loaded successfully!", "system-message");
      this.inputMode = "normal";
      this.playScene();
      return true;
    } catch (error) {
      this.uiManager.print("Failed to load save data. Invalid save code.", "error-message");
      return false;
    }
  }

  // Update the saveGame method to include statsConfirmed
  saveGame() {
    // Make sure notes are captured immediately before saving
    let notesContent = "";
    if (this.notesManager && typeof this.notesManager.save === 'function') {
      notesContent = this.notesManager.save();
    }
    
    // Consolidate available stat points before saving
    const totalStatPoints = (this.gameState.availableStatPoints || 0) + (this.availableStatPoints || 0);
    this.gameState.availableStatPoints = totalStatPoints;
    this.availableStatPoints = 0;
    
    // Store the equipment manager's stat confirmation state
    if (this.equipmentManagerUI) {
      this.gameState.statsConfirmed = this.equipmentManagerUI.statPointsConfirmed;
    }
    
    const saveData = {
      currentScene: this.currentScene,
      playerStats: this.playerStats,
      inventory: this.inventory,
      playerSpells: this.playerSpells,
      gameState: this.gameState,
      notes: notesContent
    };
    
    const saveString = btoa(JSON.stringify(saveData));
    
    this.uiManager.print("\nSave Code (copy this somewhere safe):", "system-message");
    this.uiManager.print(saveString, "save-code");
    this.uiManager.print("\nType 'continue' to resume your game.", "system-message");
  }

  // Add these methods to your TextGame class

  // Toggle notes panel
  toggleNotes() {
    if (this.notesManager) {
      this.notesManager.toggle();
    } else {
      console.error("Notes manager not initialized");
      this.uiManager.print("Notes panel is not available.", "error-message");
    }
  }

  // Toggle map panel
  toggleMap() {
    if (this.mapManager) {
      this.mapManager.toggle();
    } else {
      console.error("Map manager not initialized");
      this.uiManager.print("Map panel is not available.", "error-message");
    }
  }

  // Add or update the saveNotes method
  saveNotes() {
    if (this.notesManager) {
      return this.notesManager.save();
    }
    return "";
  }

  // Add this method to load notes
  loadNotes(notesContent) {
    if (this.notesManager) {
      this.notesManager.load(notesContent);
    }
  }

  // Add this debug method to the TextGame class

  checkPanels() {
    console.log("Checking panel initialization status:");
    
    console.log("NotesManager:", this.notesManager ? "Initialized" : "Not initialized");
    if (this.notesManager) {
      console.log("- Notes panel element:", this.notesManager.panel ? "Found" : "Not found");
    }
    
    console.log("MapManager:", this.mapManager ? "Initialized" : "Not initialized");
    if (this.mapManager) {
      console.log("- Map panel element:", this.mapManager.panel ? "Found" : "Not found");
    }
    
    console.log("EquipmentManagerUI:", this.equipmentManagerUI ? "Initialized" : "Not initialized");
    if (this.equipmentManagerUI) {
      console.log("- Equipment panel element:", this.equipmentManagerUI.panel ? "Found" : "Not found");
    }
    
    return "Panel status logged to console";
  }

  // Add this method to the TextGame class

  debugUI() {
    console.log("=== UI DEBUGGING INFO ===");
    
    // Check UI elements
    console.log("Notes panel:", document.getElementById('notes-panel') ? "Found" : "Missing");
    console.log("Notes editor:", document.getElementById('notes-editor') ? "Found" : "Missing");
    console.log("Map panel:", document.getElementById('map-panel') ? "Found" : "Missing");
    console.log("Map container:", document.getElementById('map-container') ? "Found" : "Missing");
    console.log("Equipment panel:", document.getElementById('equipment-panel') ? "Found" : "Missing");
    console.log("Equipment content:", document.getElementById('equipment-content') ? "Found" : "Missing");
    
    // Check managers
    console.log("\n=== MANAGER STATUS ===");
    console.log("Notes manager:", this.notesManager ? "Exists" : "Missing");
    console.log("Map manager:", this.mapManager ? "Exists" : "Missing");
    console.log("Equipment manager UI:", this.equipmentManagerUI ? "Exists" : "Missing");
    
    // Check manager panels
    if (this.notesManager) console.log("- Notes panel in manager:", this.notesManager.panel ? "Found" : "Missing");
    if (this.mapManager) console.log("- Map panel in manager:", this.mapManager.panel ? "Found" : "Missing");
    if (this.equipmentManagerUI) console.log("- Equipment panel in manager:", this.equipmentManagerUI.panel ? "Found" : "Missing");
    
    // Check input mode
    console.log("\n=== GAME STATE ===");
    console.log("Current input mode:", this.inputMode);
    console.log("Previous input mode:", this.previousMode);
    console.log("Is typing:", this.isTyping);
    console.log("Awaiting input:", this.awaitingInput);
    
    return "Debug info logged to console";
  }

  // Add this method to help recover from problematic states:

  // Method to force the game back to normal input mode
  forceNormalMode() {
    console.log("Forcing normal input mode...");
    console.log("Previous mode was:", this.inputMode);
    
    // Close any open panels
    if (this.notesManager && this.notesManager.visible) {
      this.notesManager.toggle(false);
    }
    
    if (this.mapManager && this.mapManager.visible) {
      this.mapManager.toggle(false);
    }
    
    if (this.equipmentManagerUI && this.equipmentManagerUI.visible) {
      this.equipmentManagerUI.toggle(false);
    }
    
    // Force normal input mode
    this.inputMode = "normal";
    this.previousMode = null;
    
    // Clear any temporary input handlers
    if (this._originalHandleInput) {
      this.handleInput = this._originalHandleInput;
      this._originalHandleInput = null;
    }
    
    console.log("Input mode reset to normal");
    return "Game reset to normal input mode";
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content loaded, initializing game");
  window.game = new TextGame();
});