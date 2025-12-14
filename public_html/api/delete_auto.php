<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

// Validar ID
if (!isset($data['id']) || !is_numeric($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit;
}

$auto_id = intval($data['id']);

// Carpeta de uploads
$uploadDir = __DIR__ . '/../uploads/';

/* ============================================================
   1. OBTENER TODAS LAS IMÁGENES FÍSICAS ASOCIADAS AL AUTO
   ============================================================ */
$stmt = $conn->prepare("SELECT ruta FROM imagenes_autos WHERE auto_id = ?");
$stmt->bind_param("i", $auto_id);
$stmt->execute();
$res = $stmt->get_result();

$imagenes = [];
while ($row = $res->fetch_assoc()) {
    $ruta = str_replace("uploads/", "", $row['ruta']);
    $imagenes[] = $ruta;
}
$stmt->close();

/* ============================================================
   2. ELIMINAR ARCHIVOS FÍSICOS
   ============================================================ */
foreach ($imagenes as $img) {
    $path = $uploadDir . $img;
    if (file_exists($path)) {
        @unlink($path);
    }
}

/* ============================================================
   3. ELIMINAR AUTO (FK elimina imagenes_autos automáticamente)
   ============================================================ */
$stmt = $conn->prepare("DELETE FROM autos WHERE id = ?");
$stmt->bind_param("i", $auto_id);
$stmt->execute();

$success = $stmt->affected_rows > 0;
$stmt->close();

echo json_encode([
    'success' => $success,
    'message' => $success 
        ? 'Auto eliminado correctamente'
        : 'No se encontró el auto para eliminar'
]);

exit;
?>
