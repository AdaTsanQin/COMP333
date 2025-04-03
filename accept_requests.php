<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

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
    echo json_encode(["success" => false, "message" => "User not logged in."]);
    exit;
}

$username = $_SESSION['username'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("SELECT * FROM requests WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    echo json_encode(["success" => true, "requests" => $result->fetch_all(MYSQLI_ASSOC)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['delete_id'])) {
        $stmt = $conn->prepare("DELETE FROM requests WHERE id = ?");
        $stmt->bind_param("i", $data['delete_id']);
        echo json_encode(["success" => $stmt->execute()]);
    }
}
$conn->close();
?>
