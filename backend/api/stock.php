<?php
require_once __DIR__ . "/../config/bootstrap.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!empty($_GET['all'])) {
        // Full batch-level inventory view across all medicines
        $rows = $pdo->query("
            SELECT s.*, m.medicine_name, m.dosage, m.unit, m.barcode, c.category_name, sup.company_name AS supplier_name
            FROM medicine_stock s
            JOIN medicines m ON m.medicine_id = s.medicine_id
            LEFT JOIN categories c ON c.category_id = m.category_id
            LEFT JOIN suppliers sup ON sup.supplier_id = s.supplier_id
            ORDER BY s.stock_id DESC
        ")->fetchAll();
        respond($rows);
        exit;
    }

    // Full batch history for one medicine
    $medicineId = $_GET['medicine_id'] ?? null;
    if (!$medicineId) fail("medicine_id is required");
    $stmt = $pdo->prepare("SELECT * FROM medicine_stock WHERE medicine_id = ? ORDER BY stock_id DESC");
    $stmt->execute([$medicineId]);
    respond($stmt->fetchAll());
    exit;
}

if ($method === 'POST') {
    // Add a new batch (restock)
    $in = body();
    foreach (['medicine_id', 'selling_price', 'quantity'] as $req) {
        if (!isset($in[$req]) || $in[$req] === '') fail("$req is required");
    }

    $stmt = $pdo->prepare("INSERT INTO medicine_stock
        (medicine_id, supplier_id, batch_no, purchase_price, selling_price, quantity, reorder_level, manufacture_date, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $in['medicine_id'], $in['supplier_id'] ?? null, $in['batch_no'] ?? null,
        $in['purchase_price'] ?? 0, $in['selling_price'], $in['quantity'],
        $in['reorder_level'] ?? 10, $in['manufacture_date'] ?? null, $in['expiry_date'] ?? null,
    ]);
    respond(["stock_id" => $pdo->lastInsertId()], 201);
    exit;
}

fail("Method not allowed", 405);
