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
    let currentLocationAccuracyCircle = null;
    const geolocationControl = L.control({ position: "bottomright" });
    geolocationControl.onAdd = () => {
        const element = L.DomUtil.create("button", "geolocation-control");
        element.type = "button";
        element.title = "Zum eigenen Standort springen";
        element.innerHTML = '<span class="location-dot">●</span> Standort wird ermittelt ...';
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
        if (element) element.innerHTML = `<span class="location-dot">●</span> ${formatCoordinates(event.latlng)}`;

        const accuracy = Math.max(event.accuracy || 0, 10);
        if (!currentLocationAccuracyCircle) {
            currentLocationAccuracyCircle = L.circle(event.latlng, {
                radius: accuracy,
                color: "#1976d2",
                weight: 1,
                fillColor: "#1976d2",
                fillOpacity: 0.16,
                interactive: false
            }).addTo(map);
        } else {
            currentLocationAccuracyCircle
                .setLatLng(event.latlng)
                .setRadius(accuracy);
        }

        if (!currentLocationMarker) {
            currentLocationMarker = L.marker(event.latlng).addTo(map);
        } else {
            currentLocationMarker.setLatLng(event.latlng);
        }
    });

    map.on("locationerror", () => {
        const element = document.querySelector(".geolocation-control");
        if (element) element.innerHTML = '<span class="location-dot">●</span> Standort nicht verfügbar';
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

    loadSavedMarkers(map);

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

async function loadSavedMarkers(map) {
    const localMarkers = readLocalMarkers();
    const renderedMarkerIds = new Set();
    renderSavedMarkers(map, localMarkers, renderedMarkerIds);
    try {
        const response = await fetch(`includes/marker-data.json?v=${Date.now()}`);
        if (!response.ok) throw new Error(`Projektmarker konnten nicht geladen werden: ${response.status}`);
        const projectData = normalizeMarkers(await response.json());
        renderSavedMarkers(map, projectData, renderedMarkerIds);
    } catch (error) {
        console.warn("Projektmarker konnten nicht geladen werden.", error);
    }
}

function renderSavedMarkers(map, markers, renderedMarkerIds) {
    const areaTitleMarkers = [];
    const areaBounds = L.latLngBounds([]);
    markers.forEach((marker) => {
        if (marker.id && renderedMarkerIds.has(marker.id)) return;
        if (marker.id) renderedMarkerIds.add(marker.id);
        if (marker.type === "point" && Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude)) {
            const applicationLink = marker.applicationUrl
                ? `<a class="poi-popup-link" href="${escapeHtml(marker.applicationUrl)}">Zur Anwendung</a>`
                : "";
            const popupContent = `
                <div class="poi-popup-content">
                    <strong class="poi-popup-name">${escapeHtml(marker.title)}</strong>
                    <p class="poi-popup-description">${escapeHtml(marker.description || "Keine Beschreibung")}</p>
                    ${applicationLink}
                </div>`;
            L.marker([marker.latitude, marker.longitude]).addTo(map).bindPopup(popupContent, { className: "poi-popup" });
        }

        if (marker.type === "area" && marker.bounds) {
            areaBounds.extend(marker.bounds);
            const rectangle = L.rectangle(marker.bounds, {
                color: "#8e44ad",
                weight: 3,
                fillColor: "#8e44ad",
                fillOpacity: 0.12,
                interactive: false
            }).addTo(map);
            const topLeft = [marker.bounds[1][0], marker.bounds[0][1]];
            const title = L.marker(topLeft, {
                interactive: true,
                icon: L.divIcon({
                    className: "area-title-marker",
                    html: `<a class="area-title-label" href="${escapeHtml(marker.url || "#")}">${escapeHtml(getAreaTitle(marker, map))}</a>`,
                    iconAnchor: [0, 0]
                })
            }).addTo(map);

            title.on("click", (event) => {
                L.DomEvent.stopPropagation(event);
            });
            areaTitleMarkers.push({ marker, title });
        }
    });

    if (areaBounds.isValid()) {
        requestAnimationFrame(() => {
            map.invalidateSize();
            map.fitBounds(areaBounds, { padding: [24, 24], maxZoom: 14, animate: false });
        });
    }

    map.on("zoomend", () => {
        areaTitleMarkers.forEach(({ marker, title }) => {
            title.setIcon(createAreaTitleIcon(marker, map));
        });
    });
}

function createAreaTitleIcon(marker, map) {
    return L.divIcon({
        className: "area-title-marker",
        html: `<a class="area-title-label" href="${escapeHtml(marker.url || "#")}">${escapeHtml(getAreaTitle(marker, map))}</a>`,
        iconAnchor: [0, 0]
    });
}

function getAreaTitle(marker, map) {
    const title = String(marker.title || "");
    const northWest = L.latLng(marker.bounds[1][0], marker.bounds[0][1]);
    const northEast = L.latLng(marker.bounds[1][0], marker.bounds[1][1]);
    const areaWidth = Math.abs(map.latLngToContainerPoint(northEast).x - map.latLngToContainerPoint(northWest).x);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = "700 16px Arial";
    return context.measureText(title).width + 12 > areaWidth ? title.charAt(0) : title;
}

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

function readLocalMarkers() {
    try {
        return normalizeMarkers(JSON.parse(localStorage.getItem("bugaMarkers") || "[]"));
    } catch (error) {
        console.warn("Gespeicherte Marker konnten nicht gelesen werden.", error);
        return [];
    }
}

function normalizeMarkers(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.value)) return data.value;
    return [];
}