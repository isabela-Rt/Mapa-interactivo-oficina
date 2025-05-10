<?php
require_once 'Config/Conexio.php';

// Obtener acción desde GET
$action = isset($_GET['action']) ? $_GET['action'] : '';


if ($action == 'reservar') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Verificar si los datos existen
    if (!isset($data['puesto'], $data['fecha'], $data['cedula'], $data['horario'])) {
        echo json_encode(["success" => false, "message" => "Faltan datos en la solicitud"]);
        exit;
    }

    $puesto = $data['puesto'];
    $fecha = $data['fecha'];
    $cedula = trim($data['cedula']); 
    $horario = $data['horario']; 

    try {
        if ($horario === 'todo_dia') {
            $horarios = ['M', 'T'];
            $reservaExitosa = true;
            
            foreach ($horarios as $turno) {
                $stmt = $pdo->prepare("SELECT cedula FROM reservas WHERE puesto = :puesto AND fecha = :fecha AND horario = :horario");
                $stmt->execute(['puesto' => $puesto, 'fecha' => $fecha, 'horario' => $turno]);
                $reservaExistente = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($reservaExistente && $reservaExistente['cedula'] != null && $reservaExistente['cedula'] != '0') {
                    echo json_encode(["success" => false, "message" => "Este puesto ya está reservado para el turno $turno"]);
                    $reservaExitosa = false;
                    break;
                }
            }

            if ($reservaExitosa) {
                foreach ($horarios as $turno) {
                    $stmt = $pdo->prepare("UPDATE reservas SET cedula = :cedula WHERE puesto = :puesto AND fecha = :fecha AND horario = :horario");
                    if (!$stmt->execute(['cedula' => $cedula, 'puesto' => $puesto, 'fecha' => $fecha, 'horario' => $turno])) {
                        echo json_encode(["success" => false, "message" => "Error al actualizar la reserva"]);
                        exit;
                    }
                }
                echo json_encode(["success" => true, "message" => "Reserva realizada correctamente para todo el día"]);
            }
        } else {
            // Reservar para un solo turno (M o T)
            $stmt = $pdo->prepare("SELECT cedula FROM reservas WHERE puesto = :puesto AND fecha = :fecha AND horario = :horario");
            $stmt->execute(['puesto' => $puesto, 'fecha' => $fecha, 'horario' => $horario]);
            $reservaExistente = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($reservaExistente && $reservaExistente['cedula'] != null && $reservaExistente['cedula'] != '0') {
                echo json_encode(["success" => false, "message" => "Este puesto ya está reservado para el turno $horario"]);
                exit;
            }

            // Realizar la reserva para el turno específico
            $stmt = $pdo->prepare("UPDATE reservas SET cedula = :cedula WHERE puesto = :puesto AND fecha = :fecha AND horario = :horario");
            if ($stmt->execute(['cedula' => $cedula, 'puesto' => $puesto, 'fecha' => $fecha, 'horario' => $horario])) {
                echo json_encode(["success" => true, "message" => "Reserva realizada correctamente para el turno $horario"]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al actualizar la reserva"]);
            }
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Error en la consulta: " . $e->getMessage()]);
    }
} elseif ($action === 'get') {
    $fechaActual = isset($_GET['fecha']) ? $_GET['fecha'] : date('Y-m-d');
    $horario = isset($_GET['horario']) ? $_GET['horario'] : '';

    try {
        $querySelect = "SELECT puesto, horario, cedula FROM reservas WHERE fecha = :fecha";
        $params = ['fecha' => $fechaActual];

        if (!empty($horario) && $horario !== 'todo_dia') {
            $querySelect .= " AND horario = :horario";
            $params['horario'] = $horario; // No convertir a entero
        }

        $stmt = $pdo->prepare($querySelect);
        $stmt->execute($params);
        $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "message" => count($reservas) > 0 ? "Reservas encontradas" : "No hay reservas",
            "reservas" => $reservas
        ]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Error en la consulta: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Solicitud inválida o parámetros faltantes"]);
}