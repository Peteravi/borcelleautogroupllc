/* 
   admin.js - Panel de administración con filtrado integrado - CORREGIDO
*/

document.addEventListener("DOMContentLoaded", () => {

    let cars = [];
    let filteredCars = [];
    let newFiles = [];                 // Al agregar
    let editNewFiles = [];             // Nuevas imágenes en edición
    let editExistingImages = [];       // Imágenes actuales del auto
    let currentPrincipal = null;       // ID o token de la principal
    let editingAutoId = null;

    // ------------------- TOAST -------------------
    function showToast(msg, type = "success") {
        const toastEl = document.getElementById("mainToast");
        const toastBody = document.getElementById("mainToastBody");
        if (!toastEl) return;
        toastBody.textContent = msg;
        toastEl.className = `toast align-items-center text-bg-${type} border-0`;
        bootstrap.Toast.getOrCreateInstance(toastEl).show();
    }

    // ------------------- INICIALIZAR FILTROS -------------------
    function initializeFilters() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const featuredFilter = document.getElementById('featuredFilter');

        if (searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', applyFilters);
        }

        if (featuredFilter) {
            featuredFilter.addEventListener('change', applyFilters);
        }
    }

    // ------------------- APLICAR FILTROS -------------------
    function applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const statusValue = document.getElementById('statusFilter').value;
        const featuredValue = document.getElementById('featuredFilter').value;

        filteredCars = cars.filter(car => {
            // Filtro por búsqueda
            const matchesSearch = searchTerm === '' ||
                (car.marca && car.marca.toLowerCase().includes(searchTerm)) ||
                (car.modelo && car.modelo.toLowerCase().includes(searchTerm)) ||
                (car.vin && car.vin.toLowerCase().includes(searchTerm)) ||
                (car.anio && car.anio.toString().includes(searchTerm)) ||
                (car.combustible && car.combustible.toLowerCase().includes(searchTerm));

            // Filtro por estado
            const matchesStatus = statusValue === '' ||
                (car.estado && car.estado === statusValue);

            // Filtro por destacado
            let matchesFeatured = true;
            if (featuredValue === 'true') {
                matchesFeatured = car.destacado === 1 || car.destacado === true;
            }

            return matchesSearch && matchesStatus && matchesFeatured;
        });

        renderCars();
        updateStatistics();
    }

    // ------------------- ACTUALIZAR ESTADÍSTICAS -------------------
    function updateStatistics() {
        const totalVehicles = document.getElementById('totalVehicles');
        const availableVehicles = document.getElementById('availableVehicles');

        if (totalVehicles) {
            totalVehicles.textContent = filteredCars.length;
        }

        if (availableVehicles) {
            const availableCount = filteredCars.filter(car => car.estado === 'available').length;
            availableVehicles.textContent = availableCount;
        }
    }

    // ------------------- LIMPIAR FILTROS -------------------
    function clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('featuredFilter').value = '';
        applyFilters();
    }

    // ------------------- GET AUTOS -------------------
    async function getCars() {
        try {
            const res = await fetch("api/get_autos.php");
            const data = await res.json();
            cars = Array.isArray(data) ? data : [];
            filteredCars = [...cars]; // Inicializar filteredCars con todos los autos
            initializeFilters(); // Inicializar filtros después de cargar los datos
            applyFilters(); // Aplicar filtros iniciales
        } catch (e) {
            console.error("Error GET autos:", e);
            showToast("Error cargando autos", "danger");
        }
    }

    // ------------------- RENDER AUTOS -------------------
    function renderCars() {
        const container = document.getElementById("carList");
        const emptyState = document.getElementById("emptyState");

        if (!container) return;

        container.innerHTML = "";

        // Usar filteredCars en lugar de cars para mostrar solo los filtrados
        const carsToRender = filteredCars.length > 0 ? filteredCars : cars;

        if (carsToRender.length === 0) {
            if (emptyState) emptyState.classList.remove('d-none');
            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="bi bi-search display-1 text-muted mb-4"></i>
                        <h4 class="fw-bold text-dark mb-3">No se encontraron vehículos</h4>
                        <p class="text-muted mb-4">Intenta ajustar los filtros de búsqueda</p>
                        <button class="btn btn-outline-primary" onclick="clearFilters()">
                            <i class="bi bi-arrow-clockwise"></i>
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        if (emptyState) emptyState.classList.add('d-none');

        carsToRender.forEach(car => {
            const imagenes = Array.isArray(car.imagenes) ? car.imagenes : [];
            let imagenHtml = "";

            if (imagenes.length > 0) {
                const first = imagenes[0].ruta.replace(/^uploads\//, "");
                imagenHtml = `
                <div class="card-img-top text-center p-2 bg-light">
                    <img src="uploads/${first}" style="max-height:200px;object-fit:contain" class="img-fluid">
                    ${imagenes.length > 1 ? `<small class="text-muted">+${imagenes.length - 1} más</small>` : ""}
                </div>`;
            }

            const statusBadge = getStatusBadge(car.estado);
            const featuredBadge = car.destacado ? '<span class="badge bg-warning text-dark"><i class="bi bi-star-fill me-1"></i>Destacado</span>' : '';

            const html = `
            <div class="col-md-4 mb-4">
                <div class="card shadow-sm h-100">
                    ${imagenHtml}
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${car.marca} ${car.modelo}</h5>
                            <div>${featuredBadge}</div>
                        </div>
                        <p class="card-text text-muted mb-2">Año: ${car.anio}</p>
                        <p class="card-text fw-bold text-primary h5 mb-3">$${car.precio}</p>
                        
                        <div class="mb-3">
                            ${statusBadge}
                        </div>

                        <div class="card-details small text-muted mb-3 flex-grow-1">
                            ${car.vin ? `<div><strong>VIN:</strong> ${car.vin}</div>` : ""}
                            ${car.millaje ? `<div><strong>Millaje:</strong> ${car.millaje} km</div>` : ""}
                            ${car.combustible ? `<div><strong>Combustible:</strong> ${car.combustible}</div>` : ""}
                            ${car.drive_train ? `<div><strong>Transmisión:</strong> ${car.drive_train}</div>` : ""}
                        </div>

                        <div class="mt-auto d-flex gap-2">
                            <button class="btn btn-warning btn-edit flex-fill" data-id="${car.id}" data-bs-toggle="modal" data-bs-target="#modalCar">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-danger btn-delete" data-id="${car.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

            container.insertAdjacentHTML("beforeend", html);
        });

        // botones editar / eliminar
        document.querySelectorAll(".btn-edit").forEach(btn => {
            btn.onclick = () => {
                // Buscar en el array completo de cars, no en filteredCars
                const car = cars.find(c => c.id == btn.dataset.id);
                if (car) {
                    openEditModal(car);
                }
            };
        });

        document.querySelectorAll(".btn-delete").forEach(btn => {
            btn.onclick = () => deleteAuto(btn.dataset.id);
        });
    }

    // ------------------- BADGE DE ESTADO -------------------
    function getStatusBadge(status) {
        const statusConfig = {
            'available': { class: 'bg-success', text: 'Disponible' },
            'reserved': { class: 'bg-warning text-dark', text: 'Reservado' },
            'sold': { class: 'bg-secondary', text: 'Vendido' }
        };

        const config = statusConfig[status] || { class: 'bg-light text-dark', text: status };
        return `<span class="badge ${config.class}">${config.text}</span>`;
    }

    // ------------------- FUNCIONES AUXILIARES PARA PERSISTENCIA -------------------
    function getFormData() {
        return {
            vin: document.getElementById("carVin").value,
            marca: document.getElementById("carMake").value,
            modelo: document.getElementById("carModel").value,
            anio: document.getElementById("carYear").value,
            precio: document.getElementById("carPrice").value,
            millaje: document.getElementById("carMileage").value,
            combustible: document.getElementById("carFuel").value, // CORREGIDO: carFuel en lugar de carCombustible
            drive_train: document.getElementById("carDriveTrain").value,
            descripcion: document.getElementById("carDescription").value, // CORREGIDO: carDescription en lugar de carDescripcion
            destacado: document.getElementById("carFeatured").checked, // CORREGIDO: carFeatured en lugar de carDestacado
            estado: document.getElementById("carStatus").value // CORREGIDO: carStatus en lugar de carEstado
        };
    }

    function restoreFormData(data) {
        document.getElementById("carVin").value = data.vin || "";
        document.getElementById("carMake").value = data.marca || "";
        document.getElementById("carModel").value = data.modelo || "";
        document.getElementById("carYear").value = data.anio || "";
        document.getElementById("carPrice").value = data.precio || "";
        document.getElementById("carMileage").value = data.millaje || "";
        document.getElementById("carFuel").value = data.combustible || ""; // CORREGIDO
        document.getElementById("carDriveTrain").value = data.drive_train || "";
        document.getElementById("carDescription").value = data.descripcion || ""; // CORREGIDO
        document.getElementById("carFeatured").checked = data.destacado || false; // CORREGIDO
        document.getElementById("carStatus").value = data.estado || "available"; // CORREGIDO
    }

    // ------------------- OPEN EDIT MODAL -------------------
    function openEditModal(car) {
        editingAutoId = car.id;

        // LIMPIAR ESTADOS ANTERIORES
        editExistingImages = [];
        editNewFiles = [];
        currentPrincipal = null;

        // LLENAR FORMULARIO CON IDs CORRECTOS
        document.getElementById("carVin").value = car.vin || "";
        document.getElementById("carMake").value = car.marca || "";
        document.getElementById("carModel").value = car.modelo || "";
        document.getElementById("carYear").value = car.anio || "";
        document.getElementById("carPrice").value = car.precio || "";
        document.getElementById("carMileage").value = car.millaje || "";
        document.getElementById("carFuel").value = car.combustible || ""; // CORREGIDO
        document.getElementById("carDriveTrain").value = car.drive_train || "";
        document.getElementById("carDescription").value = car.descripcion || ""; // CORREGIDO
        document.getElementById("carFeatured").checked = car.destacado == 1; // CORREGIDO
        document.getElementById("carStatus").value = car.estado || "available"; // CORREGIDO

        // IMÁGENES - Validar que exista el array
        if (car.imagenes && Array.isArray(car.imagenes)) {
            editExistingImages = car.imagenes.map(img => ({
                id: img.id,
                ruta: img.ruta.replace(/^uploads\//, ""),
                principal: img.principal
            }));

            const principalImg = editExistingImages.find(x => x.principal == 1);
            currentPrincipal = principalImg ? principalImg.id : null;
        }

        renderPreviewEdit();
    }

    // ------------------- PREVIEW DE EDICIÓN CORREGIDO -------------------
    function renderPreviewEdit() {
        const preview = document.getElementById("preview");

        // PRESERVAR DATOS DEL FORMULARIO ANTES DE CUALQUIER OPERACIÓN
        const formData = getFormData();

        preview.innerHTML = "";

        // EXISTING IMAGES
        editExistingImages.forEach(img => {
            const ruta = img.ruta;

            const div = document.createElement("div");
            div.className = "position-relative m-2 border p-1 rounded";
            div.style.width = "120px";
            div.style.height = "90px";

            div.innerHTML = `
                <img src="uploads/${ruta}" style="width:100%;height:100%;object-fit:contain">
                <button class="btn btn-sm ${currentPrincipal == img.id ? "btn-warning" : "btn-outline-warning"} position-absolute" style="left:5px;top:5px">
                    <i class="bi ${currentPrincipal == img.id ? "bi-star-fill" : "bi-star"}"></i>
                </button>
                <button class="btn btn-sm btn-danger position-absolute" style="right:5px;top:5px">
                    <i class="bi bi-trash"></i>
                </button>`;

            const starBtn = div.querySelector('button:nth-child(2)');
            const delBtn = div.querySelector('button:nth-child(3)');

            starBtn.onclick = () => {
                currentPrincipal = img.id;
                renderPreviewEdit();
            };

            delBtn.onclick = () => {
                if (!confirm("¿Eliminar esta imagen?")) return;

                // MOSTRAR LOADING
                const originalHTML = delBtn.innerHTML;
                delBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm"></i>';
                delBtn.disabled = true;

                fetch("api/delete_image.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image_id: img.id })
                })
                    .then(r => r.json())
                    .then(d => {
                        if (d.success) {
                            editExistingImages = editExistingImages.filter(x => x.id !== img.id);
                            if (currentPrincipal == img.id) currentPrincipal = null;
                            renderPreviewEdit();
                            showToast("Imagen eliminada correctamente", "success");
                        } else {
                            showToast("Error al eliminar imagen", "danger");
                            // RESTAURAR BOTÓN
                            delBtn.innerHTML = originalHTML;
                            delBtn.disabled = false;
                        }
                    })
                    .catch(error => {
                        console.error("Error:", error);
                        showToast("Error de conexión", "danger");
                        delBtn.innerHTML = originalHTML;
                        delBtn.disabled = false;
                    });
            };

            preview.appendChild(div);
        });

        // NEW FILES
        editNewFiles.forEach((file, index) => {
            const div = document.createElement("div");
            div.className = "position-relative m-2 border p-1 rounded";
            div.style.width = "120px";
            div.style.height = "90px";

            const url = URL.createObjectURL(file);

            div.innerHTML = `
                <img src="${url}" style="width:100%;height:100%;object-fit:contain">
                <input type="radio" name="principal_new" class="position-absolute" style="left:5px;top:5px" ${currentPrincipal === "new_" + index ? "checked" : ""}>
                <button class="btn btn-sm btn-danger position-absolute" style="right:5px;top:5px">
                    <i class="bi bi-x-lg"></i>
                </button>`;

            const radio = div.querySelector('input[type="radio"]');
            const delBtn = div.querySelector('button');

            radio.onclick = () => {
                currentPrincipal = "new_" + index;
            };

            delBtn.onclick = () => {
                editNewFiles.splice(index, 1);
                if (currentPrincipal == "new_" + index) currentPrincipal = null;
                renderPreviewEdit();
            };

            preview.appendChild(div);
        });

        // RESTAURAR DATOS DEL FORMULARIO
        restoreFormData(formData);
    }

    // ------------------- PREVIEW CREACIÓN -------------------
    function renderPreviewCreate() {
        const preview = document.getElementById("preview");
        preview.innerHTML = "";

        newFiles.forEach((file, index) => {
            const url = URL.createObjectURL(file);
            const div = document.createElement("div");
            div.className = "position-relative m-2 border p-1 rounded";
            div.style.width = "120px";
            div.style.height = "90px";

            div.innerHTML = `
                <img src="${url}" style="width:100%;height:100%;object-fit:contain">
                <input type="radio" name="principal_new" class="position-absolute" style="left:5px;top:5px" ${currentPrincipal == "new_" + index ? "checked" : ""}>
                <button class="btn btn-sm btn-danger position-absolute" style="right:5px;top:5px">
                    <i class="bi bi-x-lg"></i>
                </button>`;

            const radio = div.querySelector('input[type="radio"]');
            const delBtn = div.querySelector('button');

            radio.onclick = () => currentPrincipal = "new_" + index;

            delBtn.onclick = () => {
                newFiles.splice(index, 1);
                if (currentPrincipal == "new_" + index) currentPrincipal = null;
                renderPreviewCreate();
            };

            preview.appendChild(div);
        });
    }

    // ------------------- HANDLE FILE INPUT -------------------
    document.getElementById("carImage").addEventListener("change", e => {
        const files = Array.from(e.target.files);
        if (editingAutoId) {
            files.forEach(f => editNewFiles.push(f));
            if (!currentPrincipal && editNewFiles.length > 0) currentPrincipal = "new_0";
            renderPreviewEdit();
        } else {
            files.forEach(f => newFiles.push(f));
            if (!currentPrincipal && newFiles.length > 0) currentPrincipal = "new_0";
            renderPreviewCreate();
        }
        e.target.value = "";
    });

    // ------------------- RESET MODAL -------------------
    function resetModal() {
        editingAutoId = null;
        editExistingImages = [];
        editNewFiles = [];
        newFiles = [];
        currentPrincipal = null;
        document.getElementById("formAddCar").reset();
        document.getElementById("preview").innerHTML = "";
        document.getElementById("modalCarLabel").innerHTML = `
            <i class="bi bi-pencil-square me-2"></i>
            Register Vehicle
        `;
    }

    // ------------------- MODAL EVENT LISTENERS -------------------
    const modalCar = document.getElementById('modalCar');
    if (modalCar) {
        modalCar.addEventListener('show.bs.modal', function () {
            // No hacer nada especial al abrir
        });

        modalCar.addEventListener('hidden.bs.modal', function () {
            resetModal();
        });
    }

    // ------------------- SUBMIT FORM -------------------
    document.getElementById("formAddCar").onsubmit = e => {
        e.preventDefault();

        // Validación básica
        if (!document.getElementById("carMake").value ||
            !document.getElementById("carModel").value ||
            !document.getElementById("carYear").value ||
            !document.getElementById("carPrice").value) {
            showToast("Complete los campos obligatorios", "danger");
            return;
        }

        const carData = {
            vin: document.getElementById("carVin").value,
            marca: document.getElementById("carMake").value,
            modelo: document.getElementById("carModel").value,
            anio: document.getElementById("carYear").value,
            precio: document.getElementById("carPrice").value,
            millaje: document.getElementById("carMileage").value,
            combustible: document.getElementById("carFuel").value, // CORREGIDO
            drive_train: document.getElementById("carDriveTrain").value,
            descripcion: document.getElementById("carDescription").value, // CORREGIDO
            destacado: document.getElementById("carFeatured").checked ? 1 : 0, // CORREGIDO
            estado: document.getElementById("carStatus").value // CORREGIDO
        };

        if (!editingAutoId) {
            addCar(carData);
        } else {
            updateCar(carData);
        }
    };

    // ------------------- ADD AUTO -------------------
    function addCar(data) {
        const fd = new FormData();
        for (let k in data) fd.append(k, data[k]);
        newFiles.forEach(f => fd.append("imagenes[]", f));
        fd.append("principal", currentPrincipal);

        // Mostrar loading
        const submitBtn = document.querySelector('#formAddCar button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-2"></i> Guardando...';
        submitBtn.disabled = true;

        fetch("api/add_auto.php", { method: "POST", body: fd })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    showToast("Auto agregado correctamente");
                    resetModal();
                    bootstrap.Modal.getInstance(document.getElementById('modalCar')).hide();
                    getCars(); // Recargar los autos
                } else {
                    showToast(res.msg || "Error al agregar auto", "danger");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                showToast("Error de conexión", "danger");
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
    }

    // ------------------- UPDATE AUTO -------------------
    function updateCar(data) {
        const fd = new FormData();
        fd.append("id", editingAutoId);

        for (let k in data) fd.append(k, data[k]);

        editNewFiles.forEach(f => fd.append("imagenes[]", f));
        fd.append("principal", currentPrincipal);

        // Mostrar loading
        const submitBtn = document.querySelector('#formAddCar button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-2"></i> Actualizando...';
        submitBtn.disabled = true;

        fetch("api/edit_auto.php", { method: "POST", body: fd })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    showToast("Auto actualizado correctamente");
                    resetModal();
                    bootstrap.Modal.getInstance(document.getElementById('modalCar')).hide();
                    getCars(); // Recargar los autos
                } else {
                    showToast(res.message || "Error al actualizar auto", "danger");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                showToast("Error de conexión", "danger");
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
    }

    // ------------------- DELETE AUTO -------------------
    function deleteAuto(id) {
        if (!confirm("¿Está seguro de eliminar este auto? Esta acción no se puede deshacer.")) return;

        const car = cars.find(c => c.id == id);
        if (!car) return;

        // Mostrar loading en el botón
        const deleteBtn = document.querySelector(`.btn-delete[data-id="${id}"]`);
        const originalText = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm"></i>';
        deleteBtn.disabled = true;

        fetch("api/delete_auto.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    showToast("Auto eliminado correctamente", "danger");
                    getCars(); // Recargar los autos
                } else {
                    showToast(res.message || "Error al eliminar auto", "danger");
                    deleteBtn.innerHTML = originalText;
                    deleteBtn.disabled = false;
                }
            })
            .catch(error => {
                console.error("Error:", error);
                showToast("Error de conexión", "danger");
                deleteBtn.innerHTML = originalText;
                deleteBtn.disabled = false;
            });
    }

    // ------------------- HACER FUNCIONES GLOBALES -------------------
    window.clearFilters = clearFilters;

    // ------------------- INIT -------------------
    getCars();

});