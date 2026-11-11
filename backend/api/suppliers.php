<?php
require_once __DIR__ . "/../config/bootstrap.php";

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        respond($pdo->query("SELECT * FROM suppliers ORDER BY company_name")->fetchAll());
        break;

    case 'POST':
        $in = body();
        if (empty($in['company_name'])) fail("company_name is required");
        $stmt = $pdo->prepare("INSERT INTO suppliers (company_name, contact_person, phone, email, address, city) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$in['company_name'], $in['contact_person'] ?? null, $in['phone'] ?? null, $in['email'] ?? null, $in['address'] ?? null, $in['city'] ?? null]);
        respond(["supplier_id" => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        $in = body();
        if (empty($in['supplier_id'])) fail("supplier_id is required");
        $stmt = $pdo->prepare("UPDATE suppliers SET company_name=?, contact_person=?, phone=?, email=?, address=?, city=? WHERE supplier_id=?");
        $stmt->execute([$in['company_name'], $in['contact_person'] ?? null, $in['phone'] ?? null, $in['email'] ?? null, $in['address'] ?? null, $in['city'] ?? null, $in['supplier_id']]);
        respond(["success" => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) fail("id is required");
        $stmt = $pdo->prepare("DELETE FROM suppliers WHERE supplier_id = ?");
        $stmt->execute([$id]);
        respond(["success" => true]);
        break;

    default:
        fail("Method not allowed", 405);
}
