<?php
include '../config/database.php';
header('Content-Type: application/json');

// Log
$logfile = __DIR__ . '/add_auto_debug.log';
function wlog($txt) {
    global $logfile;
    file_put_contents($logfile, "[".date("Y-m-d H:i:s")."] $txt\n", FILE_APPEND);
}

wlog("=== add_auto.php INICIADO ===");

// Crear carpeta uploads si no existe
$uploads = __DIR__ . '/../uploads/';
if (!file_exists($uploads)) {
    mkdir($uploads, 0775, true);
    wlog("Carpeta /uploads creada");
}

// ----------------------------------------------------------
// 1) LEER FORM DATA
// ----------------------------------------------------------

$campos = [
    'vin','marca','modelo','anio','precio','millaje',
    'combustible','drive_train','descripcion','destacado','estado'
];

$data = [];
foreach ($campos as $c) $data[$c] = $_POST[$c] ?? null;

wlog("POST recibido:\n".print_r($_POST,true));

// Validación básica
if (empty($data['marca']) || empty($data['modelo']) || empty($data['anio']) || empty($data['precio'])) {
    echo json_encode(['success'=>false,'msg'=>'Faltan campos obligatorios']);
    wlog("ERROR: campos obligatorios vacíos");
    exit;
}

$data['anio'] = intval($data['anio']);
$data['millaje'] = intval($data['millaje'] ?? 0);
$data['precio'] = floatval($data['precio']);
$data['destacado'] = intval($data['destacado'] ?? 0);
$data['estado'] = $data['estado'] ?: 'disponible';

// ----------------------------------------------------------
// 2) INSERTAR AUTO
// ----------------------------------------------------------

$stmt = $conn->prepare("
    INSERT INTO autos
        (vin, marca, modelo, anio, precio, millaje, combustible,
         drive_train, descripcion, destacado, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "sssdiisssis",
    $data['vin'],
    $data['marca'],
    $data['modelo'],
    $data['anio'],
    $data['precio'],
    $data['millaje'],
    $data['combustible'],
    $data['drive_train'],
    $data['descripcion'],
    $data['destacado'],
    $data['estado']
);

if (!$stmt->execute()) {
    wlog("ERROR INSERT AUTO: ".$stmt->error);
    echo json_encode(['success'=>false,'msg'=>'Error insertando auto']);
    exit;
}

$auto_id = $stmt->insert_id;
$stmt->close();

wlog("Auto insertado con id = $auto_id");

// ----------------------------------------------------------
// 3) PROCESAR IMÁGENES
// ----------------------------------------------------------

$imagenes_guardadas = [];
$currentPrincipal = $_POST['principal'] ?? null;

wlog("principal recibido: ".$currentPrincipal);

if (!empty($_FILES['imagenes']['name'][0])) {
    wlog("Procesando imágenes...");
    foreach ($_FILES['imagenes']['tmp_name'] as $i => $tmp) {

        if (!is_uploaded_file($tmp)) {
            wlog("Archivo no válido en índice $i");
            continue;
        }

        $original = basename($_FILES['imagenes']['name'][$i]);
        $ext = pathinfo($original, PATHINFO_EXTENSION);
        $newname = uniqid("car_", true) . "." . $ext;

        $ruta_relativa = "uploads/".$newname;
        $ruta_final = $uploads . $newname;

        if (move_uploaded_file($tmp, $ruta_final)) {

            // Determinar si es la principal
            $token = "new_".$i;
            $es_principal = ($currentPrincipal === $token) ? 1 : 0;

            // Insertar a la base
            $stmt2 = $conn->prepare("
                INSERT INTO imagenes_autos (auto_id, ruta, principal)
                VALUES (?, ?, ?)
            ");
            $stmt2->bind_param("isi", $auto_id, $ruta_relativa, $es_principal);
            $stmt2->execute();
            $stmt2->close();

            wlog("Imagen guardada: $ruta_relativa | principal = $es_principal");

            $imagenes_guardadas[] = [
                'ruta' => $ruta_relativa,
                'principal' => $es_principal
            ];

        } else {
            wlog("ERROR moviendo archivo: $tmp");
        }
    }
} else {
    wlog("No se enviaron imágenes.");
}

// Si ninguna fue marcada como principal, hacer la primera principal
if (count($imagenes_guardadas) > 0 && !in_array(1, array_column($imagenes_guardadas, 'principal'))) {
    wlog("No se seleccionó principal: marcando la primera como principal");
    $conn->query("UPDATE imagenes_autos SET principal = 1 WHERE auto_id = $auto_id ORDER BY id ASC LIMIT 1");
}

wlog("=== add_auto.php FINALIZADO ===");

// ----------------------------------------------------------
// RESPUESTA
// ----------------------------------------------------------

echo json_encode([
    'success' => true,
    'msg' => 'Auto agregado',
    'auto_id' => $auto_id,
    'imagenes' => $imagenes_guardadas
], JSON_UNESCAPED_UNICODE);

