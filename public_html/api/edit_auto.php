<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../config/database.php';

$uploadDir = __DIR__ . '/../uploads/';

// Validar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

if (!isset($_POST['id'])) {
    echo json_encode(["success" => false, "message" => "ID del auto faltante"]);
    exit;
}

$auto_id = intval($_POST['id']);

// -----------------------------------------------
// UPDATE PARCIAL: SOLO ACTUALIZA LO QUE SE ENVÍA
// -----------------------------------------------
$fields = [
    "vin", "marca", "modelo", "anio", "precio", 
    "millaje", "combustible", "drive_train", 
    "descripcion", "estado"
];

$setParts = [];
$values   = [];
$types    = "";

foreach ($fields as $f) {
    if (isset($_POST[$f])) {
        $setParts[] = "$f = ?";
        $values[]   = $_POST[$f];
        $types     .= "s";
    }
}

// destacado (checkbox)
if (isset($_POST['destacado'])) {
    $setParts[] = "destacado = ?";
    $values[]   = ($_POST['destacado'] == "1") ? 1 : 0;
    $types     .= "i";
}

// SOLO actualiza si hay campos enviados
if (count($setParts) > 0) {
    $sql = "UPDATE autos SET " . implode(", ", $setParts) . " WHERE id=?";
    $stmt = $conn->prepare($sql);
    $types .= "i";
    $values[] = $auto_id;
    $stmt->bind_param($types, ...$values);

    if (!$stmt->execute()) {
        echo json_encode(["success" => false, "message" => "Error actualizando datos: " . $stmt->error]);
        exit;
    }
    $stmt->close();
}

// -----------------------------------------------
// MANEJO DE IMÁGENES
// -----------------------------------------------

// IMÁGENES PARA ELIMINAR
$deleted_images = [];
if (!empty($_POST['deleted_images'])) {
    $decoded = json_decode($_POST['deleted_images'], true);
    if (is_array($decoded)) {
        $deleted_images = $decoded;
    }
}

// eliminar imágenes
foreach ($deleted_images as $item) {

    // eliminar por ID
    if (is_numeric($item)) {

        $stmt = $conn->prepare("SELECT ruta FROM imagenes_autos WHERE id=? AND auto_id=?");
        $stmt->bind_param("ii", $item, $auto_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $stmt->close();

        if ($row) {
            $file = str_replace("uploads/", "", $row['ruta']);
            @unlink($uploadDir . $file);
        }

        $stmt = $conn->prepare("DELETE FROM imagenes_autos WHERE id=? AND auto_id=?");
        $stmt->bind_param("ii", $item, $auto_id);
        $stmt->execute();
        $stmt->close();
    }
}

// SUBIR NUEVAS IMÁGENES
$new_image_ids = [];

if (!empty($_FILES['imagenes']['name'][0])) {

    $totalFiles = count($_FILES['imagenes']['name']);
    $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    for ($i = 0; $i < $totalFiles; $i++) {

        if ($_FILES['imagenes']['error'][$i] !== 0) continue;

        $tmp = $_FILES['imagenes']['tmp_name'][$i];
        $mime = mime_content_type($tmp);
        if (!in_array($mime, $allowedTypes)) continue;

        $ext = strtolower(pathinfo($_FILES['imagenes']['name'][$i], PATHINFO_EXTENSION));
        $newName = uniqid("img_", true) . "." . $ext;
        $path = $uploadDir . $newName;

        if (!move_uploaded_file($tmp, $path)) continue;

        $rutaBD = "uploads/" . $newName;

        $stmt = $conn->prepare("INSERT INTO imagenes_autos (auto_id, ruta, principal) VALUES (?, ?, 0)");
        $stmt->bind_param("is", $auto_id, $rutaBD);
        $stmt->execute();
        $newId = $stmt->insert_id;
        $stmt->close();

        $new_image_ids[] = $newId;
    }
}

// CAMBIAR IMAGEN PRINCIPAL
if (!empty($_POST['principal'])) {

    $principal = $_POST['principal'];

    // quitar principal a todas
    $conn->query("UPDATE imagenes_autos SET principal=0 WHERE auto_id=$auto_id");

    // A) nueva imagen subida
    if (preg_match('/new_(\d+)/', $principal, $m)) {
        $index = intval($m[1]);
        if (isset($new_image_ids[$index])) {
            $pid = $new_image_ids[$index];
            $conn->query("UPDATE imagenes_autos SET principal=1 WHERE id=$pid");
        }
    }

    // B) ID existente
    elseif (is_numeric($principal)) {
        $pid = intval($principal);
        $conn->query("UPDATE imagenes_autos SET principal=1 WHERE id=$pid AND auto_id=$auto_id");
    }
}

echo json_encode([
    "success" => true,
    "message" => "Auto actualizado correctamente (parcial)"
]);
exit;

?>
