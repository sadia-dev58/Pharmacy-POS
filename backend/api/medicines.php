<?php
require_once __DIR__ . "/../config/bootstrap.php";

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Shared SELECT: each medicine joined with its most recent/active stock batch
 * (highest stock_id with quantity > 0, falling back to the latest batch if all are 0)
 * so the POS and inventory screens get price + quantity + reorder level in one call.
 */
const BASE_SELECT = "
    SELECT
        m.medicine_id, m.medicine_name, m.generic_name, m.brand_name, m.manufacturer,
        m.category_id, c.category_name, m.barcode, m.dosage, m.unit, m.description, m.image,
        s.stock_id, s.batch_no, s.purchase_price, s.selling_price, s.quantity,
        s.reorder_level, s.manufacture_date, s.expiry_date
    FROM medicines m
    LEFT JOIN categories c ON c.category_id = m.category_id
    LEFT JOIN (
        SELECT ms1.*
        FROM medicine_stock ms1
        INNER JOIN (
            SELECT medicine_id, MAX(stock_id) AS max_id
            FROM medicine_stock
            WHERE quantity > 0
            GROUP BY medicine_id
        ) latest ON latest.medicine_id = ms1.medicine_id AND latest.max_id = ms1.stock_id
    ) s ON s.medicine_id = m.medicine_id
";

switch ($method) {
    case 'GET':
        if (!empty($_GET['barcode'])) {
            // Barcode scan lookup - used directly by the POS scanner.
            // TRIM() on both sides guards against stray whitespace some
            // scanners/cameras append to the decoded value.
            $scannedBarcode = trim($_GET['barcode']);
            $stmt = $pdo->prepare(BASE_SELECT . " WHERE TRIM(m.barcode) = ? LIMIT 1");
            $stmt->execute([$scannedBarcode]);
            $row = $stmt->fetch();
            if (!$row) fail("No medicine found for barcode " . $scannedBarcode, 404);
            respond($row);
            break;
        }

        if (!empty($_GET['id'])) {
            $stmt = $pdo->prepare(BASE_SELECT . " WHERE m.medicine_id = ? LIMIT 1");
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) fail("Medicine not found", 404);
            respond($row);
            break;
        }

        if (!empty($_GET['search'])) {
            $q = '%' . $_GET['search'] . '%';
            $stmt = $pdo->prepare(BASE_SELECT . " WHERE m.medicine_name LIKE ? OR m.generic_name LIKE ? OR m.brand_name LIKE ? OR m.barcode LIKE ? ORDER BY m.medicine_name LIMIT 50");
            $stmt->execute([$q, $q, $q, $q]);
            respond($stmt->fetchAll());
            break;
        }

        $rows = $pdo->query(BASE_SELECT . " ORDER BY m.medicine_name")->fetchAll();
        respond($rows);
        break;

    case 'POST':
        // Create a new medicine, optionally with an initial stock batch
        $in = body();
        foreach (['medicine_name'] as $req) {
            if (empty($in[$req])) fail("$req is required");
        }
        if (!empty($in['barcode'])) {
            $chk = $pdo->prepare("SELECT medicine_id FROM medicines WHERE barcode = ?");
            $chk->execute([$in['barcode']]);
            if ($chk->fetch()) fail("Barcode already exists for another medicine", 409);
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO medicines
                (medicine_name, generic_name, brand_name, manufacturer, category_id, barcode, dosage, unit, description, image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $in['medicine_name'], $in['generic_name'] ?? null, $in['brand_name'] ?? null,
                $in['manufacturer'] ?? null, $in['category_id'] ?? null, $in['barcode'] ?? null,
                $in['dosage'] ?? null, $in['unit'] ?? null, $in['description'] ?? null, $in['image'] ?? null,
            ]);
            $medicineId = $pdo->lastInsertId();

            if (!empty($in['selling_price'])) {
                $stmt = $pdo->prepare("INSERT INTO medicine_stock
                    (medicine_id, supplier_id, batch_no, purchase_price, selling_price, quantity, reorder_level, manufacture_date, expiry_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $medicineId, $in['supplier_id'] ?? null, $in['batch_no'] ?? null,
                    $in['purchase_price'] ?? 0, $in['selling_price'], $in['quantity'] ?? 0,
                    $in['reorder_level'] ?? 10, $in['manufacture_date'] ?? null, $in['expiry_date'] ?? null,
                ]);
            }

            $pdo->commit();
            respond(["medicine_id" => $medicineId], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            fail("Failed to create medicine: " . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        $in = body();
        if (empty($in['medicine_id'])) fail("medicine_id is required");
        $stmt = $pdo->prepare("UPDATE medicines SET
            medicine_name = ?, generic_name = ?, brand_name = ?, manufacturer = ?,
            category_id = ?, barcode = ?, dosage = ?, unit = ?, description = ?
            WHERE medicine_id = ?");
        $stmt->execute([
            $in['medicine_name'], $in['generic_name'] ?? null, $in['brand_name'] ?? null,
            $in['manufacturer'] ?? null, $in['category_id'] ?? null, $in['barcode'] ?? null,
            $in['dosage'] ?? null, $in['unit'] ?? null, $in['description'] ?? null, $in['medicine_id'],
        ]);

        // Optional: update the linked stock batch (price/quantity) in the same call
        if (!empty($in['stock_id'])) {
            $stmt = $pdo->prepare("UPDATE medicine_stock SET
                selling_price = ?, purchase_price = ?, quantity = ?, reorder_level = ?, expiry_date = ?
                WHERE stock_id = ?");
            $stmt->execute([
                $in['selling_price'] ?? 0, $in['purchase_price'] ?? 0, $in['quantity'] ?? 0,
                $in['reorder_level'] ?? 10, $in['expiry_date'] ?? null, $in['stock_id'],
            ]);
        }

        respond(["success" => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) fail("id is required");
        $stmt = $pdo->prepare("DELETE FROM medicines WHERE medicine_id = ?");
        $stmt->execute([$id]);
        respond(["success" => true]);
        break;

    default:
        fail("Method not allowed", 405);
}
