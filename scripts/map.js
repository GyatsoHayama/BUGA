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

    let currentLocation = null;
    let currentLocationMarker = null;
    const geolocationControl = L.control({ position: "bottomright" });
    geolocationControl.onAdd = () => {
        const element = L.DomUtil.create("button", "geolocation-control");
        element.type = "button";
        element.title = "Zum eigenen Standort springen";
        element.textContent = "● Standort wird ermittelt ...";
        L.DomEvent.disableClickPropagation(element);
        element.addEventListener("click", () => {
            if (currentLocation) {
                map.setView(currentLocation, Math.max(map.getZoom(), 15));
            }
        });
        return element;
    };
    geolocationControl.addTo(map);

    map.on("locationfound", (event) => {
        currentLocation = event.latlng;
        const element = document.querySelector(".geolocation-control");
        if (element) element.textContent = `● ${formatCoordinates(event.latlng)}`;

        if (!currentLocationMarker) {
            currentLocationMarker = L.circleMarker(event.latlng, {
                radius: 7,
                color: "#fff",
                weight: 2,
                fillColor: "#1976d2",
                fillOpacity: 1
            }).addTo(map);
        } else {
            currentLocationMarker.setLatLng(event.latlng);
        }
    });

    map.on("locationerror", () => {
        const element = document.querySelector(".geolocation-control");
        if (element) element.textContent = "● Standort nicht verfügbar";
    });

    map.locate({ watch: true, enableHighAccuracy: true, setView: false });

    fetch("POI/POI2/pois.json")
        .then((response) => {
            if (!response.ok) throw new Error(`POIs konnten nicht geladen werden: ${response.status}`);
            return response.json();
        })
        .then((pois) => {
            pois.forEach((poi) => {
                if (!Number.isFinite(poi.latitude) || !Number.isFinite(poi.longitude)) return;

                const applicationUrl = poi.applicationUrl || "POI/POI2/index.html";
                const popupContent = `
                    <div class="poi-popup-content" style="background:#ffffff; color:#333333; opacity:1;">
                        <strong class="poi-popup-name">${escapeHtml(poi.name)}</strong>
                        <p class="poi-popup-description">${escapeHtml(poi.description || "Keine Beschreibung")}</p>
                        <a class="poi-popup-link" href="${escapeHtml(applicationUrl)}">Zur Anwendung</a>
                        <small class="poi-popup-coordinates">Koordinaten: ${formatCoordinates({ lat: poi.latitude, lng: poi.longitude })}</small>
                    </div>`;

                L.marker([poi.latitude, poi.longitude])
                    .addTo(map)
                    .bindPopup(popupContent, { className: "poi-popup" });
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

function formatCoordinates(latlng) {
    return `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
}