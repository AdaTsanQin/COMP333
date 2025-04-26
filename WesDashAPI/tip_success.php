<?php
// File: /WesDashAPI/tip_success.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
while (ob_get_level()) ob_end_clean();
header('Content-Type: text/html; charset=utf-8');

// Load Composer
$autoloadPaths = [
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/../vendor/autoload.php',
];
foreach ($autoloadPaths as $p) {
    if (file_exists($p)) {
        require $p;
        break;
    }
}

// Load secrets
$secretPaths = [
    __DIR__ . '/secrets.php',
    __DIR__ . '/../secrets.php',
];
foreach ($secretPaths as $s) {
    if (file_exists($s)) {
        require $s;
        break;
    }
}

\Stripe\Stripe::setApiKey($stripeSecretKey);

try {
    $session_id = $_GET['session_id'] ?? '';
    $request_id = isset($_GET['request_id']) ? (int)$_GET['request_id'] : 0;
    if (!$session_id || $request_id < 1) {
        throw new \Exception("Invalid session_id or request_id");
    }

    $session = \Stripe\Checkout\Session::retrieve($session_id);
    if ($session->payment_status !== 'paid' && $session->amount_total > 0) {
        throw new \Exception("Payment not completed. Status = {$session->payment_status}");
    }

    $conn = new mysqli('localhost', 'root', '', 'app-db');
    if ($conn->connect_error) {
        throw new \Exception("DB connect error: " . $conn->connect_error);
    }

    $amount   = $session->amount_total; // in cents
    $currency = $session->currency;
    $pi       = $session->payment_intent;

    // 1) Get both the sender (username) and the dasher (accepted_by)
    $stmt = $conn->prepare("
        SELECT username AS sender_username,
               accepted_by AS dasher_username
          FROM requests
         WHERE id = ?
    ");
    $stmt->bind_param('i', $request_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row || empty($row['dasher_username'])) {
        throw new \Exception("Request does not have an accepted_by dasher.");
    }
    $senderUsername = $row['sender_username'];
    $dasherUsername = $row['dasher_username'];

    // 2) Start transaction
    $conn->begin_transaction();

    // Insert the tip record
    $ins = $conn->prepare("
      INSERT INTO tips 
        (request_id, tip_intent_id, amount, currency, status)
      VALUES (?, ?, ?, ?, 'succeeded')
    ");
    $ins->bind_param('isis', $request_id, $pi, $amount, $currency);
    if (!$ins->execute()) {
        throw new \Exception("Insert tip failed: " . $ins->error);
    }

    // 3a) Credit the dasher
    $credit = $conn->prepare("
      UPDATE users
         SET balance = balance + ?
       WHERE username = ?
    ");
    $credit->bind_param('is', $amount, $dasherUsername);
    if (!$credit->execute()) {
        throw new \Exception("Credit to dasher failed: " . $credit->error);
    }

    // 3b) Debit the sender
    $debit = $conn->prepare("
      UPDATE users
         SET balance = balance - ?
       WHERE username = ?
    ");
    $debit->bind_param('is', $amount, $senderUsername);
    if (!$debit->execute()) {
        throw new \Exception("Debit from sender failed: " . $debit->error);
    }

    // Update the request’s payment status and mark it confirmed
    $upd = $conn->prepare("
      UPDATE requests 
         SET payment_intent_id = ?,
             payment_status   = 'captured',
             status           = 'confirmed'
       WHERE id = ?
    ");
    $upd->bind_param('si', $pi, $request_id);
    if (!$upd->execute()) {
        throw new \Exception("Update request failed: " . $upd->error);
    }


    $conn->commit();

    // Redirect back to app
    $appUrl = "myapp://tip-complete?request_id={$request_id}";
    echo "<script>window.location.href = " . json_encode($appUrl) . ";</script>";
    exit;

} catch (\Exception $e) {
    if (isset($conn) && $conn->connect_errno === 0) {
        $conn->rollback();
    }
    http_response_code(500);
    echo "<h1>500 – Error Processing Tip</h1>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
    exit;
}
?>