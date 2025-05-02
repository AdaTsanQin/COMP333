<?php
// ─── Session Handling ───
if (isset($_GET['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_GET['PHPSESSID'])) {
    session_id($_GET['PHPSESSID']);
} elseif (isset($_COOKIE['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_COOKIE['PHPSESSID'])) {
    session_id($_COOKIE['PHPSESSID']);
}
session_start();

// ─── Headers ───
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Optional: Debug log session contents
// error_log("SESSION: " . json_encode($_SESSION));

// ─── Auth Check ───
if (empty($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}
$me = $_SESSION['username'];

// ─── DB Connection ───
require_once __DIR__ . '/db_conn.php';

// ─── Query Chat Rooms ───
$sql = "
SELECT cr.id              AS room_id,
       r.item             AS order_item,
       r.status           AS order_status,
       COALESCE(MAX(cm.sent_at), '——') AS last_time
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
