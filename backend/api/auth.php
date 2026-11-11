<?php
require_once __DIR__ . "/../config/bootstrap.php";

// One-time migration: the original schema has no "role" column. Add it
// if missing, and make sure the seeded admin user actually has the Admin
// role so nothing loses access when this ships.
$roleColumn = $pdo->query("SHOW COLUMNS FROM users LIKE 'role'")->fetch();
if (!$roleColumn) {
    $pdo->exec("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'Cashier'");
    $pdo->exec("UPDATE users SET role = 'Admin' WHERE username = 'admin'");
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== "POST") {
    fail("Only POST allowed", 405);
}

$in = body();
$username = trim($in['username'] ?? '');
$password = trim($in['password'] ?? '');

if ($username === '' || $password === '') {
    fail("Username and password are required");
}

$stmt = $pdo->prepare("SELECT user_id, full_name, username, email, phone, role, password FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user) {
    fail("Invalid username or password", 401);
}

// NOTE: passwords in this demo dataset are stored in plain text.
// In production, store password_hash() output and verify with password_verify().
$valid = ($password === $user['password']) || password_verify($password, $user['password']);

if (!$valid) {
    fail("Invalid username or password", 401);
}

unset($user['password']);
respond(["user" => $user]);
