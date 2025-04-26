<?php
// File: /WesDashAPI/create_tip.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
while (ob_get_level()) ob_end_clean();
header('Content-Type: application/json; charset=utf-8');

// 1) Load Composer
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'Stripe SDK not found.']);
    exit;
}
require $autoload;

// 2) Load secrets.php
$secrets = __DIR__ . '/secrets.php';
if (!file_exists($secrets)) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'Missing secrets.php']);
    exit;
}
require $secrets;

\Stripe\Stripe::setApiKey($stripeSecretKey);

// 3) Parse input
$in = json_decode(file_get_contents('php://input'), true);
$requestId = (int)($in['request_id'] ?? 0);
$percent   = (int)($in['percent']    ?? 0);
if ($requestId < 1 || $percent < 1) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>'Invalid request_id or percent']);
    exit;
}

// 4) Lookup price
$conn = new mysqli('localhost', 'root', '', 'app-db');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'DB connection failed']);
    exit;
}
$stmt = $conn->prepare("SELECT est_price, accepted_by FROM requests WHERE id=?");
$stmt->bind_param('i', $requestId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row) {
    http_response_code(404);
    echo json_encode(['success'=>false,'error'=>'Order not found']);
    exit;
}

$estPrice = floatval($row['est_price']);
$dasher = $row['accepted_by'] ?? null;

if (empty($dasher)) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>'Order has not been accepted yet.']);
    exit;
}

// 5) Build domain
$scheme = $_SERVER['REQUEST_SCHEME'] ?? 'http';
$host   = $_SERVER['HTTP_HOST'];
$base   = "{$scheme}://{$host}/WesDashAPI";

$tipCents = intval(round($estPrice * ($percent / 100) * 100));

// 6) Create Stripe Checkout Session
$session = \Stripe\Checkout\Session::create([
    'payment_method_types' => ['card'],
    'line_items' => [[
        'price_data' => [
            'currency'    => 'usd',
            'unit_amount' => $tipCents,
            'product_data'=> [
                'name' => "{$percent}% Tip for Order #{$requestId}",
            ],
        ],
        'quantity' => 1,
    ]],
    'mode'        => 'payment',
    'success_url' => "{$base}/tip_success.php?session_id={CHECKOUT_SESSION_ID}&request_id={$requestId}",
    'cancel_url'  => "{$base}/tip_cancel.php?request_id={$requestId}",
    'metadata'    => [
        'request_id' => $requestId,
        'dasher'     => $dasher,
    ],
]);

echo json_encode(['success'=>true,'sessionUrl'=>$session->url]);
exit;
?>
