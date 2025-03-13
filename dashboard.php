<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Must be logged in.
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit;
}

$servername = "127.0.0.1";
$dbusername = "root";
$dbpassword = "";
$dbname     = "app-db";

// Create connection using MySQLi.
$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

$username = $_SESSION['username'];

// --- FETCH PENDING ORDERS ---
// Pending orders are those with status 'pending'.
$sqlPending = "SELECT id, username, item, drop_off_location, delivery_speed, status, created_at 
               FROM requests 
               WHERE status = 'pending'";
$resultPending = $conn->query($sqlPending);
$pendingOrders = [];
if ($resultPending) {
    $pendingOrders = $resultPending->fetch_all(MYSQLI_ASSOC);
}

// --- FETCH CLAIMED ORDERS ---
// Claimed orders (for dasher tasks) are those with status 'claimed'.
$sqlClaimed = "SELECT id, username, item, drop_off_location, delivery_speed, status, created_at 
               FROM requests 
               WHERE status = 'claimed'";
$resultClaimed = $conn->query($sqlClaimed);
$claimedOrders = [];
if ($resultClaimed) {
    $claimedOrders = $resultClaimed->fetch_all(MYSQLI_ASSOC);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - WesDash</title>
    <style>
        nav {
            background-color: #f2f2f2;
            padding: 10px;
            margin-bottom: 20px;
        }
        nav a {
            margin-right: 15px;
            text-decoration: none;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table, th, td {
            border: 1px solid #999;
        }
        th, td {
            padding: 8px;
            text-align: left;
        }
    </style>
</head>
<body>
    <h1>Welcome to WesDash, <?php echo htmlspecialchars($username); ?>!</h1>
    <nav>
        <a href="create_requests.php">Make Order</a>
        <a href="delete_requests.php">Update Order</a>
        <a href="delete_requests.php">Delete Order</a>
        <a href="manage_review.php">Manage Reviews</a>
        <a href="dashboard.php">Dashboard</a>
    </nav>
    
    <!-- SECTION: Pending Orders -->
    <h2>Pending Orders</h2>
    <?php if (count($pendingOrders) > 0): ?>
        <table>
            <tr>
                <th>ID</th>
                <th>Buyer's Username</th>
                <th>Item</th>
                <th>Drop-Off Location</th>
                <th>Delivery Speed</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Action</th>
            </tr>
            <?php foreach ($pendingOrders as $order): ?>
                <tr>
                    <td><?php echo htmlspecialchars($order['id']); ?></td>
                    <td><?php echo htmlspecialchars($order['username']); ?></td>
                    <td><?php echo htmlspecialchars($order['item']); ?></td>
                    <td><?php echo htmlspecialchars($order['drop_off_location']); ?></td>
                    <td><?php echo htmlspecialchars($order['delivery_speed']); ?></td>
                    <td><?php echo htmlspecialchars($order['status']); ?></td>
                    <td><?php echo htmlspecialchars($order['created_at']); ?></td>
                    <td>
                        <!-- Clicking this link will update the order's status to 'claimed' -->
                        <a href="claim_order.php?order_id=<?php echo $order['id']; ?>">Claim Order</a>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>
    <?php else: ?>
        <p>No pending orders at the moment.</p>
    <?php endif; ?>
    
    <!-- SECTION: Dasher Tasks (Claimed Orders) -->
    <h2>Dasher Tasks</h2>
    <?php if (count($claimedOrders) > 0): ?>
        <table>
            <tr>
                <th>ID</th>
                <th>Buyer's Username</th>
                <th>Item</th>
                <th>Drop-Off Location</th>
                <th>Delivery Speed</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Action</th>
            </tr>
            <?php foreach ($claimedOrders as $order): ?>
                <tr>
                    <td><?php echo htmlspecialchars($order['id']); ?></td>
                    <td><?php echo htmlspecialchars($order['username']); ?></td>
                    <td><?php echo htmlspecialchars($order['item']); ?></td>
                    <td><?php echo htmlspecialchars($order['drop_off_location']); ?></td>
                    <td><?php echo htmlspecialchars($order['delivery_speed']); ?></td>
                    <td><?php echo htmlspecialchars($order['status']); ?></td>
                    <td><?php echo htmlspecialchars($order['created_at']); ?></td>
                    <td>
                        <!-- Dasher task links can update progress; these could point to another script -->
                        <a href="update_task.php?order_id=<?php echo $order['id']; ?>&action=picked">Pick Up</a>
                        <a href="drop_off.php?order_id=<?php echo $order['id']; ?>&action=dropped">Drop Off</a>


                    </td>
                </tr>
            <?php endforeach; ?>
        </table>
    <?php else: ?>
        <p>No claimed orders at the moment.</p>
    <?php endif; ?>
</body>
</html>
<?php
$conn->close();
?>
