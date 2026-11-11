<?php
require_once __DIR__ . "/../config/bootstrap.php";

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $rows = $pdo->query("SELECT * FROM categories ORDER BY category_name")->fetchAll();
        respond($rows);
        break;

    case 'POST':
        $in = body();
        if (empty($in['category_name'])) fail("category_name is required");
        $stmt = $pdo->prepare("INSERT INTO categories (category_name, description) VALUES (?, ?)");
        $stmt->execute([$in['category_name'], $in['description'] ?? null]);
        respond(["category_id" => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        $in = body();
        if (empty($in['category_id'])) fail("category_id is required");
        $stmt = $pdo->prepare("UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?");
        $stmt->execute([$in['category_name'], $in['description'] ?? null, $in['category_id']]);
        respond(["success" => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) fail("id is required");
        $stmt = $pdo->prepare("DELETE FROM categories WHERE category_id = ?");
        $stmt->execute([$id]);
        respond(["success" => true]);
        break;

    default:
        fail("Method not allowed", 405);
}
