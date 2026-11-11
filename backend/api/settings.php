<?php
require_once __DIR__ . "/../config/bootstrap.php";

/**
 * Simple key-value settings store (pharmacy name/address/phone/email,
 * logo, default tax rate, currency symbol, etc). This table isn't part
 * of the original schema, so it's created automatically the first time
 * this endpoint runs - no manual migration needed.
 */
$pdo->exec("CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Widen an already-existing table too (in case it was created by an older
// version of this file with a plain TEXT column, which is too small to
// hold a base64-encoded logo image).
try { $pdo->exec("ALTER TABLE app_settings MODIFY setting_value LONGTEXT"); } catch (Exception $e) { /* already correct type - ignore */ }

$DEFAULTS = [
    'pharmacy_name'    => 'Medicare Pharmacy',
    'pharmacy_address' => '12-B Model Town Link Road, Lahore',
    'pharmacy_phone'   => '+92 300 1234567',
    'pharmacy_email'   => 'care@medicarepharmacy.pk',
    'pharmacy_logo'    => '',
    'default_tax_rate' => '5',
    'currency_symbol'  => 'Rs',
    'receipt_footer'   => 'Thank you — get well soon!',
];

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->query("SELECT setting_key, setting_value FROM app_settings")->fetchAll();
    $settings = $DEFAULTS;
    foreach ($rows as $r) {
        $settings[$r['setting_key']] = $r['setting_value'];
    }
    respond($settings);
    exit;
}

if ($method === 'POST') {
    $in = body();
    $stmt = $pdo->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    foreach ($in as $key => $value) {
        if (!array_key_exists($key, $DEFAULTS)) continue; // ignore unknown keys
        $stmt->execute([$key, (string)$value]);
    }
    respond(["success" => true]);
    exit;
}

fail("Method not allowed", 405);
