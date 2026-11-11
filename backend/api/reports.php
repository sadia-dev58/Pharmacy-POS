<?php
require_once __DIR__ . "/../config/bootstrap.php";

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail("Method not allowed", 405);

// Optional date range, defaults to the last 30 days
$from = $_GET['from'] ?? date('Y-m-d', strtotime('-29 days'));
$to   = $_GET['to']   ?? date('Y-m-d');

// 1. Top selling medicines by quantity (within range)
$stmt = $pdo->prepare("
    SELECT m.medicine_name, SUM(si.quantity) AS total_quantity, SUM(si.total) AS total_revenue
    FROM sale_items si
    JOIN medicine_stock ms ON ms.stock_id = si.stock_id
    JOIN medicines m ON m.medicine_id = ms.medicine_id
    JOIN sales s ON s.sale_id = si.sale_id
    WHERE DATE(s.sale_date) BETWEEN ? AND ?
    GROUP BY m.medicine_id, m.medicine_name
    ORDER BY total_quantity DESC
    LIMIT 10
");
$stmt->execute([$from, $to]);
$topMedicines = $stmt->fetchAll();

// 2. Sales by category
$stmt = $pdo->prepare("
    SELECT COALESCE(c.category_name, 'Uncategorized') AS category_name, SUM(si.total) AS total_revenue
    FROM sale_items si
    JOIN medicine_stock ms ON ms.stock_id = si.stock_id
    JOIN medicines m ON m.medicine_id = ms.medicine_id
    LEFT JOIN categories c ON c.category_id = m.category_id
    JOIN sales s ON s.sale_id = si.sale_id
    WHERE DATE(s.sale_date) BETWEEN ? AND ?
    GROUP BY c.category_id, COALESCE(c.category_name, 'Uncategorized')
    ORDER BY total_revenue DESC
");
$stmt->execute([$from, $to]);
$categorySales = $stmt->fetchAll();

// 3. Daily sales trend
$stmt = $pdo->prepare("
    SELECT DATE(sale_date) AS day, SUM(total_amount) AS total, COUNT(*) AS count
    FROM sales
    WHERE DATE(sale_date) BETWEEN ? AND ?
    GROUP BY DATE(sale_date)
    ORDER BY day ASC
");
$stmt->execute([$from, $to]);
$salesTrend = $stmt->fetchAll();

// 4. Payment method breakdown
$stmt = $pdo->prepare("
    SELECT payment_method, SUM(amount) AS total, COUNT(*) AS count
    FROM payments p
    JOIN sales s ON s.sale_id = p.sale_id
    WHERE DATE(s.sale_date) BETWEEN ? AND ?
    GROUP BY payment_method
");
$stmt->execute([$from, $to]);
$paymentBreakdown = $stmt->fetchAll();

// 5. Summary totals for the range
$stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) AS revenue, COUNT(*) AS orders FROM sales WHERE DATE(sale_date) BETWEEN ? AND ?");
$stmt->execute([$from, $to]);
$summary = $stmt->fetch();

respond([
    'from' => $from,
    'to' => $to,
    'top_medicines' => $topMedicines,
    'category_sales' => $categorySales,
    'sales_trend' => $salesTrend,
    'payment_breakdown' => $paymentBreakdown,
    'summary' => $summary,
]);
