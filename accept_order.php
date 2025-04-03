<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, PUT");
header("Access-Control-Allow-Headers: Content-Type");


$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "app-db";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

if (!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "Please log in before managing your request."]);
    exit;
}


$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Fetch all requests with 'pending' status
    $query = "SELECT * FROM orders WHERE status = 'pending'";
    $result = $conn->query($query);

    if ($result->num_rows > 0) {
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        echo json_encode(["success" => true, "requests" => $orders]);
    } else {
        echo json_encode(["success" => false, "message" => "No pending requests found."]);
    }
} elseif ($method == 'PUT') {
    // Update order status to 'accepted'
    $data = json_decode(file_get_contents("php://input"), true);

    if (isset($data['id']) && !empty($data['id'])) {
        $id = $conn->real_escape_string($data['id']);

        $updateQuery = "UPDATE orders SET status = 'accepted' WHERE id = '$id'";
        if ($conn->query($updateQuery) === TRUE) {
            echo json_encode(["success" => true, "message" => "Order accepted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update order status."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Invalid order ID."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}

$conn->close();
?>
