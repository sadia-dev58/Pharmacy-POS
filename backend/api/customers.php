<?php
require_once __DIR__ . "/../config/bootstrap.php";

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!empty($_GET['search'])) {
            $q = '%' . $_GET['search'] . '%';
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE customer_name LIKE ? OR phone LIKE ? ORDER BY customer_name LIMIT 20");
            $stmt->execute([$q, $q]);
            respond($stmt->fetchAll());
            break;
        }
        respond($pdo->query("SELECT * FROM customers ORDER BY customer_name")->fetchAll());
        break;

    case 'POST':
        $in = body();
        if (empty($in['customer_name'])) fail("customer_name is required");
        $stmt = $pdo->prepare("INSERT INTO customers (customer_name, phone, email, gender, address) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$in['customer_name'], $in['phone'] ?? null, $in['email'] ?? null, $in['gender'] ?? null, $in['address'] ?? null]);
        respond(["customer_id" => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        $in = body();
        if (empty($in['customer_id'])) fail("customer_id is required");
        $stmt = $pdo->prepare("UPDATE customers SET customer_name=?, phone=?, email=?, gender=?, address=? WHERE customer_id=?");
        $stmt->execute([$in['customer_name'], $in['phone'] ?? null, $in['email'] ?? null, $in['gender'] ?? null, $in['address'] ?? null, $in['customer_id']]);
        respond(["success" => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) fail("id is required");
        $stmt = $pdo->prepare("DELETE FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        respond(["success" => true]);
        break;

    default:
        fail("Method not allowed", 405);
}
