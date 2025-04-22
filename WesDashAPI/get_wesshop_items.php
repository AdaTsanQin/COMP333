<?php
header('Content-Type: application/json');
session_start();

// 1) DB credentials
$servername   = "localhost";
$db_username  = "root";
$db_password  = "";
$dbname       = "app-db";

// 2) connect
$conn = new mysqli($servername, $db_username, $db_password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
      'success' => false,
      'message' => "DB connect error: " . $conn->connect_error
    ]);
    exit;
}
$conn->set_charset('utf8mb4');

// 3) optional: ensure user is logged in
if (empty($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode([
      'success' => false,
      'message' => "Not logged in"
    ]);
    exit;
}

// 4) fetch all in‑stock items
$sql    = "SELECT id, name, number, price FROM Wesshop WHERE number > 0";
$result = $conn->query($sql);

if (! $result) {
    http_response_code(500);
    echo json_encode([
      'success' => false,
      'message' => "Query error: " . $conn->error
    ]);
    exit;
}

// 5) build array
$items = [];
while ($row = $result->fetch_assoc()) {
    $items[] = $row;
}

// 6) return
echo json_encode([
  'success' => true,
  'items'   => $items
]);

$conn->close();
