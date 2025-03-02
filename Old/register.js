document.querySelector("#registerForm").addEventListener("submit", function(event){
    event.preventDefault();
    
    var formData = new FormData(event.target);
    
    fetch('registerUser.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            // Registration successful, show message
            alert("Registration successful! Redirecting to login page...");

            // Redirect to login page
            window.location.href = "login.html";
        } else {
            // Registration failed, show error message
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
});
