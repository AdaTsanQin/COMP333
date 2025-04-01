<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json"); 

$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "app-db";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}

if (!isset($_SESSION['username'])) {
    die(json_encode(["error" => "Please log in before creating a request."]));
}

$inputData = json_decode(file_get_contents("php://input"), true);
if ($inputData) {
    $item            = $inputData['item'] ?? '';
    $dropOffLocation = $inputData['drop_off_location'] ?? '';
    $deliverySpeed   = $inputData['delivery_speed'] ?? 'common';
} else {
    $item            = $_POST['item'] ?? '';
    $dropOffLocation = $_POST['drop_off_location'] ?? '';
    $deliverySpeed   = $_POST['delivery_speed'] ?? 'common';
}

if (empty($item) || empty($dropOffLocation)) {
    die(json_encode(["error" => "Item and Drop-off location cannot be empty!"]));
}

$status    = 'pending';
$createdAt = date('Y-m-d H:i:s');
$username  = $_SESSION['username'];

$sql = "INSERT INTO requests (username, item, drop_off_location, delivery_speed, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    die(json_encode(["error" => "Prepare failed: " . $conn->error]));
}

$stmt->bind_param("ssssss", $username, $item, $dropOffLocation, $deliverySpeed, $status, $createdAt);

if ($stmt->execute()) {
    echo json_encode(["success" => "Request created successfully!"]);
} else {
    echo json_encode(["error" => "Insert failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
