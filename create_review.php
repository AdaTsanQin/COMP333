<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration
$servername = "localhost";
$dbusername = "root";
$dbpassword = "";
$dbname = "app-db";

// Create a connection
$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Ensure the user is logged in
if (!isset($_SESSION['username'])) {
    die("Please log in.");
}

$username = $_SESSION['username'];

// Ensure task_id is provided
if (!isset($_GET['task_id'])) {
    die("No task ID provided.");
}
$task_id = $_GET['task_id'];

// Check if a review already exists for this task
$stmt = $conn->prepare("SELECT comment FROM tasks WHERE task_id = ?");
$stmt->bind_param("i", $task_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stmt->close();

// If a nonempty review already exists, do not allow creation
if ($row && trim($row['comment']) !== "") {
    die("A review already exists for this task. Please use the update functionality.");
}

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rating = $_POST['rating'] ?? '';
    $review = $_POST['review'] ?? '';
    
    // Basic validation: both fields are required
    if (empty($rating) || empty($review)) {
        die("Both rating and review are required.");
    }
    
    // Cast rating to integer (ensure it's numeric)
    $rating = (int)$rating;
    
    // Update the tasks table with the new review and rating
    $stmt = $conn->prepare("UPDATE tasks SET comment = ?, rating = ? WHERE task_id = ?");
    if (!$stmt) {
        die("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("sii", $review, $rating, $task_id);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        // Redirect back to the manage reviews page after creation
        header("Location: manage_review.php");
        exit;
    } else {
        echo "Failed to create review.";
    }
    $stmt->close();
}
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Create Review</title>
    <style>
        label {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>Create Review for Task <?php echo htmlspecialchars($task_id); ?></h1>
    <form method="POST" action="create_review.php?task_id=<?php echo urlencode($task_id); ?>">
        <label for="rating">Rating (1-5):</label><br>
        <input type="number" name="rating" id="rating" min="1" max="5" required><br><br>
        
        <label for="review">Review:</label><br>
        <textarea name="review" id="review" rows="5" cols="50" required></textarea><br><br>
        
        <button type="submit">Submit Review</button>
    </form>
    <p><a href="manage_review.php">Back to Manage Reviews</a></p>
</body>
</html>
