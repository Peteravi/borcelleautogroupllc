<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

// ------- LOG FILE -------
$log_file = __DIR__ . '/../logs/get_autos.log';
function log_msg($msg) {
    global $log_file;
    file_put_contents($log_file, "[".date("Y-m-d H:i:s")."] ".$msg."\n", FILE_APPEND);
}
log_msg("=== Iniciando get_autos.php ===");

// ------- Ejecutar consulta autos -------
$sql = "SELECT 
            id, vin, marca, modelo, anio, precio, millaje, 
            combustible, drive_train, descripcion, destacado, 
            estado, fecha_publicacion
        FROM autos 
        ORDER BY id DESC";

log_msg("SQL Autos: $sql");

$result = $conn->query($sql);

if (!$result) {
    log_msg("ERROR SQL Autos: " . $conn->error);
    echo json_encode([
        'success' => false,
        'message' => 'Error ejecutando consulta autos',
        'mysql_error' => $conn->error
    ]);
    exit;
}

$autos = [];
log_msg("Autos encontrados: " . $result->num_rows);

// ------- Recorrer autos -------
while ($row = $result->fetch_assoc()) {

    $auto_id = intval($row['id']);
    log_msg("Procesando auto ID: $auto_id");

    // Normalización de datos
    $row['anio']      = intval($row['anio']);
    $row['precio']    = floatval($row['precio']);
    $row['destacado'] = intval($row['destacado']);
    $row['millaje']   = $row['millaje'] !== null ? intval($row['millaje']) : null;

    // ------- Obtener imágenes -------
    $sqlImg = "
        SELECT id, ruta, principal
        FROM imagenes_autos
        WHERE auto_id = ?
        ORDER BY principal DESC, id ASC
    ";
    log_msg("SQL Img: $sqlImg");

    $stmt = $conn->prepare($sqlImg);
    if (!$stmt) {
        log_msg("ERROR preparando stmt imágenes: " . $conn->error);
    }

    $stmt->bind_param("i", $auto_id);
    if (!$stmt->execute()) {
        log_msg("ERROR ejecutando stmt img auto_id $auto_id: " . $stmt->error);
    }

    $imgs = $stmt->get_result();

    log_msg("Imágenes encontradas para auto $auto_id: " . $imgs->num_rows);

    $imagenes = [];
    while ($img = $imgs->fetch_assoc()) {

        $ruta_original = $img['ruta'];
        log_msg("Ruta original BD: $ruta_original");

        // Normalizar ruta
        $ruta = str_replace("uploads/", "", $ruta_original);
        $ruta = "uploads/" . $ruta;

        log_msg("Ruta normalizada enviada al front: $ruta");

        // Guardar imagen
        $imagenes[] = [
            "id"        => intval($img['id']),
            "ruta"      => $ruta,
            "principal" => intval($img['principal'])
        ];
    }
    $stmt->close();

    if (empty($imagenes)) {
        log_msg("⚠ AVISO: auto $auto_id NO tiene imágenes registradas.");
    }

    // Agregar imágenes al auto
    $row['imagenes'] = $imagenes;

    $autos[] = $row;
}

log_msg("Total autos procesados: " . count($autos));
log_msg("=== FIN get_autos.php ===");

echo json_encode($autos, JSON_UNESCAPED_UNICODE);
exit;
?>
