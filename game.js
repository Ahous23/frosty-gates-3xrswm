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
    
    this.inventory = [];
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
      // Check if Space is pressed and typing is in progress
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

    // Initialize notes system
    this.initNotes();

    // Initialize map properties
    this.mapVisible = false;
    this.mapLocations = {};
    this.currentMapLocation = null;
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
      
      // Initialize map elements AFTER story index is loaded
      this.initMapElements();
      
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

  // Update saveGame to properly include notes
  saveGame() {
    // Make sure notes are captured immediately before saving
    this.saveNotes();
    
    console.log("Saving notes content:", this.notesContent); // Add this debug line
    
    const saveData = {
      currentScene: this.currentScene,
      playerStats: this.playerStats,
      inventory: this.inventory,
      gameState: this.gameState,
      notes: this.notesContent // Use the captured notes content directly
    };
    
    console.log("Full save data:", saveData); // Add this to see the complete object
    
    const saveString = btoa(JSON.stringify(saveData));
    console.log("Save string length:", saveString.length); // Check if the save string is being created correctly
    
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

  initNotes() {
    // Set up notes panel
    this.notesVisible = false;
    this.notesContent = "";
    
    // Get DOM elements
    this.notesPanel = document.getElementById('notes-panel');
    this.notesEditor = document.getElementById('notes-editor');
    const closeNotesBtn = document.getElementById('close-notes');
    
    // Ensure the panel is hidden initially (display: none)
    if (!this.notesVisible) {
      this.notesPanel.style.display = 'none';
    }
    
    // Setup event listeners
    closeNotesBtn.addEventListener('click', () => this.toggleNotes());
    
    // Setup rich text formatting
    this.setupRichTextEditing();
    
    // Auto-save notes when content changes (with debounce)
    let timeout = null;
    this.notesEditor.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.notesContent = this.notesEditor.innerHTML;
      }, 500);
    });
  }

  setupRichTextEditing() {
    // Get all formatting buttons and selects
    const formatButtons = document.querySelectorAll('.format-btn');
    const formatSelects = document.querySelectorAll('.format-select');
    
    // Add event listeners to buttons
    formatButtons.forEach(button => {
      button.addEventListener('click', () => {
        const command = button.dataset.command;
        document.execCommand(command, false, null);
        this.notesEditor.focus();
      });
    });
    
    // Add event listeners to selects
    formatSelects.forEach(select => {
      select.addEventListener('change', () => {
        const command = select.dataset.command;
        const value = select.value;
        document.execCommand(command, false, value);
        select.selectedIndex = 0; // Reset to default option
        this.notesEditor.focus();
      });
    });
    
    // Focus the editor when clicking on it
    this.notesEditor.addEventListener('focus', () => {
      // This ensures we're editing in the correct context
    });
  }

  toggleNotes() {
    this.notesVisible = !this.notesVisible;
    
    if (this.notesVisible) {
      // Show notes
      this.notesPanel.style.display = 'flex';
      // Use requestAnimationFrame to ensure display change takes effect before removing transform
      requestAnimationFrame(() => {
        this.notesPanel.classList.remove('hidden');
      });
    } else {
      // Hide notes - first start the transition
      this.notesPanel.classList.add('hidden');
      
      // Add transitionend listener to set display to none after animation
      const hidePanel = () => {
        this.notesPanel.style.display = 'none';
        this.notesPanel.removeEventListener('transitionend', hidePanel);
      };
      
      this.notesPanel.addEventListener('transitionend', hidePanel);
    }
  }

  saveNotes() {
    // Capture current notes content
    const notesContent = this.notesEditor.innerHTML;
    console.log("Notes content before saving:", notesContent);
    this.notesContent = notesContent;
    return this.notesContent;
  }

  // Make sure the loadNotes method properly handles the content
  loadNotes(notesContent) {
    if (notesContent) {
      this.notesContent = notesContent;
      this.notesEditor.innerHTML = this.notesContent;
      console.log("Notes loaded:", notesContent.substring(0, 50) + "..."); // Debug log
    }
  }

  // Initialize map location data
  initMapLocations() {
    // Define map locations (coordinates are percentages of the map container)
    this.mapLocations = {
      "intro": { x: 20, y: 15, name: "Starting Point" },
      "huntersOutpost": { x: 35, y: 25, name: "Hunter's Outpost" },
      "forestPath": { x: 50, y: 30, name: "Forest Path" },
      "riverCrossing": { x: 65, y: 40, name: "River Crossing" },
      "mountainBase": { x: 75, y: 55, name: "Mountain Base" },
      "crystalRidge": { x: 85, y: 70, name: "Crystal Ridge" },
      "bearCave": { x: 90, y: 80, name: "Bear Cave" }
    };
    
    // Set initial location
    this.updatePlayerMapLocation();
  }
  
  // Update player's location on the map based on currentScene
  updatePlayerMapLocation() {
    // Add a safety check for storyIndex
    if (!this.storyIndex || !this.currentScene) {
      console.log("Story index or current scene not available yet");
      return;
    }
    
    // Get current chapter/location from the scene ID
    const currentChapter = this.getChapterForScene(this.currentScene);
    
    if (currentChapter) {
      // Extract location name from chapter (e.g., "huntersOutpost" from "locations/huntersOutpost")
      const locationMatch = currentChapter.match(/locations\/(\w+)/);
      if (locationMatch && locationMatch[1]) {
        this.currentMapLocation = locationMatch[1];
      }
    }
    
    // If we're showing the map, update the display
    if (this.mapVisible) {
      this.renderMap();
    }
  }
  
  // Render the map with locations
  renderMap() {
    if (!this.mapContainer) return;
    
    // Clear existing map markers
    this.mapContainer.innerHTML = '';
    
    // Add all known locations
    Object.entries(this.mapLocations).forEach(([locationId, location]) => {
      const marker = document.createElement('div');
      marker.className = 'map-landmark';
      marker.style.left = `${location.x}%`;
      marker.style.top = `${location.y}%`;
      marker.title = location.name;
      
      // If this is the player's current location, make it red
      if (locationId === this.currentMapLocation) {
        marker.style.backgroundColor = '#ff0000';
        marker.style.width = '12px';
        marker.style.height = '12px';
        marker.style.zIndex = '10';
        marker.title = `Your Location: ${location.name}`;
      }
      
      this.mapContainer.appendChild(marker);
    });
  }
  
  // Toggle map visibility
  toggleMap() {
    console.log("Toggle map called, current visibility:", this.mapVisible);
    
    if (!this.mapPanel) {
      console.error("Map panel not found when toggling map");
      return;
    }
    
    this.mapVisible = !this.mapVisible;
    
    if (this.mapVisible) {
      // Show map
      console.log("Showing map panel");
      this.mapPanel.style.display = 'flex';
      
      // Use requestAnimationFrame to ensure display change takes effect before removing transform
      requestAnimationFrame(() => {
        this.mapPanel.classList.remove('hidden');
        // Render the map when opened
        this.renderMap();
      });
    } else {
      // Hide map - first start the transition
      console.log("Hiding map panel");
      this.mapPanel.classList.add('hidden');
      
      // Add transitionend listener to set display to none after animation
      const hidePanel = () => {
        this.mapPanel.style.display = 'none';
        this.mapPanel.removeEventListener('transitionend', hidePanel);
        console.log("Map panel hidden completely via transitionend");
      };
      
      this.mapPanel.addEventListener('transitionend', hidePanel);
    }
  }

  // New method specifically for closing the map (not toggling)
  closeMap() {
    console.log("Close map button clicked, explicitly closing map");
    
    if (!this.mapPanel) {
      console.error("Map panel not found when closing map");
      return;
    }
    
    // Always set to false
    this.mapVisible = false;
    
    // Hide map - start the transition
    console.log("Hiding map panel via close button");
    this.mapPanel.classList.add('hidden');
    
    // Use setTimeout instead of transitionend for reliability
    setTimeout(() => {
      if (!this.mapVisible) { // Double-check state
        this.mapPanel.style.display = 'none';
        console.log("Map panel hidden completely via timeout");
      }
    }, 300); // 300ms to match the CSS transition duration
  }

  // Change the initMapElements method to use the new closeMap method
  initMapElements() {
    console.log("Initializing map elements");
    this.mapPanel = document.getElementById('map-panel');
    this.mapContainer = document.getElementById('map-container');
    const closeMapBtn = document.getElementById('close-map');
    
    if (!this.mapPanel) {
      console.error("Map panel element not found!");
      return;
    }
    
    if (!this.mapContainer) {
      console.error("Map container element not found!");
      return;
    }
    
    // Setup map event listeners with a direct close method
    if (closeMapBtn) {
      // Use the dedicated close method, not toggle
      closeMapBtn.addEventListener('click', () => this.closeMap());
      console.log("Close map button event listener attached with dedicated close method");
    } else {
      console.error("Close map button not found!");
    }
    
    // Ensure initial state
    if (!this.mapVisible) {
      this.mapPanel.style.display = 'none';
    }
    
    // Only initialize locations if everything else succeeded
    this.initMapLocations();
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content loaded, initializing game");
  window.game = new TextGame(); // Store game in global variable for debugging
  
  // Don't need to call initMapElements again since it's called in initialize()
  // The reason we keep this is in case the async initialize() method hasn't finished yet
  setTimeout(() => {
    if (!window.game.mapPanel || !window.game.mapContainer) {
      console.log("Map elements not initialized after 2 seconds, initializing now");
      window.game.initMapElements();
    }
  }, 2000);
});