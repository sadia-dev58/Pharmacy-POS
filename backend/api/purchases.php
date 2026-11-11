<?php
require_once __DIR__ . "/../config/bootstrap.php";

/**
 * Purchases represent stock bought in from a supplier. Creating a purchase
 * with line items also creates a new medicine_stock batch for each item
 * (same as a restock) and links it via purchase_items.stock_id, so the
 * new stock immediately becomes sellable in the POS.
 */

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!empty($_GET['id'])) {
            respond(getPurchaseWithItems($pdo, (int)$_GET['id']));
            break;
        }
        $rows = $pdo->query("
            SELECT p.*, s.company_name AS supplier_name
            FROM purchases p LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
            ORDER BY p.purchase_id DESC LIMIT 200
        ")->fetchAll();
        respond($rows);
        break;

    case 'POST':
        $in = body();
        $items = $in['items'] ?? [];
        if (empty($items)) fail("Purchase items are required");
        if (empty($in['supplier_id'])) fail("supplier_id is required");

        $pdo->beginTransaction();
        try {
            $subtotal = 0;
            foreach ($items as $it) {
                $subtotal += (float)$it['purchase_price'] * (int)$it['quantity'];
            }
            $discount = (float)($in['discount'] ?? 0);
            $tax = (float)($in['tax'] ?? 0);
            $total = round($subtotal - $discount + $tax, 2);
            $invoiceNumber = generateInvoiceNumber("PUR");

            $stmt = $pdo->prepare("INSERT INTO purchases
                (supplier_id, invoice_number, purchase_date, subtotal, discount, tax, total_amount, payment_method, payment_status)
                VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $in['supplier_id'], $invoiceNumber, $subtotal, $discount, $tax, $total,
                $in['payment_method'] ?? 'Cash', $in['payment_status'] ?? 'Paid',
            ]);
            $purchaseId = $pdo->lastInsertId();

            $stockStmt = $pdo->prepare("INSERT INTO medicine_stock
                (medicine_id, supplier_id, batch_no, purchase_price, selling_price, quantity, reorder_level, manufacture_date, expiry_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $itemStmt = $pdo->prepare("INSERT INTO purchase_items (purchase_id, stock_id, quantity, purchase_price, total) VALUES (?, ?, ?, ?, ?)");

            foreach ($items as $it) {
                $qty = (int)$it['quantity'];
                $purchasePrice = (float)$it['purchase_price'];
                $stockStmt->execute([
                    $it['medicine_id'], $in['supplier_id'], $it['batch_no'] ?? null,
                    $purchasePrice, $it['selling_price'] ?? $purchasePrice, $qty,
                    $it['reorder_level'] ?? 10, $it['manufacture_date'] ?? null, $it['expiry_date'] ?? null,
                ]);
                $newStockId = $pdo->lastInsertId();
                $itemStmt->execute([$purchaseId, $newStockId, $qty, $purchasePrice, round($purchasePrice * $qty, 2)]);
            }

            $pdo->commit();
            respond(getPurchaseWithItems($pdo, $purchaseId), 201);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            fail("Failed to record purchase: " . $e->getMessage(), 500);
        }
        break;

    default:
        fail("Method not allowed", 405);
}

function getPurchaseWithItems(PDO $pdo, int $purchaseId): array {
    $stmt = $pdo->prepare("SELECT p.*, s.company_name AS supplier_name, s.phone AS supplier_phone
        FROM purchases p LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id WHERE p.purchase_id = ?");
    $stmt->execute([$purchaseId]);
    $purchase = $stmt->fetch();
    if (!$purchase) fail("Purchase not found", 404);

    $stmt = $pdo->prepare("SELECT pi.*, m.medicine_name, ms.batch_no, ms.expiry_date
        FROM purchase_items pi
        JOIN medicine_stock ms ON ms.stock_id = pi.stock_id
        JOIN medicines m ON m.medicine_id = ms.medicine_id
        WHERE pi.purchase_id = ?");
    $stmt->execute([$purchaseId]);
    $purchase['items'] = $stmt->fetchAll();

    return $purchase;
}
