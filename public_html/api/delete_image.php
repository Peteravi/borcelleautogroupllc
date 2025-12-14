<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['image_id']) || !is_numeric($data['image_id'])) {
    echo json_encode(['success' => false, 'message' => 'ID de imagen inválido']);
    exit;
}

$image_id = intval($data['image_id']);
$uploadDir = __DIR__ . '/../uploads/';

// Obtener la ruta de la imagen
$stmt = $conn->prepare("SELECT ruta, auto_id FROM imagenes_autos WHERE id = ?");
$stmt->bind_param("i", $image_id);
$stmt->execute();
$res = $stmt->get_result();
$image = $res->fetch_assoc();

if (!$image) {
    echo json_encode(['success' => false, 'message' => 'Imagen no encontrada']);
    exit;
}

// Eliminar archivo físico
$filePath = $uploadDir . str_replace("uploads/", "", $image['ruta']);
if (file_exists($filePath)) {
    @unlink($filePath);
}

// Eliminar registro de la base de datos
$stmt = $conn->prepare("DELETE FROM imagenes_autos WHERE id = ?");
$stmt->bind_param("i", $image_id);
$success = $stmt->execute();

$stmt->close();

echo json_encode([
    'success' => $success,
    'message' => $success ? 'Imagen eliminada correctamente' : 'Error al eliminar imagen'
]);
?>