<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie, Accept');
header('Access-Control-Allow-Credentials: true');

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') { http_response_code(200); exit; }

$conn = new mysqli('localhost', 'root', '', 'app-db');
if ($conn->connect_error) {
  echo json_encode(['success'=>false,'message'=>'DB connection failed: '.$conn->connect_error]); exit;
}
$conn->set_charset('utf8mb4');

if (!isset($_SESSION['username'])) {
  echo json_encode(['success'=>false,'message'=>'User not logged in.']); exit;
}
$loggedInUser = $_SESSION['username'];

/* ═══════════════ GET: ═══════════════ */
if ($method === 'GET') {
  $sql = "
    SELECT *
      FROM requests
     WHERE (status='pending'  AND username   != ?)
        OR (status='accepted' AND accepted_by = ?)";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param('ss', $loggedInUser, $loggedInUser);
  $stmt->execute();
  echo json_encode(['success'=>true,'orders'=>$stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
  exit;
}

/* ═══════════════ PUT: Drop-off ═══════════════ */
if ($method === 'PUT') {
  $in = json_decode(file_get_contents('php://input'), true);
  if (empty($in['id'])) { echo json_encode(['success'=>false,'message'=>'Missing id']); exit; }
  $id = (int)$in['id'];

  /* —— 1. Drop-off —— */
  if (($in['action'] ?? '') === 'drop_off') {
    $stmt = $conn->prepare(
      "UPDATE requests SET status='completed'
        WHERE id=? AND status='accepted' AND accepted_by=?");
    $stmt->bind_param('is', $id, $loggedInUser);
    $stmt->execute();

    $close = $conn->prepare("UPDATE chat_rooms SET closed_at=NOW() WHERE order_id=?");
    $close->bind_param('i', $id);
    $close->execute();

    echo json_encode([
      'success'=>$stmt->affected_rows>0,
      'message'=>$stmt->affected_rows>0
                ? 'Order dropped off successfully'
                : 'No matching accepted order found']);
    exit;
  }

  $conn->begin_transaction();

  /* 2-a 锁定订单 */
  $sel = $conn->prepare(
    "SELECT username,item,quantity
       FROM requests
      WHERE id=? AND status='pending' AND username!=?
      FOR UPDATE");
  $sel->bind_param('is', $id, $loggedInUser);
  $sel->execute();
  $order = $sel->get_result()->fetch_assoc();
  if (!$order) {
    $conn->rollback();
    echo json_encode(['success'=>false,'message'=>'Order not available']); exit;
  }

  /* 2-b 扣库存 */
  $updShop = $conn->prepare(
    "UPDATE Wesshop SET number = number-? WHERE name=? AND number>=?");
  $updShop->bind_param('iss', $order['quantity'], $order['item'], $order['quantity']);
  $updShop->execute();
  if ($updShop->affected_rows===0) {
    $conn->rollback();
    echo json_encode(['success'=>false,'message'=>'Insufficient stock']); exit;
  }

  /* 2-c 更新订单状态 */
  $updReq = $conn->prepare(
    "UPDATE requests SET status='accepted', accepted_by=? WHERE id=?");
  $updReq->bind_param('si', $loggedInUser, $id);
  $updReq->execute();

  /* 2-d 创建聊天室 */
  $chat = $conn->prepare(
    "INSERT INTO chat_rooms (order_id,user_name,dasher_name) VALUES (?,?,?)");
  $chat->bind_param('iss', $id, $order['username'], $loggedInUser);
  $chat->execute();
  $roomId = $chat->insert_id;

  $conn->commit();
  echo json_encode([
    'success'=>true,
    'message'=>'Order accepted successfully.',
    'room_id'=>$roomId   // ★ 前端跳转 Chat 用这个
  ]);
  exit;
}

/* ---------- 其余方法 ---------- */
echo json_encode(['success'=>false,'message'=>"Invalid request method: $method"]);
$conn->close();
