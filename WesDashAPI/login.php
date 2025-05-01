<?php
$allowed_origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Cookie, Accept");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
session_start();

// ---------- Session Setup ----------
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',               // Leave empty unless using custom domain
    'secure' => false,            // true if using HTTPS
    'httponly' => false,
    'samesite' => 'Lax',          // Use 'None' if secure is true
]);

error_reporting(E_ALL);
ini_set('display_errors', 1);

// ---------- Connect to DB ----------
$mysqli = new mysqli("localhost", "root", "", "app-db");
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// ---------- Read input ----------
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!isset($data['username'], $data['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing username or password."]);
    exit;
}

$username = trim($data['username']);
$password = $data['password'];
$role     = $data['role'] ?? 'user';

// ---------- Look up user ----------
$stmt = $mysqli->prepare("SELECT password, is_deleted FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Username not found."]);
    exit;
}

$stmt->bind_result($hashedPwd, $isDeleted);
$stmt->fetch();

if ($isDeleted == 1) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Account is deleted."]);
    exit;
}

// ---------- Check password ----------
if (!password_verify($password, $hashedPwd)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid password."]);
    exit;
}

// ---------- Create session ----------
$_SESSION['username'] = $username;

// ---------- Update role ----------
$update = $mysqli->prepare("UPDATE users SET role = ? WHERE username = ?");
$update->bind_param("ss", $role, $username);
$update->execute();
$update->close();

// ---------- Debug session info ----------
file_put_contents(__DIR__ . "/session_debug.log", "Session ID: " . session_id() . "\nUsername: " . $_SESSION['username'] . "\n", FILE_APPEND);

// ---------- Return success response ----------
echo json_encode([
    "success"    => true,
    "message"    => "Login successful",
    "session_id" => session_id(),
    "role"       => $role
]);

$stmt->close();
$mysqli->close();
?>
