
# 🤖 Ender AI - Neural Assistant 2026

Ender AI est un assistant de bureau (Desktop App) 100 % local, multimodal et autonome. Il utilise une architecture "Triple Engine" pour analyser vos sentiments, observer vos images et raisonner sur vos documents, le tout de manière **totalement non censurée** et sécurisée pour votre vie privée.

## ✨ Fonctionnalités Principales

*   **🧠 Triple-Engine Architecture :**
    *   *Cerveau Principal (Génération & Raisonnement)* : `DeepSeek-R1-Distill-Llama-8B`
    *   *Expert Émotion (Analyse de ton)* : `Lexi-Llama-3-8B-Uncensored`
    *   *Expert Vision (Analyse d'images)* : `JoyCaption (LLaVA)`
*   **📚 RAG Natif :** Glissez un PDF ou un fichier texte sur Ender, il l'indexe instantanément en utilisant les embeddings natifs de `llama-cpp-python` (0% PyTorch, aucun conflit de mémoire GPU).
*   **🌐 Exploration Web Automatique :** Fournissez une URL à Ender. Il la visitera, extraira le contenu texte pur, explorera les liens internes (profondeur 1) et utilisera ces connaissances pour vous répondre en temps réel.
*   **🎭 Moteur Émotionnel :** Le visage d'Ender et ses réponses s'adaptent dynamiquement à votre attitude (Gentil, Neutre, Méchant).
*   **🗣️ Synthèse Sonore "Animalese" :** Ender parle avec un retour audio généré en temps réel, inspiré de la licence Animal Crossing.
*   **⚙️ Mode Pensée (Chain of Thought) :** Visualisez la réflexion interne de l'IA (le processus `<think>`) avant sa réponse finale.
*   **⏰ Proactivité :** Si vous restez inactif pendant 5 minutes, Ender relancera la conversation en se basant sur votre historique.

---

## 🚀 Prérequis Matériels & Logiciels
*   **Python :** Version **3.12** requise.
*   **RAM Système :** 32 Go recommandés.
*   **GPU :** Une carte graphique NVIDIA avec au moins **16 Go de VRAM** (ex: RTX 4060 Ti 16Go) est fortement conseillée pour charger le Triple-Engine complet et profiter du RAG.
*   **Espace Disque :** ~20 Go pour l'installation automatique des modèles GGUF.

---

## 🛠️ Installation

### 🐧 Sur Linux (Manjaro / Arch / Ubuntu)

1. **Installer les dépendances système :**
Pour l'accélération GPU et l'interface Webview (WebKit2GTK).
```bash
sudo pacman -Syu
sudo pacman -S base-devel cmake cuda cudnn webkit2gtk
```
*(Sur Ubuntu : `sudo apt install build-essential cmake nvidia-cuda-toolkit libwebkit2gtk-4.0-dev`)*

2. **Créer l'environnement Python :**
```bash
git clone https://github.com/Batpolygon/Ender-AI.git
cd Ender-AI
python3.12 -m venv venv
source venv/bin/activate
```

3. **Installer Llama-cpp avec support CUDA (Obligatoire) :**
C'est l'étape la plus critique pour garantir les performances.
```bash
CMAKE_ARGS="-DGGML_CUDA=on" pip install llama-cpp-python --upgrade --force-reinstall --no-cache-dir
```

4. **Installer le reste des dépendances :**
```bash
pip install -r requirements.txt
```

### 🪟 Sur Windows 10/11

1. **Prérequis Système :**
    *   Installer [Visual Studio Community](https://visualstudio.microsoft.com/fr/vs/community/) (Cocher "Développement Desktop en C++").
    *   Installer le [CUDA Toolkit](https://developer.nvidia.com/cuda-downloads).

2. **Créer l'environnement Python (dans PowerShell Admin) :**
```powershell
git clone https://github.com/Batpolygon/Ender-AI.git
cd Ender-AI
python -m venv venv
.\venv\Scripts\activate
```

3. **Installer Llama-cpp avec support CUDA (Obligatoire) :**
```powershell
$env:CMAKE_ARGS="-DGGML_CUDA=on"
pip install llama-cpp-python --upgrade --force-reinstall --no-cache-dir
```

4. **Installer le reste des dépendances :**
```powershell
pip install -r requirements.txt
```

---

## 🎯 Lancement & Utilisation

Vous avez deux façons de lancer l'application :

### Option 1 : Le Launcher (Recommandé au 1er lancement)
Lancez `launcher.py` si vous n'avez pas encore téléchargé de modèles. Ce script ouvrira une petite fenêtre pour télécharger automatiquement les modèles optimaux (DeepSeek-R1, Lexi-Llama et JoyCaption) directement depuis HuggingFace vers les bons dossiers, puis démarrera Ender.
```bash
python launcher.py
```

### Option 2 : Démarrage Direct
Si vous avez déjà vos propres modèles `.gguf` placés manuellement dans les dossiers `models/llm/` et `models/vision/`, vous pouvez lancer directement le cœur de l'application :
```bash
python main.py
```

*Note : Une fois dans l'application, ouvrez le panneau des paramètres (⚙️) à droite pour sélectionner vos "Cerveaux" et cliquez sur "Appliquer les réglages" pour les monter en VRAM.*

---

## 🤝 Contribution & Crédits
Ce projet est open-source. N'hésitez pas à forker, proposer des améliorations sur les prompts ou de nouvelles intégrations API (Voice-to-Text via Whisper, Commandes Système locales, etc.).

💡 **Crédits :** Ce projet a été pensé, conçu et développé par **Batpolygon**, et entièrement co-créé avec l'assistance IA de **Gemini 3 Flash**.
