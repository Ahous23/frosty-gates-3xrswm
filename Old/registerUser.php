<?php
header('Content-type: application/json');

include "config.php"; // your database connection file

// Get POST data
$username = $_POST['username'];
$password = $_POST['password'];
$email = $_POST['email'];

// Hash the password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// First, check if the username or email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$stmt->bind_param('ss', $username, $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    // A user with the same username or email already exists
    echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
    exit();
}

// If we've reached this point, no user with the same username or email was found
$stmt = $conn->prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
$stmt->bind_param('sss', $username, $hashed_password, $email);

// Execute the statement and check for errors
if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Error registering user.']);
    exit();
}

// If we've reached this point, the user was registered successfully
echo json_encode(['success' => true]);
?>
