import { UIPanel } from './uiPanel.js';

export class AudioPanel extends UIPanel {
  constructor(game) {
    const panel = document.getElementById('audio-panel');
    super(panel);
    this.game = game;
    this.closeButton = panel ? panel.querySelector('#close-audio') : null;
    this.musicCheckbox = panel ? panel.querySelector('#enable-music-checkbox') : null;
    this.volumeSlider = panel ? panel.querySelector('#music-volume') : null;
    this.typingCheckbox = panel ? panel.querySelector('#enable-typing-checkbox') : null;
    this.init();
  }

  init() {
    if (!this.panel) return;

    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        // Close the panel directly then let the input handler restore the mode
        this.toggle(false);
        if (this.game.inputHandlers &&
            typeof this.game.inputHandlers.resumeAfterAudio === 'function') {
          this.game.inputHandlers.resumeAfterAudio();
        }
      });
    }

    if (!this.visible) {
      this.panel.style.display = 'none';
      this.panel.classList.add('hidden');
    }

    if (this.musicCheckbox) {
      this.musicCheckbox.checked = this.game.audioManager.musicEnabled;
      this.musicCheckbox.addEventListener('change', () => {
        this.game.audioManager.enableMusic(this.musicCheckbox.checked);
      });
    }

    if (this.volumeSlider) {
      this.volumeSlider.value = this.game.audioManager.getMusicVolume();
      this.volumeSlider.addEventListener('input', () => {
        const vol = parseFloat(this.volumeSlider.value);
        this.game.audioManager.setMusicVolume(vol);
      });
    }

    if (this.typingCheckbox) {
      this.typingCheckbox.checked = this.game.audioManager.typingSoundEnabled;
      this.typingCheckbox.addEventListener('change', () => {
        this.game.audioManager.typingSoundEnabled = this.typingCheckbox.checked;
        if (!this.typingCheckbox.checked) {
          this.game.audioManager.stopTypingSound();
        }
      });
    }
  }
}
