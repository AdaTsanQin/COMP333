<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if the user is logged in.
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

// --- PROCESS REVIEW SUBMISSION ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_review'])) {
    $taskId  = intval($_POST['task_id']);
    $rating  = intval($_POST['rating']);
    $comment = $_POST['comment'] ?? '';

    // Check if the order is completed.
    $sqlCheck = "SELECT status FROM tasks WHERE task_id = ? AND username = ?";
    $stmtCheck = $conn->prepare($sqlCheck);
    $stmtCheck->bind_param("is", $taskId, $currentUser);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();
    $row = $resultCheck->fetch_assoc();
    $stmtCheck->close();

    if (!$row || $row['status'] !== 'completed') {
        echo "Order not completed. You cannot add a review.";
    } else {
        // Update the tasks table with the review.
        $sqlUpdate = "UPDATE tasks SET rating = ?, comment = ? WHERE task_id = ? AND username = ?";
        $stmtUpdate = $conn->prepare($sqlUpdate);
        $stmtUpdate->bind_param("isis", $rating, $comment, $taskId, $currentUser);
        if ($stmtUpdate->execute()) {
            header("Location: manage_review.php");
            exit;
        } else {
            die("Error updating review: " . $stmtUpdate->error);
        }
        $stmtUpdate->close();
    }
}

// --- FETCH ORDERS for the current buyer ---
$sqlTasks = "SELECT task_id, dashername, status, rating, comment FROM tasks WHERE username = ?";
$stmtTasks = $conn->prepare($sqlTasks);
$stmtTasks->bind_param("s", $currentUser);
$stmtTasks->execute();
$resultTasks = $stmtTasks->get_result();
$tasks = $resultTasks->fetch_all(MYSQLI_ASSOC);
$stmtTasks->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your Claimed & Completed Orders</title>
    <style>
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #999; }
        th, td { padding: 8px; text-align: left; }
    </style>
</head>
<body>
<h1>Review your Dashers</h1>
<table>
    <tr>
        <th>Task ID</th>
        <th>Dasher</th>
        <th>Status</th>
        <th>Rating</th>
        <th>Comment</th>
        <th>Action</th>
    </tr>
    <?php foreach ($tasks as $task): ?>
        <tr>
            <td><?php echo htmlspecialchars($task['task_id']); ?></td>
            <td><?php echo htmlspecialchars($task['dashername']); ?></td>
            <td><?php echo htmlspecialchars($task['status']); ?></td>
            <td><?php echo htmlspecialchars($task['rating']); ?></td>
            <td><?php echo htmlspecialchars($task['comment']); ?></td>
            <td>
                <!-- Link to add review; passes the task_id as a GET parameter -->
                <a href="create_review.php?review=<?php echo $task['task_id']; ?>">Add Review</a>
            </td>
        </tr>
    <?php endforeach; ?>
</table>

<?php
// --- SHOW REVIEW FORM if GET parameter 'review' is set ---
if (isset($_GET['review'])) {
    $taskId = intval($_GET['review']);
    // Retrieve the specific task to check its status.
    $sqlTask = "SELECT status, rating, comment FROM tasks WHERE task_id = ? AND username = ?";
    $stmtTask = $conn->prepare($sqlTask);
    $stmtTask->bind_param("is", $taskId, $currentUser);
    $stmtTask->execute();
    $resultTask = $stmtTask->get_result();
    $taskData = $resultTask->fetch_assoc();
    $stmtTask->close();

    if (!$taskData) {
        echo "<p>Task not found.</p>";
    } else {
        if ($taskData['status'] !== 'completed') {
            echo "<p>Order not completed. Cannot add review.</p>";
        } else {
            ?>
            <h2>Add/Edit Review for Order <?php echo $taskId; ?></h2>
            <form method="POST" action="create_review.php">
                <input type="hidden" name="task_id" value="<?php echo $taskId; ?>">
                <label for="rating">Rating (1-5):</label>
                <input type="number" name="rating" id="rating" min="1" max="5" required 
                       value="<?php echo htmlspecialchars($taskData['rating']); ?>"><br><br>
                <label for="comment">Comment (optional):</label><br>
                <textarea name="comment" id="comment" rows="4" cols="50"><?php echo htmlspecialchars($taskData['comment']); ?></textarea><br><br>
                <button type="submit" name="submit_review">Submit Review</button>
            </form>
            <?php
        }
    }
}

$conn->close();
?>
</body>
</html>
