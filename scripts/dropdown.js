function initDropdown() {
    const dropdown = document.getElementById('mainDropdown');
    if (!dropdown) return;

    const button = dropdown.querySelector('.dropdown-button');
    const menu = dropdown.querySelector('.dropdown-menu');

    function closeMenu() {
        dropdown.classList.remove('open');
        if (menu) menu.style.display = 'none';
    }

    function openMenu() {
        dropdown.classList.add('open');
        if (menu) menu.style.display = 'block';
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

    document.addEventListener('click', function () {
        if (dropdown.classList.contains('open')) {
            closeMenu();
        }
    });

    dropdown.addEventListener('click', function (event) {
        event.stopPropagation();
    });
}