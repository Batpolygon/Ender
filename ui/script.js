/**
 * ENDER AI - Logic Engine 2026
 * Triple-Engine, Multimodal (JoyCaption), RAG, Émotionnelle & Proactive
 */

// ==============================================================================
// 1. ÉLÉMENTS DU DOM
// ==============================================================================

const dropOverlay = document.getElementById('drop-overlay');
const appContainer = document.getElementById('app');
const face = document.querySelector('.face');
const mouth = document.getElementById('mouth');
const eyes = document.querySelectorAll('.eye');

const displayArea = document.getElementById('display-area');
const userInput = document.getElementById('user-input');
const actionBtn = document.getElementById('action-btn');
const moodFiller = document.getElementById('mood-filler');

const historyPanel = document.getElementById('history-panel');
const settingsPanel = document.getElementById('settings-panel');
const historyToggle = document.getElementById('history-toggle');
const settingsToggle = document.getElementById('settings-toggle');
const historyContent = document.getElementById('history-content');

// Paramètres (Triple-Engine)
const selectLLM = document.getElementById('select-llm');
const selectEmotion = document.getElementById('select-emotion'); // NOUVEAU
const selectVisText = document.getElementById('select-vision-text');
const selectVisProj = document.getElementById('select-vision-proj');
const selectFormat = document.getElementById('select-format');
const checkSound = document.getElementById('check-sound');
const applySettings = document.getElementById('apply-settings');
const settingsStatus = document.getElementById('settings-status');

// Gestion Fichiers (Vision & RAG)
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const imgPreview = document.getElementById('img-preview');
const fileInfoPreview = document.getElementById('file-info-preview');
const fileNameText = document.getElementById('file-name-text');
const cancelImg = document.getElementById('cancel-img');

// ==============================================================================
// 2. VARIABLES D'ÉTAT GLOBALES
// ==============================================================================

let isGenerating = false;
let abortController = null;
let currentFileBase64 = null;
let currentFileName = null;
let isImageFile = false;
let accumulatedMarkdown = "";

// Timer d'inactivité
let idleTimer = null;
const IDLE_TIME_LIMIT = 5 * 60 * 1000; // 5 minutes

// ==============================================================================
// 3. MOTEUR AUDIO "ANIMALESE"
// ==============================================================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAnimaleseChar(char) {
    if (!checkSound.checked || char === " " || char === "\n" || char === "\t") return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'triangle';
    const code = char.toLowerCase().charCodeAt(0);
    // Variation de la note pour simuler une voix mignonne
    oscillator.frequency.setValueAtTime(450 + (code % 15) * 25, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08);
}

// ==============================================================================
// 4. ANIMATIONS DU VISAGE
// ==============================================================================

function setExpression(state) {
    face.classList.remove('analyzing', 'looking', 'thinking');
    if (state !== 'idle') face.classList.add(state);
}

function randomBlink() {
    setTimeout(() => {
        eyes.forEach(eye => eye.classList.add('blink'));
        setTimeout(() => {
            eyes.forEach(eye => eye.classList.remove('blink'));
            randomBlink();
        }, 150);
    }, Math.random() * 5000 + 2000);
}
randomBlink();

// ==============================================================================
// 5. GESTION DE LA PROACTIVITÉ
// ==============================================================================

function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (!isGenerating) {
        idleTimer = setTimeout(() => {
            console.log("[SYSTEM] Inactivité détectée. Ender prend l'initiative.");
            handleAction("__PROACTIVE_RECOVERY__");
        }, IDLE_TIME_LIMIT);
    }
}

// ==============================================================================
// 6. GESTION DES FICHIERS (DRAG N DROP & SELECTION)
// ==============================================================================

function handleFileSelection(file) {
    if (!file) return;

    currentFileName = file.name;
    isImageFile = file.type.startsWith('image/');

    const reader = new FileReader();
    reader.onload = (ev) => {
        currentFileBase64 = ev.target.result.split(',')[1];
        previewContainer.style.display = 'block';

        if (isImageFile) {
            imgPreview.src = ev.target.result;
            imgPreview.style.display = 'block';
            fileInfoPreview.style.display = 'none';
        } else {
            imgPreview.style.display = 'none';
            fileInfoPreview.style.display = 'flex';
            fileNameText.innerText = currentFileName;
        }
    };
    reader.readAsDataURL(file);
}

