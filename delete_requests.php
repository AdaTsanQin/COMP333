<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "app-db";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Must login first
if (!isset($_SESSION['username'])) {
    die("Please log in before managing your request.");
}

$username = $_SESSION['username'];

if (isset($_GET['id']) && !empty($_GET['id'])) {
    $requestId = $_GET['id'];

    $sql = "DELETE FROM requests WHERE id = ? AND username = ? AND status = 'pending'";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $requestId, $username);

    if ($stmt->execute()) {
        header("Location: delete_requests.php?msg=deleted");
        exit;
    } else {
        echo "Failed to delete the request.";
    }
}

$sql = "SELECT * FROM requests WHERE username = ? AND status = 'pending'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Manage Requests</title>
</head>
<body>

<h1>Your Pending Requests</h1>

<?php
if (isset($_GET['msg']) && $_GET['msg'] === 'deleted') {
    echo "<p style='color: green;'>Request has been successfully deleted.</p>";
}

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "<p>";
        echo "Request ID: " . $row['id'] . " - Item: " . $row['item'] . " - Status: " . $row['status'];

        if ($row['status'] === 'pending') {
            echo " <a href='delete_requests.php?id=" . $row['id'] . "'>Cancel</a>";
        }

        echo "</p>";
    }
} else {
    echo "You have no pending requests.";
}

$stmt->close();
$conn->close();
?>

<a href="create_requests.php">
    <button>Back to Create New Request</button>
</a>


</body>
</html>
