<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Olaf vs Bears - Login</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Include Bootstrap CSS -->
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
</head>
<body>
  <body>
  <div class="container">
    <div id="login-form">
      <h2>Login</h2>
      <form>
        <div class="form-group">
          <label for="login-username">Username:</label>
          <input type="text" id="login-username" class="form-control">
        </div>
        <div class="form-group">
          <label for="login-password">Password:</label>
          <input type="password" id="login-password" class="form-control">
        </div>
        <button type="button" id="login-button" class="btn btn-primary">Login</button>
      </form>
    </div>

    <div id="register-form">
      <h2>Register</h2>
      <form>
        <div class="form-group">
          <label for="register-username">Username:</label>
          <input type="text" id="register-username" class="form-control">
        </div>
        <div class="form-group">
          <label for="register-password">Password:</label>
          <input type="password" id="register-password" class="form-control">
        </div>
        <div class="form-group">
          <label for="register-email">Email:</label>
          <input type="email" id="register-email" class="form-control">
        </div>
        <button type="button" id="register-button" class="btn btn-primary">Register</button>
      </form>
    </div>
  </div>

  
</body>

<script>
  
  
$(document).ready(function() {
  $('#register-button').click(function() {
    var username = $('#register-username').val();
    var password = $('#register-password').val();
    var email = $('#register-email').val();

    $.ajax({
      url: 'registerUser.php',
      type: 'POST',
      data: {
        username: username,
        password: password,
        email: email
      },
      success: function(data) {
        var response = JSON.parse(data);
        if (response.success) {
          console.log('User registered successfully.');
        } else {
          console.error('Error: ' + response.message);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error('Error: ' + textStatus, errorThrown);
      }
    });
  });
});

$(document).ready(function() {
  $('#login-button').click(function() {
    var username = $('#login-username').val();
    var password = $('#login-password').val();

    $.ajax({
      url: 'loginUser.php',
      type: 'POST',
      data: {
        username: username,
        password: password
      },
      success: function(data) {
        var response = JSON.parse(data);
        if (response.success) {
          console.log('User logged in successfully.');
          loadProgress(response.userId);  // load the game progress
        } else {
          console.error('Error: ' + response.message);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error('Error: ' + textStatus, errorThrown);
      }
    });
  });
});
</script>
</html>