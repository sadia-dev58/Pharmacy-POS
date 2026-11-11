<?php
require_once __DIR__ . "/../config/bootstrap.php";

/**
 * Returns a medicine against a specific sale_item. Restocks the returned
 * quantity back into medicine_stock automatically, and prevents returning
 * more than was actually sold (minus anything already returned for that
 * line item).
 */

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!empty($_GET['sale_id'])) {
            // Returnable items for a specific sale - used to build the return form
            respond(getReturnableItems($pdo, (int)$_GET['sale_id']));
            break;
        }

        // Full returns history, most recent first
        $rows = $pdo->query("
            SELECT r.return_id, r.sale_item_id, r.quantity, r.reason, r.return_date,
                   si.selling_price, (r.quantity * si.selling_price) AS refund_amount,
                   m.medicine_name, ms.batch_no,
                   s.sale_id, s.invoice_number, s.customer_id, c.customer_name
            FROM returns r
            JOIN sale_items si ON si.sale_item_id = r.sale_item_id
            JOIN medicine_stock ms ON ms.stock_id = si.stock_id
            JOIN medicines m ON m.medicine_id = ms.medicine_id
            JOIN sales s ON s.sale_id = si.sale_id
            LEFT JOIN customers c ON c.customer_id = s.customer_id
            ORDER BY r.return_id DESC
            LIMIT 300
        ")->fetchAll();
        respond($rows);
        break;

    case 'POST':
        $in = body();
        $items = $in['items'] ?? null;
        // Allow either a single { sale_item_id, quantity, reason } or a batch { items: [...] }
        if (!$items) {
            if (empty($in['sale_item_id']) || empty($in['quantity'])) fail("sale_item_id and quantity are required");
            $items = [$in];
        }

        $pdo->beginTransaction();
        try {
            $created = [];
            $stockStmt = $pdo->prepare("UPDATE medicine_stock SET quantity = quantity + ? WHERE stock_id = ?");
            $insertStmt = $pdo->prepare("INSERT INTO returns (sale_item_id, quantity, reason, return_date) VALUES (?, ?, ?, NOW())");

            foreach ($items as $item) {
                $saleItemId = (int)($item['sale_item_id'] ?? 0);
                $qty = (int)($item['quantity'] ?? 0);
                $reason = trim($item['reason'] ?? '');

                if (!$saleItemId || $qty <= 0) fail("Each return item needs a valid sale_item_id and quantity");

                // Look up the sale item + how much of it has already been returned
                $stmt = $pdo->prepare("SELECT si.*, ms.stock_id FROM sale_items si JOIN medicine_stock ms ON ms.stock_id = si.stock_id WHERE si.sale_item_id = ?");
                $stmt->execute([$saleItemId]);
                $saleItem = $stmt->fetch();
                if (!$saleItem) fail("Sale item {$saleItemId} not found");

                $stmt = $pdo->prepare("SELECT COALESCE(SUM(quantity),0) AS returned FROM returns WHERE sale_item_id = ?");
                $stmt->execute([$saleItemId]);
                $alreadyReturned = (int)$stmt->fetch()['returned'];

                $returnable = (int)$saleItem['quantity'] - $alreadyReturned;
                if ($qty > $returnable) {
                    fail("Cannot return {$qty} - only {$returnable} unit(s) are returnable for this item", 409);
                }

                $insertStmt->execute([$saleItemId, $qty, $reason ?: null]);
                $returnId = $pdo->lastInsertId();

                // Put the returned quantity back into stock
                $stockStmt->execute([$qty, $saleItem['stock_id']]);

                $created[] = [
                    'return_id' => $returnId,
                    'sale_item_id' => $saleItemId,
                    'quantity' => $qty,
                    'refund_amount' => round($qty * (float)$saleItem['selling_price'], 2),
                ];
            }

            $pdo->commit();
            respond(['returns' => $created], 201);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            fail("Failed to process return: " . $e->getMessage(), 500);
        }
        break;

    default:
        fail("Method not allowed", 405);
}

function getReturnableItems(PDO $pdo, int $saleId): array {
    $stmt = $pdo->prepare("SELECT s.sale_id, s.invoice_number, s.sale_date, s.customer_id, c.customer_name
        FROM sales s LEFT JOIN customers c ON c.customer_id = s.customer_id WHERE s.sale_id = ?");
    $stmt->execute([$saleId]);
    $sale = $stmt->fetch();
    if (!$sale) fail("Sale not found", 404);

    $stmt = $pdo->prepare("
        SELECT si.sale_item_id, si.stock_id, si.quantity AS quantity_sold, si.selling_price, si.total,
               m.medicine_name, m.dosage, ms.batch_no,
               COALESCE((SELECT SUM(r.quantity) FROM returns r WHERE r.sale_item_id = si.sale_item_id), 0) AS quantity_returned
        FROM sale_items si
        JOIN medicine_stock ms ON ms.stock_id = si.stock_id
        JOIN medicines m ON m.medicine_id = ms.medicine_id
        WHERE si.sale_id = ?
    ");
    $stmt->execute([$saleId]);
    $items = $stmt->fetchAll();
    foreach ($items as &$item) {
        $item['quantity_returnable'] = (int)$item['quantity_sold'] - (int)$item['quantity_returned'];
    }

    $sale['items'] = $items;
    return $sale;
}
