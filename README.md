# 🌿 Folia

Application web moderne d'aide et de suivi botanique assistée par IA (Gemini), combinant une interface React/Vite, un serveur Node.js et une API backend PHP / SQLite intégrée.

---

## 📋 Prérequis & Dépendances

### Système & Environnement
* **OS recommandé** : Debian 12 / 13 (LXC Proxmox ou VM/Bare-metal)
* **CPU** : 2 vCPU minimum
* **RAM** : 2 Go (2048 Mo) minimum
* **Disque** : 16 Go recommandés

### Paquets & Runtimes requis
* **Node.js** : `v20.x` ou supérieur (avec `npm`)
* **PHP CLI & SQLite** : `php-cli`, `php-sqlite3`, `sqlite3`
* **Git & Curl** : `git`, `curl`
* **PM2** (gestionnaire de processus pour la persistance)

---

## 🚀 Déploiement étape par étape

### 1. Création du conteneur LXC (Proxmox VE)

Dans le shell de votre nœud Proxmox VE, exécutez le script Proxmox Community Helper pour créer un conteneur Debian avec les ressources requises :

```bash
var_cpu="2" var_ram="2048" var_disk="16" bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/debian.sh)"
```

### 2. Installation des dépendances système

Connectez-vous au conteneur (console ou SSH en root) et installez PHP et SQLite :

```bash
apt update && apt install -y curl git php-cli php-sqlite3 sqlite3
```
(Si Node.js n'est pas encore installé dans votre conteneur Debian standard) :
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```
### 3. Clonage du projet et installation

Placez-vous dans /opt et clonez le dépôt :
```bash
cd /opt
git clone https://github.com/Glyphe36/Folia.git app
cd /opt/app
```
Installez les dépendances du projet Node.js :
```bash
npm install --legacy-peer-deps
```
### 4. Configuration de l'environnement (.env)

Créez le fichier de configuration .env à partir de l'exemple :
```bash
cp .env.example .env
nano .env
```
Renseignez les variables nécessaires :
```bash
# Clé d'API Google Gemini
GEMINI_API_KEY="VOTRE_CLE_API_GEMINI"

# URL de l'application (remplacez par l'IP de votre LXC ou nom de domaine)
APP_URL="http://192.168.1.157:3000"

# URL de l'API PHP / SQLite
VITE_API_URL=http://192.168.1.157:3001/api
```
### 5. Démarrage en production et persistance (PM2)

Pour que l'application tourne en arrière-plan et redémarre automatiquement au boot du conteneur :

  Installer PM2 globalement :
```bash
npm install -g pm2
```
  Lancer le serveur Folia :
```bash
cd /opt/app
pm2 start "npx tsx server.ts" --name "folia"
```
  Activer le démarrage automatique au boot :
```bash
pm2 save
pm2 startup
```
  (Exécutez ensuite la commande systemctl générée par PM2 si demandée).

## 🌐 Accès à l'application

  Frontend Web & Application : http://<IP_DU_LXC>:3000
  API Backend PHP / SQLite : http://<IP_DU_LXC>:3001/api
    
## 🛠️ Commandes utiles
```bash
# Voir le statut du serveur
pm2 status
```
```bash
# Consulter les logs en temps réel (Node + PHP)
pm2 logs folia
```
```bash
# Redémarrer l'application
pm2 restart folia
```
```bash
# Arrêter l'application
pm2 stop folia
```
