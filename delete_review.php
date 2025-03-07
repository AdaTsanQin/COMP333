<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Ensure the user is logged in.
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit;
}

// Verify that task_id is provided.
if (!isset($_GET['task_id'])) {
    die("No task ID provided.");
}

$taskId = intval($_GET['task_id']);
$currentUser = $_SESSION['username'];

$servername = "127.0.0.1";
$dbusername = "root";
$dbpassword = "";
$dbname     = "app-db";

// Create a MySQLi connection.
$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Update the tasks table: remove the review data (rating and comment).
$sql = "UPDATE tasks SET rating = 0, comment = '' WHERE task_id = ? AND username = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    die("Prepare failed: " . $conn->error);
}
$stmt->bind_param("is", $taskId, $currentUser);
$stmt->execute();
$stmt->close();

$conn->close();

// Redirect back to the manage page.
header("Location: manage_review.php");
exit;
?>
