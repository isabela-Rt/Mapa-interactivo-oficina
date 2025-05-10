let reservasPorFecha = {};
let fechaActual = '';

document.addEventListener("DOMContentLoaded", async function () {
    const response = await fetch('../API/api.php?action=get', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    try {
        reservas = data.reservas;
    } catch (error) {
        throw new Error("Respuesta no válida de la API: " + error);
    }
});

let puestoShapes = {};
const reservedPuestos = new Set();

const puestos = [
    { name: 'SR1', coords: [465, 110], type: 'sala1' },
    { name: 'SR2', coords: [686, 295], type: 'sala2' },
    { name: 'SR3', coords: [686, 470], type: 'sala3' },
    { name: 'SR4', coords: [686, 640], type: 'sala4' },
    { name: 'SR5', coords: [487, 845], type: 'sala5' },
    { name: 'OP1', coords: [418, 500], type: 'oficina1' },
    { name: 'OP2', coords: [488, 500], type: 'oficina2' },
    { name: 'OP3', coords: [417, 750], type: 'oficina3' },
    { name: 'OP4', coords: [559, 750], type: 'oficina4' },
    { name: 'OP5', coords: [690, 984], type: 'oficina5' },
    { name: 'OP6', coords: [690, 1074], type: 'oficina6' },
    { name: 'EC1', coords: [557.5, 1185], type: 'ec1' },
    { name: 'EC2', coords: [556, 1072], type: 'ec2' },
    { name: 'PT1', coords: [366, 935], type: 'puesto' },
    { name: 'PT2', coords: [400, 935], type: 'puesto' },
    { name: 'PT3', coords: [434, 935], type: 'puesto' },
    { name: 'PT4', coords: [466, 935], type: 'puesto' },
    { name: 'PT5', coords: [500, 935], type: 'puesto' },
    { name: 'PT6', coords: [534, 935], type: 'puesto' },
    { name: 'PT7', coords: [568, 935], type: 'puesto' },
    { name: 'PT8', coords: [568, 1000], type: 'puesto' },
    { name: 'PT9', coords: [534, 1000], type: 'puesto' },
    { name: 'PT10', coords: [500, 1000], type: 'puesto' },
    { name: 'PT11', coords: [466, 1000], type: 'puesto' },
    { name: 'PT12', coords: [433, 1000], type: 'puesto' },
    { name: 'PT13', coords: [400, 1000], type: 'puesto' },
    { name: 'PT14', coords: [365, 1000], type: 'puesto' },
    { name: 'PT15', coords: [368, 1040], type: 'puesto' },
    { name: 'PT16', coords: [400, 1040], type: 'puesto' },
    { name: 'PT17', coords: [433, 1040], type: 'puesto' },
    { name: 'PT18', coords: [466, 1040], type: 'puesto' },
    { name: 'PT19', coords: [500, 1040], type: 'puesto' },
    { name: 'PT20', coords: [499, 1215], type: 'puesto' },
    { name: 'PT21', coords: [466, 1215], type: 'puesto' },
    { name: 'PT22', coords: [565, 518], type: 'puesto' },
    { name: 'PT23', coords: [565, 475], type: 'puesto' },
    { name: 'PT24', coords: [565, 423], type: 'puesto' },
    { name: 'PT25', coords: [565, 377], type: 'puesto' }
];

function createShape(puesto) {
    let color = 'lime';
    let shapeOptions = { color, weight: 1, fillColor: color, fillOpacity: 0.4 };
    let shape;

    if (puesto.type === 'puesto') {
        shape = L.circle([puesto.coords[0], puesto.coords[1]], { radius: 12, ...shapeOptions });
    } else {
        let altura, ancho;
        switch(puesto.type) {
            case 'sala1': altura = 343; ancho = 140; break;
            case 'sala2': altura = 100; ancho = 163; break;
            case 'sala3': altura = 100; ancho = 177; break;
            case 'sala4': altura = 100; ancho = 165; break;
            case 'sala5': altura = 222; ancho = 95; break;
            case 'oficina1': altura = 80; ancho = 96; break;
            case 'oficina2': altura = 62; ancho = 96; break;
            case 'oficina3': altura = 78; ancho = 95; break;
            case 'oficina4': altura = 78; ancho = 95; break;
            case 'oficina5': altura = 95; ancho = 92; break;
            case 'oficina6': altura = 95; ancho = 92; break;
            case 'ec1': altura = 84; ancho = 44; break;
            case 'ec2': altura = 84; ancho = 44; break;
        }

        const bounds = [
            [puesto.coords[0] - altura / 2, puesto.coords[1] - ancho / 2],
            [puesto.coords[0] + altura / 2, puesto.coords[1] + ancho / 2]
        ];
        shape = L.rectangle(bounds, shapeOptions);
    } 

    puestoShapes[puesto.name] = shape;
    return shape;
}

document.getElementById("openModal").addEventListener("click", function() {
    document.getElementById("calendarModal").style.display = "flex";
});

document.getElementById("closeModal").addEventListener("click", function() {
    document.getElementById("calendarModal").style.display = "none";
});

flatpickr("#datepicker", {
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr) {
        const turnoSeleccionado = document.getElementById("turno").value;
        document.getElementById("calendarModal").style.display = "none"; 
        if (dateStr && turnoSeleccionado) {
            cargarMapa(dateStr, turnoSeleccionado);
        }
    }
});

