<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

/* ---------- 数据库连接 ---------- */
require_once __DIR__.'/db_conn.php';

/* ---------- 请求方法 ---------- */
$method = $_SERVER['REQUEST_METHOD'];

/* ═══════════════ POST: 发送消息 ═══════════════ */
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (
        !is_array($input) ||
        empty($input['room_id']) ||
        empty($input['sender']) ||
        empty($input['message'])
    ) {
        echo json_encode(['success'=>false,'error'=>'Missing fields']); exit;
    }

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO chat_messages (room_id, sender, message)
             VALUES (:room, :sender, :msg)'
        );
        $stmt->execute([
            ':room'   => (int)$input['room_id'],
            ':sender' => $input['sender'],
            ':msg'    => $input['message'],
        ]);

        echo json_encode([
            'success' => true,
            'id'      => $pdo->lastInsertId()   // 前端调试用，拿到自增 ID
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

/* ---------- 其它方法 ---------- */
echo json_encode(['success'=>false,'error'=>'Unsupported method']);
