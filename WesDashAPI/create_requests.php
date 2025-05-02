<?php
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie, Accept');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── Session Setup ───────────────────────────────
if (isset($_GET['PHPSESSID'])) {
    session_id($_GET['PHPSESSID']);
} elseif (isset($_COOKIE['PHPSESSID'])) {
    session_id($_COOKIE['PHPSESSID']);

}session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => false,
    'httponly' => false,
    'samesite' => 'Lax',
]);
session_start();

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
        'root', '',
        [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC ]
    );
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

if (empty($_SESSION['username'])) {
    echo json_encode(['success' => false, 'error' => 'Please log in before creating a request.']);
    exit;
}
$username = $_SESSION['username'];

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

$dropOff = trim($input['drop_off_location'] ?? '');
if ($dropOff === '') {
    echo json_encode(['success' => false, 'error' => 'drop_off_location required']);
    exit;
}
$deliverySpeed = $input['delivery_speed'] ?? 'common';
$now           = date('Y-m-d H:i:s');
$status        = 'pending';
$isCustom      = empty($input['is_custom']) ? 0 : 1;

if (!empty($input['items'])) {
    $lines = [];
    $qtySum = 0;
    foreach ($input['items'] as $row) {
        $name = trim($row['item'] ?? '');
        if ($name === '') continue;
        $qty = max(1, (int)($row['quantity'] ?? 1));
        $lines[] = "{$qty}× {$name}";
        $qtySum += $qty;
    }
    if (!$lines) {
        echo json_encode(['success' => false, 'error' => 'No valid items']);
        exit;
    }
    $itemField = implode('; ', $lines);
    $qtyField  = $qtySum;
} elseif (!empty($input['item'])) {
    $itemField = trim($input['item']);
    $qtyField  = max(1, (int)($input['quantity'] ?? 1));
} else {
    echo json_encode(['success' => false, 'error' => 'item or items[] required']);
    exit;
}

$estPrice     = isset($input['est_price']) ? floatval($input['est_price']) : 0.00;
$purchaseMode = trim($input['purchase_mode'] ?? 'DASHER_CHOOSING');

$sql = "INSERT INTO requests
        (username, item, quantity, drop_off_location,
         delivery_speed, status, created_at,
         is_custom, est_price, purchase_mode)
        VALUES
        (:u, :it, :q, :loc,
         :spd, :st, :dt,
         :custom, :est, :pm)";
try {
    $st = $pdo->prepare($sql);
    $st->execute([
        ':u'      => $username,
        ':it'     => $itemField,
        ':q'      => $qtyField,
        ':loc'    => $dropOff,
        ':spd'    => $deliverySpeed,
        ':st'     => $status,
        ':dt'     => $now,
        ':custom' => $isCustom,
        ':est'    => $estPrice,
        ':pm'     => $purchaseMode
    ]);

    $reqId = $pdo->lastInsertId();

    echo json_encode([
        'success'     => true,
        'request_id'  => $reqId,
        'est_price'   => number_format($estPrice, 2),
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error'   => 'Insert failed',
        'details' => $e->getMessage()
    ]);
}
?>
