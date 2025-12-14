// assets/js/index-inventory.js - Muestra 3 carros en el index
let featuredCars = [];

// Función para cargar 3 autos desde la API PHP
async function loadFeaturedCars() {
    try {
        const response = await fetch('api/get_autos.php');

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Transformar datos y tomar solo los primeros 3
        featuredCars = data.map(car => ({
            id: car.id,
            make: car.marca,
            model: car.modelo,
            year: car.anio,
            price: car.precio,
            mileage: car.millaje || 0,
            fuel: car.combustible || 'N/A',
            title: car.estado === 'disponible' ? 'Clean Title' : 'Used',
            images: car.imagenes ? car.imagenes.map(img => img.ruta) : [],
            estado: car.estado,
            destacado: car.destacado
        }))
            .filter(car => car.estado === 'disponible') // Solo mostrar disponibles
            .slice(0, 3); // Tomar solo los primeros 3

        renderFeaturedCars();

    } catch (error) {
        console.error('Error cargando autos destacados:', error);
        renderEmptyFeaturedState();
    }
}

// Renderizar los 3 autos destacados
function renderFeaturedCars() {
    const container = document.getElementById("featuredCarsContainer");
    if (!container) return;

    container.innerHTML = "";

    if (featuredCars.length === 0) {
        renderEmptyFeaturedState();
        return;
    }

    featuredCars.forEach((car, index) => {
        container.innerHTML += renderFeaturedCard(car, index);
    });
}

// Renderizar tarjeta individual para el index
function renderFeaturedCard(car, index) {
    const firstImage = car.images && car.images.length > 0 ? car.images[0] : 'assets/img/car-placeholder.jpg';

    return `
    <div class="col-md-4">
        <div class="card h-100 shadow-sm car-item">
            <img src="${firstImage}" class="card-img-top" alt="${car.make} ${car.model}" style="height: 200px; object-fit: cover;">
            <div class="card-body">
                <h5 class="card-title">${car.make} ${car.model}</h5>
                <p class="card-text">${car.descripcion || 'Excellent condition, ready for delivery.'}</p>

                <ul class="list-unstyled car-attributes mb-2">
                    <li><strong>Year:</strong> ${car.year}</li>
                    <li><strong>Mileage:</strong> ${Number(car.mileage).toLocaleString()} miles</li>
                    <li><strong>Price:</strong> $${Number(car.price).toLocaleString()}</li>
                    <li><strong>Fuel:</strong> ${car.fuel}</li>
                </ul>

                <!-- Title Option -->
                <div class="mb-3">
                    <label class="form-label d-block"><strong>Title:</strong></label>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="title${index}" id="clean${index}" value="Clean Title" ${car.title.includes('Clean') ? 'checked' : ''} disabled>
                        <label class="form-check-label" for="clean${index}">${car.title.includes('Clean') ? 'Clean Title' : 'Used'}</label>
                    </div>
                </div>

                <a href="inventory.html" class="btn btn-outline-primary w-100 mt-3">Details</a>
            </div>
        </div>
    </div>
    `;
}

// Estado vacío para featured cars
function renderEmptyFeaturedState() {
    const container = document.getElementById("featuredCarsContainer");
    if (container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-car-front display-1 text-muted"></i>
                    <h4 class="mt-3">No featured vehicles available</h4>
                    <p class="text-muted">Check our full inventory for available vehicles</p>
                    <a href="inventory.html" class="btn btn-primary mt-3">View Full Inventory</a>
                </div>
            </div>
        `;
    }
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    loadFeaturedCars();
});