<?php
// WesDashAPI/get_request.php
// 用 id 拉取一条订单；返回 { success:true, request:{…} }

header('Content-Type: application/json; charset=utf-8');
session_start();

/* —— (可选) 登录校验 —— */
if (empty($_SESSION['username'])) {
    echo json_encode(['success'=>false,'error'=>'Not logged in']); exit;
}

/* —— 读取 id —— */
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    echo json_encode(['success'=>false,'error'=>'Missing id']); exit;
}

/* —— 连接数据库 —— */
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
        'root', '',
        [ PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC ]
    );

    $st = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
    $st->execute([$id]);
    $row = $st->fetch();

    if (!$row) {
        echo json_encode(['success'=>false,'error'=>'Request not found']); exit;
    }

    echo json_encode(['success'=>true,'request'=>$row]);
} catch (Throwable $e) {
    // 真正开发时可以把 $e->getMessage() 打到日志，而不是返回给前端
    echo json_encode(['success'=>false,'error'=>'DB error']); 
}
