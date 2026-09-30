document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("editor-map", { center: [51.2562, 7.1508], zoom: 12 });
    L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    const form = document.getElementById("marker-form");
    const typeButtons = document.querySelectorAll(".type-button");
    const typeSwitch = document.getElementById("marker-type-switch");
    const applicationSelect = document.getElementById("marker-application");
    const applicationHint = document.getElementById("application-hint");
    const poiFields = document.getElementById("poi-fields");
    const categoryInput = document.getElementById("marker-category");
    const iconSelect = document.getElementById("marker-icon");
    const titleInput = document.getElementById("marker-title");
    const descriptionInput = document.getElementById("marker-description");
    const markerUrlInput = document.getElementById("marker-url");
    const urlField = document.getElementById("url-field");
    const urlLabel = document.getElementById("url-label");
    const positionButton = document.getElementById("position-button");
    const status = document.getElementById("position-status");
    const saveToProject = document.getElementById("save-to-project");
    const savedList = document.getElementById("saved-marker-list");
    let markerType = "point";
    let selectedPosition = null;
    let drawing = false;
    let firstCorner = null;
    let preview = null;
    let editingMarkerId = null;
    const saveButton = form.querySelector(".save-button");
    const applicationUrls = {
        poi: "POI/skl_POI.html",
        murals: "Murals/skl_Murals_Marcel.html",
        marker: "A-Frame/skl_Marker_L.html"
    };
    const applicationNames = {
        individual: "Individueller Punkt",
        poi: "POI",
        murals: "Murals",
        marker: "A-Frame-Marker"
    };

    updateApplicationFields(false);

    typeButtons.forEach((button) => button.addEventListener("click", () => {
        if (applicationSelect.value !== "individual") return;
        setMarkerType(button.dataset.type);
        resetPosition();
    }));

    applicationSelect.addEventListener("change", () => {
        updateApplicationFields();
    });

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
        const applicationType = applicationSelect.value;
        const exportForImport = saveToProject.checked;
        const markerData = {
            type: markerType,
            applicationType,
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            applicationUrl: applicationUrls[applicationType] || markerUrlInput.value.trim(),
            url: markerType === "area" ? markerUrlInput.value.trim() : "",
            ...selectedPosition
        };
        if (applicationType === "poi") {
            markerData.category = categoryInput.value.trim() || "poi";
            markerData.icon = iconSelect.value;
        }
        if (editingMarkerId) {
            const markerIndex = markers.findIndex((marker) => marker.id === editingMarkerId);
            if (markerIndex !== -1) markers[markerIndex] = { ...markers[markerIndex], ...markerData };
        } else {
            markers.push({ id: `custom-${Date.now()}`, ...markerData });
        }
        localStorage.setItem("bugaMarkers", JSON.stringify(markers));
        if (exportForImport) downloadProjectMarkers(markers);
        editingMarkerId = null;
        form.reset();
        setMarkerType("point");
        updateApplicationFields(false);
        resetPosition();
        saveButton.textContent = "Marker speichern";
        renderSavedMarkers();
        status.textContent = exportForImport
            ? "Marker gespeichert und für den Import exportiert."
            : "Marker gespeichert.";
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

    function setMarkerType(type) {
        markerType = type;
        typeButtons.forEach((button) => button.classList.toggle("active", button.dataset.type === type));
        urlLabel.textContent = type === "area" ? "Link für das Areal (optional)" : "Externer Link (optional)";
    }

    function updateApplicationFields(resetPositionSelection = true) {
        const applicationType = applicationSelect.value;
        const isIndividual = applicationType === "individual";
        const isPoi = applicationType === "poi";

        typeSwitch.hidden = !isIndividual;
        poiFields.hidden = !isPoi;
        urlField.hidden = !isIndividual;
        categoryInput.required = isPoi;
        applicationHint.hidden = isIndividual;
        applicationHint.textContent = isPoi
            ? "Der POI wird in die Daten der POI-Anwendung importiert."
            : applicationType === "murals"
                ? "Der Kartenpunkt verlinkt zur Murals-Anwendung."
                : "Der Kartenpunkt verlinkt zur A-Frame-Marker-Anwendung.";

        if (!isIndividual) setMarkerType("point");
        if (resetPositionSelection) resetPosition();
    }

    function readMarkers() {
        try { return JSON.parse(localStorage.getItem("bugaMarkers") || "[]"); } catch { return []; }
    }

    function downloadProjectMarkers(markers) {
        const data = JSON.stringify(markers, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "marker-data.json";
        link.click();
        URL.revokeObjectURL(downloadUrl);
        status.textContent = "Marker gespeichert und als marker-data.json exportiert.";
    }

    function renderSavedMarkers() {
        savedList.innerHTML = "";
        readMarkers().forEach((marker) => {
            const item = document.createElement("li");
            const label = document.createElement("span");
            const markerKind = marker.type === "area" ? "Areal" : applicationNames[marker.applicationType || "individual"];
            label.textContent = `${marker.title} (${markerKind})`;
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
        applicationSelect.value = marker.applicationType || "individual";
        markerType = marker.type === "area" && applicationSelect.value === "individual" ? "area" : "point";
        typeButtons.forEach((button) => button.classList.toggle("active", button.dataset.type === markerType));
        updateApplicationFields(false);
        titleInput.value = marker.title || "";
        descriptionInput.value = marker.description || "";
        categoryInput.value = marker.category || "test";
        iconSelect.value = marker.icon || "default";
        markerUrlInput.value = applicationSelect.value === "individual"
            ? marker.type === "area" ? marker.url || "" : marker.applicationUrl || ""
            : "";
        selectedPosition = marker.type === "area"
            ? { bounds: marker.bounds }
            : { latitude: marker.latitude, longitude: marker.longitude };
        saveButton.textContent = "Änderungen speichern";
        status.textContent = "Marker geladen. Du kannst ihn jetzt überarbeiten.";
    }

    renderSavedMarkers();
});
