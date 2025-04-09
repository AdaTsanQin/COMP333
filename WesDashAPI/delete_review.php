<?php
if (isset($_GET['PHPSESSID'])) {
    session_id($_GET['PHPSESSID']);
}
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers for JSON API
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "app-db";

// Create database connection with port 3307
$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname, 3307);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

// Must login first
if (!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "Please log in before deleting a review."]);
    exit;
}

// Get JSON data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (!isset($data['task_id'])) {
    echo json_encode(["success" => false, "message" => "Task ID is required."]);
    exit;
}

$taskId = intval($data['task_id']);

// Clear the review by clearing the comment field and resetting rating
$emptyComment = "";
$zeroRating = 0;

$sql = "UPDATE tasks SET comment = ?, rating = ? WHERE task_id = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmt->bind_param("sii", $emptyComment, $zeroRating, $taskId);
if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Review deleted successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to delete review: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>