document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("area-map", { center: [51.2562, 7.1508], zoom: 12 });
    L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    let markers = [];
    const areaTitleMarkers = [];
    try { markers = JSON.parse(localStorage.getItem("bugaMarkers") || "[]"); } catch { return; }
    markers.forEach((marker) => {
        if (marker.type === "point" && Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude)) {
            L.marker([marker.latitude, marker.longitude]).addTo(map).bindPopup(`<strong>${escapeHtml(marker.title)}</strong><p>${escapeHtml(marker.description || "")}</p>`);
        }
        if (marker.type === "area" && marker.bounds) {
            L.rectangle(marker.bounds, { color: "#8e44ad", weight: 3, fillColor: "#8e44ad", fillOpacity: 0.12, interactive: false }).addTo(map);
            const topLeft = [marker.bounds[1][0], marker.bounds[0][1]];
            const title = L.marker(topLeft, { icon: createAreaTitleIcon(marker, map) }).addTo(map);
            areaTitleMarkers.push({ marker, title });
        }
    });

    map.on("zoomend", () => {
        areaTitleMarkers.forEach(({ marker, title }) => {
            title.setIcon(createAreaTitleIcon(marker, map));
        });
    });
});

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
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
