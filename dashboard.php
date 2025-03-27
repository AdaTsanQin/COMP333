<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit;
}

$username = $_SESSION['username'];
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
    </style>
</head>
<body>
    <h1>Welcome to WesDash, <?php echo htmlspecialchars($username); ?>!</h1>

    <nav>
        <a href="create_requests.php">Make Order</a>
        <a href="delete_requests.php">Delete Order</a>
        <a href="manage_review.php">Manage Reviews</a>
        <a href="read.php">View My Orders</a>
        <a href="dashboard.php">Dashboard</a>
        <a href="logout.php">Logout</a>
        <a href="delete_user.php">Delete Account</a>
    </nav>

    <p>Welcome to your dashboard! Use the links above to manage your orders.</p>
</body>
</html>
