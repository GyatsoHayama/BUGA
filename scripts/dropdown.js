document.addEventListener('DOMContentLoaded', function () {

    // dropdown.html laden
    fetch('includes/dropdown.html')
        .then(response => response.text())
        .then(data => {

            // HTML einsetzen
            document.getElementById('dropdown-menu').innerHTML = data;

            // Danach Dropdown aktivieren
            initDropdown();
        });

});

function initDropdown() {

    const dropdown = document.getElementById('mainDropdown');
    if (!dropdown) return;

    const button = dropdown.querySelector('.dropdown-button');
    const menu = dropdown.querySelector('.dropdown-menu');

    function closeMenu() {
        dropdown.classList.remove('open');

        if (menu) {
            menu.style.display = 'none';
        }
    }

    function openMenu() {
        dropdown.classList.add('open');

        if (menu) {
            menu.style.display = 'block';
        }
    }

    function toggleMenu(event) {

        event.stopPropagation();

        if (dropdown.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    if (button) {
        button.addEventListener('click', toggleMenu);
    }

    function setIframeSrc(src) {
        const iframe = document.getElementById('aframeViewer') || document.querySelector('main iframe');
        if (iframe) {
            iframe.src = src;
            closeMenu();
        } else {
            window.location.href = src;
        }
    }

    function onDropdownLinkClick(event) {
        const link = event.target.closest('a[data-iframe]');
        if (!link) return;
        event.preventDefault();
        const src = link.dataset.src;
        if (src) {
            setIframeSrc(src);
        }
    }

    dropdown.addEventListener('click', onDropdownLinkClick);

    document.addEventListener('click', function () {

        if (dropdown.classList.contains('open')) {
            closeMenu();
        }
    });

    dropdown.addEventListener('click', function (event) {
        event.stopPropagation();
    });
}