fileInput.onchange = (e) => handleFileSelection(e.target.files[0]);

cancelImg.onclick = () => {
    currentFileBase64 = null;
    currentFileName = null;
    isImageFile = false;
    previewContainer.style.display = 'none';
    fileInput.value = "";
};

// --- DRAG N DROP LOGIC ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
});

window.addEventListener('dragenter', () => dropOverlay.classList.add('active'));
dropOverlay.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) dropOverlay.classList.remove('active');
});
window.addEventListener('drop', (e) => {
    dropOverlay.classList.remove('active');
    handleFileSelection(e.dataTransfer.files[0]);
});

// ==============================================================================
// 7. INITIALISATION DES MODÈLES (TRIPLE ENGINE)
// ==============================================================================

async function initModels() {
    try {
        const res = await fetch('/list-models');
        const data = await res.json();

        // 1. Cerveau Principal (DeepSeek par défaut)
        selectLLM.innerHTML = data.llms.map(f =>
        `<option value="${f}" ${f.toLowerCase().includes('deepseek') ? 'selected' : ''}>${f}</option>`
        ).join('');

        // 2. Expert Émotion (Llama Instruct classique)
        selectEmotion.innerHTML = `<option value="">Aucun (Utiliser le Cerveau Principal)</option>` +
        data.llms.map(f => {
            const isMatch = f.toLowerCase().includes('llama') && !f.toLowerCase().includes('joycaption') && !f.toLowerCase().includes('deepseek');
            return `<option value="${f}" ${isMatch ? 'selected' : ''}>${f}</option>`;
        }).join('');

        // 3. Expert Vision (JoyCaption Texte)
        selectVisText.innerHTML = `<option value="">Aucun</option>` + data.llms.map(f => {
            const isMatch = f.toLowerCase().includes('joycaption') && !f.toLowerCase().includes('mmproj');
            return `<option value="${f}" ${isMatch ? 'selected' : ''}>${f}</option>`;
        }).join('');

        // 4. Projecteur Vision (JoyCaption mmproj)
        selectVisProj.innerHTML = `<option value="">Aucun</option>` + data.visions.map(f => {
            const isMatch = f.toLowerCase().includes('joycaption') && f.toLowerCase().includes('mmproj');
            return `<option value="${f}" ${isMatch ? 'selected' : ''}>${f}</option>`;
        }).join('');

        selectFormat.value = "llava-1.5"; // Format standard pour JoyCaption
    } catch (e) { console.error("Erreur init models:", e); }
}

applySettings.onclick = async () => {
    applySettings.disabled = true;
    settingsStatus.innerHTML = "<span style='color:orange'>🔄 Synchronisation VRAM...</span>";
    try {
        await fetch('/reload', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                llm_file: selectLLM.value,
                emotion_file: selectEmotion.value,
                vision_text_file: selectVisText.value,
                vision_proj_file: selectVisProj.value,
                chat_format: selectFormat.value
            })
        });
        settingsStatus.innerHTML = "<span style='color:green'>✅ Ender Prêt !</span>";
        displayArea.innerHTML = `Moteurs chargés. Cerveau : <b>${selectLLM.value}</b>`;
    } catch (e) { settingsStatus.innerHTML = "<span style='color:red'>❌ Erreur critique</span>"; }
    finally { applySettings.disabled = false; }
};

// ==============================================================================
// 8. PANNEAUX LATÉRAUX
// ==============================================================================

historyToggle.onclick = async () => {
    historyPanel.classList.toggle('open');
    if (historyPanel.classList.contains('open')) {
        try {
            const res = await fetch('/history');
            const data = await res.json();
            historyContent.innerHTML = data.filter(i => i.role !== 'system').map(i => `
            <div style="margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
            <b style="color:${i.role==='user'?'#0084ff':'#333'}; font-size:0.8em;">${i.role.toUpperCase()}</b>
            <div style="font-size:0.95em; line-height:1.4;">${i.content}</div>
            </div>
            `).join('');
        } catch (e) { historyContent.innerHTML = "Erreur chargement."; }
    }
};

