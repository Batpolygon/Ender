import os
import sys
import requests
import threading
import webview
import time
import traceback
from pathlib import Path

# ==============================================================================
# 1. RÉSOLUTION DES CHEMINS (COMPATIBLE COMPILATION)
# ==============================================================================
if getattr(sys, 'frozen', False):
    # Chemin de l'exécutable final (dist/EnderAI/EnderAI)
    ROOT_DIR = Path(sys.executable).parent
    UI_DIR = Path(sys._MEIPASS) / "ui"
else:
    # Chemin de développement
    ROOT_DIR = Path(__file__).resolve().parent
    UI_DIR = ROOT_DIR / "ui"

MODELS_LLM = ROOT_DIR / "models" / "llm"
MODELS_VIS  = ROOT_DIR / "models" / "vision"

# ==============================================================================
# 2. LISTE DES MODÈLES À TÉLÉCHARGER
# ==============================================================================
MODELS_TO_DOWNLOAD = [
    {
        "id": "llm",
        "name": "DeepSeek-R1-Distill-Llama-8B-Q4_K_M.gguf",
        "url": "https://huggingface.co/bartowski/DeepSeek-R1-Distill-Llama-8B-GGUF/resolve/main/DeepSeek-R1-Distill-Llama-8B-Q4_K_M.gguf",
        "path": MODELS_LLM,
        "label": "Cerveau Principal (DeepSeek-R1)"
    },
    {
        "id": "emotion", # NOUVEAU MODÈLE POUR L'EXPERT SENTIMENT
        "name": "Lexi-Llama-3-8B-Uncensored-Q4_K_M.gguf",
        "url": "https://huggingface.co/bartowski/Lexi-Llama-3-8B-Uncensored-GGUF/resolve/main/Lexi-Llama-3-8B-Uncensored-Q4_K_M.gguf",
        "path": MODELS_LLM,
        "label": "Expert Émotion (Lexi Llama 3)"
    },
    {
        "id": "joy-txt",
        "name": "llama-joycaption-beta-one-hf-llava.Q4_K_M.gguf",
        "url": "https://huggingface.co/mradermacher/llama-joycaption-beta-one-hf-llava-GGUF/resolve/main/llama-joycaption-beta-one-hf-llava.Q4_K_M.gguf",
        "path": MODELS_LLM,
        "label": "Cerveau Vision (JoyCaption Text)"
    },
    {
        "id": "joy-vis",
        "name": "llama-joycaption-beta-one-llava-mmproj-model-f16.gguf",
        "url": "https://huggingface.co/concedo/llama-joycaption-beta-one-hf-llava-mmproj-gguf/resolve/main/llama-joycaption-beta-one-llava-mmproj-model-f16.gguf",
        "path": MODELS_VIS,
        "label": "Projecteur Vision (JoyCaption proj)"
    }
]

# ==============================================================================
# 3. MOTEUR DE TÉLÉCHARGEMENT
# ==============================================================================
def download_engine(window):
    """Gère le téléchargement des fichiers et la mise à jour de l'interface."""
    try:
        for model in MODELS_TO_DOWNLOAD:
            # Création du dossier cible si nécessaire
            model["path"].mkdir(parents=True, exist_ok=True)
            dest = model["path"] / model["name"]

            # Vérification de l'existence du fichier complet
            # (Un GGUF valide fait toujours plus d'1 Mo)
            if dest.exists() and dest.stat().st_size > 1000000:
                print(f"[LAUNCHER] ✅ {model['name']} est déjà prêt.")
                window.evaluate_js(f"updateProgress('{model['id']}', 100)")
                continue

            print(f"[LAUNCHER] ⬇️ Téléchargement : {model['name']}")

            # Initialisation de la connexion HTTP
            response = requests.get(model["url"], stream=True)
            total_size = int(response.headers.get('content-length', 0))
            downloaded_size = 0

            # Écriture du fichier par blocs de 1Mo
            with open(dest, "wb") as f:
                for chunk in response.iter_content(chunk_size=1024*1024):
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)

                        # Calcul et envoi du pourcentage au Frontend (JS)
                        if total_size > 0:
                            percent = int((downloaded_size / total_size) * 100)
                            window.evaluate_js(f"updateProgress('{model['id']}', {percent})")

        print("[LAUNCHER] 🎉 Tous les modèles sont prêts !")
        time.sleep(1.5) # Petite pause pour laisser le temps à l'utilisateur de voir le 100%
        window.destroy() # Ferme le launcher pour passer au main.py

    except Exception as e:
        print(f"❌ Erreur Launcher : {e}")
        traceback.print_exc()

# ==============================================================================
# 4. LANCEMENT ET TRANSITION
# ==============================================================================
if __name__ == "__main__":
    # 1. On lance la petite interface HTML de téléchargement
    launcher_html = UI_DIR / "launcher.html"
    window = webview.create_window(
        'Ender AI - Installation des Moteurs',
        str(launcher_html),
        width=550,
        height=650,
        resizable=False
    )

    # 2. Le téléchargement se lance dans un thread pour ne pas bloquer l'UI
    threading.Thread(target=download_engine, args=(window,), daemon=True).start()

    # 3. Démarre la fenêtre (bloquant jusqu'à window.destroy())
    webview.start()

    # 4. Une fois téléchargé et fermé, on lance le cœur de l'application
    print("\n[SYSTEM] Lancement de l'application principale Ender...")
    import main
    main.run_app()
