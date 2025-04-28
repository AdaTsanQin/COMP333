<?php

declare(strict_types=1);

session_start();

/* ─────────────── CORS & 通用头 ─────────────── */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

/* ─────────────── 权限校验 ─────────────── */
if (empty($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Not logged in']);
  exit;
}
$dasher = $_SESSION['username'];

/* ─────────────── 表单字段 ─────────────── */
$idRaw   = $_POST['request_id']   ?? '';
$priceRaw= $_POST['actual_price'] ?? '';
$fileArr = $_FILES['receipt']     ?? null;

$id    = (int)$idRaw;
$price = (float)$priceRaw;

if ($id <= 0 || $price <= 0 || !$fileArr) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'Missing or invalid fields']);
  exit;
}

/* ─────────────── 图片上传 ─────────────── */
$allowExt  = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'];
$ext       = strtolower(pathinfo($fileArr['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $allowExt, true)) {
  http_response_code(415);
  echo json_encode(['success' => false, 'error' => 'Unsupported file type']);
  exit;
}

$uploadDir = __DIR__ . '/receipts/';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true) && !is_dir($uploadDir)) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Cannot create upload dir']);
  exit;
}

$fname   = sprintf('%d_%d.%s', $id, time(), $ext);
$destAbs = $uploadDir . $fname;

if (!move_uploaded_file($fileArr['tmp_name'], $destAbs)) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Upload failed']);
  exit;
}

/* 生成相对 URL（便于前端直接拼接域名访问）*/
$relativeUrl = 'WesDashAPI/receipts/' . $fname;

/* ─────────────── 数据库更新 ─────────────── */
try {
  $pdo = new PDO(
    'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
    'root',
    '',
    [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ],
  );

  $stmt = $pdo->prepare(
    'UPDATE requests
        SET est_price = ?,          /* 实际商品价格 ($)            */
            status    = "completed",
            receipt_url = ?
      WHERE id = ? AND accepted_by = ?'
  );
  $stmt->execute([$price, $relativeUrl, $id, $dasher]);

  if ($stmt->rowCount() === 0) {
    /* 订单状态不符或不是该 Dasher 的订单 */
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden or already updated']);
    exit;
  }

  echo json_encode(['success' => true, 'url' => $relativeUrl]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'DB error']);
}