const map = L.map('map', {
    crs: L.CRS.Simple,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    dragging: false,
}).setView([400, 1000], -1);

const imageUrl = 'assets/Imagenes/mapa_reservas_new.png';
const imageBounds = [[0, 0], [762, 1400]]; 
L.imageOverlay(imageUrl, imageBounds).addTo(map);
map.fitBounds(imageBounds);

async function guardarReserva(puesto, fecha, turnoSeleccionado) {
    const cedula = '1133789936';
    try {
        if (turnoSeleccionado === "todo_dia") {
            const turnos = ['M', 'T'];
            for (const turno of turnos) {
                const response = await fetch('../API/api.php?action=reservar', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        puesto: puesto.name,
                        fecha: fechaActual,
                        horario: turno,
                        cedula: cedula
                    })
                });

                const data = await response.json();
                if (data.success) {
                    console.log(`¡Reserva exitosa! El puesto ${puesto.name} ha sido reservado para el turno ${turno}.`);
                    reservedPuestos.add(puesto.name);
                } else {
                    alert('Error al realizar la reserva: ' + data.message);
                }
            }
        } else {
            const response = await fetch('../API/api.php?action=reservar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    puesto: puesto.name,
                    fecha: fechaActual,
                    horario: turnoSeleccionado,
                    cedula: cedula
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(`¡Reserva exitosa! El puesto ${puesto.name} ha sido reservado para el turno ${turnoSeleccionado}.`);
                reservedPuestos.add(puesto.name);
            } else {
                alert('Error al realizar la reserva: ' + data.message);
            }
        }
    } catch (error) {
        console.error("Error al guardar la reserva:", error);
    }
}

async function cargarMapa(dateStr, turnoSeleccionado) {
    fechaActual = dateStr;

    try {
        let url = `../API/api.php?action=get&fecha=${dateStr}`;
        if (turnoSeleccionado !== "todo_dia") {
            url += `&horario=${turnoSeleccionado}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error al obtener las reservas. Status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !Array.isArray(data.reservas)) {
            alert(data.message || "No se pudieron obtener las reservas");
            return;
        }

        const reservasParaTurno = turnoSeleccionado === "todo_dia"
            ? data.reservas 
            : data.reservas.filter(reserva => reserva.horario === turnoSeleccionado);

        reservasPorFecha[dateStr] = reservasParaTurno;
    } catch (error) {
        console.error("Error al cargar las reservas:", error);
        return;
    }

    const reservasParaTurno = reservasPorFecha[dateStr];

    puestos.forEach(puesto => {
        let shape = puestoShapes[puesto.name];
        if (!shape) {
            shape = createShape(puesto);
            shape.addTo(map);
        }

        const reserva = reservasParaTurno.find(res => res.puesto === puesto.name);

        if (reserva && reserva.cedula != "0" && reserva.cedula) {
            shape.setStyle({ fillColor: 'red', color: 'red' });
        } else {
            shape.setStyle({ fillColor: 'lime', color: 'lime' });
        }

        shape.on('click', function() {
            const turnoActual = document.getElementById("turno").value;
            if (reserva && reserva.cedula !== "0" && reserva.cedula) {
                alert('El puesto ' + puesto.name + ' está ocupado.');
            } else {
                reservedPuestos.add(puesto.name);
                shape.setStyle({ fillColor: 'red', color: 'red' });
                guardarReserva(puesto, fechaActual, turnoActual); 
            }
        });
    });
}
