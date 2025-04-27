<?php
// WesDashAPI/create-payment-intent.php

require 'vendor/autoload.php';               // composer install stripe/stripe-php
\Stripe\Stripe::setApiKey('sk_test_…');      // your secret key

header('Content-Type: application/json; charset=utf-8');
session_start();

// 0) Auth check
if (empty($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['error'=>'Not logged in']);
  exit;
}
$user = $_SESSION['username'];

// 1) Read + validate amount (in cents)
$in     = json_decode(file_get_contents('php://input'), true);
$amount = (int)($in['amount'] ?? 0);
if ($amount < 100) {
  http_response_code(400);
  echo json_encode(['error'=>'Minimum amount is $1']);
  exit;
}

try {
  // 2) Connect to your DB
  $pdo = new PDO(
    'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
    'root','',
    [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
  );

  // 3) Insert a pending recharge record
  $stmt = $pdo->prepare("
    INSERT INTO recharges
      (username, amount, status, created_at)
    VALUES
      (?, ?, 'pending', NOW())
  ");
  $stmt->execute([$user, $amount]);
  $rechargeId = $pdo->lastInsertId();

  // 4) Create a Stripe PaymentIntent
  $pi = \Stripe\PaymentIntent::create([
    'amount'   => $amount,
    'currency' => 'usd',
    'metadata' => [
      'username'    => $user,
      'recharge_id' => $rechargeId
    ],
    'automatic_payment_methods' => ['enabled'=>true],
  ]);

  // 5) Save the Stripe Intent ID back to our table
  $stmt = $pdo->prepare("
    UPDATE recharges
      SET stripe_pi = ?
    WHERE id = ?
  ");
  $stmt->execute([$pi->id, $rechargeId]);

  // 6) Return clientSecret
  echo json_encode(['clientSecret'=>$pi->client_secret]);

} catch (\Exception $e) {
  http_response_code(500);
  echo json_encode(['error'=>$e->getMessage()]);
}
