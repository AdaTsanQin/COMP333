<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Ensure the user is logged in.
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit;
}

$servername = "127.0.0.1";
$dbusername = "root";
$dbpassword = "";
$dbname     = "app-db";

// Create a MySQLi connection.
$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

$currentUser = $_SESSION['username'];

// Fetch tasks (reviews) for the current buyer.
// Adjust the WHERE clause if you want to display only tasks with a review (e.g. rating IS NOT NULL OR comment != '')
$sql = "SELECT task_id, item, rating, comment, status 
        FROM tasks 
        WHERE username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $currentUser);
$stmt->execute();
$result = $stmt->get_result();
$reviews = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Manage Your Reviews</title>
    <style>
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
        a.button {
            text-decoration: none;
            padding: 6px 12px;
            background: #007BFF;
            color: #fff;
            border-radius: 4px;
            margin-right: 4px;
        }
        a.button.delete {
            background: #DC3545;
        }
    </style>
</head>
<body>
    <h1>Manage Your Reviews</h1>
    <?php if (count($reviews) > 0): ?>
        <table>
            <tr>
                <th>Task ID</th>
                <th>Item</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
            <?php foreach ($reviews as $review): ?>
                <tr>
                    <td><?php echo htmlspecialchars($review['task_id']); ?></td>
                    <td><?php echo htmlspecialchars($review['item']); ?></td>
                    <td><?php echo htmlspecialchars($review['rating']); ?></td>
                    <td><?php echo htmlspecialchars($review['comment']); ?></td>
                    <td><?php echo htmlspecialchars($review['status']); ?></td>
                    <td>
                    <td>
                        <a class="button" href="create_review.php?review=<?php echo $review['task_id']; ?>">Create Review</a>
                        <a class="button" href="update_review.php?task_id=<?php echo $review['task_id']; ?>">Update Review</a>
                        <a class="button delete" href="delete_review.php?task_id=<?php echo $review['task_id']; ?>" onclick="return confirm('Are you sure you want to delete this review?');">Delete Review</a>
                    </td>

                    </td>
                </tr>
            <?php endforeach; ?>
        </table>
    <?php else: ?>
        <p>No reviews found.</p>
    <?php endif; ?>
</body>
</html>
