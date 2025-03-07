<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "app-db";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

//must login first
if (!isset($_SESSION['username'])) {
    die("Please log in before creating a request.");
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $item              = $_POST['item']              ?? '';
    $dropOffLocation   = $_POST['drop_off_location'] ?? '';
    $deliverySpeed     = $_POST['delivery_speed']     ?? 'common';
    $status            = 'pending'; 
    $createdAt         = date('Y-m-d H:i:s');  

    $username = $_SESSION['username'];

 
    if (empty($item) || empty($dropOffLocation)) {
        die("Item and Drop-off location cannot be empty!");
    }


    $sql = "INSERT INTO requests (username, item, drop_off_location, delivery_speed, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        die("Prepare failed: " . $conn->error);
    }


    $stmt->bind_param("ssssss", $username, $item, $dropOffLocation, $deliverySpeed, $status, $createdAt);

    if ($stmt->execute()) {
        //Ada: changed the location to a valid new site
        header("Location: delete_requests.php");
        exit;
    } else {
        die("Insert failed: " . $stmt->error);
    }
} 


?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Create a new request</title>
</head>
<body>
<h1>Create a new request</h1>
<form method="POST" action="create_requests.php">
    <label>Item:</label>
    <input type="text" name="item" required><br><br>

    <label>Drop-off location:</label>
    <input type="text" name="drop_off_location" required><br><br>


    <label>Delivery Speed:</label>
    <input type="radio" name="delivery_speed" value="urgent"> Urgent
    <input type="radio" name="delivery_speed" value="common" checked> Common
    <br><br>

    <button type="submit">Create</button>

    <a href="logout.php">
    <button type="button">Logout</button>
    </a>
</form>
</body>
</html>
