<?php
// File: /Applications/XAMPP/xamppfiles/htdocs/WesDashAPI/tip_success.php

// 1) Turn on error reporting so you see what’s going wrong
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 2) Clear stray output
while (ob_get_level()) {
    ob_end_clean();
}

// 3) HTML header (we’re redirecting via JS later)
header('Content-Type: text/html; charset=utf-8');

// 4) Load Composer’s autoload (try same paths as create_tip.php)
$autoloadPaths = [
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
];
$found = false;
foreach ($autoloadPaths as $p) {
    if (file_exists($p)) {
        require $p;
        $found = true;
        break;
    }
}
if (! $found) {
    http_response_code(500);
    echo "<h1>500 – Stripe SDK Not Found</h1>\n";
    echo "<p>Looked at:</p><pre>" . implode("\n", $autoloadPaths) . "</pre>";
    exit;
}

// 5) Load your secrets.php (same dual‐path logic)
$secretPaths = [
    __DIR__ . '/secrets.php',
    __DIR__ . '/../secrets.php',
];
$gotSecrets = false;
foreach ($secretPaths as $s) {
    if (file_exists($s)) {
        require $s;
        $gotSecrets = true;
        break;
    }
}
if (! $gotSecrets) {
    http_response_code(500);
    echo "<h1>500 – Missing secrets.php</h1>\n";
    echo "<p>Please create one of:</p><pre>" . implode("\n", $secretPaths) . "</pre>";
    exit;
}

// 6) Initialize Stripe
\Stripe\Stripe::setApiKey($stripeSecretKey);

try {
    // 7) Read query params
    $session_id = $_GET['session_id']  ?? '';
    $request_id = isset($_GET['request_id']) ? (int)$_GET['request_id'] : 0;
    if (! $session_id || $request_id < 1) {
        throw new \Exception("Invalid session_id or request_id");
    }

    // 8) Retrieve the session to confirm payment
    $session = \Stripe\Checkout\Session::retrieve($session_id);
    if ($session->payment_status !== 'paid' && $session->amount_total > 0) {
        throw new \Exception("Payment not completed. status={$session->payment_status}");
    }

    // 9) Record the tip in your DB
    $conn = new mysqli('localhost','root','','app-db');
    if ($conn->connect_error) {
        throw new \Exception("DB connect error: " . $conn->connect_error);
    }
    $amount   = $session->amount_total;    // in cents
    $currency = $session->currency;
    $pi       = $session->payment_intent;

    $ins = $conn->prepare("
      INSERT INTO tips(request_id, tip_intent_id, amount, currency, status)
      VALUES(?,?,?,?, 'succeeded')
    ");
    $ins->bind_param('isis', $request_id, $pi, $amount, $currency);
    if (! $ins->execute()) {
        throw new \Exception("Insert tip failed: " . $ins->error);
    }

    // 10) Update the request’s payment_status
    $upd = $conn->prepare("
      UPDATE requests 
         SET payment_intent_id=?, payment_status='captured' 
       WHERE id=?
    ");
    $upd->bind_param('si', $pi, $request_id);
    if (! $upd->execute()) {
        throw new \Exception("Update request failed: " . $upd->error);
    }

    // 11) Redirect back into your app via deep link
    $appUrl = "myapp://tip-complete?request_id={$request_id}";
    echo "<script>window.location.href = " . json_encode($appUrl) . ";</script>";
    exit;

} catch (\Exception $e) {
    // Print a visible error so you can debug
    http_response_code(500);
    echo "<h1>500 – Error Processing Tip</h1>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
    exit;
}
