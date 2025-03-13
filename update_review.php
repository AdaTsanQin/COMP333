<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Ensure the user is logged in.
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit;
}

$currentUser = $_SESSION['username'];

$servername = "127.0.0.1";
$dbusername = "root";
$dbpassword = "";
$dbname     = "app-db";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Ensure task_id is provided via GET.
if (!isset($_GET['task_id'])) {
    die("No task ID provided.");
}

$taskId = intval($_GET['task_id']);

// Process form submission.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_update'])) {
    $rating  = intval($_POST['rating']);
    $comment = $_POST['comment'] ?? '';

    // Update the review in the tasks table.
    $sqlUpdate = "UPDATE tasks SET rating = ?, comment = ? WHERE task_id = ? AND username = ?";
    $stmt = $conn->prepare($sqlUpdate);
    if (!$stmt) {
        die("Update prepare failed: " . $conn->error);
    }
    $stmt->bind_param("isis", $rating, $comment, $taskId, $currentUser);
    if ($stmt->execute()) {
        // Redirect to manage.php after a successful update.
        header("Location: manage_review.php");
        exit;
    } else {
        die("Update failed: " . $stmt->error);
    }
    $stmt->close();
}

// If not a POST, fetch the current review details to pre-fill the form.
$sqlFetch = "SELECT rating, comment FROM tasks WHERE task_id = ? AND username = ?";
$stmtFetch = $conn->prepare($sqlFetch);
if (!$stmtFetch) {
    die("Fetch prepare failed: " . $conn->error);
}
$stmtFetch->bind_param("is", $taskId, $currentUser);
$stmtFetch->execute();
$result = $stmtFetch->get_result();
$review = $result->fetch_assoc();
$stmtFetch->close();
$conn->close();

if (!$review) {
    die("Review not found or you do not have permission to edit this review.");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Update Review</title>
    <style>
        form {
            max-width: 500px;
            margin: auto;
        }
        label {
            display: block;
            margin-top: 10px;
        }
        input[type="number"],
        textarea {
            width: 100%;
            padding: 8px;
            margin-top: 4px;
        }
        button {
            margin-top: 10px;
            padding: 8px 16px;
        }
    </style>
</head>
<body>
    <h1>Update Your Review</h1>
    <form method="POST" action="update_review.php?task_id=<?php echo $taskId; ?>">
        <label for="rating">Rating (1-5):</label>
        <input type="number" name="rating" id="rating" min="1" max="5" required value="<?php echo htmlspecialchars($review['rating']); ?>">
        
        <label for="comment">Comment (optional):</label>
        <textarea name="comment" id="comment" rows="4" cols="50"><?php echo htmlspecialchars($review['comment']); ?></textarea>
        
        <button type="submit" name="submit_update">Update Review</button>
    </form>
</body>
</html>
