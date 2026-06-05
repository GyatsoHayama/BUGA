window.addEventListener('DOMContentLoaded', function () {
    const selectEl = document.getElementById('protocol-select');
    const buttonEl = document.getElementById('load-protocol');
    const messageEl = document.getElementById('load-message');
    const nameEl = document.getElementById('protocol-name');
    const frameEl = document.getElementById('protocol-frame');

    function getProtocolPath(filename) {
        const currentUrl = window.location.href;
        const currentDir = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
        return new URL(filename, currentDir).href;
    }

    function setSelectOptions(files) {
        selectEl.innerHTML = '<option value="">-- Bitte wählen --</option>';
        files.forEach(filename => {
            const option = document.createElement('option');
            option.value = filename;
            option.textContent = filename;
            selectEl.appendChild(option);
        });
    }

    function loadProtocol() {
        const filename = selectEl.value;

        if (!filename) {
            nameEl.textContent = 'Keines gewählt';
            frameEl.src = '';
            messageEl.textContent = 'Bitte wähle zuerst ein Protokoll aus der Liste.';
            return;
        }

        const path = getProtocolPath(filename);
        messageEl.textContent = `Lade ${filename}...`;
        nameEl.textContent = filename;
        frameEl.src = path;
    }

    async function loadProtocolList() {
        try {
            const currentUrl = window.location.href;
            const listUrl = new URL('protocols.json', currentUrl).href;
            const response = await fetch(listUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const files = await response.json();
            if (!Array.isArray(files)) {
                throw new Error('Ungültiges Protokoll-Format');
            }
            setSelectOptions(files);
            if (files.length === 0) {
                messageEl.textContent = 'Keine Protokolle gefunden.';
            }
        } catch (error) {
            console.error(error);
            messageEl.textContent = 'Fehler beim Laden der Protokollliste.';
        }
    }

    buttonEl.addEventListener('click', loadProtocol);
    selectEl.addEventListener('change', loadProtocol);
    loadProtocolList();
});
