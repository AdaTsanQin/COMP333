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

// --- build itemField & qtyField as before ---
if (!empty($input['items'])) {
    $lines = [];
    $totalQty = 0;
    foreach ($input['items'] as $row) {
        $name = trim($row['item'] ?? '');
        if ($name === '') continue;
        $qty = max(1, (int)($row['quantity'] ?? 1));
        $lines[]  = "{$qty}× {$name}";
        $totalQty += $qty;
    }
    if (!$lines) {
        echo json_encode(['error' => 'No valid items']); 
        exit;
    }
    $itemField = implode('; ', $lines);
    $qtyField  = $totalQty;
} elseif (!empty($input['item'])) {
    $itemField = trim($input['item']);
    $qtyField  = max(1, (int)($input['quantity'] ?? 1));
} else {
    echo json_encode(['error' => 'items[] or item required']); 
    exit;
}

// --- handle price fields ---
// client may send est_price (per‐unit or total? here we treat it as per‐unit)
$estPrice = isset($input['est_price'])
    ? floatval($input['est_price'])
    : null;

// client may send total_price explicitly
$totalPrice = isset($input['total_price'])
    ? floatval($input['total_price'])
    // fallback: if we have est_price, multiply by quantity
    : ($estPrice !== null ? round($estPrice * $qtyField, 2) : 0.00);

$sql = "INSERT INTO requests
        (username, item, quantity, drop_off_location,
         delivery_speed, status, created_at, est_price, total_price)
        VALUES
        (:u, :it, :q, :loc, :spd, :st, :dt, :est, :tot)";
$st = $pdo->prepare($sql);

try {
    $st->execute([
        ':u'   => $username,
        ':it'  => $itemField,
        ':q'   => $qtyField,
        ':loc' => $dropOff,
        ':spd' => $deliverySpeed,
        ':st'  => $status,
        ':dt'  => $now,
        ':est' => $estPrice,     // will be NULL if not provided
        ':tot' => $totalPrice
    ]);
    echo json_encode([
        'success'    => true,
        'request_id' => $pdo->lastInsertId(),
        'total_price'=> number_format($totalPrice, 2)
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Insert failed: '.$e->getMessage()]);
}