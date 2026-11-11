<?php
require_once __DIR__ . "/../config/bootstrap.php";

// Same migration as auth.php - safe to run in both places since it
// only alters the table the first time it's ever missing.
$roleColumn = $pdo->query("SHOW COLUMNS FROM users LIKE 'role'")->fetch();
if (!$roleColumn) {
    $pdo->exec("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'Cashier'");
    $pdo->exec("UPDATE users SET role = 'Admin' WHERE username = 'admin'");
}

const VALID_ROLES = ['Admin', 'Manager', 'Cashier'];

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $rows = $pdo->query("SELECT user_id, full_name, username, email, phone, role, created_at FROM users ORDER BY full_name")->fetchAll();
        respond($rows);
        break;

    case 'POST':
        $in = body();
        foreach (['full_name', 'username', 'password'] as $req) {
            if (empty($in[$req])) fail("$req is required");
        }
        $role = $in['role'] ?? 'Cashier';
        if (!in_array($role, VALID_ROLES)) fail("Invalid role - must be one of: " . implode(', ', VALID_ROLES));

        $chk = $pdo->prepare("SELECT user_id FROM users WHERE username = ?");
        $chk->execute([$in['username']]);
        if ($chk->fetch()) fail("Username already taken", 409);

        $stmt = $pdo->prepare("INSERT INTO users (full_name, username, email, phone, role, password) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $in['full_name'], $in['username'], $in['email'] ?? null, $in['phone'] ?? null, $role,
            password_hash($in['password'], PASSWORD_DEFAULT),
        ]);
        respond(["user_id" => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        $in = body();
        if (empty($in['user_id'])) fail("user_id is required");
        $role = $in['role'] ?? 'Cashier';
        if (!in_array($role, VALID_ROLES)) fail("Invalid role - must be one of: " . implode(', ', VALID_ROLES));

        // Don't allow demoting the very last remaining Admin - the app would
        // become unmanageable (no one left who can access Users/Settings).
        if ($role !== 'Admin') {
            $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
            $stmt->execute([$in['user_id']]);
            $current = $stmt->fetch();
            if ($current && $current['role'] === 'Admin') {
                $adminCount = (int)$pdo->query("SELECT COUNT(*) AS c FROM users WHERE role = 'Admin'")->fetch()['c'];
                if ($adminCount <= 1) fail("Cannot change the role of the last remaining Admin", 400);
            }
        }

        if (!empty($in['password'])) {
            $stmt = $pdo->prepare("UPDATE users SET full_name=?, email=?, phone=?, role=?, password=? WHERE user_id=?");
            $stmt->execute([$in['full_name'], $in['email'] ?? null, $in['phone'] ?? null, $role, password_hash($in['password'], PASSWORD_DEFAULT), $in['user_id']]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET full_name=?, email=?, phone=?, role=? WHERE user_id=?");
            $stmt->execute([$in['full_name'], $in['email'] ?? null, $in['phone'] ?? null, $role, $in['user_id']]);
        }
        respond(["success" => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) fail("id is required");
        $countRow = $pdo->query("SELECT COUNT(*) AS c FROM users")->fetch();
        if ((int)$countRow['c'] <= 1) fail("Cannot delete the last remaining user", 400);

        $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
        $stmt->execute([$id]);
        $target = $stmt->fetch();
        if ($target && $target['role'] === 'Admin') {
            $adminCount = (int)$pdo->query("SELECT COUNT(*) AS c FROM users WHERE role = 'Admin'")->fetch()['c'];
            if ($adminCount <= 1) fail("Cannot delete the last remaining Admin", 400);
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = ?");
        $stmt->execute([$id]);
        respond(["success" => true]);
        break;

    default:
        fail("Method not allowed", 405);
}
