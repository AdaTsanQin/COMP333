<?php
// ─── Strict session ID validation before session_start ───
if (isset($_GET['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_GET['PHPSESSID'])) {
  session_id($_GET['PHPSESSID']);
} elseif (isset($_COOKIE['PHPSESSID']) && preg_match('/^[a-zA-Z0-9-_]{1,128}$/', $_COOKIE['PHPSESSID'])) {
  session_id($_COOKIE['PHPSESSID']);
}

// ─── Headers ────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie, Accept');

// ─── Preflight ───────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// ─── Session Setup ───────────────────────────────────────────
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => false,
  'httponly' => false,
  'samesite' => 'Lax',
]);
session_start();

// ─── Autoload Stripe ─────────────────────────────────────────
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) $autoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload)) {
  http_response_code(500);
  echo json_encode(['error' => 'Missing vendor/autoload.php']);
  exit;
}
require $autoload;

\Stripe\Stripe::setApiKey('your sk key');

// ─── Auth Check ──────────────────────────────────────────────
if (empty($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Not logged in']);
  exit;
}
$user = $_SESSION['username'];

// ─── Read + Validate Amount ──────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);
$amount = (int)($input['amount'] ?? 0);
if ($amount < 100) {
  http_response_code(400);
  echo json_encode(['error' => 'Minimum amount is $1']);
  exit;
}

// ─── Process ─────────────────────────────────────────────────
try {
  // DB connection
  $pdo = new PDO('mysql:host=localhost;dbname=app-db;charset=utf8mb4', 'root', '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);

  // Insert recharge record
  $stmt = $pdo->prepare("INSERT INTO recharges (username, amount, status, created_at) VALUES (?, ?, 'pending', NOW())");
  $stmt->execute([$user, $amount]);
  $rechargeId = $pdo->lastInsertId();

  // Create PaymentIntent
  $pi = \Stripe\PaymentIntent::create([
    'amount' => $amount,
    'currency' => 'usd',
    'metadata' => [
      'username' => $user,
      'recharge_id' => $rechargeId
    ],
    'automatic_payment_methods' => ['enabled' => true],
  ]);

  // Save Stripe PI ID
  $stmt = $pdo->prepare("UPDATE recharges SET stripe_pi = ? WHERE id = ?");
  $stmt->execute([$pi->id, $rechargeId]);

  echo json_encode(['clientSecret' => $pi->client_secret]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Server error. Please try again later.']);
}
