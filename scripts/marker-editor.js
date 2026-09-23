document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("editor-map", { center: [51.2562, 7.1508], zoom: 12 });
    L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    const form = document.getElementById("marker-form");
    const typeButtons = document.querySelectorAll(".type-button");
    const positionButton = document.getElementById("position-button");
    const status = document.getElementById("position-status");
    const applicationSelect = document.getElementById("marker-application");
    const markerUrlInput = document.getElementById("marker-url");
    const websiteLinkSelect = document.getElementById("website-link-select");
    const savedList = document.getElementById("saved-marker-list");
    let markerType = "point";
    let selectedPosition = null;
    let drawing = false;
    let firstCorner = null;
    let preview = null;
    let editingMarkerId = null;
    const saveButton = form.querySelector(".save-button");
    const websiteApplication = "__website__";

    applicationSelect.add(new Option("Keine Verknüpfung", ""));
    [
        ["POI-Anwendung", "POI/POI2/index.html"],
        ["Marker-Anwendung", "A-Frame/skl_index.html"],
        ["Webseite erstellen", websiteApplication],
        ["Eigene Adresse", "https://example.com"]
    ].forEach(([label, value]) => applicationSelect.add(new Option(label, value)));

    loadWebsiteLinks();

    typeButtons.forEach((button) => button.addEventListener("click", () => {
        markerType = button.dataset.type;
        typeButtons.forEach((item) => item.classList.toggle("active", item === button));
        document.getElementById("description-field").hidden = markerType === "area";
        document.getElementById("application-field").hidden = false;
        applicationSelect.required = false;
        updateWebsiteField();
        resetPosition();
    }));

    applicationSelect.addEventListener("change", updateWebsiteField);

    positionButton.addEventListener("click", () => {
        resetPosition(false);
        drawing = true;
        firstCorner = null;
        map.getContainer().classList.add("is-positioning");
        status.textContent = markerType === "point" ? "Klicke auf die gewünschte Position." : "Ziehe mit der Maus ein Rechteck auf der Karte.";
    });

    map.on("click", (event) => {
        if (!drawing || markerType !== "point") return;
        selectedPosition = { latitude: event.latlng.lat, longitude: event.latlng.lng };
        drawing = false;
        map.getContainer().classList.remove("is-positioning");
        status.textContent = `Position: ${event.latlng.lat.toFixed(5)}, ${event.latlng.lng.toFixed(5)}`;
    });

    map.on("mousedown", (event) => {
        if (!drawing || markerType !== "area") return;
        firstCorner = event.latlng;
        preview = L.rectangle([firstCorner, firstCorner], { color: "#2e7d32", dashArray: "6 4" }).addTo(map);
        map.dragging.disable();
    });

    map.on("mousemove", (event) => {
        if (firstCorner && preview) preview.setBounds([firstCorner, event.latlng]);
    });

    map.on("mouseup", (event) => {
        if (!firstCorner || markerType !== "area") return;
        const bounds = L.latLngBounds(firstCorner, event.latlng);
        selectedPosition = { bounds: [[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]] };
        drawing = false;
        firstCorner = null;
        if (preview) { map.removeLayer(preview); preview = null; }
        map.dragging.enable();
        map.getContainer().classList.remove("is-positioning");
        status.textContent = "Areal festgelegt. Du kannst es jetzt speichern.";
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!selectedPosition) { status.textContent = "Bitte zuerst die Position auf der Karte bestimmen."; return; }
        const markers = readMarkers();
        const markerData = {
            type: markerType,
            title: document.getElementById("marker-title").value.trim(),
            description: document.getElementById("marker-description").value.trim(),
            applicationUrl: applicationSelect.value === websiteApplication
                ? websiteLinkSelect.value
                : markerType === "point" ? applicationSelect.value : "",
            url: markerUrlInput.value.trim(),
            ...selectedPosition
        };
        if (editingMarkerId) {
            const markerIndex = markers.findIndex((marker) => marker.id === editingMarkerId);
            if (markerIndex !== -1) markers[markerIndex] = { ...markers[markerIndex], ...markerData };
        } else {
            markers.push({ id: `custom-${Date.now()}`, ...markerData });
        }
        localStorage.setItem("bugaMarkers", JSON.stringify(markers));
        editingMarkerId = null;
        form.reset();
        resetPosition();
        updateWebsiteField();
        saveButton.textContent = "Marker speichern";
        renderSavedMarkers();
        status.textContent = "Marker gespeichert.";
    });

    function resetPosition(clear = true) {
        drawing = false;
        firstCorner = null;
        if (preview) { map.removeLayer(preview); preview = null; }
        map.dragging.enable();
        map.getContainer().classList.remove("is-positioning");
        if (clear) selectedPosition = null;
        status.textContent = "Noch keine Position gewählt.";
    }

    function readMarkers() {
        try { return JSON.parse(localStorage.getItem("bugaMarkers") || "[]"); } catch { return []; }
    }

    function renderSavedMarkers() {
        savedList.innerHTML = "";
        readMarkers().forEach((marker) => {
            const item = document.createElement("li");
            const label = document.createElement("span");
            label.textContent = `${marker.title} (${marker.type === "area" ? "Areal" : "Punkt"})`;
            label.className = "saved-marker-label";
            label.title = "Marker bearbeiten";
            label.addEventListener("click", () => loadMarkerForEditing(marker));
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-marker-button";
            deleteButton.textContent = "X";
            deleteButton.title = "Marker löschen";
            deleteButton.addEventListener("click", () => {
                const remainingMarkers = readMarkers().filter((savedMarker) => savedMarker.id !== marker.id);
                localStorage.setItem("bugaMarkers", JSON.stringify(remainingMarkers));
                renderSavedMarkers();
            });
            item.append(label, deleteButton);
            savedList.appendChild(item);
        });
    }

    function loadMarkerForEditing(marker) {
        editingMarkerId = marker.id;
        const typeButton = [...typeButtons].find((button) => button.dataset.type === marker.type);
        if (typeButton) typeButton.click();
        document.getElementById("marker-title").value = marker.title || "";
        document.getElementById("marker-description").value = marker.description || "";
        const savedUrl = marker.type === "area" ? marker.url : marker.applicationUrl;
        const websiteLink = [...websiteLinkSelect.options].some((option) => option.value === savedUrl);
        applicationSelect.value = websiteLink ? websiteApplication : marker.applicationUrl || "";
        websiteLinkSelect.value = websiteLink ? savedUrl : "";
        markerUrlInput.value = marker.url || "";
        updateWebsiteField();
        selectedPosition = marker.type === "area"
            ? { bounds: marker.bounds }
            : { latitude: marker.latitude, longitude: marker.longitude };
        saveButton.textContent = "Änderungen speichern";
        status.textContent = "Marker geladen. Du kannst ihn jetzt überarbeiten.";
    }

    function updateWebsiteField() {
        const isWebsiteSelection = applicationSelect.value === websiteApplication;
        const isArea = markerType === "area";
        document.getElementById("url-field").hidden = !isWebsiteSelection && !isArea;
        markerUrlInput.hidden = isWebsiteSelection;
        websiteLinkSelect.hidden = !isWebsiteSelection;
        markerUrlInput.required = isArea && !isWebsiteSelection;
        websiteLinkSelect.required = isWebsiteSelection;
    }

    async function loadWebsiteLinks() {
        try {
            const response = await fetch("includes/dropdown.html");
            if (!response.ok) throw new Error(`Dropdown konnte nicht geladen werden: ${response.status}`);
            const dropdownMarkup = await response.text();
            const dropdown = document.createElement("div");
            dropdown.innerHTML = dropdownMarkup;
            websiteLinkSelect.replaceChildren(new Option("Webseite auswählen", ""));
            dropdown.querySelectorAll("a[href]").forEach((link) => {
                const url = new URL(link.getAttribute("href"), document.baseURI).href;
                websiteLinkSelect.add(new Option(link.textContent.trim(), url));
            });
        } catch (error) {
            console.warn("Webseiten-Links konnten nicht geladen werden.", error);
        }
    }

    renderSavedMarkers();
});
