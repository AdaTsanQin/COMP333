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
    echo json_encode([
      "success" => false,
      "message" => "DB connection failed: " . $conn->connect_error
    ]);
    exit();
}
$conn->set_charset('utf8mb4');

// Ensure user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode([
      "success" => false,
      "message" => "User not logged in."
    ]);
    exit();
}
$loggedInUser = $_SESSION['username'];

if ($method === 'GET') {
    // Fetch pending (not own) and accepted (own) orders
    $sql = "
        SELECT * 
          FROM requests 
         WHERE (status = 'pending'  AND username   != ?)
            OR (status = 'accepted' AND accepted_by = ?)
    ";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode([
          "success" => false,
          "message" => "SQL prepare error: " . $conn->error
        ]);
        exit();
    }
    $stmt->bind_param("ss", $loggedInUser, $loggedInUser);
    $stmt->execute();
    $orders = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
      "success" => true,
      "orders"  => $orders
    ]);
    exit();

} elseif ($method === 'PUT') {
    // Read input
    $input = json_decode(file_get_contents("php://input"), true);
    if (empty($input['id'])) {
        echo json_encode([
          "success" => false,
          "message" => "Invalid input: missing id."
        ]);
        exit();
    }
    $id = (int)$input['id'];

    // --- Drop off a completed order ---
    if (isset($input['action']) && $input['action'] === 'drop_off') {
        $stmt = $conn->prepare("
            UPDATE requests
               SET status = 'completed'
             WHERE id         = ?
               AND status     = 'accepted'
               AND accepted_by = ?
        ");
        $stmt->bind_param("is", $id, $loggedInUser);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode([
              "success" => true,
              "message" => "Order dropped off (completed) successfully"
            ]);
        } else {
            echo json_encode([
              "success" => false,
              "message" => "No matching accepted order found or you are not the acceptor."
            ]);
        }
        exit();
    }

    // --- Accept a pending order and decrement stock ---
    $conn->begin_transaction();

    // 1) Lock & fetch the request row
    $sel = $conn->prepare("
        SELECT item, quantity
          FROM requests
         WHERE id       = ?
           AND status   = 'pending'
           AND username != ?
         FOR UPDATE
    ");
    $sel->bind_param("is", $id, $loggedInUser);
    $sel->execute();
    $res = $sel->get_result();
    if ($res->num_rows === 0) {
        $conn->rollback();
        echo json_encode([
          "success" => false,
          "message" => "Order not found, already processed, or you cannot accept your own order."
        ]);
        exit();
    }
    $row      = $res->fetch_assoc();
    $itemName = $row['item'];
    $qty      = (int)$row['quantity'];

    // 2) Attempt to decrement stock
    $updShop = $conn->prepare("
        UPDATE Wesshop
           SET number = number - ?
         WHERE name    = ?
           AND number >= ?
    ");
    $updShop->bind_param("iss", $qty, $itemName, $qty);
    $updShop->execute();

    // 2a) If no rows updated, insufficient stock: rollback & return error
    if ($updShop->affected_rows === 0) {
        $conn->rollback();
        echo json_encode([
          "success" => false,
          "message" => "There is not enough storage in Wesshop; not able to accept order."
        ]);
        exit();
    }

    // 3) Mark request as accepted
    $updReq = $conn->prepare("
        UPDATE requests
           SET status      = 'accepted',
               accepted_by = ?
         WHERE id = ?
    ");
    $updReq->bind_param("si", $loggedInUser, $id);
    $updReq->execute();
    if ($updReq->affected_rows === 0) {
        $conn->rollback();
        echo json_encode([
          "success" => false,
          "message" => "Failed to accept order."
        ]);
        exit();
    }

    // 4) All good → commit
    $conn->commit();
    echo json_encode([
      "success" => true,
      "message" => "Order accepted successfully."
    ]);
    exit();

} else {
    // Invalid method
    echo json_encode([
      "success" => false,
      "message" => "Invalid request method: $method"
    ]);
    exit();
}

$conn->close();
