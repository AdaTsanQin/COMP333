<?php

/* ---------- CORS ---------- */
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // echo back the exact Origin so that credentials work
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* ---------- Session setup ---------- */
session_set_cookie_params([
    'lifetime' => 0,          // session cookie
    'path'     => '/',
    'domain'   => '',         // keep empty unless on custom domain
    'secure'   => false,      // true if served over HTTPS
    'httponly' => true,       // JS cannot read
    'samesite' => 'Lax',      // if HTTPS+cross-site, use 'None'
]);
session_start();

/* ---------- Error handling ---------- */
ini_set('display_errors', 0);   // never leak warnings to frontend
error_reporting(E_ALL);

/* ---------- DB connection ---------- */
$mysqli = new mysqli('localhost', 'root', '', 'app-db');
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

/* ---------- Read & validate JSON ---------- */
try {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Malformed JSON body']);
    exit;
}

if (!isset($data['username'], $data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing username or password']);
    exit;
}

$username = trim($data['username']);
$password = $data['password'];

/* ---------- Look up user ---------- */
$stmt = $mysqli->prepare(
    'SELECT password, is_deleted, role FROM users WHERE username = ?'
);
$stmt->bind_param('s', $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Username not found']);
    exit;
}

$stmt->bind_result($hashedPwd, $isDeleted, $role);
$stmt->fetch();

if ($isDeleted == 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Account is deleted']);
    exit;
}

/* ---------- Verify password ---------- */
if (!password_verify($password, $hashedPwd)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid password']);
    exit;
}

/* ---------- Establish session ---------- */
$_SESSION['username'] = $username;
$_SESSION['role']     = $role;    

/* ---------- Debug log (optional) ---------- */
$logFile = __DIR__ . '/session_debug.log';
$logLine = sprintf(
    "[%s] Session ID: %s  User: %s\n",
    date('Y-m-d H:i:s'),
    session_id(),
    $username
);
if (is_writable(dirname($logFile))) {   // write only if allowed
    @file_put_contents($logFile, $logLine, FILE_APPEND);
} else {
    error_log('Cannot write to session_debug.log');
}

/* ---------- Success response ---------- */
echo json_encode([
    'success'    => true,
    'message'    => 'Login successful',
    'session_id' => session_id(),
    'role'       => $role      
]);

/* ---------- Cleanup ---------- */
$stmt->close();
$mysqli->close();
?>