<?php
require_once __DIR__ . "/../config/bootstrap.php";

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        if (!empty($_GET['id'])) {
            respond(getSaleWithItems($pdo, (int)$_GET['id']));
            break;
        }

        // List sales, most recent first.
        // Existing single-day filter (?date=2026-07-19) is unchanged.
        // New: optional ?from=&to= date-range filter, used by the Report
        // Generator's Sales Report - additive, does not affect any
        // existing caller that doesn't pass these params.
        $sql = "SELECT s.*, c.customer_name, c.phone AS customer_phone
                FROM sales s LEFT JOIN customers c ON c.customer_id = s.customer_id";
        $params = [];
        $limit = 200;
        if (!empty($_GET['date'])) {
            $sql .= " WHERE DATE(s.sale_date) = ?";
            $params[] = $_GET['date'];
        } elseif (!empty($_GET['from']) || !empty($_GET['to'])) {
            $conditions = [];
            if (!empty($_GET['from'])) { $conditions[] = "DATE(s.sale_date) >= ?"; $params[] = $_GET['from']; }
            if (!empty($_GET['to']))   { $conditions[] = "DATE(s.sale_date) <= ?"; $params[] = $_GET['to']; }
            $sql .= " WHERE " . implode(" AND ", $conditions);
            $limit = 2000; // reports need more history than the recent-activity views
        }
        $sql .= " ORDER BY s.sale_id DESC LIMIT " . (int)$limit;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        respond($stmt->fetchAll());
        break;

    case 'POST':
        $in = body();
        $items = $in['items'] ?? [];
        if (empty($items)) fail("Cart items are required");

        $customerId    = $in['customer_id'] ?? null;
        $discount      = (float)($in['discount'] ?? 0);
        $taxRate       = (float)($in['tax_rate'] ?? 0); // percent
        $paymentMethod = $in['payment_method'] ?? 'Cash';
        $amountPaid    = (float)($in['amount_paid'] ?? 0);

        if (!in_array($paymentMethod, ['Cash', 'Card', 'Online'])) {
            fail("Invalid payment_method");
        }

        $pdo->beginTransaction();
        try {
            // 1. Validate stock + compute totals server-side (never trust client prices)
            $subtotal = 0;
            $lineItems = [];
            foreach ($items as $item) {
                $stockId  = (int)$item['stock_id'];
                $qty      = (int)$item['quantity'];
                if ($qty <= 0) fail("Invalid quantity for stock_id {$stockId}");

                $stmt = $pdo->prepare("SELECT * FROM medicine_stock WHERE stock_id = ? FOR UPDATE");
                $stmt->execute([$stockId]);
                $stock = $stmt->fetch();
                if (!$stock) fail("Stock item {$stockId} not found");
                if ($stock['quantity'] < $qty) {
                    fail("Insufficient stock for item (available: {$stock['quantity']}, requested: {$qty})", 409);
                }

                $price = (float)$stock['selling_price'];
                $lineTotal = round($price * $qty, 2);
                $subtotal += $lineTotal;

                $lineItems[] = [
                    'stock_id' => $stockId,
                    'quantity' => $qty,
                    'selling_price' => $price,
                    'total' => $lineTotal,
                ];
            }

            $taxAmount   = round(($subtotal - $discount) * ($taxRate / 100), 2);
            $totalAmount = round($subtotal - $discount + $taxAmount, 2);
            $changeReturn = round($amountPaid - $totalAmount, 2);

            if ($paymentMethod === 'Cash' && $amountPaid < $totalAmount) {
                fail("Amount paid is less than total amount due", 400);
            }

            // 2. Insert sale header
            $invoiceNumber = generateInvoiceNumber();
            $stmt = $pdo->prepare("INSERT INTO sales
                (invoice_number, customer_id, sale_date, subtotal, discount, tax, total_amount, payment_method, amount_paid, change_return)
                VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $invoiceNumber, $customerId, $subtotal, $discount, $taxAmount,
                $totalAmount, $paymentMethod, $amountPaid, max($changeReturn, 0),
            ]);
            $saleId = $pdo->lastInsertId();

            // 3. Insert sale items + decrement stock
            $itemStmt  = $pdo->prepare("INSERT INTO sale_items (sale_id, stock_id, quantity, selling_price, total) VALUES (?, ?, ?, ?, ?)");
            $stockStmt = $pdo->prepare("UPDATE medicine_stock SET quantity = quantity - ? WHERE stock_id = ?");
            foreach ($lineItems as $li) {
                $itemStmt->execute([$saleId, $li['stock_id'], $li['quantity'], $li['selling_price'], $li['total']]);
                $stockStmt->execute([$li['quantity'], $li['stock_id']]);
            }

            // 4. Insert payment record
            $stmt = $pdo->prepare("INSERT INTO payments (sale_id, payment_method, amount, payment_date, transaction_id, status)
                VALUES (?, ?, ?, NOW(), ?, 'Success')");
            $stmt->execute([$saleId, $paymentMethod, $totalAmount, $in['transaction_id'] ?? ('TXN' . $saleId . time())]);

            $pdo->commit();
            respond(getSaleWithItems($pdo, $saleId), 201);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            fail("Checkout failed: " . $e->getMessage(), 500);
        }
        break;

    default:
        fail("Method not allowed", 405);
}

function getSaleWithItems(PDO $pdo, int $saleId): array {
    $stmt = $pdo->prepare("SELECT s.*, c.customer_name, c.phone AS customer_phone, c.address AS customer_address
        FROM sales s LEFT JOIN customers c ON c.customer_id = s.customer_id WHERE s.sale_id = ?");
    $stmt->execute([$saleId]);
    $sale = $stmt->fetch();
    if (!$sale) fail("Sale not found", 404);

    $stmt = $pdo->prepare("SELECT si.*, m.medicine_name, m.dosage, m.unit, m.barcode
        FROM sale_items si
        JOIN medicine_stock ms ON ms.stock_id = si.stock_id
        JOIN medicines m ON m.medicine_id = ms.medicine_id
        WHERE si.sale_id = ?");
    $stmt->execute([$saleId]);
    $sale['items'] = $stmt->fetchAll();

    return $sale;
}
