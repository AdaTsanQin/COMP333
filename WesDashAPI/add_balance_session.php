<?php
// File: /WesDashAPI/create_balance_session.php

session_start();
header('Content-Type: application/json; charset=utf-8');
require __DIR__.'/vendor/autoload.php';
require __DIR__.'/secrets.php';

\Stripe\Stripe::setApiKey($stripeSecretKey);

// 1) Auth
if (empty($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['success'=>false,'error'=>'Not logged in']);
    exit;
}
$user = $_SESSION['username'];

// 2) Read & validate amount (in cents)
$in = json_decode(file_get_contents('php://input'), true);
$amount = intval($in['amount'] ?? 0);
if ($amount < 50) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>'Amount too small']);
    exit;
}

// 3) Create Stripe Checkout Session
$host   = $_SERVER['HTTP_HOST'];
$scheme = (!empty($_SERVER['HTTPS']) ? 'https' : 'http');
$base   = "{$scheme}://{$host}/WesDashAPI";

$session = \Stripe\Checkout\Session::create([
    'payment_method_types' => ['card'],
    'line_items' => [[
        'price_data' => [
            'currency'    => 'usd',
            'unit_amount' => $amount,
            'product_data'=> [
                'name' => "Coin top-up: \${$amount/100}",
            ],
        ],
        'quantity' => 1,
    ]],
    'mode'        => 'payment',
    'success_url' => "{$base}/handle_balance_success.php?session_id={CHECKOUT_SESSION_ID}",
    'cancel_url'  => "{$base}/handle_balance_cancel.php",
    'metadata'    => [ 'user' => $user, 'amount' => $amount ],
]);

echo json_encode([
    'success'    => true,
    'sessionUrl' => $session->url
]);
