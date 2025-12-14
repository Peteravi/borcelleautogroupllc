// inventory.js - VERSIÓN CON CATÁLOGO DE IMÁGENES
let cars = [];

// Función para cargar autos desde la API PHP
async function loadCarsFromAPI() {
    try {
        const response = await fetch('api/get_autos.php');

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Transformar datos de PHP al formato esperado por el frontend
        cars = data.map(car => ({
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
        })).filter(car => car.estado === 'disponible'); // Solo mostrar disponibles

        renderCars();

    } catch (error) {
        console.error('Error cargando autos:', error);
        // Fallback a localStorage si hay error
        loadFromLocalStorage();
    }
}

// Fallback a localStorage (opcional)
function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('inventoryCars');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                cars = parsed;
                renderCars();
                return;
            }
        }
    } catch (e) {
        console.warn('Error con localStorage:', e);
    }

    // Si no hay datos, mostrar estado vacío
    renderEmptyState();
}

// Renderizar autos con catálogo de imágenes
function renderCars() {
    const container = document.getElementById("carList");
    if (!container) return;

    container.innerHTML = "";

    if (cars.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-car-front display-1 text-muted"></i>
                    <h4 class="mt-3">No vehicles available</h4>
                    <p class="text-muted">Check back later for new inventory</p>
                </div>
            </div>
        `;
        return;
    }

    cars.forEach((car, index) => {
        container.innerHTML += renderCard(car, index);
    });

    // Inicializar sliders después de renderizar
    initializeImageSliders();
}

// Renderizar tarjeta con catálogo de imágenes
function renderCard(car, index) {
    const hasMultipleImages = car.images && car.images.length > 1;
    const firstImage = car.images && car.images.length > 0 ? car.images[0] : 'assets/img/car-placeholder.jpg';

    // Generar HTML para las imágenes
    let imagesHTML = '';
    if (car.images && car.images.length > 0) {
        imagesHTML = car.images.map((image, imgIndex) => `
            <div class="car-image-slide" data-index="${imgIndex}">
                <img src="${image}" class="car-image" alt="${car.make} ${car.model} - Image ${imgIndex + 1}" onerror="this.src='assets/img/car-placeholder.jpg'">
            </div>
        `).join('');
    } else {
        imagesHTML = `
            <div class="car-image-slide">
                <img src="assets/img/car-placeholder.jpg" class="car-image" alt="${car.make} ${car.model}">
            </div>
        `;
    }

    // Generar indicadores si hay múltiples imágenes
    let indicatorsHTML = '';
    if (hasMultipleImages) {
        indicatorsHTML = car.images.map((_, imgIndex) => `
            <div class="car-image-indicator ${imgIndex === 0 ? 'active' : ''}" data-index="${imgIndex}"></div>
        `).join('');
    }

    return `
    <div class="col-md-12 col-lg-6 col-xl-4">
        <div class="car-card inventory-card" data-car-id="${car.id}">
            <div class="car-image-container">
                <div class="car-image-slider" id="slider-${car.id}">
                    <div class="car-image-wrapper">
                        ${imagesHTML}
                    </div>
                    
                    ${hasMultipleImages ? `
                        <button class="car-image-nav car-image-prev" onclick="slideImage('${car.id}', -1)">‹</button>
                        <button class="car-image-nav car-image-next" onclick="slideImage('${car.id}', 1)">›</button>
                        <div class="car-image-counter">1/${car.images.length}</div>
                        <div class="car-image-indicators">
                            ${indicatorsHTML}
                        </div>
                    ` : ''}
                </div>
                
                <span class="car-badge ${car.title.toLowerCase().includes('clean') ? 'badge-clean' : 'badge-salvage'}">
                    ${car.title}
                </span>
                <span class="fuel-badge fuel-${car.fuel ? car.fuel.toLowerCase().replace(/ /g, '-') : 'unknown'}">
                    <i class="bi bi-fuel-pump"></i> ${car.fuel}
                </span>
            </div>
            <div class="car-card-body">
                <h5 class="car-title">${car.make} ${car.model}</h5>
                <div class="car-specs">
                    <div class="spec-item">
                        <i class="bi bi-calendar-event"></i>
                        <span>${car.year}</span>
                    </div>
                    <div class="spec-item">
                        <i class="bi bi-speedometer"></i>
                        <span>${Number(car.mileage).toLocaleString()} mi</span>
                    </div>
                    <div class="spec-item">
                        <i class="bi bi-fuel-pump"></i>
                        <span>${car.fuel}</span>
                    </div>
                    <div class="spec-item">
                        <i class="bi bi-archive"></i>
                        <span>${car.title}</span>
                    </div>
                </div>
                <div class="car-price">$${Number(car.price).toLocaleString()}</div>
                <div class="car-actions">
                    <button class="btn btn-primary btn-contact" onclick="contactAboutCar('${car.make}', '${car.model}')">
                        <i class="bi bi-telephone"></i> Contact Us
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}

// Función para deslizar imágenes
function slideImage(carId, direction) {
    const slider = document.getElementById(`slider-${carId}`);
    if (!slider) return;

    const wrapper = slider.querySelector('.car-image-wrapper');
    const slides = slider.querySelectorAll('.car-image-slide');
    const indicators = slider.querySelectorAll('.car-image-indicator');
    const counter = slider.querySelector('.car-image-counter');

    if (!slides.length) return;

    const currentIndex = Array.from(slides).findIndex(slide => {
        const rect = slide.getBoundingClientRect();
        return rect.left >= 0 && rect.left < slider.offsetWidth;
    });

    let newIndex = currentIndex + direction;

    // Circular navigation
    if (newIndex < 0) newIndex = slides.length - 1;
    if (newIndex >= slides.length) newIndex = 0;

    // Mover el wrapper
    wrapper.style.transform = `translateX(-${newIndex * 100}%)`;

    // Actualizar indicadores
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === newIndex);
    });

    // Actualizar contador
    if (counter) {
        counter.textContent = `${newIndex + 1}/${slides.length}`;
    }
}

