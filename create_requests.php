<?php
session_start();

// Set headers for JSON response and CORS
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Enable error reporting in dev
error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "app-db";

// Connect DB
$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(["error" => "Please log in before creating a request."]);
    exit();
}

// Read raw JSON from request
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

// If parse fails, return error
if (!$data && json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(["error" => "Invalid JSON received."]);
    exit();
}

// Extract fields
$item            = $data['item'] ?? '';
$dropOffLocation = $data['drop_off_location'] ?? '';
$deliverySpeed   = $data['delivery_speed'] ?? 'common';

// Validate
if (empty($item) || empty($dropOffLocation)) {
    echo json_encode(["error" => "Item and Drop-off location cannot be empty!"]);
    exit();
}

$status    = 'pending';
$createdAt = date('Y-m-d H:i:s');
$username  = $_SESSION['username'];

// Insert
$sql = "INSERT INTO requests (username, item, drop_off_location, delivery_speed, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(["error" => "Prepare failed: " . $conn->error]);
    exit();
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
