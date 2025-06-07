export class AudioManager {
  constructor() {
    this.titleMusic = new Audio('audio/title.mp3');
    this.titleMusic.loop = true;
    this.musicEnabled = false;
    this.titleMusic.volume = 0.5;
    this.typingSound = new Audio('audio/typing.mp3');
    this.typingSound.loop = true;
    this.typingSound.volume = 0.1;
    this.typingSoundEnabled = true;
  }

  enableMusic(enable) {
    this.musicEnabled = enable;
    if (enable) {
      this.playTitleMusic();
    } else {
      this.stopTitleMusic();
    }
  }

  setMusicVolume(volume) {
    this.titleMusic.volume = volume;
  }

  getMusicVolume() {
    return this.titleMusic.volume;
  }

  playTitleMusic() {
    if (this.musicEnabled) {
      this.titleMusic.play().catch(e => console.log("Error playing title music:", e));
    }
  }

  stopTitleMusic() {
    if (!this.musicEnabled) return;
    const fadeAudio = setInterval(() => {
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

  playTypingSound() {
    if (this.typingSoundEnabled && this.typingSound.paused) {
      this.typingSound.play().catch(e => console.log("Error playing typing sound:", e));
    }
  }

  stopTypingSound() {
    this.typingSound.pause();
    this.typingSound.currentTime = 0;
  }
}