<?php
$servername = "localhost"; // your database server
$dbusername = "olafzbba_usersadmin"; // your database username
$dbpassword = "0Gtx@*7J%zM@efUl%L%8gt#9i"; // your database password
$dbname = "olafzbba_game"; // your database name

// Create connection
$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}
?>
