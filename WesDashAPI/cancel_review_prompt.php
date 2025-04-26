<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie, Accept');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'app-db');
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'DB connection failed: ' . $conn->connect_error]);
    exit;
}
$conn->set_charset('utf8mb4');

if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$orderId = $input['orderId'] ?? null;

if (!$orderId) {
    echo json_encode(['success' => false, 'message' => 'Missing order ID.']);
    exit;
}

$stmt = $conn->prepare(
    "UPDATE requests SET review_prompt_status = 'rejected' WHERE id = ?"
);
$stmt->bind_param('i', $orderId);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Review prompt canceled successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to cancel review prompt.']);
}

$stmt->close();
$conn->close();
?>