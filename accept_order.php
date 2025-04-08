<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Cookie, Accept");
header("Access-Control-Allow-Credentials: true");

$method = $_SERVER['REQUEST_METHOD'];

$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname     = "app-db";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB connection failed: " . $conn->connect_error]);
    exit();
}

if (!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "User not logged in."]);
    exit();
}
$loggedInUser = $_SESSION['username'];

if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT * FROM requests WHERE status='pending' AND username != ?");
    $stmt->bind_param("s", $loggedInUser);
    $stmt->execute();
    $result = $stmt->get_result();
    $orders = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode(["success" => true, "orders" => $orders]);
    exit();

} elseif ($method === 'PUT') {
    $raw = file_get_contents("php://input");
    $input = json_decode($raw, true);
    if (!isset($input['id'])) {
        echo json_encode(["success" => false, "message" => "Missing order id."]);
        exit();
    }
    $id = $input['id'];

    // 将该订单设为 accepted，accepted_by=当前用户，但前提：status='pending' AND username!=当前用户
    $stmt = $conn->prepare("
        UPDATE requests
           SET status='accepted', accepted_by=?
         WHERE id=? 
           AND status='pending'
           AND username != ?
    ");
    $stmt->bind_param("sis", $loggedInUser, $id, $loggedInUser);
    if (!$stmt->execute()) {
        echo json_encode(["success" => false, "message" => "Execute error: " . $stmt->error]);
        exit();
    }
    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Order accepted successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "No matching pending order found or that order is yours."]);
    }
    exit();

} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit();
}

$conn->close();
?>