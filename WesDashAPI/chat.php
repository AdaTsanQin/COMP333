<?php
// ─── Strict Session Handling ───
if (isset($_GET['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_GET['PHPSESSID'])) {
    session_id($_GET['PHPSESSID']);
} elseif (isset($_COOKIE['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_COOKIE['PHPSESSID'])) {
    session_id($_COOKIE['PHPSESSID']);
}
session_start();

// ─── Debug (optional) ───
// error_log("Session: " . json_encode($_SESSION));

error_reporting(E_ALL);
ini_set('display_errors', 1);

// ─── Headers ───
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ─── DB Connection ───
require_once __DIR__ . '/db_conn.php';

// ─── Detect Method ───
$method = $_SERVER['REQUEST_METHOD'];

/* ═══════════════ POST: 发送消息 ═══════════════ */
if ($method === 'POST') {
    if (empty($_SESSION['username'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (
        !is_array($input) ||
        empty($input['room_id']) ||
        empty($input['message'])
    ) {
        echo json_encode(['success'=>false,'error'=>'Missing fields']); exit;
    }

    $roomId = (int)$input['room_id'];
    $msg    = $input['message'];
    $sender = $_SESSION['username']; // Enforce real session identity

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO chat_messages (room_id, sender, message)
             VALUES (:room, :sender, :msg)'
        );
        $stmt->execute([
            ':room'   => $roomId,
            ':sender' => $sender,
            ':msg'    => $msg,
        ]);

        echo json_encode([
            'success' => true,
            'id'      => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
    }
    exit;
}

/* ═══════════════ GET: 拉取历史/增量 ═══════════════ */
if ($method === 'GET') {
    $room  = isset($_GET['room_id']) ? (int)$_GET['room_id'] : 0;
    $after = $_GET['after'] ?? '1970-01-01 00:00:00';

    try {
        $stmt = $pdo->prepare(
            'SELECT sender, message, sent_at
               FROM chat_messages
              WHERE room_id = :room
                AND sent_at > :after
           ORDER BY id ASC'
        );
        $stmt->execute([':room'=>$room, ':after'=>$after]);
        $rows = $stmt->fetchAll();

        echo json_encode(['success'=>true, 'msgs'=>$rows]);
    } catch (PDOException $e) {
        echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
    }
    exit;
}

// ─── Unsupported Method ───
echo json_encode(['success'=>false,'error'=>'Unsupported method']);
?>
