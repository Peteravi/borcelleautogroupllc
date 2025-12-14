document.addEventListener("DOMContentLoaded", function () {
    console.log("main.js is successfully connected!");

    // Bootstrap Tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Custom form alert
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('Thank you for your message!');
        });
    }

    // WHATSAPP FLOATING BUTTON 
    const waButton = document.createElement("a");
    waButton.href = "https://wa.me/13853019148";
    waButton.target = "_blank";
    waButton.rel = "noopener";
    waButton.className = "whatsapp-float";

    const icon = document.createElement("img");
    icon.src = "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg";
    icon.alt = "WhatsApp";
    icon.style.filter = "invert(36%) sepia(93%) saturate(747%) hue-rotate(84deg) brightness(93%) contrast(92%)"; // para que se vea verde

    waButton.appendChild(icon);
    document.body.appendChild(waButton);
});
