<?php
/**
 * Common bootstrap included by every API endpoint.
 * Handles CORS (so the React frontend can be opened from any port/file),
 * JSON content type, small helper functions, and defensive error handling
 * so that ANY PHP warning/notice/fatal error still comes back as valid
 * JSON instead of breaking the response (which otherwise looks to the
 * frontend like "nothing happened" - e.g. a page that never loads).
 */

ini_set('display_errors', '0'); // never leak raw HTML error output into a JSON response
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Turn PHP warnings/notices into catchable exceptions instead of stray
// HTML output that would corrupt the JSON response.
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return false;
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// Last line of defense: if something still fatals, respond with clean JSON
// instead of a blank page or raw PHP error text.
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode(['error' => 'Server error: ' . $error['message']]);
    }
});

require_once __DIR__ . "/db.php";

/** Read JSON body of the request as an associative array */
function body(): array {
    $raw = file_get_contents("php://input");
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Send a JSON response and stop execution */
function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $status = 400): void {
    respond(["error" => $message], $status);
}

/** Generate a simple unique invoice number, e.g. INV-20260719-3841 */
function generateInvoiceNumber(string $prefix = "INV"): string {
    return $prefix . "-" . date("Ymd") . "-" . random_int(1000, 9999);
}
