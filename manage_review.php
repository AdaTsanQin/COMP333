<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration
$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "app-db";

// Create connection
$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Ensure the user is logged in
if (!isset($_SESSION['username'])) {
    die("Please log in.");
}

$username = $_SESSION['username'];

// Query to get all completed orders from the tasks table
$sql = "SELECT task_id, request_id, username AS buyer, dashername, item, comment, rating, status 
        FROM tasks 
        WHERE status = 'completed' 
        ORDER BY task_id DESC";
$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Manage Reviews for Completed Orders</title>
    <style>
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: center;
        }
        th {
            background-color: #f2f2f2;
        }
        a.button, input.button {
            padding: 5px 10px;
            background-color: blue;
            color: #fff;
            text-decoration: none;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        form {
            display: inline;
        }
    </style>
</head>
<body>
    <h1>Manage Reviews for Completed Orders</h1>
    <h2> Note: Only complete orders can be reviewed </h2>
    <p style="font-weight: bold; color: blue;">Logged in as: <?php echo htmlspecialchars($username); ?></p>

    <?php if ($result && $result->num_rows > 0): ?>
        <table>
            <thead>
                <tr>
                    <th>Task ID</th>
                    <th>Request ID</th>
                    <th>Buyer</th>
                    <th>Dasher</th>
                    <th>Item</th>
                    <th>Rating</th>
                    <th>Review Comment</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($row = $result->fetch_assoc()):
                    // Normalize the review (trim whitespace)
                    $review = trim($row['comment']);
                ?>
                    <tr>
                        <td><?php echo htmlspecialchars($row['task_id']); ?></td>
                        <td><?php echo htmlspecialchars($row['request_id']); ?></td>
                        <td><?php echo htmlspecialchars($row['buyer']); ?></td>
                        <td><?php echo htmlspecialchars($row['dashername']); ?></td>
                        <td><?php echo htmlspecialchars($row['item']); ?></td>
                        <td><?php echo htmlspecialchars($row['rating']); ?></td>
                        <td><?php echo htmlspecialchars($row['comment']); ?></td>
                        <td>
                            <?php if (empty($review)): ?>
                                <!-- No review exists: show Create button -->
                                <a class="button" href="create_review.php?task_id=<?php echo urlencode($row['task_id']); ?>">Create Review</a>
                            <?php else: ?>
                                <!-- Review exists: show Update and Delete buttons -->
                                <a class="button" href="update_review.php?task_id=<?php echo urlencode($row['task_id']); ?>">Update Review</a>
                                <form method="POST" action="delete_review.php" onsubmit="return confirm('Are you sure you want to delete this review?');">
                                    <input type="hidden" name="task_id" value="<?php echo htmlspecialchars($row['task_id']); ?>">
                                    <input type="submit" class="button" value="Delete Review">
                                </form>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    <?php else: ?>
        <p>No completed orders found.</p>
    <?php endif; ?>

    <p><a href="dashboard.php">Back to Dashboard</a></p>
</body>
</html>

<?php
$conn->close();
?>
