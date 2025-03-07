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
    die("Please log in.");
}

$username = $_SESSION['username'];

$requestId = $_GET['request_id'] ?? null;

if (!$requestId) {
    die("Invalid request.");
}

// Handle "Dropped Off" button click
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['request_id'])) {
    $requestId = $_POST['request_id'];

    $sql = "UPDATE requests SET status = 'completed' WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $requestId);
    $stmt->execute();

    echo "<p>Order has been completed!</p>";
    exit;
}

// Fetch request details including delivery_speed
$sql = "SELECT id, status, delivery_speed FROM requests WHERE id = ? AND status = 'accepted'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $requestId);
$stmt->execute();
$result = $stmt->get_result();
$request = $result->fetch_assoc();

if (!$request) {
    die("No active request found.");
}

// Determine countdown duration based on delivery_speed
$deliverySpeed = $request['delivery_speed'] ?? 'common';
$countdownDuration = ($deliverySpeed === 'urgent') ? 10 * 60 : 20 * 60; // 10 min for urgent, 20 min for common

// Ensure $_SESSION['startTime'] is an array before using it
if (!isset($_SESSION['startTime']) || !is_array($_SESSION['startTime'])) {
    $_SESSION['startTime'] = []; // Initialize as an array if not set
}

// Start countdown timer for this specific request
if (!isset($_SESSION['startTime'][$requestId])) {
    $_SESSION['startTime'][$requestId] = time();
}

$endTime = $_SESSION['startTime'][$requestId] + $countdownDuration;
$remainingTime = $endTime - time();

if ($remainingTime <= 0) {
    $_SESSION['startTime'][$requestId] = 0;
    $remainingTime = 0;
}

$endTime = $_SESSION['startTime'][$requestId] + $countdownDuration;
$remainingTime = $endTime - time();

if ($remainingTime <= 0) {
    $_SESSION['startTime'][$requestId] = 0;
    $remainingTime = 0;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Countdown</title>
</head>
<body>
    <h1><?php echo ucfirst($deliverySpeed); ?> Delivery Countdown</h1>
    <div id="countdown">
        <?php
        if ($remainingTime > 0) {
            $minutes = floor($remainingTime / 60);
            $seconds = $remainingTime % 60;
            echo sprintf("%02d:%02d", $minutes, $seconds);
        } else {
            echo "Time's up! There is an additional charge for late deliveries.";
        }
        ?>
    </div>

    <?php if ($request): ?>
        <form method="POST">
            <input type="hidden" name="request_id" value="<?php echo $request['id']; ?>">
            <button type="submit">Dropped Off</button>
        </form>
    <?php else: ?>
        <p>No active requests.</p>
    <?php endif; ?>

    <script>
        setTimeout(function() {
            location.reload();
        }, 1000);
    </script>
</body>
</html>
