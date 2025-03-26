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
    die("Please log in before managing your request.");
}

$username = $_SESSION['username'];

if (isset($_POST['confirm_id'])) {
    $confirmId = $_POST['confirm_id'];
    $sql = "UPDATE requests SET status = 'confirmed' WHERE id = ? AND username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $confirmId, $username);

    if ($stmt->execute()) {
        header("Location: delete_requests.php?msg=confirmed");
        exit;
    } else {
        echo "Failed to update the status.";
    }
}

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

if (isset($_POST['delete_user'])) {
    $targetUser = $_POST['delete_user'];

    $checkUser = $conn->prepare("SELECT * FROM users WHERE username = ?");
    $checkUser->bind_param("s", $targetUser);
    $checkUser->execute();
    $result = $checkUser->get_result();

    if ($result->num_rows > 0) {
        $anonymizedUsername = "deleted_user_" . time(); 

        $updateRequests = $conn->prepare("UPDATE requests SET username = ? WHERE username = ?");
        $updateRequests->bind_param("ss", $anonymizedUsername, $targetUser);
        $updateRequests->execute();

        $updateTasks = $conn->prepare("UPDATE task SET username = ? WHERE username = ?");
        $updateTasks->bind_param("ss", $anonymizedUsername, $targetUser);
        $updateTasks->execute();

        $deleteUser = $conn->prepare("DELETE FROM users WHERE username = ?");
        $deleteUser->bind_param("s", $targetUser);
        $deleteUser->execute();

        if ($deleteUser->affected_rows > 0) {
            echo "<p style='color: red;'>User deleted, but their associated data remains.</p>";
        } else {
            echo "<p style='color: red;'>Error deleting user.</p>";
        }
    } else {
        echo "<p style='color: red;'>User not found.</p>";
    }

    $checkUser->close();
    $updateRequests->close();
    $updateTasks->close();
    $deleteUser->close();
}

$sql = "SELECT id, item, status, accepted_by FROM requests WHERE username = ? AND status != 'confirmed'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$pendingRequests = $stmt->get_result();

$sqlConfirmed = "SELECT id, item, status, accepted_by FROM requests WHERE username = ? AND status = 'confirmed'";
$stmt = $conn->prepare($sqlConfirmed);
$stmt->bind_param("s", $username);
$stmt->execute();
$confirmedRequests = $stmt->get_result();

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Manage Requests</title>
</head>
<body>

<p style="font-weight: bold; color: blue;">You are logged in as: <?php echo htmlspecialchars($username); ?></p>

<h1>Your Requests</h1>

<?php
if (isset($_GET['msg']) && $_GET['msg'] === 'deleted') {
    echo "<p style='color: green;'>Request has been successfully deleted.</p>";
}

if (isset($_GET['msg']) && $_GET['msg'] === 'confirmed') {
    echo "<p style='color: blue;'>Request has been successfully confirmed.</p>";
}

if ($pendingRequests->num_rows > 0) {
    while ($row = $pendingRequests->fetch_assoc()) {
        echo "<p>";
        echo "Request ID: " . $row['id'] . 
             " - Item: " . $row['item'] . 
             " - Status: " . ucfirst($row['status']);

        if ($row['status'] === 'accepted') {
            echo " - Accepted By: " . ($row['accepted_by'] ? $row['accepted_by'] : "N/A");
        }

        if ($row['status'] === 'pending') {
            echo " <a href='delete_requests.php?id=" . $row['id'] . "'>Cancel</a>";
        }

        if ($row['status'] === 'completed') {
            echo " <form method='POST' action='delete_requests.php'>
                    <input type='hidden' name='confirm_id' value='" . $row['id'] . "'>
                    <button type='submit'>Get the item</button>
                  </form>";
        }

        echo "</p>";
    }
} else {
    echo "You have no pending requests.";
}
?>

<h1>Finished Requests</h1>
<?php
if ($confirmedRequests->num_rows > 0) {
    while ($row = $confirmedRequests->fetch_assoc()) {
        echo "<p>";
        echo "Request ID: " . $row['id'] . 
             " - Item: " . $row['item'];

        if ($row['status'] === 'confirmed') {
            echo " - Status: <strong>Confirmed</strong>";
        }

        echo "</p>";
    }
} else {
    echo "You have no finished requests.";
}

$stmt->close();
$conn->close();
?>

<a href="create_requests.php">
    <button>Create New Request</button>
</a>
<a href="manage_requests.php">
    <button>Accept Orders</button>
</a> 
<a href="read.php">
    <button type="button">View all requests</button>
</a>

<a href="logout.php">
    <button type="button">Logout</button>
</a>

<h2>Admin: Delete a User</h2>
<form method="POST" action="delete_requests.php">
    <label for="delete_user">Username to Delete:</label>
    <input type="text" name="delete_user" required>
    <button type="submit">Delete User</button>
</form>

</body>
</html>

