<?php
// ───── CORS HEADERS: Must come first ─────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Cookie, Accept");
header("Content-Type: application/json; charset=utf-8");

// ───── Handle preflight ─────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ───── Restore session if passed manually ─────
if (isset($_GET['PHPSESSID'])) session_id($_GET['PHPSESSID']);
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => false,
  'httponly' => false,
  'samesite' => 'Lax',
]);
session_start();

error_reporting(E_ALL);
ini_set('display_errors', 1);

// ───── DB connect ─────
$conn = new mysqli('localhost', 'root', '', 'app-db');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// ───── Read JSON input ─────
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid JSON input"]);
    exit;
}

$username         = trim($data['username'] ?? '');
$password         = $data['password'] ?? '';
$confirm_password = $data['confirm_password'] ?? '';

if (empty($username) || empty($password) || empty($confirm_password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}
if (strlen($password) < 10) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Password must be at least 10 characters."]);
    exit;
}
if ($password !== $confirm_password) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Passwords do not match."]);
    exit;
}

// ───── Check for existing username ─────
$stmt = $conn->prepare("SELECT is_deleted FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->bind_result($is_deleted);
$stmt->fetch();
$stmt->close();

if ($is_deleted === 1) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "This account has already been deleted."]);
    exit;
} elseif ($is_deleted === null) {
    // Insert new user
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $username, $hashed_password);
    if ($stmt->execute()) {
        $_SESSION['username'] = $username;
        echo json_encode([
            "success"    => true,
            "message"    => "Account created successfully!",
            "session_id" => session_id()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to register."]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Username is already taken."]);
}

$conn->close();
