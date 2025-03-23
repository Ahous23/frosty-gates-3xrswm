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
    this.gameOutput = document.getElementById("gameOutput");
    this.gameInput = document.getElementById("gameInput");
    this.audioManager = new AudioManager();
    this.uiManager = new UIManager(this.gameOutput, this.gameInput);
    this.lootSystem = new LootSystem(this);
    this.gameLogic = new GameLogic(this);
    this.inputHandlers = new InputHandlers(this);
    this.combatSystem = new CombatSystem(this);
    this.weaponManager = new WeaponManager(this);

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
    
    // Initialize everything
    this.init();
  }

  async init() {
    // Initialize other systems
    await this.weaponManager.initialize();
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

  // Add the startNewGame method that was missing
  startNewGame() {
    this.uiManager.print("\nStarting new game...\n", "system-message");
    
    // Stop title music
    this.audioManager.stopTitleMusic();

    // Clear output before starting new game
    this.uiManager.clearOutput();

    // Initialize starting inventory
    this.inventory = [];

    // Reset player stats to default
    this.playerStats = { ...initialPlayerStats };
    this.availableStatPoints = availableStatPoints;

    this.currentScene = "intro";
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
    this.typeLoadingText(loadingTextContainer, randomQuip);
    const randomDuration = Math.floor(Math.random() * 2000) + 3000;
    await new Promise((resolve) => setTimeout(resolve, randomDuration));
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
    while (true) {
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

  // Toggle notes panel
  toggleNotes() {
    this.notesManager.toggle();
  }

  // Save notes content
  saveNotes() {
    return this.notesManager.save();
  }

  // Load notes content
  loadNotes(notesContent) {
    this.notesManager.load(notesContent);
  }

  // Toggle map panel
  toggleMap() {
    this.mapManager.toggle();
  }

  // Update player's location on the map
  updatePlayerMapLocation() {
    this.mapManager.updatePlayerLocation();
  }

  // Update saveGame to properly include notes
  saveGame() {
    // Make sure notes are captured immediately before saving
    const notesContent = this.saveNotes();
    
    console.log("Saving notes content:", notesContent);
    
    const saveData = {
      currentScene: this.currentScene,
      playerStats: this.playerStats,
      inventory: this.inventory,
      gameState: this.gameState,
      notes: notesContent
    };
    
    console.log("Full save data:", saveData);
    
    const saveString = btoa(JSON.stringify(saveData));
    console.log("Save string length:", saveString.length);
    
    this.uiManager.print("\nSave Code (copy this somewhere safe):", "system-message");
    this.uiManager.print(saveString, "save-code");
    this.uiManager.print("\nType 'continue' to resume your game.", "system-message");
  }

  // Update loadSaveData to handle combat-related data
  loadSaveData(saveData) {
    try {
      const data = JSON.parse(atob(saveData));
      this.currentScene = data.currentScene;
      this.playerStats = data.playerStats;
      this.inventory = data.inventory || [];
      this.gameState = data.gameState || {};
      
      // Ensure health is set if not in save data
      if (this.gameState.playerHealth === undefined) {
        this.gameState.playerHealth = 100;
      }
      
      // Ensure XP is set if not in save data
      if (this.gameState.playerXp === undefined) {
        this.gameState.playerXp = 0;
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
    this.typeLoadingText(loadingTextContainer, randomQuip);
    const randomDuration = Math.floor(Math.random() * 2000) + 3000;
    await new Promise((resolve) => setTimeout(resolve, randomDuration));
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
    while (true) {
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

  // Rest of the TextGame class methods...
  // (Keep all the other methods that aren't related to notes or map)
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content loaded, initializing game");
  window.game = new TextGame();
});