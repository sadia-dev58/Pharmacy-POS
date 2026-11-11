<?php
require_once __DIR__ . "/../config/bootstrap.php";

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail("Method not allowed", 405);

$todaySales = $pdo->query("SELECT COALESCE(SUM(total_amount),0) AS total, COUNT(*) AS count
    FROM sales WHERE DATE(sale_date) = CURDATE()")->fetch();

// Revenue Section — today / this week / this month
$weekSales = $pdo->query("SELECT COALESCE(SUM(total_amount),0) AS total
    FROM sales WHERE YEARWEEK(sale_date, 1) = YEARWEEK(CURDATE(), 1)")->fetch();

$monthSales = $pdo->query("SELECT COALESCE(SUM(total_amount),0) AS total
    FROM sales WHERE YEAR(sale_date) = YEAR(CURDATE()) AND MONTH(sale_date) = MONTH(CURDATE())")->fetch();

$totalMedicines = $pdo->query("SELECT COUNT(*) AS c FROM medicines")->fetch()['c'];

$lowStock = $pdo->query("SELECT m.medicine_id, m.medicine_name, s.quantity, s.reorder_level
    FROM medicine_stock s JOIN medicines m ON m.medicine_id = s.medicine_id
    WHERE s.quantity <= s.reorder_level ORDER BY s.quantity ASC")->fetchAll();

$expiringSoon = $pdo->query("SELECT m.medicine_name, s.batch_no, s.expiry_date, s.quantity
    FROM medicine_stock s JOIN medicines m ON m.medicine_id = s.medicine_id
    WHERE s.expiry_date IS NOT NULL AND s.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
    ORDER BY s.expiry_date ASC")->fetchAll();

$recentSales = $pdo->query("SELECT s.sale_id, s.invoice_number, s.total_amount, s.payment_method, s.sale_date, c.customer_name
    FROM sales s LEFT JOIN customers c ON c.customer_id = s.customer_id
    ORDER BY s.sale_id DESC LIMIT 8")->fetchAll();

// Inventory Overview — total remaining quantity per medicine, classified into
// In Stock / Low Stock (<=5) / Out of Stock (0), and the same list doubles as
// the "automatic notification" feed for the dashboard.
$perMedicineQty = $pdo->query("
    SELECT m.medicine_id, m.medicine_name, COALESCE(SUM(s.quantity), 0) AS total_qty
    FROM medicines m
    LEFT JOIN medicine_stock s ON s.medicine_id = m.medicine_id
    GROUP BY m.medicine_id, m.medicine_name
")->fetchAll();

$inStock = 0; $lowStockCount = 0; $outOfStockCount = 0;
$notifications = [];
foreach ($perMedicineQty as $row) {
    $qty = (int)$row['total_qty'];
    if ($qty === 0) {
        $outOfStockCount++;
        $notifications[] = ['type' => 'out', 'medicine_name' => $row['medicine_name'], 'quantity' => $qty];
    } elseif ($qty <= 5) {
        $lowStockCount++;
        $notifications[] = ['type' => 'low', 'medicine_name' => $row['medicine_name'], 'quantity' => $qty];
    } else {
        $inStock++;
    }
}

// Sales chart — Daily (last 7 days), Weekly (last 8 weeks), Monthly (last 6 months)
$dailySales = $pdo->query("
    SELECT DATE(sale_date) AS label, COALESCE(SUM(total_amount),0) AS total
    FROM sales
    WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(sale_date)
    ORDER BY label ASC
")->fetchAll();

$weeklySales = $pdo->query("
    SELECT YEARWEEK(sale_date, 1) AS ykey, MIN(DATE(sale_date)) AS label, COALESCE(SUM(total_amount),0) AS total
    FROM sales
    WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 WEEK)
    GROUP BY YEARWEEK(sale_date, 1)
    ORDER BY ykey ASC
")->fetchAll();

$monthlySales = $pdo->query("
    SELECT DATE_FORMAT(sale_date, '%Y-%m') AS label, COALESCE(SUM(total_amount),0) AS total
    FROM sales
    WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
    GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
    ORDER BY label ASC
")->fetchAll();

// Best selling medicines (all-time, top 5 by quantity sold)
$bestSelling = $pdo->query("
    SELECT m.medicine_name, SUM(si.quantity) AS total_quantity, SUM(si.total) AS total_revenue
    FROM sale_items si
    JOIN medicine_stock ms ON ms.stock_id = si.stock_id
    JOIN medicines m ON m.medicine_id = ms.medicine_id
    GROUP BY m.medicine_id, m.medicine_name
    ORDER BY total_quantity DESC
    LIMIT 5
")->fetchAll();

respond([
    'today_sales_total' => (float)$todaySales['total'],
    'today_sales_count' => (int)$todaySales['count'],
    'week_sales_total'  => (float)$weekSales['total'],
    'month_sales_total' => (float)$monthSales['total'],
    'total_medicines'   => (int)$totalMedicines,
    'low_stock'         => $lowStock,
    'expiring_soon'     => $expiringSoon,
    'recent_sales'      => $recentSales,
    'stock_status'      => ['in_stock' => $inStock, 'low_stock' => $lowStockCount, 'out_of_stock' => $outOfStockCount],
    'notifications'     => $notifications,
    'sales_chart'       => ['daily' => $dailySales, 'weekly' => $weeklySales, 'monthly' => $monthlySales],
    'best_selling'      => $bestSelling,
]);
