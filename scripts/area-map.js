document.addEventListener("DOMContentLoaded", () => {
    const mapElement = document.getElementById("area-map");
    if (!mapElement) return;

    const map = L.map(mapElement);
    L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    loadAreaData(mapElement.dataset.areaId)
        .then(({ area, pois }) => {
            const bounds = L.latLngBounds(area.bounds);
            map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
            L.rectangle(bounds, {
                color: "#286b39",
                weight: 2,
                fillColor: "#286b39",
                fillOpacity: 0.1,
                interactive: false
            }).addTo(map);
            renderPois(pois, map);
        })
        .catch((error) => {
            console.error("Areal-Karte konnte nicht geladen werden:", error);
            const emptyMessage = document.getElementById("area-poi-empty");
            if (emptyMessage) {
                emptyMessage.hidden = false;
                emptyMessage.textContent = "Gebiet oder POIs konnten nicht geladen werden.";
            }
        });
});

async function loadAreaData(areaId) {
    const markers = await loadMarkers();
    const area = markers.find((marker) => marker.id === areaId && marker.type === "area");
    if (!area || !isValidBounds(area.bounds)) {
        throw new Error("Für diese Seite wurde kein gültiger Areal-Marker gefunden.");
    }

    const response = await fetch("POI/POI2/pois.json");
    if (!response.ok) {
        throw new Error(`POI-Daten konnten nicht geladen werden: ${response.status}`);
    }

    const poisFromFile = await response.json();
    if (!Array.isArray(poisFromFile)) {
        throw new Error("Die POI-Datei enthält kein gültiges Array.");
    }

    const savedPoints = markers
        .filter((marker) => marker.type === "point")
        .map((marker) => ({
            id: marker.id,
            name: marker.title,
            description: marker.description,
            latitude: marker.latitude,
            longitude: marker.longitude
        }));
    const poisById = new Map();
    [...poisFromFile, ...savedPoints].forEach((poi) => {
        if (!Number.isFinite(poi.latitude) || !Number.isFinite(poi.longitude)) return;
        const id = poi.id || `${poi.latitude},${poi.longitude}`;
        poisById.set(id, poi);
    });

    return {
        area,
        pois: [...poisById.values()].filter((poi) => isInsideBounds(poi, area.bounds))
    };
}

async function loadMarkers() {
    const localMarkers = readLocalMarkers();
    try {
        const response = await fetch("includes/marker-data.json");
        if (!response.ok) throw new Error(`Marker konnten nicht geladen werden: ${response.status}`);

        const data = await response.json();
        const projectMarkers = Array.isArray(data) ? data : data.value || [];
        const markersById = new Map(localMarkers.map((marker) => [marker.id, marker]));
        projectMarkers.forEach((marker) => markersById.set(marker.id, marker));
        return [...markersById.values()];
    } catch {
        return localMarkers;
    }
}

function readLocalMarkers() {
    try {
        const markers = JSON.parse(localStorage.getItem("bugaMarkers") || "[]");
        return Array.isArray(markers) ? markers : [];
    } catch {
        return [];
    }
}

function isValidBounds(bounds) {
    return Array.isArray(bounds) && bounds.length === 2 && bounds.every(
        (corner) => Array.isArray(corner) && corner.length === 2 && corner.every(Number.isFinite)
    );
}

function isInsideBounds(poi, bounds) {
    return Number.isFinite(poi.latitude)
        && Number.isFinite(poi.longitude)
        && poi.latitude >= bounds[0][0]
        && poi.latitude <= bounds[1][0]
        && poi.longitude >= bounds[0][1]
        && poi.longitude <= bounds[1][1];
}

function renderPois(pois, map) {
    const list = document.getElementById("area-poi-list");
    const count = document.getElementById("area-poi-count");
    const emptyMessage = document.getElementById("area-poi-empty");
    if (!list || !count || !emptyMessage) return;

    list.replaceChildren();
    count.textContent = `${pois.length} ${pois.length === 1 ? "POI" : "POIs"}`;
    emptyMessage.hidden = pois.length > 0;

    pois.forEach((poi) => {
        const marker = L.marker([poi.latitude, poi.longitude]).addTo(map);
        marker.bindPopup(`<strong>${escapeHtml(poi.name || "POI")}</strong><p>${escapeHtml(poi.description || "")}</p>`);

        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "area-poi-button";
        button.textContent = poi.name || "Unbenannter POI";
        button.setAttribute("aria-label", `Karte auf ${button.textContent} zentrieren`);
        button.addEventListener("click", () => {
            map.panTo(marker.getLatLng());
            marker.openPopup();
        });
        item.append(button);
        list.append(item);
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
