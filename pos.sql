-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 17, 2026 at 12:34 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pos`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `category_name`, `description`) VALUES
(1, 'Tablet', 'Tablet Medicines'),
(2, 'Capsule', 'Capsule Medicines'),
(3, 'Syrup', 'Liquid Medicines'),
(4, 'Injection', 'Injection Medicines'),
(5, 'Ointment', 'Skin Medicines'),
(6, 'Drops', 'Eye and Ear Drops'),
(7, 'Cream', 'Medicinal Creams'),
(8, 'Powder', 'Medical Powders'),
(9, 'Inhaler', 'Asthma Inhalers'),
(10, 'Gel', 'Medicinal Gels'),
(26, 'Drops', 'Eye and Ear Drops'),
(27, 'Cream', 'Medicinal Creams'),
(28, 'Powder', 'Medical Powders'),
(29, 'Inhaler', 'Asthma Inhalers'),
(30, 'Gel', 'Medicinal Gels');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`customer_id`, `customer_name`, `phone`, `email`, `gender`, `address`, `created_at`) VALUES
(1, 'Ayesha Khan', '03110000001', 'ayesha@gmail.com', 'Female', 'Johar Town, Lahore', '2026-07-07 06:39:52'),
(2, 'Ali Raza', '03110000002', 'ali@gmail.com', 'Male', 'Gulberg, Lahore', '2026-07-07 06:39:52'),
(3, 'Fatima Noor', '03110000003', 'fatima@gmail.com', 'Female', 'Model Town, Lahore', '2026-07-07 06:39:52'),
(4, 'Ahmed Hassan', '03110000004', 'ahmed@gmail.com', 'Male', 'DHA, Lahore', '2026-07-07 06:39:52'),
(5, 'Sara Ali', '03110000005', 'sara@gmail.com', 'Female', 'Bahria Town, Lahore', '2026-07-07 06:39:52'),
(6, 'Bilal Ahmed', '03110000006', 'bilal@gmail.com', 'Male', 'Faisal Town, Lahore', '2026-07-07 06:39:52'),
(7, 'Hina Malik', '03110000007', 'hina@gmail.com', 'Female', 'Wapda Town, Lahore', '2026-07-07 06:39:52'),
(8, 'Usman Tariq', '03110000008', 'usman@gmail.com', 'Male', 'Saddar, Rawalpindi', '2026-07-07 06:39:52'),
(9, 'Zainab Iqbal', '03110000009', 'zainab@gmail.com', 'Female', 'Satellite Town, Rawalpindi', '2026-07-07 06:39:52'),
(10, 'Hamza Khan', '03110000010', 'hamza@gmail.com', 'Male', 'University Road, Peshawar', '2026-07-07 06:39:52');

-- --------------------------------------------------------

--
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `medicine_id` int(11) NOT NULL,
  `medicine_name` varchar(150) NOT NULL,
  `generic_name` varchar(150) DEFAULT NULL,
  `brand_name` varchar(100) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `dosage` varchar(50) DEFAULT NULL,
  `unit` enum('Piece','Strip','Box','Bottle','Tube') DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`medicine_id`, `medicine_name`, `generic_name`, `brand_name`, `manufacturer`, `category_id`, `barcode`, `dosage`, `unit`, `description`, `image`, `created_at`) VALUES
(1, 'Panadol', 'Paracetamol', 'Panadol', 'GSK Pakistan', 1, '890123450001', '500mg', 'Strip', 'Pain reliever and fever reducer', 'panadol.jpg', '2026-07-07 06:48:26'),
(2, 'Brufen', 'Ibuprofen', 'Brufen', 'Abbott Pakistan', 1, '890123450002', '400mg', 'Strip', 'Pain and inflammation relief', 'brufen.jpg', '2026-07-07 06:48:26'),
(3, 'Augmentin', 'Amoxicillin + Clavulanic Acid', 'Augmentin', 'GSK Pakistan', 2, '890123450003', '625mg', 'Box', 'Antibiotic', 'augmentin.jpg', '2026-07-07 06:48:26'),
(4, 'Calpol Syrup', 'Paracetamol', 'Calpol', 'GSK Pakistan', 3, '890123450004', '120mg/5ml', 'Bottle', 'Fever syrup for children', 'calpol.jpg', '2026-07-07 06:48:26'),
(5, 'Ceftriaxone Injection', 'Ceftriaxone', 'Rocephin', 'Sami Pharmaceuticals', 4, '890123450005', '1g', 'Piece', 'Antibiotic injection', 'ceftriaxone.jpg', '2026-07-07 06:48:26'),
(6, 'Polyfax Ointment', 'Bacitracin + Polymyxin B', 'Polyfax', 'GSK Pakistan', 5, '890123450006', '20g', 'Tube', 'Skin infection treatment', 'polyfax.jpg', '2026-07-07 06:48:26'),
(7, 'Refresh Eye Drops', 'Carboxymethylcellulose', 'Refresh', 'Abbott Pakistan', 6, '890123450007', '10ml', 'Bottle', 'Lubricating eye drops', 'refresh.jpg', '2026-07-07 06:48:26'),
(8, 'ORS Powder', 'Oral Rehydration Salts', 'ORS', 'Getz Pharma', 8, '890123450008', '20g', 'Piece', 'Rehydration powder', 'ors.jpg', '2026-07-07 06:48:26'),
(9, 'Ventolin Inhaler', 'Salbutamol', 'Ventolin', 'GSK Pakistan', 9, '890123450009', '100mcg', 'Piece', 'Asthma inhaler', 'ventolin.jpg', '2026-07-07 06:48:26');

-- --------------------------------------------------------

--
-- Table structure for table `medicine_stock`
--

CREATE TABLE `medicine_stock` (
  `stock_id` int(11) NOT NULL,
  `medicine_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `batch_no` varchar(50) DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `reorder_level` int(11) DEFAULT NULL,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicine_stock`
--

INSERT INTO `medicine_stock` (`stock_id`, `medicine_id`, `supplier_id`, `batch_no`, `purchase_price`, `selling_price`, `quantity`, `reorder_level`, `manufacture_date`, `expiry_date`, `created_at`) VALUES
(1, 1, 1, 'PAN001', 20.00, 30.00, 100, 20, '2026-01-15', '2028-01-14', '2026-07-07 06:49:39'),
(2, 2, 2, 'BRU001', 35.00, 50.00, 80, 15, '2026-02-10', '2028-02-09', '2026-07-07 06:49:39'),
(3, 3, 3, 'AUG001', 180.00, 240.00, 60, 10, '2026-03-05', '2028-03-04', '2026-07-07 06:49:39'),
(4, 4, 4, 'CAL001', 70.00, 95.00, 50, 10, '2026-01-20', '2027-12-31', '2026-07-07 06:49:39'),
(5, 5, 5, 'CEF001', 220.00, 300.00, 40, 8, '2026-04-01', '2028-04-01', '2026-07-07 06:49:39'),
(6, 6, 6, 'POL001', 60.00, 85.00, 70, 15, '2026-02-15', '2028-02-15', '2026-07-07 06:49:39'),
(7, 7, 7, 'REF001', 120.00, 160.00, 45, 10, '2026-03-12', '2028-03-12', '2026-07-07 06:49:39'),
(8, 8, 8, 'ORS001', 15.00, 25.00, 200, 50, '2026-01-05', '2028-01-05', '2026-07-07 06:49:39'),
(9, 9, 9, 'VEN001', 300.00, 380.00, 35, 5, '2026-05-01', '2028-05-01', '2026-07-07 06:49:39');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `sale_id` int(11) DEFAULT NULL,
  `payment_method` enum('Cash','Card','Online') DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `status` enum('Success','Pending','Failed') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `sale_id`, `payment_method`, `amount`, `payment_date`, `transaction_id`, `status`) VALUES
(2, 1, 'Cash', 305.00, '2026-07-15 09:35:00', 'TXN1001', 'Success'),
(3, 2, 'Card', 504.00, '2026-07-15 10:20:00', 'TXN1002', 'Success'),
(4, 3, 'Online', 252.00, '2026-07-15 11:05:00', 'TXN1003', 'Success'),
(5, 4, 'Cash', 446.25, '2026-07-16 09:50:00', 'TXN1004', 'Success'),
(6, 5, 'Card', 598.50, '2026-07-16 12:25:00', 'TXN1005', 'Success'),
(7, 6, 'Cash', 178.50, '2026-07-16 14:15:00', 'TXN1006', 'Success'),
(8, 7, 'Online', 351.75, '2026-07-17 10:45:00', 'TXN1007', 'Success'),
(9, 8, 'Cash', 283.50, '2026-07-17 13:35:00', 'TXN1008', 'Success'),
(10, 9, 'Card', 787.50, '2026-07-18 11:55:00', 'TXN1009', 'Success'),
(11, 10, 'Online', 420.00, '2026-07-18 15:05:00', 'TXN1010', 'Success');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `purchase_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `tax` decimal(10,2) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `payment_method` enum('Cash','Card','Online') DEFAULT NULL,
  `payment_status` enum('Paid','Pending','Unpaid') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` (`purchase_id`, `supplier_id`, `invoice_number`, `purchase_date`, `subtotal`, `discount`, `tax`, `total_amount`, `payment_method`, `payment_status`) VALUES
(1, 1, 'PUR-1001', '2026-07-01', 2000.00, 100.00, 50.00, 1950.00, 'Cash', 'Paid'),
(2, 2, 'PUR-1002', '2026-07-02', 2800.00, 50.00, 70.00, 2820.00, 'Card', 'Paid'),
(3, 3, 'PUR-1003', '2026-07-03', 3000.00, 150.00, 75.00, 2925.00, 'Online', 'Paid'),
(4, 4, 'PUR-1004', '2026-07-04', 1500.00, 0.00, 40.00, 1540.00, 'Cash', 'Paid'),
(5, 5, 'PUR-1005', '2026-07-05', 4500.00, 200.00, 100.00, 4400.00, 'Card', 'Paid'),
(6, 6, 'PUR-1006', '2026-07-06', 1800.00, 50.00, 45.00, 1795.00, 'Cash', 'Paid'),
(7, 7, 'PUR-1007', '2026-07-07', 2500.00, 100.00, 60.00, 2460.00, 'Online', 'Paid'),
(8, 8, 'PUR-1008', '2026-07-08', 900.00, 0.00, 20.00, 920.00, 'Cash', 'Paid'),
(9, 9, 'PUR-1009', '2026-07-09', 5000.00, 250.00, 125.00, 4875.00, 'Card', 'Paid'),
(10, 10, 'PUR-1010', '2026-07-10', 2200.00, 100.00, 55.00, 2155.00, 'Online', 'Paid');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_items`
--

