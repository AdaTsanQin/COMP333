<?php
// products.php
// Proxy endpoint for Kroger Products API inside WesDashAPI/

// enable error reportting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Load Kroger credentials
$clientId     = "wesdash-24326124303424454c716451675273425043765356732f4534447a474f4e30792e655a50776956694476504a76446a567757545a436c5349777678575237036709938591960"; 
$clientSecret = "0wfdd7sTL0diHDJJ4KOkYys2irHzB61iFS4bJhkw"; 
$cacheFile    = __DIR__ . '/kroger_token_cache.json';

// Check if credentials are set
if (empty($clientId) || 
    empty($clientSecret)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'missing_credentials',
        'message' => 'Kroger API credentials are not configured. Please update the clientId and clientSecret in products.php.'
    ]);
    exit;
}

/**
 * Retrieve a valid Kroger access token, using a cache file to avoid frequent token requests.
 */
function getAccessToken($clientId, $clientSecret, $cacheFile) {
    // Try to load cached token
    if (file_exists($cacheFile)) {
        $json = @file_get_contents($cacheFile);
        $tokenData = json_decode($json, true);
        if (isset($tokenData['access_token'], $tokenData['expires_at']) && $tokenData['expires_at'] > time() + 60) {
            return $tokenData['access_token'];
        }
    }

    // Request new token via OAuth2 client credentials
    $credentials = base64_encode("$clientId:$clientSecret");
    $postFields = http_build_query([
        'grant_type' => 'client_credentials',
        'scope'      => 'product.compact'
    ]);

    $ch = curl_init('https://api.kroger.com/v1/connect/oauth2/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Basic {$credentials}",
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if (curl_errno($ch)) {
        http_response_code(500);
        echo json_encode(['error' => 'token_request_failed', 'message' => curl_error($ch)]);
        exit;
    }
    if ($httpCode !== 200) {
        http_response_code(500);
        echo json_encode([
            'error' => 'token_request_http_error', 
            'status' => $httpCode,
            'message' => "HTTP error during token request: $httpCode",
            'response' => $response
        ]);
        exit;
    }
    curl_close($ch);

    $data = json_decode($response, true);
    if (!isset($data['access_token'], $data['expires_in'])) {
        http_response_code(500);
        echo json_encode(['error' => 'invalid_token_response', 'message' => $response]);
        exit;
    }

    // Cache token with expiry timestamp
    $tokenData = [
        'access_token' => $data['access_token'],
        'expires_at'   => time() + $data['expires_in']
    ];
    file_put_contents($cacheFile, json_encode($tokenData));

    return $data['access_token'];
}

// Get or refresh access token
$accessToken = getAccessToken($clientId, $clientSecret, $cacheFile);

// Build query parameters for the Kroger Products API
$params = [];
if (!empty($_GET['term']))          $params['filter.term']        = $_GET['term'];
if (!empty($_GET['locationId']))    $params['filter.locationId']  = $_GET['locationId'];
if (!empty($_GET['limit']))         $params['filter.limit']       = $_GET['limit'];
if (!empty($_GET['fulfillment']))   $params['filter.fulfillment'] = $_GET['fulfillment'];

$queryString = http_build_query($params);
$url = "https://api.kroger.com/v1/products?{$queryString}";

// Fetch products from Kroger
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer {$accessToken}",
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'products_request_failed', 'message' => curl_error($ch)]);
    exit;
}
curl_close($ch);

// For debugging purposes, log the API request and response
error_log("Kroger API URL: $url");
error_log("Kroger API Response Code: $httpCode");
error_log("Kroger API Response: $response");

// Check for successful response
if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'error' => 'products_api_error',
        'status' => $httpCode,
        'message' => "Kroger API returned error $httpCode",
        'response' => json_decode($response, true)
    ]);
    exit;
}

// Relay Kroger's successful response
http_response_code(200);
echo $response;

?>