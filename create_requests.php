<?php
if (isset($_GET['PHPSESSID'])) {
    session_id($_GET['PHPSESSID']);
}
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "app-db";


$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}

// Must login first
if (!isset($_SESSION['username'])) {
    die(json_encode(["error" => "Please log in before creating a request."]));
}

// Check if request is JSON or form data
$inputData = json_decode(file_get_contents("php://input"), true);

// Debugging
file_put_contents("debug_log.txt", print_r($inputData, true), FILE_APPEND);
file_put_contents("debug_log.txt", print_r($_POST, true), FILE_APPEND);


if ($inputData) {
    // JSON request
    $item            = $inputData['item'] ?? '';
    $dropOffLocation = $inputData['drop_off_location'] ?? '';
    $deliverySpeed   = $inputData['delivery_speed'] ?? 'common';
} else {
    // Form-encoded request
    $item            = $_POST['item'] ?? '';
    $dropOffLocation = $_POST['drop_off_location'] ?? '';
    $deliverySpeed   = $_POST['delivery_speed'] ?? 'common';
}

// Validate data
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
exit();
?>
