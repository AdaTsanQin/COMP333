<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

/* ──────── CORS / JSON header ──────── */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie, Accept');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

/* ──────── 登录校验 ──────── */
if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}
$me = $_SESSION['username'];

/* ──────── 数据库连接 ──────── */
$conn = new mysqli('localhost', 'root', '', 'app-db');
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'DB connection failed: '.$conn->connect_error]);
    exit;
}
$conn->set_charset('utf8mb4');

/* ─────────────────────────── GET ─────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "
        SELECT  r.*,
                cr.id AS room_id
          FROM  requests r
          LEFT JOIN chat_rooms cr ON cr.order_id = r.id
         WHERE  r.username = ?
           AND  r.status <> 'confirmed'       -- ★ 隐藏已确认的单
         ORDER BY r.id DESC";
    $st = $conn->prepare($sql);
    $st->bind_param('s', $me);
    $st->execute();
    $rows = $st->get_result()->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'requests' => $rows]);
    exit;
}

/* ───────────────────────── DELETE ───────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $in = json_decode(file_get_contents('php://input'), true);
    if (empty($in['delete_id'])) {
        echo json_encode(['success'=>false,'message'=>'Missing delete_id']); exit;
    }
    $id = (int)$in['delete_id'];
    $st = $conn->prepare("DELETE FROM requests WHERE id=? AND username=?");
    $st->bind_param('is', $id, $me);
    $ok = $st->execute();
    echo json_encode(['success'=>$ok,'message'=>$ok?'Request deleted':'Delete failed']);
    exit;
}

/* ─────────────────────────── PUT ─────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_decode(file_get_contents('php://input'), true);

    /* ----- 1) 确认完成：completed → confirmed，顺带删聊天室 ----- */
    if (!empty($in['request_id'])) {
        $reqId = (int)$in['request_id'];

        // 检查状态
        $chk = $conn->prepare("SELECT status FROM requests WHERE id=? AND username=?");
        $chk->bind_param('is', $reqId, $me);
        $chk->execute();
        $row = $chk->get_result()->fetch_assoc();
        if (!$row) {
            echo json_encode(['success'=>false,'message'=>'Request not found.']); exit;
        }
        if ($row['status'] !== 'completed') {
            echo json_encode(['success'=>false,'message'=>'Only completed requests can be confirmed.']); exit;
        }

        // 更新为 confirmed
        $upd = $conn->prepare("UPDATE requests SET status='confirmed' WHERE id=?");
        $upd->bind_param('i', $reqId);
        $ok = $upd->execute();

        /* ★ 删除聊天室；chat_messages 由 ON DELETE CASCADE 自动清空 */
        if ($ok) {
            $del = $conn->prepare("DELETE FROM chat_rooms WHERE order_id=?");
            $del->bind_param('i', $reqId);
            $del->execute();
        }

        echo json_encode([
            'success'=>$ok,
            'message'=>$ok ? 'Request confirmed & chat removed.' : 'Confirm failed.'
        ]);
        exit;
    }

    /* ----- 2) 编辑请求 ----- */
    if (empty($in['id']) || empty($in['item']) ||
        empty($in['drop_off_location']) || empty($in['delivery_speed']) ||
        empty($in['status'])) {
        echo json_encode(['success'=>false,'message'=>'Missing fields.']); exit;
    }

    $st = $conn->prepare(
        "UPDATE requests
            SET item=?, drop_off_location=?, delivery_speed=?, status=?
          WHERE id=? AND username=?"
    );
    $st->bind_param(
        'ssssis',
        $in['item'],
        $in['drop_off_location'],
        $in['delivery_speed'],
        $in['status'],
        $in['id'],
        $me
    );
    $ok = $st->execute();
    echo json_encode(['success'=>$ok,'message'=>$ok?'Request updated.':'Update failed.']);
    exit;
}

/* ───────── 其它方法 ───────── */
echo json_encode(['success'=>false,'message'=>'Unsupported method.']);
$conn->close();
