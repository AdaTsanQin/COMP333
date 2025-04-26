<?php
// File: /Applications/XAMPP/xamppfiles/htdocs/WesDashAPI/tip_cancel.php
// Simply redirect back without tipping
$request_id = (int)($_GET['request_id'] ?? 0);
$appUrl = "myapp://tip-cancel?request_id={$request_id}";
echo "<script>location.href=".json_encode($appUrl).";</script>";
