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
    die("Unauthorized access.");
}

$usernameToDelete = $_SESSION['username']; 
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $password = $_POST['password'];

    $sql = "SELECT password FROM users WHERE username = ? AND is_deleted = 0";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $usernameToDelete);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows == 1) {
        $stmt->bind_result($hashedPassword);
        $stmt->fetch();

        if (password_verify($password, $hashedPassword)) {
            $sql = "UPDATE users SET is_deleted = 1 WHERE username = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $usernameToDelete);
            
            if ($stmt->execute()) {
                session_destroy();
                header("Location: register.php?msg=account_deleted");
                exit();
            } else {
                $error = "Error deleting account.";
            }
        } else {
            $error = "Incorrect password.";
        }
    } else {
        $error = "User not found.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <title>Delete Account</title>
</head>
<body>
    <h2>Delete Your Account</h2>
    <?php if (isset($error)) echo "<p style='color:red;'>$error</p>"; ?>
    <form method="POST" action="">
        <label for="password">Enter your password to confirm:</label>
        <input type="password" name="password" required>
        <br>
        <input type="submit" value="Delete My Account">
    </form>
    <a href="dashboard.php"><button>Cancel</button></a>
</body>
</html>
