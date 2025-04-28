<?php
// WesDashAPI/add_balance.php
header('Content-Type: application/json; charset=utf-8');
session_start();

/* 0) 登录校验 */
if (empty($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['success'=>false,'error'=>'Not logged in']); exit;
}
$user = $_SESSION['username'];

/* 1) 读取 amount */
$in     = json_decode(file_get_contents('php://input'), true);
$amount = (int)($in['amount'] ?? 0);      // 以“分”为单位
if ($amount <= 0) {
  http_response_code(400);
  echo json_encode(['success'=>false,'error'=>'Invalid amount']); exit;
}

/* 2) 写数据库 */
try {
  $pdo = new PDO('mysql:host=localhost;dbname=app-db;charset=utf8mb4',
                 'root','',[
                   PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION
                 ]);

  $stmt = $pdo->prepare("UPDATE users SET balance = balance + ? WHERE username = ?");
  $stmt->execute([$amount, $user]);

  $newBal = $pdo->query("SELECT balance FROM users WHERE username='$user'")
                ->fetchColumn();

  echo json_encode(['success'=>true,'newBalance'=>$newBal]);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'DB error']);
}
