<?php
session_start();

// Check if the user is not logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Olaf vs Bears</title>
    <script>
        // Function to handle level data
        function handleLevelData(currentLevelData) {
            const gameTextElement = document.getElementById('game-text');
            const optionsContainer = document.getElementById('options-container');

            // Display the level content
            gameTextElement.innerText = currentLevelData.content.join('\n');

            // Generate buttons for the available options
            currentLevelData.options.forEach(function(option) {
                const button = document.createElement('button');
                button.textContent = option.text;

                // Add a click event listener to handle option selection
                button.addEventListener('click', function() {
                    handleOptionSelection(option);
                });

                // Append the button to the DOM
                optionsContainer.appendChild(button);
            });
        }

        // Function to handle option selection
        function handleOptionSelection(option) {
            // Update the game state or perform any necessary actions based on the selected option
            // You can retrieve the 'nextSection' value from the selected option and load the corresponding JSON file
            // ...

            // Example: Reload the page with the new section/level
            window.location.href = 'game.php?section=' + option.nextSection;
        }

        // Function to load the level data
        function loadLevelData() {
			let section = '<?php echo isset($_GET['section']) ? $_GET['section'] : ''; ?>';
			if (section === '') {
				section = 'level1';
			}
			const jsonFilePath = `levels/${section}.json`;

			fetch(jsonFilePath)
				.then(response => response.json())
				.then(data => {
					// Store the loaded JSON data in the 'currentLevelData' variable
					const currentLevelData = data;

					// Call the function to handle the loaded level data
					handleLevelData(currentLevelData);
				})
				.catch(error => {
					console.error('Error loading level data:', error);
				});
		}


        // Call the function to load the level data when the page loads
        window.addEventListener('load', loadLevelData);
    </script>
</head>
<body>
    <div id="game-text"></div>
    <div id="options-container"></div>

    <!-- Additional HTML and game interface elements -->
    <!-- ... -->
</body>
</html>
