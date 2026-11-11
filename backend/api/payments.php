<?php
require_once __DIR__ . "/../config/bootstrap.php";

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail("Method not allowed", 405);

$sql = "SELECT p.*, s.invoice_number, s.customer_id, c.customer_name
        FROM payments p
        LEFT JOIN sales s ON s.sale_id = p.sale_id
        LEFT JOIN customers c ON c.customer_id = s.customer_id
        WHERE 1=1";
$params = [];

if (!empty($_GET['method'])) {
    $sql .= " AND p.payment_method = ?";
    $params[] = $_GET['method'];
}
if (!empty($_GET['status'])) {
    $sql .= " AND p.status = ?";
    $params[] = $_GET['status'];
}
if (!empty($_GET['date'])) {
    $sql .= " AND DATE(p.payment_date) = ?";
    $params[] = $_GET['date'];
}

$sql .= " ORDER BY p.payment_id DESC LIMIT 300";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
respond($stmt->fetchAll());