// Inicializar sliders
function initializeImageSliders() {
    // Agregar event listeners para los indicadores
    document.querySelectorAll('.car-image-indicator').forEach(indicator => {
        indicator.addEventListener('click', function () {
            const carId = this.closest('.car-image-slider').id.replace('slider-', '');
            const index = parseInt(this.getAttribute('data-index'));
            goToImage(carId, index);
        });
    });
}

// Función para ir a una imagen específica
function goToImage(carId, index) {
    const slider = document.getElementById(`slider-${carId}`);
    if (!slider) return;

    const wrapper = slider.querySelector('.car-image-wrapper');
    const slides = slider.querySelectorAll('.car-image-slide');
    const indicators = slider.querySelectorAll('.car-image-indicator');
    const counter = slider.querySelector('.car-image-counter');

    if (index < 0 || index >= slides.length) return;

    // Mover el wrapper
    wrapper.style.transform = `translateX(-${index * 100}%)`;

    // Actualizar indicadores
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });

    // Actualizar contador
    if (counter) {
        counter.textContent = `${index + 1}/${slides.length}`;
    }
}

// Función de contacto
function contactAboutCar(make, model) {
    const phoneNumber = "13853019148";
    const message = `Hi, I'm interested in the ${make} ${model} from your inventory. Can you provide more information?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Filtros
function initFilters() {
    const searchForm = document.querySelector('form');
    const makeSelect = document.getElementById('makeSelect');
    const modelInput = document.getElementById('modelSelect');
    const yearInput = document.getElementById('yearSelect');

    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            filterCars();
        });
    }

    if (makeSelect) {
        makeSelect.addEventListener('change', filterCars);
    }

    if (modelInput) {
        modelInput.addEventListener('input', filterCars);
    }

    if (yearInput) {
        yearInput.addEventListener('input', filterCars);
    }
}

function filterCars() {
    const makeFilter = document.getElementById('makeSelect')?.value.toLowerCase() || '';
    const modelFilter = document.getElementById('modelSelect')?.value.toLowerCase() || '';
    const yearFilter = document.getElementById('yearSelect')?.value || '';

    let filteredCars = cars;

    if (makeFilter && makeFilter !== 'any make') {
        filteredCars = filteredCars.filter(car =>
            car.make.toLowerCase().includes(makeFilter)
        );
    }

    if (modelFilter) {
        filteredCars = filteredCars.filter(car =>
            car.model.toLowerCase().includes(modelFilter)
        );
    }

    if (yearFilter) {
        filteredCars = filteredCars.filter(car =>
            car.year.toString().includes(yearFilter)
        );
    }

    renderFilteredCars(filteredCars);
}

function renderFilteredCars(filteredCars) {
    const container = document.getElementById("carList");
    container.innerHTML = "";

    if (filteredCars.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-search display-1 text-muted"></i>
                    <h4 class="mt-3">No vehicles found</h4>
                    <p class="text-muted">Try adjusting your search filters</p>
                </div>
            </div>
        `;
        return;
    }

    filteredCars.forEach((car, index) => {
        container.innerHTML += renderCard(car, index);
    });

    // Inicializar sliders después de filtrar
    initializeImageSliders();
}

function renderEmptyState() {
    const container = document.getElementById("carList");
    if (container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-car-front display-1 text-muted"></i>
                    <h4 class="mt-3">No vehicles available</h4>
                    <p class="text-muted">Check back later for new inventory</p>
                </div>
            </div>
        `;
    }
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    loadCarsFromAPI();
    initFilters();
});

// Hacer las funciones globales para los onclick
window.slideImage = slideImage;
window.contactAboutCar = contactAboutCar;