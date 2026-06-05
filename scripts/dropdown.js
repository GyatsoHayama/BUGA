document.addEventListener('DOMContentLoaded', function () {

    // dropdown.html laden
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (dropdownMenu) {
        const dropdownUrl = new URL('includes/dropdown.html', document.baseURI).href;
        fetch(dropdownUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Fetch failed: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                dropdownMenu.innerHTML = data;
                initDropdown();
            })
            .catch(error => {
                console.error('Dropdown load failed:', error);
                dropdownMenu.innerHTML = getDropdownFallback();
                initDropdown();
            });
    }

    initPageSelect();

});

function getDropdownFallback() {
    return `
        <div class="dropdown" id="mainDropdown">
            <button class="dropdown-button" aria-label="Menü">Menü</button>
            <div class="dropdown-menu">
                <div class="menu-section">
                    <h3 class="menu-title">A-Frame</h3>
                    <a href="A-Frame/skl_index.html">HsBo alte Bsp</a>
                    <a href="Murals/skl_Murals_Marcel.html">Murals_Marcel</a>
                    <a href="A-Frame/skl_Marker_L.html">Marker_Laura</a>
                </div>
                <div class="menu-section">
                    <h3 class="menu-title">POI´s</h3>
                    <a href="POI/skl_POI.html">POI_Dennis</a>
                </div>
                <div class="menu-section">
                    <h3 class="menu-title">Protokolle</h3>
                    <a href="Sitzungsprotokolle/Protokoll.html">Sitzungs protokolle</a>
                </div>
            </div>
        </div>
    `;
}

function initPageSelect() {
    const select = document.getElementById('pageSelect');
    const iframe = document.getElementById('aframeViewer');
    if (!select || !iframe) return;

    select.addEventListener('change', function () {
        iframe.src = this.value;
    });
}

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