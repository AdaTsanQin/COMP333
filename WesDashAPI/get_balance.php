<?php
// get_balance.php  - 返回当前登录用户余额（分）
header('Content-Type: application/json; charset=utf-8');

// Set session ID BEFORE session_start
if (isset($_GET['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_GET['PHPSESSID'])) {
  session_id($_GET['PHPSESSID']);
} elseif (isset($_COOKIE['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_COOKIE['PHPSESSID'])) {
  session_id($_COOKIE['PHPSESSID']);
}

// Configure session cookie behavior
session_set_cookie_params([
  'lifetime' => 0,
  'path'     => '/',
  'secure'   => false,
  'httponly' => false,
  'samesite' => 'Lax',
]);

session_start();

/* 登录校验 */
if (empty($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['success'=>false,'error'=>'Not logged in']);
  exit;
}
$user = $_SESSION['username'];

// Connect DB
try {
  $pdo = new PDO(
    'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
    'root','',
    [ PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC ]
  );

  $bal = $pdo->prepare('SELECT balance FROM users WHERE username = ?');
  $bal->execute([$user]);
  $cents = (int)$bal->fetchColumn();

  echo json_encode([
    'success' => true,
    'balance' => $cents
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'DB error']);
}
