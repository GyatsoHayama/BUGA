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

        function loadProtocol() {
            const filename = selectEl.value;

            if (!filename) {
                nameEl.textContent = 'Keines gewÃ¤hlt';
                frameEl.src = '';
                messageEl.textContent = 'Bitte wÃ¤hle zuerst ein Protokoll aus der Liste.';
                return;
            }

            const path = getProtocolPath(filename);
            messageEl.textContent = `Lade ${filename}...`;
            nameEl.textContent = filename;
            frameEl.src = path;
        }

        buttonEl.addEventListener('click', loadProtocol);
        selectEl.addEventListener('change', loadProtocol);