<?php
// create_tip.php ─ 扣款 + 写 tip + 付给 dasher + 确认订单 + 关聊天室
header('Content-Type: application/json; charset=utf-8');
if (isset($_GET['PHPSESSID'])) session_id($_GET['PHPSESSID']);
session_start();

/* ─────────── 登录校验 ─────────── */
if (empty($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['success'=>false,'error'=>'Not logged in']); exit;
}
$user = $_SESSION['username'];

/* ─────────── 读参数 ─────────── */
$in       = json_decode(file_get_contents('php://input'), true);
$reqId    = (int)($in['request_id'] ?? 0);
$percent  = (int)($in['percent']    ?? 0);

if ($reqId <= 0 || $percent < 0) {
  http_response_code(400);
  echo json_encode(['success'=>false,'error'=>'request_id / percent missing']); exit;
}

try {
  $pdo = new PDO(
    'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
    'root','',
    [ PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC ]
  );

  $pdo->beginTransaction();

  /* 1. 锁定订单并取信息 */
  $q  = $pdo->prepare(
        'SELECT est_price, delivery_speed, accepted_by
           FROM requests
          WHERE id = ? FOR UPDATE');
  $q->execute([$reqId]);
  $row = $q->fetch();
  if (!$row) {
    $pdo->rollBack();
    http_response_code(404);
    echo json_encode(['success'=>false,'error'=>'Order not found']); exit;
  }
  $estPrice = (float)$row['est_price'];
  $speed    = $row['delivery_speed'];
  $dasher   = $row['accepted_by'];      // 可能为 NULL（尚无人接单）

  /* 2. 费用计算 */
  $deliveryFee = $speed === 'urgent' ? $estPrice * 0.20 : $estPrice * 0.05;
  $tipDollars  = $estPrice * $percent / 100;
  $totalCents  = (int) round(($estPrice + $deliveryFee + $tipDollars) * 100);

  /* 3. 用户余额检查 */
  $bal = $pdo->prepare('SELECT balance FROM users WHERE username = ? FOR UPDATE');
  $bal->execute([$user]);
  $balance = (int)$bal->fetchColumn();
  if ($balance < $totalCents) {
    $pdo->rollBack();
    echo json_encode(['success'=>false,'error'=>'Insufficient balance']); exit;
  }

  /* 4. 扣款 */
  $pdo->prepare('UPDATE users SET balance = balance - ? WHERE username = ?')
      ->execute([$totalCents, $user]);

  /* 5. 小费记录（单位：分） */
  $pdo->prepare('INSERT INTO tips(request_id, amount) VALUES(?, ?)')
      ->execute([$reqId, (int) round($tipDollars * 100)]);

  /* 6. 把钱打给 dasher（若已接单） */
  if ($dasher) {
    $pdo->prepare('UPDATE users SET balance = balance + ? WHERE username = ?')
        ->execute([$totalCents, $dasher]);
  }

  /* 7. 订单状态 → confirmed */
  $pdo->prepare('UPDATE requests SET status = "confirmed" WHERE id = ?')
      ->execute([$reqId]);

  /* 8. 删除聊天室（messages 由 ON DELETE CASCADE 级联删除） */
  $pdo->prepare('DELETE FROM chat_rooms WHERE order_id = ?')
      ->execute([$reqId]);

  $pdo->commit();

  echo json_encode([
    'success'    => true,
    'newBalance' => $balance - $totalCents
  ]);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'Server error']);
}
