<?php
/**
 * Folia - Connexion SQLite & Initialisation de la Base de Données
 */

declare(strict_types=1);

$dbDir = __DIR__;
$dbPath = $dbDir . '/database.sqlite';

try {
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec("PRAGMA foreign_keys = ON;");
    $pdo->exec("PRAGMA journal_mode = WAL;");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'details' => $e->getMessage()
    ]);
    exit();
}

/**
 * Crée les tables si elles n'existent pas
 */
function initDatabase(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS plants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            nickname TEXT,
            species TEXT NOT NULL,
            location TEXT NOT NULL,
            lightRequirement TEXT NOT NULL,
            wateringFrequencyDays INTEGER NOT NULL,
            mistingFrequencyDays INTEGER,
            fertilizerFrequencyDays INTEGER,
            lastWatered TEXT NOT NULL,
            lastMisted TEXT,
            lastFertilized TEXT,
            healthStatus TEXT NOT NULL,
            potSizeCm REAL,
            notes TEXT,
            imageUrl TEXT NOT NULL,
            addedDate TEXT NOT NULL,
            favorite INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS care_logs (
            id TEXT PRIMARY KEY,
            plantId TEXT NOT NULL,
            plantName TEXT NOT NULL,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            amountOrDetails TEXT,
            performedBy TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            avatarBg TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS preferences (
            id TEXT PRIMARY KEY DEFAULT 'default',
            enabled INTEGER NOT NULL DEFAULT 1,
            reminderTime TEXT NOT NULL DEFAULT '08:30',
            quietHoursStart TEXT NOT NULL DEFAULT '22:00',
            quietHoursEnd TEXT NOT NULL DEFAULT '07:30',
            selectedDays TEXT NOT NULL DEFAULT '[\"Lun\",\"Mar\",\"Mer\",\"Jeu\",\"Ven\",\"Sam\",\"Dim\"]',
            notifyWatering INTEGER NOT NULL DEFAULT 1,
            notifyMisting INTEGER NOT NULL DEFAULT 1,
            notifyFertilizer INTEGER NOT NULL DEFAULT 1,
            soundAlerts INTEGER NOT NULL DEFAULT 1,
            autoAdjustSeason INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS completed_checks (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            completedAt TEXT NOT NULL
        );
    ");

    // Vérifier si des plantes existent déjà
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM plants");
    $count = (int)$stmt->fetchColumn();

    if ($count === 0) {
        seedInitialData($pdo);
    }
}

/**
 * Insère les données d'exemple si la base est vide
 */
function seedInitialData(PDO $pdo): void {
    $now = new DateTime('now', new DateTimeZone('UTC'));
    
    // Dates relatives réalistes
    $d0 = (clone $now)->modify('-7 days')->format(DateTime::ATOM);
    $d1 = (clone $now)->modify('-10 days')->format(DateTime::ATOM);
    $d2 = (clone $now)->modify('-4 days')->format(DateTime::ATOM);
    $d3 = (clone $now)->modify('-2 days')->format(DateTime::ATOM);
    $d14 = (clone $now)->modify('-14 days')->format(DateTime::ATOM);
    $d30 = (clone $now)->modify('-30 days')->format(DateTime::ATOM);

    // Initial Users
    $insertUser = $pdo->prepare("INSERT INTO users (id, name, role, avatarBg) VALUES (?, ?, ?, ?)");
    $insertUser->execute(['user-1', 'Robin', 'Principal', 'bg-emerald-600']);
    $insertUser->execute(['user-2', 'Camille', 'Secondaire', 'bg-amber-600']);
    $insertUser->execute(['user-3', 'Alexandre', 'Invité', 'bg-teal-600']);

    // Initial Preferences
    $insertPref = $pdo->prepare("
        INSERT INTO preferences (
            id, enabled, reminderTime, quietHoursStart, quietHoursEnd, selectedDays,
            notifyWatering, notifyMisting, notifyFertilizer, soundAlerts, autoAdjustSeason
        ) VALUES (
            'default', 1, '08:30', '22:00', '07:30', '[\"Lun\",\"Mar\",\"Mer\",\"Jeu\",\"Ven\",\"Sam\",\"Dim\"]',
            1, 1, 1, 1, 1
        )
    ");
    $insertPref->execute();

    // Initial Plants
    $insertPlant = $pdo->prepare("
        INSERT INTO plants (
            id, name, nickname, species, location, lightRequirement,
            wateringFrequencyDays, mistingFrequencyDays, fertilizerFrequencyDays,
            lastWatered, lastMisted, lastFertilized, healthStatus,
            potSizeCm, notes, imageUrl, addedDate, favorite
        ) VALUES (
            :id, :name, :nickname, :species, :location, :lightRequirement,
            :wateringFrequencyDays, :mistingFrequencyDays, :fertilizerFrequencyDays,
            :lastWatered, :lastMisted, :lastFertilized, :healthStatus,
            :potSizeCm, :notes, :imageUrl, :addedDate, :favorite
        )
    ");

    $plantsData = [
        [
            ':id' => 'plant-1',
            ':name' => 'Monstera Deliciosa',
            ':nickname' => 'Monty',
            ':species' => 'Monstera deliciosa',
            ':location' => 'Salon',
            ':lightRequirement' => 'Lumière indirecte',
            ':wateringFrequencyDays' => 7,
            ':mistingFrequencyDays' => 3,
            ':fertilizerFrequencyDays' => 30,
            ':lastWatered' => $d0,
            ':lastMisted' => $d3,
            ':lastFertilized' => $d14,
            ':healthStatus' => 'Excellente',
            ':potSizeCm' => 24,
            ':notes' => 'Aime que la terre sèche légèrement en surface entre deux arrosages. Nettoyer les feuilles mensuellement.',
            ':imageUrl' => '/src/assets/images/plant_monstera_1790158839834.jpg',
            ':addedDate' => '2025-04-12',
            ':favorite' => 1
        ],
        [
            ':id' => 'plant-2',
            ':name' => 'Ficus Lyrata',
            ':nickname' => 'Figgy',
            ':species' => 'Ficus lyrata',
            ':location' => 'Salon',
            ':lightRequirement' => 'Lumière vive',
            ':wateringFrequencyDays' => 8,
            ':mistingFrequencyDays' => 4,
            ':fertilizerFrequencyDays' => 30,
            ':lastWatered' => $d1,
            ':lastMisted' => $d2,
            ':lastFertilized' => $d14,
            ':healthStatus' => 'Bonne',
            ':potSizeCm' => 28,
            ':notes' => 'Attention aux courants d\'air froids. Ne pas déplacer trop souvent pour éviter la chute des feuilles.',
            ':imageUrl' => '/src/assets/images/plant_ficus_1790158853624.jpg',
            ':addedDate' => '2025-06-18',
            ':favorite' => 1
        ],
        [
            ':id' => 'plant-3',
            ':name' => 'Sansevieria Trifasciata',
            ':nickname' => 'Zelda',
            ':species' => 'Sansevieria trifasciata',
            ':location' => 'Bureau',
            ':lightRequirement' => 'Faible',
            ':wateringFrequencyDays' => 18,
            ':mistingFrequencyDays' => null,
            ':fertilizerFrequencyDays' => 60,
            ':lastWatered' => $d2,
            ':lastMisted' => null,
            ':lastFertilized' => $d30,
            ':healthStatus' => 'Excellente',
            ':potSizeCm' => 18,
            ':notes' => 'Très robuste, supporte l\'oubli d\'arrosage. Ne jamais laisser d\'eau stagner au fond de la soucoupe.',
            ':imageUrl' => '/src/assets/images/plant_snake_1790158866750.jpg',
            ':addedDate' => '2025-01-05',
            ':favorite' => 0
        ],
        [
            ':id' => 'plant-4',
            ':name' => 'Calathea Orbifolia',
            ':nickname' => 'Aura',
            ':species' => 'Calathea orbifolia',
            ':location' => 'Chambre',
            ':lightRequirement' => 'Lumière indirecte',
            ':wateringFrequencyDays' => 5,
            ':mistingFrequencyDays' => 2,
            ':fertilizerFrequencyDays' => 30,
            ':lastWatered' => $d3,
            ':lastMisted' => $d3,
            ':lastFertilized' => $d14,
            ':healthStatus' => 'Besoin d\'attention',
            ':potSizeCm' => 20,
            ':notes' => 'Exige une hygrométrie élevée. N\'utiliser que de l\'eau filtrée ou osmosée pour éviter le bout des feuilles marron.',
            ':imageUrl' => '/src/assets/images/plant_calathea_1790158886546.jpg',
            ':addedDate' => '2025-09-02',
            ':favorite' => 1
        ],
    ];

    foreach ($plantsData as $p) {
        $insertPlant->execute($p);
    }

    // Initial Care Logs
    $insertLog = $pdo->prepare("
        INSERT INTO care_logs (
            id, plantId, plantName, date, type, amountOrDetails, performedBy, notes
        ) VALUES (
            :id, :plantId, :plantName, :date, :type, :amountOrDetails, :performedBy, :notes
        )
    ");

    $logsData = [
        [
            ':id' => 'log-1',
            ':plantId' => 'plant-1',
            ':plantName' => 'Monstera Deliciosa',
            ':date' => $d0,
            ':type' => 'arrosage',
            ':amountOrDetails' => '400 ml d\'eau tempérée',
            ':performedBy' => 'Robin',
            ':notes' => 'Terre bien drainée, très bon développement racinaire.'
        ],
        [
            ':id' => 'log-2',
            ':plantId' => 'plant-4',
            ':plantName' => 'Calathea Orbifolia',
            ':date' => $d3,
            ':type' => 'brumisation',
            ':amountOrDetails' => 'Eau osmosée fine',
            ':performedBy' => 'Camille',
            ':notes' => 'Feuilles bien hydratées ce matin.'
        ],
        [
            ':id' => 'log-3',
            ':plantId' => 'plant-3',
            ':plantName' => 'Sansevieria Trifasciata',
            ':date' => $d2,
            ':type' => 'arrosage',
            ':amountOrDetails' => '200 ml',
            ':performedBy' => 'Robin',
            ':notes' => 'Arrosage léger de routine.'
        ],
        [
            ':id' => 'log-4',
            ':plantId' => 'plant-2',
            ':plantName' => 'Ficus Lyrata',
            ':date' => $d2,
            ':type' => 'nettoyage',
            ':amountOrDetails' => 'Dépoussiérage au chiffon microfibre humide',
            ':performedBy' => 'Alexandre',
            ':notes' => 'Toutes les grandes feuilles ont été nettoyées.'
        ],
        [
            ':id' => 'log-5',
            ':plantId' => 'plant-1',
            ':plantName' => 'Monstera Deliciosa',
            ':date' => $d3,
            ':type' => 'brumisation',
            ':amountOrDetails' => 'Brumisation matinale',
            ':performedBy' => 'Robin',
            ':notes' => null
        ],
        [
            ':id' => 'log-6',
            ':plantId' => 'plant-1',
            ':plantName' => 'Monstera Deliciosa',
            ':date' => $d14,
            ':type' => 'engrais',
            ':amountOrDetails' => 'Engrais plantes vertes équilibré (1/2 dose)',
            ':performedBy' => 'Camille',
            ':notes' => 'Accompagné d\'un tuteur en fibre de coco ajusté.'
        ],
    ];

    foreach ($logsData as $l) {
        $insertLog->execute($l);
    }
}

// Initialiser immédiatement la base
initDatabase($pdo);

/**
 * Utilitaires HTTP JSON
 */
function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
