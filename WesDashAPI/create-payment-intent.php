<?php
// htdocs/WesDashAPI/create-payment-intent.php

// ─── DEBUG: show all errors to the client (remove in production) ────────────
ini_set('display_errors', 1);
error_reporting(E_ALL);

// ─── 1) Locate and require Composer’s autoloader ────────────────────────────
$baseDir = __DIR__;                         // e.g. /Applications/XAMPP/xamppfiles/htdocs/WesDashAPI
$autoload = $baseDir . '/vendor/autoload.php';

if (! file_exists($autoload)) {
    // try parent folder (in case you ran composer one level up)
    $autoload = $baseDir . '/../vendor/autoload.php';
}

if (! file_exists($autoload)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
      'error' => 'Could not locate vendor/autoload.php. Did you run composer install in your API folder?'
    ]);
    exit;
}

require $autoload;
\Stripe\Stripe::setApiKey('YOUR_SECRET_KEY'); 

header('Content-Type: application/json; charset=utf-8');
session_start();

// ─── 2) Verify login ─────────────────────────────────────────────────────────
if (empty($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Not logged in']);
  exit;
}
$user = $_SESSION['username'];

// ─── 3) Read + validate amount ────────────────────────────────────────────────
$in     = json_decode(file_get_contents('php://input'), true);
$amount = isset($in['amount']) ? (int)$in['amount'] : 0;
if ($amount < 100) {
  http_response_code(400);
  echo json_encode(['error' => 'Minimum amount is $1']);
  exit;
}

try {
  // ─── 4) Connect to your DB ───────────────────────────────────────────────────
  $pdo = new PDO(
    'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );

  // ─── 5) Insert a pending record ─────────────────────────────────────────────
  $stmt = $pdo->prepare("
    INSERT INTO recharges (username, amount, status, created_at)
    VALUES (?, ?, 'pending', NOW())
  ");
  $stmt->execute([$user, $amount]);
  $rechargeId = $pdo->lastInsertId();

  // ─── 6) Create Stripe PaymentIntent ────────────────────────────────────────
  $pi = \Stripe\PaymentIntent::create([
    'amount'   => $amount,
    'currency' => 'usd',
    'metadata' => [
      'username'    => $user,
      'recharge_id' => $rechargeId
    ],
    'automatic_payment_methods' => ['enabled' => true],
  ]);

  // ─── 7) Record the Stripe Intent ID ────────────────────────────────────────
  $stmt = $pdo->prepare("
    UPDATE recharges SET stripe_pi = ? WHERE id = ?
  ");
  $stmt->execute([$pi->id, $rechargeId]);

  // ─── 8) Return the clientSecret ─────────────────────────────────────────────
  echo json_encode(['clientSecret' => $pi->client_secret]);
  exit;

} catch (\Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
  exit;
}
