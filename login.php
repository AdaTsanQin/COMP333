<?php
session_start();

// Set headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS"); 
header("Access-Control-Allow-Headers: Content-Type");

// Enable error reporting (for debugging only; remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection
$servername = "localhost";
$db_username = "root"; 
$db_password = "";
$dbname = "app-db";

$conn = new mysqli($servername, $db_username, $db_password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

// Get raw POST body and decode JSON
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

// Handle JSON parse errors
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid JSON received."]);
    exit();
}

// Get and sanitize inputs
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username and password are required."]);
    exit();
}

// Prepare and execute query to check if the user exists and if the account is deleted
$stmt = $conn->prepare("SELECT password, is_deleted FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();
$stmt->bind_result($hashed_password, $is_deleted);

// Validate login
if ($stmt->num_rows > 0) {
    $stmt->fetch();
    
    // Check if the account is deleted
    if ($is_deleted == 1) {
        echo json_encode(["success" => false, "message" => "This account has been deleted."]);
        exit();
    }

    // Validate password
    if (password_verify($password, $hashed_password)) {
        $_SESSION['username'] = $username;
        echo json_encode([
            "success" => true,
            "message" => "Login successful!",
            "session_id" => session_id()
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid password."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Username not found."]);
}

// Clean up
$stmt->close();
$conn->close();
?>