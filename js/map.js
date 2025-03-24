export class MapManager {
  constructor(game) {
    this.game = game;
    this.visible = false;
    this.locations = {};
    this.currentLocation = null;
    this.panel = null;
    this.container = null;
    this.isMobile = false;
    
    // Check if we're on mobile
    this.checkMobile();
    this.initElements();
  }
  
  checkMobile() {
    // Simple mobile detection, can be enhanced
    this.isMobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log("Mobile device detected:", this.isMobile);
  }
  
  initElements() {
    console.log("Initializing map elements");
    this.panel = document.getElementById('map-panel');
    this.container = document.getElementById('map-container');
    const closeMapBtn = document.getElementById('close-map');
    
    if (!this.panel) {
      console.error("Map panel element not found!");
      return;
    }
    
    // Setup map event listeners with a direct close method
    if (closeMapBtn) {
      closeMapBtn.addEventListener('click', () => this.close());
      console.log("Close map button event listener attached");
    } else {
      console.error("Close map button not found!");
    }
    
    // For desktop, we'll modify the panel to include an inline SVG instead of iframe
    if (!this.isMobile) {
      // Make sure container exists
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'map-container';
        this.container.className = 'map-container';
        this.panel.appendChild(this.container);
      }
      
      // Set explicit sizing for the container
      this.container.style.width = '100%';
      this.container.style.height = 'calc(100% - 40px)'; // Account for header
      this.container.style.position = 'relative';
      this.container.style.overflow = 'hidden';
    }
    
    // Ensure initial state
    if (!this.visible) {
      this.panel.classList.add('hidden');
      this.panel.style.display = 'none';
    }
    
    // Initialize locations
    this.initLocations();
    
    // Listen for window resize to update mobile detection
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.checkMobile();
      
      // If mobile status changed and map is visible, toggle it off and on
      if (wasMobile !== this.isMobile && this.visible) {
        this.visible = false;
        this.toggle();
      }
    });
  }
  
  initLocations() {
    // Define map locations (coordinates are percentages of the map container)
    this.locations = {
      "intro": { x: 20, y: 15, name: "Starting Point" },
      "huntersOutpost": { x: 35, y: 25, name: "Hunter's Outpost" },
      "forestPath": { x: 50, y: 30, name: "Forest Path" },
      "riverCrossing": { x: 65, y: 40, name: "River Crossing" },
      "mountainBase": { x: 75, y: 55, name: "Mountain Base" },
      "crystalRidge": { x: 85, y: 70, name: "Crystal Ridge" },
      "bearCave": { x: 90, y: 80, name: "Bear Cave" }
    };
    
    // Set initial location
    this.updatePlayerLocation();
  }
  
  updatePlayerLocation() {
    // Add a safety check for storyIndex
    if (!this.game.storyIndex || !this.game.currentScene) {
      console.log("Story index or current scene not available yet");
      return;
    }
    
    console.log("Updating player location for scene:", this.game.currentScene);
    
    // Get current chapter/location from the scene ID
    const currentChapter = this.game.getChapterForScene(this.game.currentScene);
    console.log("Current chapter:", currentChapter);
    
    if (currentChapter) {
      // Try to extract location name from chapter
      const locationMatch = currentChapter.match(/locations\/(\w+)/);
      if (locationMatch && locationMatch[1]) {
        this.currentLocation = locationMatch[1];
        console.log("Matched location:", this.currentLocation);
      } else {
        // If we can't extract from the chapter path, try to match to a known map location
        for (const locationId in this.locations) {
          if (this.game.currentScene.includes(locationId)) {
            this.currentLocation = locationId;
            console.log("Matched location from scene name:", this.currentLocation);
            break;
          }
        }
      }
    }
    
    // If we're showing the map, update the display
    if (this.visible) {
      this.render();
    }
  }
  
  render() {
    if (!this.container) return;
    
    // Clear existing map markers
    this.container.innerHTML = '';
    
    // Create the base map SVG
    const mapSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    mapSvg.setAttribute("width", "100%");
    mapSvg.setAttribute("height", "100%");
    mapSvg.setAttribute("viewBox", "0 0 100 100");
    mapSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    
    // Add background
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background.setAttribute("width", "100");
    background.setAttribute("height", "100");
    background.setAttribute("fill", "#2a392a");
    mapSvg.appendChild(background);
    
    // Add forest areas
    this.addForestArea(mapSvg, 10, 10, 40, 40, "#1a2e1a");
    this.addForestArea(mapSvg, 40, 20, 30, 25, "#1a2e1a");
    
    // Add mountain ranges
    this.addMountainRange(mapSvg, 70, 50, 30, 35, "#3a3a3a");
    
    // Add river paths
    const riverPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    riverPath.setAttribute("d", "M 65 10 C 60 20, 55 30, 60 40 C 65 50, 60 60, 65 70");
    riverPath.setAttribute("stroke", "#4a81b0");
    riverPath.setAttribute("stroke-width", "2");
    riverPath.setAttribute("fill", "none");
    mapSvg.appendChild(riverPath);
    
    // Add path connections
    this.addPathConnections(mapSvg);
    
    // Add the map SVG to the container
    this.container.appendChild(mapSvg);
    
    // Add location markers
    console.log("Current map location:", this.currentLocation);
    Object.entries(this.locations).forEach(([locationId, location]) => {
      const marker = document.createElement('div');
      marker.className = 'map-landmark';
      marker.style.left = `${location.x}%`;
      marker.style.top = `${location.y}%`;
      marker.title = location.name;
      
      // If this is the player's current location, make it red
      if (locationId === this.currentLocation) {
        console.log(`This is the player's location! ${locationId}`);
        marker.style.backgroundColor = '#ff0000';
        marker.style.width = '12px';
        marker.style.height = '12px';
        marker.style.zIndex = '10';
        marker.style.boxShadow = '0 0 5px #fff, 0 0 10px #ff0000';
        marker.title = `Your Location: ${location.name}`;
      }
      
      // Add location label
      const label = document.createElement('div');
      label.className = 'map-label';
      label.textContent = location.name;
      label.style.position = 'absolute';
      label.style.left = `${location.x}%`;
      label.style.top = `${location.y + 5}%`;
      label.style.transform = 'translateX(-50%)';
      
      this.container.appendChild(marker);
      this.container.appendChild(label);
    });
  }
  
  addForestArea(svg, x, y, width, height, color) {
    const forestGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const forestBase = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    forestBase.setAttribute("x", x);
    forestBase.setAttribute("y", y);
    forestBase.setAttribute("width", width);
    forestBase.setAttribute("height", height);
    forestBase.setAttribute("fill", color);
    forestBase.setAttribute("opacity", "0.7");
    forestGroup.appendChild(forestBase);
    
    for (let i = 0; i < 15; i++) {
      const treeX = x + Math.random() * width;
      const treeY = y + Math.random() * height;
      const treeSize = 1 + Math.random() * 1.5;
      
      const tree = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      tree.setAttribute("cx", treeX);
      tree.setAttribute("cy", treeY);
      tree.setAttribute("r", treeSize);
      tree.setAttribute("fill", "#1d4d1d");
      forestGroup.appendChild(tree);
    }
    
    svg.appendChild(forestGroup);
  }
  
  addMountainRange(svg, x, y, width, height, color) {
    const mountainGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const mountainBase = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    
    let points = `${x},${y + height} `;
    
    const peakCount = 5 + Math.floor(Math.random() * 5);
    const segmentWidth = width / peakCount;
    
    for (let i = 0; i <= peakCount; i++) {
      const peakX = x + i * segmentWidth;
      const peakFactor = Math.random() * 0.8 + 0.2;
      const peakY = y + height - (height * peakFactor);
      points += `${peakX},${peakY} `;
    }
    
    points += `${x + width},${y + height}`;
    
    mountainBase.setAttribute("points", points);
    mountainBase.setAttribute("fill", color);
    mountainGroup.appendChild(mountainBase);
    
    const peaks = points.split(' ').slice(1, -1);
    
    for (const peak of peaks) {
      const [peakX, peakY] = peak.split(',').map(Number);
      
      if (peakY < y + height * 0.4) {
        const snow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        snow.setAttribute("cx", peakX);
        snow.setAttribute("cy", peakY);
        snow.setAttribute("r", 1.5);
        snow.setAttribute("fill", "#eee");
        mountainGroup.appendChild(snow);
      }
    }
    
    svg.appendChild(mountainGroup);
  }
  
  addPathConnections(svg) {
    const connections = [
      ["intro", "huntersOutpost"],
      ["huntersOutpost", "forestPath"],
      ["forestPath", "riverCrossing"],
      ["riverCrossing", "mountainBase"],
      ["mountainBase", "crystalRidge"],
      ["crystalRidge", "bearCave"]
    ];
    
    for (const [from, to] of connections) {
      if (this.locations[from] && this.locations[to]) {
        const fromX = this.locations[from].x;
        const fromY = this.locations[from].y;
        const toX = this.locations[to].x;
        const toY = this.locations[to].y;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${fromX} ${fromY} L ${toX} ${toY}`);
        path.setAttribute("stroke", "#a37c40");
        path.setAttribute("stroke-width", "1");
        path.setAttribute("stroke-dasharray", "2,1");
        path.setAttribute("fill", "none");
        svg.appendChild(path);
      }
    }
  }

  toggle(show = !this.visible) {
    if (this.isMobile) {
      // For mobile, open in new tab
      this.openMapInNewTab();
      return;
    }
    
    if (!this.panel) {
      console.error("Map panel not found when toggling map");
      return;
    }
    
    if (show === this.visible) return; // No change needed
    
    this.visible = show;
    
    if (this.visible) {
      console.log("Showing map panel");
      this.panel.style.display = 'flex';
      
      // Render the map 
      this.render();
      
      requestAnimationFrame(() => {
        this.panel.classList.remove('hidden');
      });
    } else {
      console.log("Hiding map panel");
      this.panel.classList.add('hidden');
      
      const hidePanel = () => {
        this.panel.style.display = 'none';
        this.panel.removeEventListener('transitionend', hidePanel);
      };
      
      this.panel.addEventListener('transitionend', hidePanel);
    }
  }
  
  // New method to open map in a new tab
  openMapInNewTab() {
    console.log("Opening map in new tab for mobile");
    
    // Store map data for the new tab to access
    localStorage.setItem('gameMapData', JSON.stringify(this.getMapData()));
    
    // Open the map page in a new tab
    window.open('map.html', '_blank');
  }
  
  // Prepare map data for serialization
  getMapData() {
    return {
      locations: this.locations,
      currentLocation: this.currentLocation,
      forestAreas: [
        { x: 10, y: 10, width: 40, height: 40, color: "#1a2e1a" },
        { x: 40, y: 20, width: 30, height: 25, color: "#1a2e1a" }
      ],
      mountainRanges: [
        { x: 70, y: 50, width: 30, height: 35, color: "#3a3a3a" }
      ],
      rivers: [
        { path: "M 65 10 C 60 20, 55 30, 60 40 C 65 50, 60 60, 65 70", color: "#4a81b0", width: 2 }
      ]
    };
  }

  close() {
    console.log("Close map button clicked");
    
    if (!this.panel) {
      console.error("Map panel not found when closing map");
      return;
    }
    
    this.visible = false;
    
    console.log("Hiding map panel via close button");
    this.panel.classList.add('hidden');
    
    setTimeout(() => {
      if (!this.visible) {
        this.panel.style.display = 'none';
        console.log("Map panel hidden completely via timeout");
      }
    }, 300);
  }
}