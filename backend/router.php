<?php
/**
 * Folia - API Router REST en PHP / SQLite
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

// Configuration CORS & Headers JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
header("Content-Type: application/json; charset=UTF-8");

// Traitement de la requête préliminaire OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

// Normaliser le chemin : retirer un préfixe éventuel ou trailing slash
// e.g. /api/plants -> /api/plants
// e.g. /plants -> /api/plants
if (str_starts_with($uri, '/api')) {
    $path = substr($uri, 4); // supprime /api
} else {
    $path = $uri;
}
$path = '/' . trim($path, '/');
$segments = array_values(array_filter(explode('/', $path)));

// Helpers pour formater les plantes
function formatPlant(array $row): array {
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'nickname' => $row['nickname'] ?? null,
        'species' => $row['species'],
        'location' => $row['location'],
        'lightRequirement' => $row['lightRequirement'],
        'wateringFrequencyDays' => (int)$row['wateringFrequencyDays'],
        'mistingFrequencyDays' => $row['mistingFrequencyDays'] !== null ? (int)$row['mistingFrequencyDays'] : null,
        'fertilizerFrequencyDays' => $row['fertilizerFrequencyDays'] !== null ? (int)$row['fertilizerFrequencyDays'] : null,
        'lastWatered' => $row['lastWatered'],
        'lastMisted' => $row['lastMisted'] ?? null,
        'lastFertilized' => $row['lastFertilized'] ?? null,
        'healthStatus' => $row['healthStatus'],
        'potSizeCm' => $row['potSizeCm'] !== null ? (float)$row['potSizeCm'] : null,
        'notes' => $row['notes'] ?? '',
        'imageUrl' => $row['imageUrl'],
        'addedDate' => $row['addedDate'],
        'favorite' => (bool)$row['favorite'],
    ];
}

// Helpers pour formater les logs
function formatLog(array $row): array {
    return [
        'id' => $row['id'],
        'plantId' => $row['plantId'],
        'plantName' => $row['plantName'],
        'date' => $row['date'],
        'type' => $row['type'],
        'amountOrDetails' => $row['amountOrDetails'] ?? null,
        'performedBy' => $row['performedBy'],
        'notes' => $row['notes'] ?? null,
    ];
}

// Helpers pour formater les préférences
function formatPreferences(array $row): array {
    return [
        'enabled' => (bool)$row['enabled'],
        'reminderTime' => $row['reminderTime'],
        'quietHoursStart' => $row['quietHoursStart'],
        'quietHoursEnd' => $row['quietHoursEnd'],
        'selectedDays' => json_decode($row['selectedDays'], true) ?? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        'notifyWatering' => (bool)$row['notifyWatering'],
        'notifyMisting' => (bool)$row['notifyMisting'],
        'notifyFertilizer' => (bool)$row['notifyFertilizer'],
        'soundAlerts' => (bool)$row['soundAlerts'],
        'autoAdjustSeason' => (bool)$row['autoAdjustSeason'],
    ];
}

try {
    // -------------------------------------------------------------------------
    // 1. HEALTH CHECK
    // -------------------------------------------------------------------------
    if ($path === '/health' || $path === '/') {
        $plantsCount = (int)$pdo->query("SELECT COUNT(*) FROM plants")->fetchColumn();
        $logsCount = (int)$pdo->query("SELECT COUNT(*) FROM care_logs")->fetchColumn();
        $usersCount = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $dbSize = file_exists(__DIR__ . '/database.sqlite') ? filesize(__DIR__ . '/database.sqlite') : 0;

        jsonResponse([
            'status' => 'ok',
            'service' => 'Folia Botanical PHP API',
            'version' => '1.0.0',
            'database' => 'SQLite 3',
            'databasePath' => __DIR__ . '/database.sqlite',
            'databaseSizeBytes' => $dbSize,
            'phpVersion' => PHP_VERSION,
            'counts' => [
                'plants' => $plantsCount,
                'careLogs' => $logsCount,
                'users' => $usersCount,
            ],
            'timestamp' => (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM),
        ]);
    }

    // -------------------------------------------------------------------------
    // 2. PLANTS ENDPOINTS
    // -------------------------------------------------------------------------
    if (isset($segments[0]) && $segments[0] === 'plants') {
        $plantId = $segments[1] ?? null;
        $subAction = $segments[2] ?? null;

        // GET /api/plants
        if ($method === 'GET' && !$plantId) {
            $stmt = $pdo->query("SELECT * FROM plants ORDER BY favorite DESC, name ASC");
            $rows = $stmt->fetchAll();
            $plants = array_map('formatPlant', $rows);
            jsonResponse($plants);
        }

        // GET /api/plants/{id}
        if ($method === 'GET' && $plantId && !$subAction) {
            $stmt = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $stmt->execute([$plantId]);
            $row = $stmt->fetch();
            if (!$row) {
                jsonResponse(['error' => 'Plant not found'], 404);
            }
            jsonResponse(formatPlant($row));
        }

        // POST /api/plants (Ajouter une nouvelle plante)
        if ($method === 'POST' && !$plantId) {
            $input = getJsonInput();
            if (empty($input['name'])) {
                jsonResponse(['error' => 'Field "name" is required'], 400);
            }

            $id = $input['id'] ?? ('plant-' . bin2hex(random_bytes(6)));
            $name = trim((string)$input['name']);
            $nickname = !empty($input['nickname']) ? trim((string)$input['nickname']) : null;
            $species = !empty($input['species']) ? trim((string)$input['species']) : $name;
            $location = !empty($input['location']) ? trim((string)$input['location']) : 'Salon';
            $lightRequirement = !empty($input['lightRequirement']) ? (string)$input['lightRequirement'] : 'Lumière indirecte';
            $wateringFrequencyDays = max(1, (int)($input['wateringFrequencyDays'] ?? 7));
            $mistingFrequencyDays = !empty($input['mistingFrequencyDays']) ? (int)$input['mistingFrequencyDays'] : null;
            $fertilizerFrequencyDays = !empty($input['fertilizerFrequencyDays']) ? (int)$input['fertilizerFrequencyDays'] : null;
            
            $nowIso = (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM);
            $lastWatered = !empty($input['lastWatered']) ? (string)$input['lastWatered'] : $nowIso;
            $lastMisted = !empty($input['lastMisted']) ? (string)$input['lastMisted'] : null;
            $lastFertilized = !empty($input['lastFertilized']) ? (string)$input['lastFertilized'] : null;
            
            $healthStatus = !empty($input['healthStatus']) ? (string)$input['healthStatus'] : 'Excellente';
            $potSizeCm = !empty($input['potSizeCm']) ? (float)$input['potSizeCm'] : null;
            $notes = (string)($input['notes'] ?? '');
            $imageUrl = !empty($input['imageUrl']) ? (string)$input['imageUrl'] : '/src/assets/images/plant_monstera_1790158839834.jpg';
            $addedDate = !empty($input['addedDate']) ? (string)$input['addedDate'] : date('Y-m-d');
            $favorite = !empty($input['favorite']) ? 1 : 0;

            $stmt = $pdo->prepare("
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

            $stmt->execute([
                ':id' => $id,
                ':name' => $name,
                ':nickname' => $nickname,
                ':species' => $species,
                ':location' => $location,
                ':lightRequirement' => $lightRequirement,
                ':wateringFrequencyDays' => $wateringFrequencyDays,
                ':mistingFrequencyDays' => $mistingFrequencyDays,
                ':fertilizerFrequencyDays' => $fertilizerFrequencyDays,
                ':lastWatered' => $lastWatered,
                ':lastMisted' => $lastMisted,
                ':lastFertilized' => $lastFertilized,
                ':healthStatus' => $healthStatus,
                ':potSizeCm' => $potSizeCm,
                ':notes' => $notes,
                ':imageUrl' => $imageUrl,
                ':addedDate' => $addedDate,
                ':favorite' => $favorite,
            ]);

            // Enregistrer un premier log de bienvenue / création
            $logStmt = $pdo->prepare("
                INSERT INTO care_logs (id, plantId, plantName, date, type, amountOrDetails, performedBy, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $logStmt->execute([
                'log-' . bin2hex(random_bytes(6)),
                $id,
                $name,
                $nowIso,
                'arrosage',
                'Arrosage initial à l\'adoption',
                $input['performedBy'] ?? 'Robin',
                'Bienvenue dans la collection Folia !'
            ]);

            $fetch = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $fetch->execute([$id]);
            jsonResponse(formatPlant($fetch->fetch()), 201);
        }

        // PUT /api/plants/{id} (Modifier une plante)
        if (($method === 'PUT' || $method === 'PATCH') && $plantId && !$subAction) {
            $input = getJsonInput();

            $existingStmt = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $existingStmt->execute([$plantId]);
            $current = $existingStmt->fetch();
            if (!$current) {
                jsonResponse(['error' => 'Plant not found'], 404);
            }

            $fields = [
                'name' => isset($input['name']) ? trim((string)$input['name']) : $current['name'],
                'nickname' => array_key_exists('nickname', $input) ? ($input['nickname'] ? trim((string)$input['nickname']) : null) : $current['nickname'],
                'species' => isset($input['species']) ? trim((string)$input['species']) : $current['species'],
                'location' => isset($input['location']) ? trim((string)$input['location']) : $current['location'],
                'lightRequirement' => isset($input['lightRequirement']) ? (string)$input['lightRequirement'] : $current['lightRequirement'],
                'wateringFrequencyDays' => isset($input['wateringFrequencyDays']) ? max(1, (int)$input['wateringFrequencyDays']) : (int)$current['wateringFrequencyDays'],
                'mistingFrequencyDays' => array_key_exists('mistingFrequencyDays', $input) ? ($input['mistingFrequencyDays'] ? (int)$input['mistingFrequencyDays'] : null) : $current['mistingFrequencyDays'],
                'fertilizerFrequencyDays' => array_key_exists('fertilizerFrequencyDays', $input) ? ($input['fertilizerFrequencyDays'] ? (int)$input['fertilizerFrequencyDays'] : null) : $current['fertilizerFrequencyDays'],
                'lastWatered' => isset($input['lastWatered']) ? (string)$input['lastWatered'] : $current['lastWatered'],
                'lastMisted' => array_key_exists('lastMisted', $input) ? $input['lastMisted'] : $current['lastMisted'],
                'lastFertilized' => array_key_exists('lastFertilized', $input) ? $input['lastFertilized'] : $current['lastFertilized'],
                'healthStatus' => isset($input['healthStatus']) ? (string)$input['healthStatus'] : $current['healthStatus'],
                'potSizeCm' => array_key_exists('potSizeCm', $input) ? ($input['potSizeCm'] ? (float)$input['potSizeCm'] : null) : $current['potSizeCm'],
                'notes' => isset($input['notes']) ? (string)$input['notes'] : $current['notes'],
                'imageUrl' => isset($input['imageUrl']) ? (string)$input['imageUrl'] : $current['imageUrl'],
                'favorite' => array_key_exists('favorite', $input) ? ($input['favorite'] ? 1 : 0) : (int)$current['favorite'],
            ];

            $updateStmt = $pdo->prepare("
                UPDATE plants SET
                    name = :name,
                    nickname = :nickname,
                    species = :species,
                    location = :location,
                    lightRequirement = :lightRequirement,
                    wateringFrequencyDays = :wateringFrequencyDays,
                    mistingFrequencyDays = :mistingFrequencyDays,
                    fertilizerFrequencyDays = :fertilizerFrequencyDays,
                    lastWatered = :lastWatered,
                    lastMisted = :lastMisted,
                    lastFertilized = :lastFertilized,
                    healthStatus = :healthStatus,
                    potSizeCm = :potSizeCm,
                    notes = :notes,
                    imageUrl = :imageUrl,
                    favorite = :favorite
                WHERE id = :id
            ");

            $fields[':id'] = $plantId;
            $updateStmt->execute($fields);

            $fetch = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $fetch->execute([$plantId]);
            jsonResponse(formatPlant($fetch->fetch()));
        }

        // PATCH /api/plants/{id}/favorite (Basculer le favori)
        if (($method === 'PATCH' || $method === 'POST') && $plantId && $subAction === 'favorite') {
            $input = getJsonInput();
            $stmt = $pdo->prepare("SELECT favorite FROM plants WHERE id = ?");
            $stmt->execute([$plantId]);
            $row = $stmt->fetch();
            if (!$row) {
                jsonResponse(['error' => 'Plant not found'], 404);
            }

            $newFav = array_key_exists('favorite', $input) ? ($input['favorite'] ? 1 : 0) : ($row['favorite'] ? 0 : 1);
            $update = $pdo->prepare("UPDATE plants SET favorite = ? WHERE id = ?");
            $update->execute([$newFav, $plantId]);

            $fetch = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $fetch->execute([$plantId]);
            jsonResponse(formatPlant($fetch->fetch()));
        }

        // POST /api/plants/{id}/water (Arrosage rapide)
        if ($method === 'POST' && $plantId && $subAction === 'water') {
            $input = getJsonInput();
            $stmt = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $stmt->execute([$plantId]);
            $plant = $stmt->fetch();
            if (!$plant) {
                jsonResponse(['error' => 'Plant not found'], 404);
            }

            $nowIso = (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM);
            $pdo->prepare("UPDATE plants SET lastWatered = ? WHERE id = ?")->execute([$nowIso, $plantId]);

            $logId = 'log-' . bin2hex(random_bytes(6));
            $user = $input['performedBy'] ?? 'Robin';
            $details = $input['amountOrDetails'] ?? 'Arrosage régulier';
            $notes = $input['notes'] ?? null;

            $insertLog = $pdo->prepare("
                INSERT INTO care_logs (id, plantId, plantName, date, type, amountOrDetails, performedBy, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $insertLog->execute([$logId, $plantId, $plant['name'], $nowIso, 'arrosage', $details, $user, $notes]);

            $fetchPlant = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $fetchPlant->execute([$plantId]);
            $fetchLog = $pdo->prepare("SELECT * FROM care_logs WHERE id = ?");
            $fetchLog->execute([$logId]);

            jsonResponse([
                'plant' => formatPlant($fetchPlant->fetch()),
                'log' => formatLog($fetchLog->fetch()),
            ]);
        }

        // POST /api/plants/{id}/mist (Brumisation rapide)
        if ($method === 'POST' && $plantId && $subAction === 'mist') {
            $input = getJsonInput();
            $stmt = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $stmt->execute([$plantId]);
            $plant = $stmt->fetch();
            if (!$plant) {
                jsonResponse(['error' => 'Plant not found'], 404);
            }

            $nowIso = (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM);
            $pdo->prepare("UPDATE plants SET lastMisted = ? WHERE id = ?")->execute([$nowIso, $plantId]);

            $logId = 'log-' . bin2hex(random_bytes(6));
            $user = $input['performedBy'] ?? 'Robin';
            $details = $input['amountOrDetails'] ?? 'Brumisation du feuillage';
            $notes = $input['notes'] ?? null;

            $insertLog = $pdo->prepare("
                INSERT INTO care_logs (id, plantId, plantName, date, type, amountOrDetails, performedBy, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $insertLog->execute([$logId, $plantId, $plant['name'], $nowIso, 'brumisation', $details, $user, $notes]);

            $fetchPlant = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $fetchPlant->execute([$plantId]);
            $fetchLog = $pdo->prepare("SELECT * FROM care_logs WHERE id = ?");
            $fetchLog->execute([$logId]);

            jsonResponse([
                'plant' => formatPlant($fetchPlant->fetch()),
                'log' => formatLog($fetchLog->fetch()),
            ]);
        }

        // POST /api/plants/{id}/fertilize (Fertilisation rapide)
        if ($method === 'POST' && $plantId && $subAction === 'fertilize') {
            $input = getJsonInput();
            $stmt = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $stmt->execute([$plantId]);
            $plant = $stmt->fetch();
            if (!$plant) {
                jsonResponse(['error' => 'Plant not found'], 404);
            }

            $nowIso = (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM);
            $pdo->prepare("UPDATE plants SET lastFertilized = ? WHERE id = ?")->execute([$nowIso, $plantId]);

            $logId = 'log-' . bin2hex(random_bytes(6));
            $user = $input['performedBy'] ?? 'Robin';
            $details = $input['amountOrDetails'] ?? 'Apport d\'engrais équilibré';
            $notes = $input['notes'] ?? null;

            $insertLog = $pdo->prepare("
                INSERT INTO care_logs (id, plantId, plantName, date, type, amountOrDetails, performedBy, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $insertLog->execute([$logId, $plantId, $plant['name'], $nowIso, 'engrais', $details, $user, $notes]);

            $fetchPlant = $pdo->prepare("SELECT * FROM plants WHERE id = ?");
            $fetchPlant->execute([$plantId]);
            $fetchLog = $pdo->prepare("SELECT * FROM care_logs WHERE id = ?");
            $fetchLog->execute([$logId]);

            jsonResponse([
                'plant' => formatPlant($fetchPlant->fetch()),
                'log' => formatLog($fetchLog->fetch()),
            ]);
        }

        // DELETE /api/plants/{id} (Supprimer une plante)
        if ($method === 'DELETE' && $plantId) {
            $stmt = $pdo->prepare("DELETE FROM plants WHERE id = ?");
            $stmt->execute([$plantId]);
            jsonResponse(['success' => true, 'id' => $plantId]);
        }
    }

    // -------------------------------------------------------------------------
    // 3. CARE LOGS ENDPOINTS
    // -------------------------------------------------------------------------
    if (isset($segments[0]) && $segments[0] === 'logs') {
        $logId = $segments[1] ?? null;

        // GET /api/logs
        if ($method === 'GET' && !$logId) {
            $plantFilter = $_GET['plantId'] ?? null;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;

            if ($plantFilter) {
                $stmt = $pdo->prepare("SELECT * FROM care_logs WHERE plantId = ? ORDER BY date DESC LIMIT ?");
                $stmt->execute([$plantFilter, $limit]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM care_logs ORDER BY date DESC LIMIT ?");
                $stmt->execute([$limit]);
            }

            $rows = $stmt->fetchAll();
            jsonResponse(array_map('formatLog', $rows));
        }

        // POST /api/logs (Enregistrer un soin)
        if ($method === 'POST' && !$logId) {
            $input = getJsonInput();
            if (empty($input['plantId']) || empty($input['type'])) {
                jsonResponse(['error' => 'plantId and type are required'], 400);
            }

            $plantId = (string)$input['plantId'];
            $pStmt = $pdo->prepare("SELECT name FROM plants WHERE id = ?");
            $pStmt->execute([$plantId]);
            $plant = $pStmt->fetch();
            $plantName = $plant ? $plant['name'] : 'Plante inconnue';

            $id = $input['id'] ?? ('log-' . bin2hex(random_bytes(6)));
            $nowIso = (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM);
            $date = !empty($input['date']) ? (string)$input['date'] : $nowIso;
            $type = (string)$input['type'];
            $amountOrDetails = !empty($input['amountOrDetails']) ? (string)$input['amountOrDetails'] : null;
            $performedBy = !empty($input['performedBy']) ? (string)$input['performedBy'] : 'Robin';
            $notes = !empty($input['notes']) ? (string)$input['notes'] : null;

            $stmt = $pdo->prepare("
                INSERT INTO care_logs (id, plantId, plantName, date, type, amountOrDetails, performedBy, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$id, $plantId, $plantName, $date, $type, $amountOrDetails, $performedBy, $notes]);

            // Mettre à jour automatiquement les dates de soin de la plante correspondante
            if ($type === 'arrosage') {
                $pdo->prepare("UPDATE plants SET lastWatered = ? WHERE id = ?")->execute([$date, $plantId]);
            } elseif ($type === 'brumisation') {
                $pdo->prepare("UPDATE plants SET lastMisted = ? WHERE id = ?")->execute([$date, $plantId]);
            } elseif ($type === 'engrais') {
                $pdo->prepare("UPDATE plants SET lastFertilized = ? WHERE id = ?")->execute([$date, $plantId]);
            }

            $fetch = $pdo->prepare("SELECT * FROM care_logs WHERE id = ?");
            $fetch->execute([$id]);
            jsonResponse(formatLog($fetch->fetch()), 201);
        }

        // DELETE /api/logs/{id}
        if ($method === 'DELETE' && $logId) {
            $stmt = $pdo->prepare("DELETE FROM care_logs WHERE id = ?");
            $stmt->execute([$logId]);
            jsonResponse(['success' => true, 'id' => $logId]);
        }
    }

    // -------------------------------------------------------------------------
    // 4. USERS ENDPOINTS
    // -------------------------------------------------------------------------
    if (isset($segments[0]) && $segments[0] === 'users') {
        $userId = $segments[1] ?? null;

        // GET /api/users
        if ($method === 'GET' && !$userId) {
            $stmt = $pdo->query("SELECT * FROM users ORDER BY id ASC");
            jsonResponse($stmt->fetchAll());
        }

        // POST /api/users (Ajouter un profil)
        if ($method === 'POST' && !$userId) {
            $input = getJsonInput();
            if (empty($input['name'])) {
                jsonResponse(['error' => 'Name is required'], 400);
            }

            $colors = ['bg-emerald-600', 'bg-sky-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600', 'bg-purple-600'];
            $avatarBg = $input['avatarBg'] ?? $colors[array_rand($colors)];
            $id = $input['id'] ?? ('user-' . bin2hex(random_bytes(4)));
            $role = $input['role'] ?? 'Secondaire';
            $name = trim((string)$input['name']);

            $stmt = $pdo->prepare("INSERT INTO users (id, name, role, avatarBg) VALUES (?, ?, ?, ?)");
            $stmt->execute([$id, $name, $role, $avatarBg]);

            $fetch = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $fetch->execute([$id]);
            jsonResponse($fetch->fetch(), 201);
        }

        // DELETE /api/users/{id}
        if ($method === 'DELETE' && $userId) {
            $count = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
            if ($count <= 1) {
                jsonResponse(['error' => 'Cannot delete the last remaining user profile'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            jsonResponse(['success' => true, 'id' => $userId]);
        }
    }

    // -------------------------------------------------------------------------
    // 5. PREFERENCES ENDPOINTS
    // -------------------------------------------------------------------------
    if (isset($segments[0]) && $segments[0] === 'preferences') {
        // GET /api/preferences
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM preferences WHERE id = 'default'");
            $row = $stmt->fetch();
            if (!$row) {
                $row = [
                    'enabled' => 1,
                    'reminderTime' => '08:30',
                    'quietHoursStart' => '22:00',
                    'quietHoursEnd' => '07:30',
                    'selectedDays' => '["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]',
                    'notifyWatering' => 1,
                    'notifyMisting' => 1,
                    'notifyFertilizer' => 1,
                    'soundAlerts' => 1,
                    'autoAdjustSeason' => 1,
                ];
            }
            jsonResponse(formatPreferences($row));
        }

        // PUT /api/preferences
        if ($method === 'PUT' || $method === 'POST') {
            $input = getJsonInput();
            $curr = $pdo->query("SELECT * FROM preferences WHERE id = 'default'")->fetch() ?: [];

            $enabled = array_key_exists('enabled', $input) ? ($input['enabled'] ? 1 : 0) : ($curr['enabled'] ?? 1);
            $reminderTime = $input['reminderTime'] ?? ($curr['reminderTime'] ?? '08:30');
            $quietHoursStart = $input['quietHoursStart'] ?? ($curr['quietHoursStart'] ?? '22:00');
            $quietHoursEnd = $input['quietHoursEnd'] ?? ($curr['quietHoursEnd'] ?? '07:30');
            $selectedDays = isset($input['selectedDays']) ? json_encode($input['selectedDays']) : ($curr['selectedDays'] ?? '["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]');
            $notifyWatering = array_key_exists('notifyWatering', $input) ? ($input['notifyWatering'] ? 1 : 0) : ($curr['notifyWatering'] ?? 1);
            $notifyMisting = array_key_exists('notifyMisting', $input) ? ($input['notifyMisting'] ? 1 : 0) : ($curr['notifyMisting'] ?? 1);
            $notifyFertilizer = array_key_exists('notifyFertilizer', $input) ? ($input['notifyFertilizer'] ? 1 : 0) : ($curr['notifyFertilizer'] ?? 1);
            $soundAlerts = array_key_exists('soundAlerts', $input) ? ($input['soundAlerts'] ? 1 : 0) : ($curr['soundAlerts'] ?? 1);
            $autoAdjustSeason = array_key_exists('autoAdjustSeason', $input) ? ($input['autoAdjustSeason'] ? 1 : 0) : ($curr['autoAdjustSeason'] ?? 1);

            $stmt = $pdo->prepare("
                INSERT INTO preferences (
                    id, enabled, reminderTime, quietHoursStart, quietHoursEnd, selectedDays,
                    notifyWatering, notifyMisting, notifyFertilizer, soundAlerts, autoAdjustSeason
                ) VALUES (
                    'default', :enabled, :reminderTime, :quietHoursStart, :quietHoursEnd, :selectedDays,
                    :notifyWatering, :notifyMisting, :notifyFertilizer, :soundAlerts, :autoAdjustSeason
                )
                ON CONFLICT(id) DO UPDATE SET
                    enabled = :enabled,
                    reminderTime = :reminderTime,
                    quietHoursStart = :quietHoursStart,
                    quietHoursEnd = :quietHoursEnd,
                    selectedDays = :selectedDays,
                    notifyWatering = :notifyWatering,
                    notifyMisting = :notifyMisting,
                    notifyFertilizer = :notifyFertilizer,
                    soundAlerts = :soundAlerts,
                    autoAdjustSeason = :autoAdjustSeason
            ");

            $stmt->execute([
                ':enabled' => $enabled,
                ':reminderTime' => $reminderTime,
                ':quietHoursStart' => $quietHoursStart,
                ':quietHoursEnd' => $quietHoursEnd,
                ':selectedDays' => $selectedDays,
                ':notifyWatering' => $notifyWatering,
                ':notifyMisting' => $notifyMisting,
                ':notifyFertilizer' => $notifyFertilizer,
                ':soundAlerts' => $soundAlerts,
                ':autoAdjustSeason' => $autoAdjustSeason,
            ]);

            $fetch = $pdo->query("SELECT * FROM preferences WHERE id = 'default'")->fetch();
            jsonResponse(formatPreferences($fetch));
        }
    }

    // -------------------------------------------------------------------------
    // 6. DAILY CHECKS (Vérifications du jour)
    // -------------------------------------------------------------------------
    if (isset($segments[0]) && $segments[0] === 'checks') {
        $today = date('Y-m-d');

        // GET /api/checks/completed
        if ($method === 'GET' && ($segments[1] ?? '') === 'completed') {
            $stmt = $pdo->prepare("SELECT id FROM completed_checks WHERE date = ?");
            $stmt->execute([$today]);
            $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
            jsonResponse(['date' => $today, 'completedCheckIds' => $ids]);
        }

        // POST /api/checks/complete
        if ($method === 'POST' && ($segments[1] ?? '') === 'complete') {
            $input = getJsonInput();
            $checkId = $input['checkId'] ?? null;
            if (!$checkId) {
                jsonResponse(['error' => 'checkId is required'], 400);
            }

            $nowIso = (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM);
            $stmt = $pdo->prepare("
                INSERT OR REPLACE INTO completed_checks (id, date, completedAt)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$checkId, $today, $nowIso]);
            jsonResponse(['success' => true, 'checkId' => $checkId, 'date' => $today]);
        }
    }

    // -------------------------------------------------------------------------
    // 7. BACKUP & SYNC (EXPORT, IMPORT, RESET)
    // -------------------------------------------------------------------------
    if (isset($segments[0]) && $segments[0] === 'backup') {
        $action = $segments[1] ?? '';

        // GET /api/backup/export
        if ($method === 'GET' && $action === 'export') {
            $plants = array_map('formatPlant', $pdo->query("SELECT * FROM plants")->fetchAll());
            $logs = array_map('formatLog', $pdo->query("SELECT * FROM care_logs ORDER BY date DESC")->fetchAll());
            $users = $pdo->query("SELECT * FROM users")->fetchAll();
            $prefsRow = $pdo->query("SELECT * FROM preferences WHERE id = 'default'")->fetch();
            $prefs = $prefsRow ? formatPreferences($prefsRow) : null;

            jsonResponse([
                'version' => 1,
                'exportedAt' => (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM),
                'plants' => $plants,
                'careLogs' => $logs,
                'users' => $users,
                'preferences' => $prefs,
            ]);
        }

        // POST /api/backup/import
        if ($method === 'POST' && $action === 'import') {
            $input = getJsonInput();
            if (empty($input['plants']) || !is_array($input['plants'])) {
                jsonResponse(['error' => 'Invalid backup payload: plants array required'], 400);
            }

            $pdo->beginTransaction();
            try {
                // Clear existing
                $pdo->exec("DELETE FROM care_logs; DELETE FROM plants;");

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

                foreach ($input['plants'] as $p) {
                    $insertPlant->execute([
                        ':id' => $p['id'] ?? ('plant-' . bin2hex(random_bytes(6))),
                        ':name' => $p['name'],
                        ':nickname' => $p['nickname'] ?? null,
                        ':species' => $p['species'] ?? $p['name'],
                        ':location' => $p['location'] ?? 'Salon',
                        ':lightRequirement' => $p['lightRequirement'] ?? 'Lumière indirecte',
                        ':wateringFrequencyDays' => (int)($p['wateringFrequencyDays'] ?? 7),
                        ':mistingFrequencyDays' => !empty($p['mistingFrequencyDays']) ? (int)$p['mistingFrequencyDays'] : null,
                        ':fertilizerFrequencyDays' => !empty($p['fertilizerFrequencyDays']) ? (int)$p['fertilizerFrequencyDays'] : null,
                        ':lastWatered' => $p['lastWatered'] ?? (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM),
                        ':lastMisted' => $p['lastMisted'] ?? null,
                        ':lastFertilized' => $p['lastFertilized'] ?? null,
                        ':healthStatus' => $p['healthStatus'] ?? 'Excellente',
                        ':potSizeCm' => !empty($p['potSizeCm']) ? (float)$p['potSizeCm'] : null,
                        ':notes' => $p['notes'] ?? '',
                        ':imageUrl' => $p['imageUrl'] ?? '/src/assets/images/plant_monstera_1790158839834.jpg',
                        ':addedDate' => $p['addedDate'] ?? date('Y-m-d'),
                        ':favorite' => !empty($p['favorite']) ? 1 : 0,
                    ]);
                }

                if (!empty($input['careLogs']) && is_array($input['careLogs'])) {
                    $insertLog = $pdo->prepare("
                        INSERT INTO care_logs (id, plantId, plantName, date, type, amountOrDetails, performedBy, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    foreach ($input['careLogs'] as $l) {
                        $insertLog->execute([
                            $l['id'] ?? ('log-' . bin2hex(random_bytes(6))),
                            $l['plantId'],
                            $l['plantName'] ?? 'Plante',
                            $l['date'] ?? (new DateTime('now', new DateTimeZone('UTC')))->format(DateTime::ATOM),
                            $l['type'] ?? 'arrosage',
                            $l['amountOrDetails'] ?? null,
                            $l['performedBy'] ?? 'Robin',
                            $l['notes'] ?? null,
                        ]);
                    }
                }

                if (!empty($input['users']) && is_array($input['users'])) {
                    $pdo->exec("DELETE FROM users;");
                    $insertUser = $pdo->prepare("INSERT INTO users (id, name, role, avatarBg) VALUES (?, ?, ?, ?)");
                    foreach ($input['users'] as $u) {
                        $insertUser->execute([
                            $u['id'] ?? ('user-' . bin2hex(random_bytes(4))),
                            $u['name'],
                            $u['role'] ?? 'Secondaire',
                            $u['avatarBg'] ?? 'bg-emerald-600',
                        ]);
                    }
                }

                $pdo->commit();
                jsonResponse(['success' => true, 'message' => 'Données importées avec succès dans SQLite']);
            } catch (Exception $e) {
                $pdo->rollBack();
                jsonResponse(['error' => 'Import failed: ' . $e->getMessage()], 500);
            }
        }

        // POST /api/backup/reset
        if ($method === 'POST' && $action === 'reset') {
            $pdo->exec("
                DELETE FROM completed_checks;
                DELETE FROM care_logs;
                DELETE FROM plants;
                DELETE FROM users;
                DELETE FROM preferences;
            ");
            seedInitialData($pdo);
            jsonResponse(['success' => true, 'message' => 'Base SQLite réinitialisée avec les données botaniques de démonstration']);
        }
    }

    // Route non trouvée
    jsonResponse([
        'error' => 'Route not found',
        'method' => $method,
        'path' => $path,
        'availableRoutes' => [
            'GET /api/health',
            'GET /api/plants',
            'POST /api/plants',
            'GET /api/plants/{id}',
            'PUT /api/plants/{id}',
            'DELETE /api/plants/{id}',
            'PATCH /api/plants/{id}/favorite',
            'POST /api/plants/{id}/water',
            'POST /api/plants/{id}/mist',
            'POST /api/plants/{id}/fertilize',
            'GET /api/logs',
            'POST /api/logs',
            'DELETE /api/logs/{id}',
            'GET /api/users',
            'POST /api/users',
            'DELETE /api/users/{id}',
            'GET /api/preferences',
            'PUT /api/preferences',
            'GET /api/checks/completed',
            'POST /api/checks/complete',
            'GET /api/backup/export',
            'POST /api/backup/import',
            'POST /api/backup/reset',
        ]
    ], 404);

} catch (PDOException $e) {
    jsonResponse([
        'error' => 'Database error',
        'details' => $e->getMessage(),
    ], 500);
} catch (Throwable $e) {
    jsonResponse([
        'error' => 'Internal server error',
        'details' => $e->getMessage(),
    ], 500);
}
