<?php
$host = "localhost:3306"; // O el puerto que uses realmente en Workbench
$user = "root";  // Hostinger te crea uno con prefijo
$pass = "piteravi07";
$db   = "borcelle";  // Nombre exacto de la BD

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("❌ Error de conexión: " . $conn->connect_error);
}

$conn->set_charset("utf8");
?>