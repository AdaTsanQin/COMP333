<?php
if (isset($_GET['PHPSESSID'])) {            // 前端把 PHPSESSID 放在 URL 里
    session_id($_GET['PHPSESSID']);         // 手动设置会话 ID
}
session_start();                            // 启动会话

header('Content-Type: application/json');   // 返回 JSON
header('Access-Control-Allow-Origin: *');   // 方便本机调试
header('Access-Control-Allow-Credentials: true');

// ---------- 1. 登录校验 ----------
if (empty($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}
$me = $_SESSION['username'];

// ---------- 2. 数据库 ----------
require_once __DIR__ . '/db_conn.php';    

// ---------- 3. chat room ----------
$sql = "
SELECT cr.id              AS room_id,
       r.item             AS order_item,
       r.status           AS order_status,
       COALESCE(MAX(cm.sent_at),'——') AS last_time
  FROM chat_rooms cr
  LEFT JOIN requests       r  ON r.id = cr.order_id
  LEFT JOIN chat_messages  cm ON cm.room_id = cr.id
 WHERE cr.user_name = :u OR cr.dasher_name = :u
GROUP BY cr.id
ORDER BY last_time DESC
";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':u' => $me]);
    $rows = $stmt->fetchAll();
    echo json_encode(['success' => true, 'rooms' => $rows]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
exit;            
