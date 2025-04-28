<?php
// get_balance.php  - 返回当前登录用户余额（分）
header('Content-Type: application/json; charset=utf-8');
session_start();

/* 登录校验 */
if (empty($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['success'=>false,'error'=>'Not logged in']); exit;
}
$user = $_SESSION['username'];

try {
  $pdo = new PDO(
    'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
    'root','',
    [ PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC ]
  );

  $bal = $pdo->prepare('SELECT balance FROM users WHERE username = ?');
  $bal->execute([$user]);
  $cents = (int)$bal->fetchColumn();     // balance 以分为单位存储

  echo json_encode([
    'success' => true,
    'balance' => $cents                // 返回分，前端会自行转成美元
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'DB error']);
}
