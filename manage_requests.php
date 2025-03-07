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

if (!isset($_SESSION['username'])) {
    die("Please log in to manage requests.");
}

$username = $_SESSION['username'];

$checkColumn = $conn->query("SHOW COLUMNS FROM requests LIKE 'accepted_by'");
if ($checkColumn->num_rows == 0) {
    $conn->query("ALTER TABLE requests ADD accepted_by VARCHAR(255) DEFAULT NULL");
}

$sql = "SELECT * FROM requests WHERE status = 'pending'";
$result = $conn->query($sql);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['accept'])) {
        $requestId = $_POST['request_id'];
        
        $updateSql = "UPDATE requests SET status = 'accepted', accepted_by = ? WHERE id = ?";
        $stmt = $conn->prepare($updateSql);
        $stmt->bind_param("si", $username, $requestId);
        $stmt->execute();

        header("Location: order_countdown.php?request_id=$requestId");
        exit;
    }
}

?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Manage Requests</title>
</head>
<body>

<h1>Manage Pending Orders</h1>

<?php
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "<p>";
        echo "Request ID: " . $row['id'] . 
        " - Item: " . $row['item'] . 
        " - Delivery Speed: " . ucfirst($row['delivery_speed']) . 
        " - Status: " . $row['status'] . 
        " - Accepted By: " . ($row['accepted_by'] ?? 'N/A');
   
        if ($row['status'] === 'pending') {
            echo " <form method='POST' style='display:inline;'>
                    <input type='hidden' name='request_id' value='" . $row['id'] . "'>
                    <button type='submit' name='accept'>Accept Order</button>
                    </form>";
        }

        echo "</p>";
    }
} else {
    echo "No pending requests.";
}

$conn->close();
?>

<a href="create_requests.php">
    <button>Back to Create New Request</button>
</a>

</body>
</html>