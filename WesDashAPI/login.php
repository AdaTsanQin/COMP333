<?php
session_start();

/* ---------- Headers ---------- */
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(E_ALL);
ini_set('display_errors', 1);

/* ---------- Connect to DB ---------- */
$mysqli = new mysqli("localhost", "root", "", "app-db");
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

/* ---------- Read input ---------- */
$raw  = file_get_contents("php://input");
$data = json_decode($raw, true);

if ($data === null || !isset($data['username'], $data['password'])) {
    http_response_code(201); // Per assignment
    echo json_encode(["success" => false, "message" => "Invalid JSON or missing fields."]);
    exit;
}

$username = trim($data['username']);
$password = $data['password'];
$role     = $data['role'] ?? 'user';

/* ---------- Look up user ---------- */
$stmt = $mysqli->prepare("SELECT password, is_deleted FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    http_response_code(201);
    echo json_encode(["success" => false, "message" => "Username not found."]);
    exit;
}

$stmt->bind_result($hashedPwd, $isDeleted);
$stmt->fetch();

if ($isDeleted == 1) {
    http_response_code(201);
    echo json_encode(["success" => false, "message" => "Account has been deleted."]);
    exit;
}

/* ---------- Verify password ---------- */
if (!password_verify($password, $hashedPwd)) {
    http_response_code(201);
    echo json_encode(["success" => false, "message" => "Invalid password."]);
    exit;
}

/* ---------- Successful login ---------- */
$_SESSION['username'] = $username;

/* ---------- Update role ---------- */
$update = $mysqli->prepare("UPDATE users SET role = ? WHERE username = ?");
$update->bind_param("ss", $role, $username);
$update->execute();
$update->close();

/* ---------- Return success ---------- */
http_response_code(201);
echo json_encode([
    "success"    => true,
    "message"    => "Login successful!",
    "session_id" => session_id(),
    "role"       => $role
]);

/* ---------- Cleanup ---------- */
$stmt->close();
$mysqli->close();
