document.addEventListener("DOMContentLoaded", () => {
    const mapElement = document.getElementById("map");
    if (!mapElement || typeof L === "undefined") return;

    const map = L.map(mapElement, {
        center: [51.2562, 7.1508],
        zoom: 12,
        minZoom: 3,
        maxZoom: 19,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    requestAnimationFrame(() => map.invalidateSize());

    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(() => map.invalidateSize()).observe(mapElement);
    }

    fetch("POI/POI2/pois.json")
        .then((response) => {
            if (!response.ok) throw new Error(`POIs konnten nicht geladen werden: ${response.status}`);
            return response.json();
        })
        .then((pois) => {
            pois.forEach((poi) => {
                if (!Number.isFinite(poi.latitude) || !Number.isFinite(poi.longitude)) return;

                L.marker([poi.latitude, poi.longitude])
                    .addTo(map)
                    .bindPopup(`<strong>${escapeHtml(poi.name)}</strong><br>${escapeHtml(poi.description || "Keine Beschreibung")}`);
            });
        })
        .catch((error) => console.warn(error));

    document.addEventListener("wheel", (event) => {
        if (!event.ctrlKey) return;

        if (mapElement.contains(event.target)) return;

        event.preventDefault();
        map.setZoom(map.getZoom() + (event.deltaY < 0 ? 1 : -1));
    }, { passive: false });

    document.addEventListener("keydown", (event) => {
        if (!(event.ctrlKey || event.metaKey)) return;

        if (event.key === "+" || event.key === "=") {
            event.preventDefault();
            map.zoomIn();
        } else if (event.key === "-" || event.key === "_") {
            event.preventDefault();
            map.zoomOut();
        } else if (event.key === "0") {
            event.preventDefault();
            map.setZoom(12);
        }
    });
});

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}