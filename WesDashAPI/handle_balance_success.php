<?php
// File: /WesDashAPI/handle_balance_success.php

session_start();
require __DIR__.'/vendor/autoload.php';
require __DIR__.'/secrets.php';

\Stripe\Stripe::setApiKey($stripeSecretKey);

// 1) Read the session_id from the query
$sessionId = $_GET['session_id'] ?? '';
if (!$sessionId) {
  echo "<h1>Error: missing session_id</h1>";
  exit;
}

try {
  // 2) Retrieve the Checkout Session (and its metadata)
  $session = \Stripe\Checkout\Session::retrieve($sessionId);
  $metadata = $session->metadata->toArray();
  $user   = $metadata['user']   ?? null;
  $amount = intval($metadata['amount'] ?? 0);

  if (!$user || $amount < 1) {
    throw new Exception("Invalid session metadata");
  }

  // 3) Credit the user in your DB
  $pdo = new PDO(
    'mysql:host=localhost;dbname=app-db;charset=utf8mb4',
    'root','',
    [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
  );
  $stmt = $pdo->prepare("UPDATE users SET balance = balance + ? WHERE username = ?");
  $stmt->execute([$amount, $user]);

  // 4) Redirect back into your app via deep link
  $appUrl = "myapp://balance-updated?newBalance=" . ($pdo->query(
     "SELECT balance FROM users WHERE username=". $pdo->quote($user)
  )->fetchColumn());
  echo "<script>window.location.href=", json_encode($appUrl), ";</script>";

} catch (Exception $e) {
  http_response_code(500);
  echo "<h1>Payment failed</h1><pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
}
