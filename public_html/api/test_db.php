<?php
$host = "localhost";
$user = "root";
$pass = "piteravi07";
$db   = "borcelle";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo "❌ Error: " . $conn->connect_error;
} else {
    echo "✅ Conexión exitosa a MySQL!";
    
    // Probar consulta
    $result = $conn->query("SHOW TABLES");
    if ($result) {
        echo "<br>Tablas en la base de datos:";
        while ($row = $result->fetch_array()) {
            echo "<br>- " . $row[0];
        }
    }
}
?>