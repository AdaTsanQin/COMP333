<?php
// File: /WesDashAPI/handle_balance_cancel.php
$appUrl = "myapp://recharge-cancel";
echo "<script>window.location.href=", json_encode($appUrl), ";</script>";
