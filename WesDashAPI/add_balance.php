<?php
// WesDashAPI/add_balance.php

// ─── Headers ────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie, Accept');

// ─── Preflight ───────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// ─── STRICT session ID validation ────────────────────────────
if (isset($_GET['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_GET['PHPSESSID'])) {
  session_id($_GET['PHPSESSID']);
} elseif (isset($_COOKIE['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_COOKIE['PHPSESSID'])) {
  session_id($_COOKIE['PHPSESSID']);
}

// ─── Session Cookie Config + Start ───────────────────────────
session_set_cookie_params([
  'lifetime' => 0,
  'path'     => '/',
  'secure'   => false,   // true if using HTTPS
  'httponly' => false,
  'samesite' => 'Lax',
]);
session_start();

// ─── Auth Check ──────────────────────────────────────────────
if (empty($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Not logged in']);
  exit;
}
$user = $_SESSION['username'];

// ─── Read + Validate amount ──────────────────────────────────
$in = json_decode(file_get_contents('php://input'), true);
$amount = (int)($in['amount'] ?? 0);
if ($amount <= 0) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'Invalid amount']);
  exit;
}

// ─── Update DB ───────────────────────────────────────────────
try {
  $pdo = new PDO('mysql:host=localhost;dbname=app-db;charset=utf8mb4', 'root', '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);

  $stmt = $pdo->prepare("UPDATE users SET balance = balance + ? WHERE username = ?");
  $stmt->execute([$amount, $user]);

  $stmt = $pdo->prepare("SELECT balance FROM users WHERE username = ?");
  $stmt->execute([$user]);
  $newBal = $stmt->fetchColumn();

  echo json_encode(['success' => true, 'newBalance' => (int)$newBal]);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'DB error']);
}
