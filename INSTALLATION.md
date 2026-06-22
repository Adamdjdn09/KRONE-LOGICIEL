# 🚀 KRONE - Guide d'Installation

## Prérequis

1. **Node.js** (version 18 ou supérieure)
   - Télécharger : https://nodejs.org/
   - Choisir la version LTS

2. **Visual Studio Code**
   - Télécharger : https://code.visualstudio.com/

3. **Git** (optionnel mais recommandé)
   - Télécharger : https://git-scm.com/

---

## 📁 Installation pas à pas

### Étape 1 : Télécharger le projet

Créez un dossier sur votre PC, par exemple : `C:\Projets\krone`

### Étape 2 : Copier les fichiers

Copiez tous les fichiers du projet dans ce dossier.

### Étape 3 : Ouvrir avec VS Code

1. Ouvrez **Visual Studio Code**
2. Fichier → Ouvrir le dossier
3. Sélectionnez le dossier `krone`

### Étape 4 : Installer les dépendances

Ouvrez le terminal dans VS Code (`Ctrl + ù` ou `Terminal → Nouveau terminal`) et tapez :

```bash
npm install
```

Attendez que l'installation se termine.

### Étape 5 : Lancer l'application (mode développement)

```bash
npm run dev
```

L'application s'ouvrira dans votre navigateur à l'adresse : http://localhost:5173

---

## 🖥️ Créer un logiciel de bureau (Electron)

### Étape 1 : Remplacer package.json

Renommez `package.json` en `package.web.json`
Renommez `package.electron.json` en `package.json`

### Étape 2 : Installer les dépendances Electron

```bash
npm install
```

### Étape 3 : Lancer en mode développement Electron

```bash
npm run electron:dev
```

### Étape 4 : Créer l'installateur Windows (.exe)

```bash
npm run electron:build:win
```

L'installateur sera créé dans le dossier `release/`

---

## 📂 Structure du projet

```
krone/
├── electron/           # Fichiers Electron (desktop)
│   ├── main.js        # Process principal
│   └── preload.js     # Bridge entre Electron et React
├── public/            # Fichiers statiques
│   └── icon.png       # Icône de l'application
├── src/               # Code source React
│   ├── components/    # Composants React
│   ├── App.tsx        # Composant principal
│   ├── store.ts       # Gestion des données
│   ├── types.ts       # Types TypeScript
│   └── index.css      # Styles CSS
├── index.html         # Page HTML principale
├── package.json       # Dépendances et scripts
├── vite.config.ts     # Configuration Vite
└── tsconfig.json      # Configuration TypeScript
```

---

## 🛠️ Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer en mode développement (navigateur) |
| `npm run build` | Créer la version de production |
| `npm run electron:dev` | Lancer Electron en développement |
| `npm run electron:build:win` | Créer l'installateur Windows |

---

## ❓ Problèmes courants

### "npm n'est pas reconnu"
→ Node.js n'est pas installé ou pas dans le PATH. Réinstallez Node.js.

### "Erreur EACCES" ou permissions
→ Lancez VS Code en tant qu'administrateur.

### "Module not found"
→ Exécutez `npm install` à nouveau.

### L'application ne se lance pas
→ Vérifiez que tous les fichiers sont bien copiés et exécutez `npm install`.

---

## 📞 Support

Pour toute question ou problème, créez une issue sur le dépôt du projet.

---

**KRONE v4.2** - Logiciel de Gestion Commerciale
