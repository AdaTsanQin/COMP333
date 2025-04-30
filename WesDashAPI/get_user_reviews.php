<?php
// Start session
if (isset($_GET['PHPSESSID'])) {
    session_id($_GET['PHPSESSID']);
}
session_start();

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Please log in to view your reviews'
    ]);
    exit;
}

$username = $_SESSION['username'];

// Connect to database
try {
    $conn = new mysqli('localhost', 'root', '', 'app-db');
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    // For debugging - list all reviews
    $all_reviews_query = "SELECT * FROM reviews";
    $all_reviews_result = $conn->query($all_reviews_query);
    $all_reviews = [];
    if ($all_reviews_result) {
        while ($row = $all_reviews_result->fetch_assoc()) {
            $all_reviews[] = $row;
        }
    }
    
    // For debugging - list all completed requests
    $requests_query = "SELECT * FROM requests WHERE status = 'completed'";
    $requests_result = $conn->query($requests_query);
    $completed_requests = [];
    if ($requests_result) {
        while ($row = $requests_result->fetch_assoc()) {
            $completed_requests[] = $row;
        }
    }
    
    // List all user's completed requests that don't have reviews yet
    $completed_no_review_query = "
        SELECT 
            r.id as task_id,
            r.username,
            r.item,
            r.status,
            r.accepted_by as dashername,
            r.created_at,
            NULL as rating,
            NULL as comment,
            'false' as has_review
        FROM 
            requests r
        LEFT JOIN
            reviews rev ON r.id = rev.order_id
        WHERE 
            r.username = ? AND 
            r.status = 'completed' AND
            rev.id IS NULL
    ";
    
    $stmt = $conn->prepare($completed_no_review_query);
    if (!$stmt) {
        throw new Exception("Prepare failed (1): " . $conn->error);
    }
    
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $no_review_result = $stmt->get_result();
    
    $no_review_tasks = [];
    while ($row = $no_review_result->fetch_assoc()) {
        $timestamp = strtotime($row['created_at']);
        $row['created_at'] = date('M d, Y H:i', $timestamp);
        $no_review_tasks[] = $row;
    }
    $stmt->close();
    
    // Get all user's requests that have reviews
    $with_review_query = "
        SELECT 
            r.id as task_id,
            r.username,
            r.item,
            r.status,
            r.accepted_by as dashername,
            rev.created_at,
            rev.rating,
            rev.review_text as comment,
            'true' as has_review,
            rev.id as review_id
        FROM 
            reviews rev
        JOIN 
            requests r ON rev.order_id = r.id
        WHERE 
            r.username = ?
        ORDER BY 
            rev.created_at DESC
    ";
    
    $stmt = $conn->prepare($with_review_query);
    if (!$stmt) {
        throw new Exception("Prepare failed (2): " . $conn->error);
    }
    
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $with_review_result = $stmt->get_result();
    
    $with_review_tasks = [];
    while ($row = $with_review_result->fetch_assoc()) {
        $timestamp = strtotime($row['created_at']);
        $row['created_at'] = date('M d, Y H:i', $timestamp);
        $with_review_tasks[] = $row;
    }
    
    // Combine both types of tasks
    $all_tasks = array_merge($with_review_tasks, $no_review_tasks);
    
    echo json_encode([
        'success' => true,
        'tasks' => $all_tasks,
        'debug' => [
            'all_reviews' => $all_reviews,
            'completed_requests' => $completed_requests
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error fetching user reviews: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load reviews: ' . $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>