settingsToggle.onclick = () => settingsPanel.classList.toggle('open');

// ==============================================================================
// 9. CŒUR LOGIQUE : CHAT, STREAMING ET THINKING
// ==============================================================================

/**
 * Formate visuellement les balises <think> générées par DeepSeek-R1
 */
function formatThinkingTag(text) {
    let formatted = text;
    formatted = formatted.replace(/<think>/g, '<div class="thinking-box"><b>🧠 Pensée interne :</b><br><i>');
    formatted = formatted.replace(/<\/think>/g, '</i></div><br>');
    return formatted;
}

async function handleAction(forcedPrompt = null) {
    if (isGenerating) { if (abortController) abortController.abort(); return; }

    const isProactive = (forcedPrompt === "__PROACTIVE_RECOVERY__");
    const text = isProactive ? "" : userInput.value.trim();
    if (!text && !currentFileBase64 && !isProactive) return;

    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Reset États
    clearTimeout(idleTimer);
    isGenerating = true;
    actionBtn.innerText = "STOP"; actionBtn.className = "stop-mode";
    if (!isProactive) userInput.value = "";
    accumulatedMarkdown = "";

    const payloadData = {
        prompt: isProactive ? "__PROACTIVE_RECOVERY__" : text,
        image_data: isImageFile ? currentFileBase64 : null,
        file_data: !isImageFile ? currentFileBase64 : null,
        filename: currentFileName
    };

    setExpression('analyzing');
    displayArea.innerHTML = isProactive ? "<em>Ender se souvient...</em>" : "<em>Ender analyse...</em>";
    cancelImg.onclick();
    abortController = new AbortController();

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payloadData),
                                     signal: abortController.signal
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let firstToken = true;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const lines = decoder.decode(value).split('\n');
            for (let line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.substring(6));

                    // A. Update Status & Expression
                    if (data.status) {
                        displayArea.innerHTML = `<em>${data.status}</em>`;
                        if (data.status.includes('observe')) setExpression('looking');
                        else if (data.status.includes('analyse') || data.status.includes('lit') || data.status.includes('navigue')) setExpression('analyzing');
                        else if (data.status.includes('réfléchit') || data.status.includes('cherche')) setExpression('thinking');
                    }

                    // B. Update Humeur
                    if (data.mood_label) {
                        appContainer.className = data.mood_label;
                        moodFiller.style.width = data.mood_percent + "%";
                    }

                    // C. Streaming Texte
                    if (data.token) {
                        if (firstToken) {
                            displayArea.innerText = ""; firstToken = false;
                        }

                        accumulatedMarkdown += data.token;

                        // Analyse de l'état actuel : est-il en train de penser dans une balise <think> ?
                        const isThinking = accumulatedMarkdown.includes('<think>') && !accumulatedMarkdown.includes('</think>');

                        displayArea.innerHTML = marked.parse(formatThinkingTag(accumulatedMarkdown));

                        // Gestion du son et des animations de bouche
                        if (isThinking) {
                            setExpression('thinking');
                            mouth.classList.remove('talking'); // Il se tait quand il pense
                        } else {
                            setExpression('idle');
                            mouth.classList.add('talking');

                            // Son Animalese activé !
                            let delay = 0;
                            for (let char of data.token) {
                                setTimeout(() => playAnimaleseChar(char), delay);
                                delay += 30;
                            }
                            mouth.style.transform = `scaleY(${1 + Math.random() * 0.4})`;
                        }
                    }
                }
            }
            displayArea.scrollTop = displayArea.scrollHeight;
        }
    } catch (e) {
        if (e.name === 'AbortError') displayArea.innerHTML += " <br><b>[STOP]</b>";
    } finally {
        isGenerating = false;
        actionBtn.innerText = "ENVOYER"; actionBtn.className = "send-mode";
        mouth.classList.remove('talking'); mouth.style.transform = "scaleY(1)";
        setExpression('idle');
        resetIdleTimer();
    }
}

// --- ÉCOUTEURS ---
actionBtn.onclick = () => handleAction();
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAction(); });
userInput.addEventListener('input', resetIdleTimer);

// --- DÉMARRAGE ---
initModels();
resetIdleTimer();
