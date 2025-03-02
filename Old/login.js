document.querySelector("#loginForm").addEventListener("submit", function(event){
    event.preventDefault();
    
    var formData = new FormData(event.target);
    
    fetch('loginUser.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            // Login successful, redirect to game page
            window.location.href = "game.php";
        } else {
            // Login failed, show error message
            document.querySelector("#message").textContent = data.message;
            document.querySelector("#message").style.color = "red";
        }
    })
    .catch(error => console.error('Error:', error));
});
