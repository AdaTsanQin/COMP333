<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verify user is logged in.
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit;
}

// Verify required GET parameters.
if (!isset($_GET['order_id']) || !isset($_GET['action'])) {
    die("Missing parameters.");
}

$orderId = intval($_GET['order_id']);
$action = $_GET['action'];

// This script only handles the 'dropped' action.
if ($action !== 'dropped') {
    die("Invalid action.");
}

$servername = "127.0.0.1";
$dbusername = "root";
$dbpassword = "";
$dbname     = "app-db";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Update the requests table: set status = 'completed'
$sqlUpdateRequests = "UPDATE requests SET status = 'completed' WHERE id = ?";
$stmtRequests = $conn->prepare($sqlUpdateRequests);
$stmtRequests->bind_param("i", $orderId);
$stmtRequests->execute();
$stmtRequests->close();

// Update the tasks table: set status = 'completed'
$sqlUpdateTasks = "UPDATE tasks SET status = 'completed' WHERE task_id = ?";
$stmtTasks = $conn->prepare($sqlUpdateTasks);
$stmtTasks->bind_param("i", $orderId);
$stmtTasks->execute();
$stmtTasks->close();

$conn->close();

// Redirect back to the dashboard.
header("Location: dashboard.php");
exit;
?>
