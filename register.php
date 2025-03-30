<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
session_start();

error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "app-db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid JSON input"]);
    exit();
}

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
$confirm_password = $data['confirm_password'] ?? '';

if (empty($username) || empty($password) || empty($confirm_password)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit();
}
if (strlen($password) < 10) {
    echo json_encode(["success" => false, "message" => "Password must be at least 10 characters long."]);
    exit();
}
if ($password !== $confirm_password) {
    echo json_encode(["success" => false, "message" => "Passwords do not match."]);
    exit();
}

// Check if username exists **(Fixed version)**
$stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->bind_result($count);
$stmt->fetch();
$stmt->close();

if ($count > 0) {
    echo json_encode(["success" => false, "message" => "Username is already taken."]);
    exit();
}

// Hash password and insert new user
$hashed_password = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $hashed_password);

if ($stmt->execute()) {
    $_SESSION['username'] = $username;
    echo json_encode(["success" => true, "message" => "Account created successfully!", "session_id" => session_id()]);
} else {
    echo json_encode(["success" => false, "message" => "Something went wrong. Please try again."]);
}

$stmt->close();
$conn->close();
?>
