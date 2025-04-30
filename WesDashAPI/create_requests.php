<?php

if (isset($_GET['PHPSESSID'])) session_id($_GET['PHPSESSID']);
session_start();

/* ───── headers ───── */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

/* ───── connect DB ───── */
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    echo json_encode(['error' => 'DB connect error']);
    exit;
}

/* ───── auth ───── */
if (empty($_SESSION['username'])) {
    echo json_encode(['error' => 'Please log in before creating a request.']);
    exit;
}
$username = $_SESSION['username'];

/* ───── parse JSON ───── */
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

/* ───── validations ───── */
$dropOff = trim($input['drop_off_location'] ?? '');
if ($dropOff === '') {
    echo json_encode(['error' => 'drop_off_location required']);
    exit;
}
$deliverySpeed = $input['delivery_speed'] ?? 'common';
$now           = date('Y-m-d H:i:s');
$status        = 'pending';
$isCustom      = empty($input['is_custom']) ? 0 : 1;

/* items / item */
if (!empty($input['items'])) {
    $lines = [];
    $qtySum = 0;
    foreach ($input['items'] as $row) {
        $name = trim($row['item'] ?? '');
        if ($name === '') continue;
        $qty  = max(1, (int)($row['quantity'] ?? 1));
        $lines[]  = "{$qty}× {$name}";
        $qtySum  += $qty;
    }
    if (!$lines) {
        echo json_encode(['error' => 'No valid items']);
        exit;
    }
    $itemField = implode('; ', $lines);
    $qtyField  = $qtySum;
} elseif (!empty($input['item'])) {
    $itemField = trim($input['item']);
    $qtyField  = max(1, (int)($input['quantity'] ?? 1));
} else {
    echo json_encode(['error' => 'items[] or item required']);
    exit;
}

/* price fields (optional) */
$estPrice = isset($input['est_price']) ? floatval($input['est_price']) : 0.00;

/* store / purchase mode  */
$purchaseMode = trim($input['purchase_mode'] ?? 'DASHER_CHOOSING');

/* ───── insert ───── */
$sql = "INSERT INTO requests
        (username, item, quantity, drop_off_location,
         delivery_speed, status, created_at,
         is_custom, est_price, purchase_mode)
        VALUES
        (:u, :it, :q, :loc,
         :spd, :st, :dt,
         :custom, :est, :pm)";
$st = $pdo->prepare($sql);

try {
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
    
    // Add review_prompt_status if missing from the table
    try {
        $checkColumn = $pdo->query("SHOW COLUMNS FROM requests LIKE 'review_prompt_status'");
        if ($checkColumn->rowCount() === 0) {
            // Column doesn't exist, add it
            $pdo->exec("ALTER TABLE requests ADD COLUMN review_prompt_status ENUM('pending', 'rejected', 'reviewed') DEFAULT 'pending'");
        }
        
        // Update the newly inserted record to set review_prompt_status
        $requestId = $pdo->lastInsertId();
        $updateStmt = $pdo->prepare("UPDATE requests SET review_prompt_status = 'pending' WHERE id = ?");
        $updateStmt->execute([$requestId]);
    } catch (PDOException $columnError) {
        // Just log the error but continue - this is non-critical
        error_log("Could not update review_prompt_status: " . $columnError->getMessage());
    }
    
    echo json_encode([
        'success'     => true,
        'request_id'  => $pdo->lastInsertId(),
        'est_price'   => number_format($estPrice, 2),
    ]);
} catch (PDOException $e) {
    // For development purposes, include the actual error message
    echo json_encode([
        'error' => 'Insert failed: ' . $e->getMessage(),
        'sql_state' => $e->errorInfo[0] ?? '',
        'error_code' => $e->errorInfo[1] ?? '',
        'error_message' => $e->errorInfo[2] ?? ''
    ]);
}
?>