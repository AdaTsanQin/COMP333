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
$servername   = "localhost";
$db_username  = "root";
$db_password  = "";
$dbname       = "app-db";

$conn = new mysqli($servername, $db_username, $db_password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
      "success" => false,
      "message" => "Database connection failed"
    ]);
    exit();
}

// Get raw POST body and decode JSON
$rawInput = file_get_contents("php://input");
$data     = json_decode($rawInput, true);

if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
      "success" => false,
      "message" => "Invalid JSON received."
    ]);
    exit();
}

// Sanitize inputs
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
$role     = trim($data['role']     ?? 'user');

// Whitelist roles
$allowed = ['user','dasher'];
if (!in_array($role, $allowed, true)) {
    $role = 'user';
}

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
      "success" => false,
      "message" => "Username and password are required."
    ]);
    exit();
}

// Check credentials
$stmt = $conn->prepare("
  SELECT password, is_deleted
    FROM users
   WHERE username = ?
");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode([
      "success" => false,
      "message" => "Username not found."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}

$stmt->bind_result($hashed_password, $is_deleted);
$stmt->fetch();

// Check if deleted
if ($is_deleted == 1) {
    echo json_encode([
      "success" => false,
      "message" => "This account has been deleted."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}

// Verify password
if (!password_verify($password, $hashed_password)) {
    echo json_encode([
      "success" => false,
      "message" => "Invalid password."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}

// At this point login is successful: update role
$update = $conn->prepare("
  UPDATE users
     SET role = ?
   WHERE username = ?
");
$update->bind_param("ss", $role, $username);
$update->execute();
$update->close();

// Store session and return success
$_SESSION['username'] = $username;

echo json_encode([
  "success"    => true,
  "message"    => "Login successful!",
  "session_id" => session_id(),
  "role"       => $role
]);

// Clean up
$stmt->close();
$conn->close();
