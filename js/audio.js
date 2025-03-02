export class AudioManager {
  constructor() {
    this.titleMusic = new Audio('audio/title.mp3');
    this.titleMusic.loop = true;
    this.musicEnabled = false;
    this.typingSound = new Audio('audio/typing.mp3');
    this.typingSound.loop = true;
    this.typingSound.volume = 0.1;
  }

  enableAudio() {
    this.musicEnabled = true;
    this.playTitleMusic();
  }

  playTitleMusic() {
    if (this.musicEnabled) {
      this.titleMusic.volume = 0.5; // 50% volume
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
    if (this.typingSound.paused) {
      this.typingSound.play().catch(e => console.log("Error playing typing sound:", e));
    }
  }

  stopTypingSound() {
    this.typingSound.pause();
    this.typingSound.currentTime = 0;
  }
}