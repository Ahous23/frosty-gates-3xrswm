window.onload = function() {
    const gameTextElement = document.getElementById('game-text');
    const nextButton = document.getElementById('next-button');
    
    const introText = [
        'In the age of Vikings, a quiet village thrived in the shadow of a mystic mountain...',
        'Until one day, the village was destroyed by sentient bears...',
        'Olaf, a strong and brave Viking, survived. It\'s now up to him to avenge his village...'
    ];
    
    let gameState = {
        section: 'intro',
        index: 0,
    };
    
    gameTextElement.innerText = introText[gameState.index];
    
    nextButton.addEventListener('click', function() {
        gameState.index++;
        if (gameState.index < introText.length) {
            gameTextElement.innerText = introText[gameState.index];
        } else {
            // You can redirect the user to another page, or start a new section here
            nextButton.style.display = 'none';
            gameTextElement.innerText = 'End of introduction, more game play coming soon.';
        }
    });
}