CREATE TABLE `purchase_items` (
  `purchase_item_id` int(11) NOT NULL,
  `purchase_id` int(11) DEFAULT NULL,
  `stock_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_items`
--

INSERT INTO `purchase_items` (`purchase_item_id`, `purchase_id`, `stock_id`, `quantity`, `purchase_price`, `total`) VALUES
(1, 1, 1, 100, 20.00, 2000.00),
(2, 2, 2, 80, 35.00, 2800.00),
(3, 3, 3, 60, 50.00, 3000.00),
(4, 4, 4, 50, 30.00, 1500.00),
(5, 5, 5, 90, 50.00, 4500.00),
(6, 6, 6, 60, 30.00, 1800.00),
(7, 7, 7, 50, 50.00, 2500.00),
(8, 8, 8, 60, 15.00, 900.00),
(9, 9, 9, 100, 50.00, 5000.00),
(10, 10, 10, 55, 40.00, 2200.00);

-- --------------------------------------------------------

--
-- Table structure for table `returns`
--

CREATE TABLE `returns` (
  `return_id` int(11) NOT NULL,
  `sale_item_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `return_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `returns`
--

INSERT INTO `returns` (`return_id`, `sale_item_id`, `quantity`, `reason`, `return_date`) VALUES
(1, 1, 1, 'Damaged packaging', '2026-07-16 10:30:00'),
(2, 2, 2, 'Wrong medicine dispensed', '2026-07-16 11:15:00'),
(3, 3, 1, 'Customer changed mind', '2026-07-17 09:45:00'),
(4, 4, 1, 'Expired medicine', '2026-07-17 12:20:00'),
(5, 5, 1, 'Damaged seal', '2026-07-18 10:10:00'),
(6, 6, 1, 'Incorrect quantity', '2026-07-18 02:00:00'),
(7, 7, 1, 'Manufacturing defect', '2026-07-19 11:40:00'),
(8, 8, 2, 'Customer requested replacement', '2026-07-19 03:25:00'),
(9, 9, 1, 'Wrong batch supplied', '2026-07-20 09:50:00'),
(10, 10, 1, 'Medicine damaged during transport', '2026-07-20 04:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `sale_id` int(11) NOT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `sale_date` datetime DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `tax` decimal(10,2) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `payment_method` enum('Cash','Card','Online') DEFAULT NULL,
  `amount_paid` decimal(10,2) DEFAULT NULL,
  `change_return` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`sale_id`, `invoice_number`, `customer_id`, `sale_date`, `subtotal`, `discount`, `tax`, `total_amount`, `payment_method`, `amount_paid`, `change_return`) VALUES
(1, 'INV-1001', 1, '2026-07-15 09:30:00', 300.00, 10.00, 15.00, 305.00, 'Cash', 310.00, 5.00),
(2, 'INV-1002', 2, '2026-07-15 10:15:00', 500.00, 20.00, 24.00, 504.00, 'Card', 504.00, 0.00),
(3, 'INV-1003', 3, '2026-07-15 11:00:00', 240.00, 0.00, 12.00, 252.00, 'Online', 252.00, 0.00),
(4, 'INV-1004', 4, '2026-07-16 09:45:00', 450.00, 25.00, 21.25, 446.25, 'Cash', 450.00, 3.75),
(5, 'INV-1005', 5, '2026-07-16 12:20:00', 600.00, 30.00, 28.50, 598.50, 'Card', 600.00, 1.50),
(6, 'INV-1006', 6, '2026-07-16 02:10:00', 170.00, 0.00, 8.50, 178.50, 'Cash', 180.00, 1.50),
(7, 'INV-1007', 7, '2026-07-17 10:40:00', 350.00, 15.00, 16.75, 351.75, 'Online', 351.75, 0.00),
(8, 'INV-1008', 8, '2026-07-17 01:30:00', 275.00, 5.00, 13.50, 283.50, 'Cash', 300.00, 16.50),
(9, 'INV-1009', 9, '2026-07-18 11:50:00', 800.00, 50.00, 37.50, 787.50, 'Card', 800.00, 12.50),
(10, 'INV-1010', 10, '2026-07-18 03:00:00', 420.00, 20.00, 20.00, 420.00, 'Online', 420.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `sale_item_id` int(11) NOT NULL,
  `sale_id` int(11) DEFAULT NULL,
  `stock_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`sale_item_id`, `sale_id`, `stock_id`, `quantity`, `selling_price`, `total`) VALUES
(1, 1, 1, 10, 30.00, 300.00),
(2, 2, 2, 10, 50.00, 500.00),
(3, 3, 3, 1, 240.00, 240.00),
(4, 4, 4, 5, 90.00, 450.00),
(5, 5, 5, 2, 300.00, 600.00),
(6, 6, 6, 2, 85.00, 170.00),
(7, 7, 7, 2, 175.00, 350.00),
(8, 8, 8, 11, 25.00, 275.00),
(9, 9, 9, 2, 400.00, 800.00),
(10, 10, 10, 2, 210.00, 420.00);

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` int(11) NOT NULL,
  `company_name` varchar(150) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `company_name`, `contact_person`, `phone`, `email`, `address`, `city`, `created_at`) VALUES
(1, 'Getz Pharma', 'Ali Khan', '03001111111', 'getz@gmail.com', 'Johar Town', 'Lahore', '2026-07-07 06:43:10'),
(2, 'Hilton Pharma', 'Ahmed Raza', '03002222222', 'hilton@gmail.com', 'Gulberg', 'Lahore', '2026-07-07 06:43:10'),
(3, 'GSK Pakistan', 'Usman Ali', '03003333333', 'gsk@gmail.com', 'Blue Area', 'Islamabad', '2026-07-07 06:43:10'),
(4, 'Sami Pharmaceuticals', 'Hamza Khan', '03004444444', 'sami@gmail.com', 'DHA', 'Karachi', '2026-07-07 06:43:10'),
(5, 'Martin Dow', 'Bilal Ahmed', '03005555555', 'martindow@gmail.com', 'Clifton', 'Karachi', '2026-07-07 06:43:10'),
(6, 'Highnoon Laboratories', 'Zain Ali', '03006666666', 'highnoon@gmail.com', 'Model Town', 'Lahore', '2026-07-07 06:43:10'),
(7, 'AGP Limited', 'Hassan Raza', '03007777777', 'agp@gmail.com', 'F-8', 'Islamabad', '2026-07-07 06:43:10'),
(8, 'Pfizer Pakistan', 'Saad Ahmed', '03008888888', 'pfizer@gmail.com', 'Cantt', 'Lahore', '2026-07-07 06:43:10'),
(9, 'Abbott Pakistan', 'Farhan Ali', '03009999999', 'abbott@gmail.com', 'Saddar', 'Rawalpindi', '2026-07-07 06:43:10'),
(10, 'Ferozsons Laboratories', 'Adeel Khan', '03110000000', 'ferozsons@gmail.com', 'University Road', 'Peshawar', '2026-07-07 06:43:10');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `username`, `email`, `phone`, `password`, `created_at`) VALUES
(1, 'Admin', 'admin', 'admin@pharmacy.com', '03001234567', 'admin123', '2026-07-07 06:32:28');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customer_id`);

--
-- Indexes for table `medicines`
--
ALTER TABLE `medicines`
  ADD PRIMARY KEY (`medicine_id`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `medicine_stock`
--
ALTER TABLE `medicine_stock`
  ADD PRIMARY KEY (`stock_id`),
  ADD KEY `medicine_id` (`medicine_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `sale_id` (`sale_id`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`purchase_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD PRIMARY KEY (`purchase_item_id`),
  ADD KEY `purchase_id` (`purchase_id`),
  ADD KEY `stock_id` (`stock_id`);

--
-- Indexes for table `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`return_id`),
  ADD KEY `sale_item_id` (`sale_item_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`sale_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`sale_item_id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `stock_id` (`stock_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `medicine_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `medicine_stock`
--
ALTER TABLE `medicine_stock`
  MODIFY `stock_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `purchase_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `purchase_items`
--
ALTER TABLE `purchase_items`
  MODIFY `purchase_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `returns`
--
ALTER TABLE `returns`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `sale_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `sale_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `medicines`
--
ALTER TABLE `medicines`
  ADD CONSTRAINT `medicines_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`);

--
-- Constraints for table `medicine_stock`
--
ALTER TABLE `medicine_stock`
  ADD CONSTRAINT `medicine_stock_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`),
  ADD CONSTRAINT `medicine_stock_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`);

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`);

--
-- Constraints for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD CONSTRAINT `purchase_items_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`purchase_id`),
  ADD CONSTRAINT `purchase_items_ibfk_2` FOREIGN KEY (`stock_id`) REFERENCES `medicine_stock` (`stock_id`);

--
-- Constraints for table `returns`
--
ALTER TABLE `returns`
  ADD CONSTRAINT `returns_ibfk_1` FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items` (`sale_item_id`);

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`);

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`),
  ADD CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`stock_id`) REFERENCES `medicine_stock` (`stock_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
