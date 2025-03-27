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

if (isset($_SESSION['username'])) {
    echo "You are already logged in as " . $_SESSION['username'] . ".";
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        die("Username and password cannot be empty.");
    }

    // Check if the user exists and retrieve is_deleted status
    $sql = "SELECT password, is_deleted FROM users WHERE username = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        die("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows === 1) {
        $stmt->bind_result($hashedPassword, $is_deleted);
        $stmt->fetch();

        if ($is_deleted == 1) {
            echo "This account has been deleted and cannot be accessed.";
        } elseif (password_verify($password, $hashedPassword)) {
            $_SESSION['username'] = $username;
            header("Location: dashboard.php");
            exit;
        } else {
            echo "Invalid password. Please try again.";
        }
    } else {
        echo "Username not found. Please register or try again.";
    }

    $stmt->close();
}

$conn->close();
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>WesDash Login</title>
</head>
<body>
<h2>Login to WesDash</h2>
<form method="POST" action="login.php">
    <label for="username">Username:</label>
    <input type="text" name="username" required><br><br>

    <label for="password">Password:</label>
    <input type="password" name="password" required><br><br>

    <button type="submit">Log In</button>
</form>

<p>Don't have an account? <a href="register.php">Register here</a>.</p>
</body>
</html>
