<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT");
header("Content-Type: application/json");

if (!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized access. Please log in."]);
    exit;
}

$username = $_SESSION['username'];

$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname     = "app-db";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB connection failed: " . $conn->connect_error]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!isset($data['id'], $data['item'], $data['drop_off_location'], $data['delivery_speed'], $data['status'])) {
        echo json_encode(["success" => false, "message" => "Missing required fields."]);
        exit;
    }

    $id = $data['id'];
    $item = $data['item'];
    $drop_off_location = $data['drop_off_location'];
    $delivery_speed = $data['delivery_speed'];
    $status = $data['status'];

    $sql = "UPDATE requests SET item=?, drop_off_location=?, delivery_speed=?, status=? WHERE id=? AND username=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssis", $item, $drop_off_location, $delivery_speed, $status, $id, $username);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Request updated successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update request."]);
    }

    $stmt->close();
}

$conn->close();
?>
