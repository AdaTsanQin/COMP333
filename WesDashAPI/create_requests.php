<?php
if (isset($_GET['PHPSESSID'])) session_id($_GET['PHPSESSID']);
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    echo json_encode(['error' => 'DB connect error']); 
    exit;
}

if (empty($_SESSION['username'])) {
    echo json_encode(['error' => 'Please log in before creating a request.']); 
    exit;
}
$username = $_SESSION['username'];

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['error' => 'Invalid JSON']); 
    exit;
}

$dropOff = trim($input['drop_off_location'] ?? '');
if ($dropOff === '') {
    echo json_encode(['error' => 'drop_off_location required']); 
    exit;
}

$deliverySpeed = $input['delivery_speed'] ?? 'common';
$now           = date('Y-m-d H:i:s');
$status        = 'pending';

if (!empty($input['items'])) {
    $lines = [];
    $total = 0;
    foreach ($input['items'] as $row) {
        $name = trim($row['item'] ?? '');
        if ($name === '') continue;
        $qty  = max(1, (int)($row['quantity'] ?? 1));
        $lines[] = "{$qty}× {$name}";
        $total  += $qty;
    }
    if (!$lines) {
        echo json_encode(['error' => 'No valid items']); 
        exit;
    }
    $itemField = implode('; ', $lines);
    $qtyField  = $total;
} elseif (!empty($input['item'])) {
    $itemField = trim($input['item']);
    $qtyField  = max(1, (int)($input['quantity'] ?? 1));
} else {
    echo json_encode(['error' => 'items[] or item required']); 
    exit;
}

$sql = "INSERT INTO requests
        (username, item, quantity, drop_off_location,
         delivery_speed, status, created_at)
        VALUES (:u, :it, :q, :loc, :spd, :st, :dt)";
$st  = $pdo->prepare($sql);

try {
    $st->execute([
        ':u'   => $username,
        ':it'  => $itemField,
        ':q'   => $qtyField,
        ':loc' => $dropOff,
        ':spd' => $deliverySpeed,
        ':st'  => $status,
        ':dt'  => $now
    ]);
    echo json_encode([
        'success'    => true,
        'request_id' => $pdo->lastInsertId()
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Insert failed']);
}
?>
