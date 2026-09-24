import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Plant, CareLog, UserProfile, ReminderPreferences, DailyCheckItem, CareType } from '../types/plant';
import {
  INITIAL_PLANTS,
  INITIAL_CARE_LOGS,
  INITIAL_USERS,
  INITIAL_PREFERENCES,
} from '../data/initialData';
import { generateTodayChecks } from '../utils/plantCalculations';
import {
  plantApi,
  getActiveApiUrl,
  getTargetApiUrl,
  setCustomApiUrl,
  resetCustomApiUrl,
} from '../services/api';

interface ToastData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'reminder';
}

export interface ApiStatus {
  connected: boolean;
  activeUrl: string;
  targetUrl: string;
  isFallback: boolean;
  phpVersion?: string;
  database?: string;
  error?: string;
  lastChecked?: string;
}

interface PlantContextType {
  activeTab: 'accueil' | 'plantes' | 'suivi' | 'parametres';
  setActiveTab: (tab: 'accueil' | 'plantes' | 'suivi' | 'parametres') => void;
  plants: Plant[];
  careLogs: CareLog[];
  users: UserProfile[];
  currentUser: UserProfile;
  preferences: ReminderPreferences;
  todayChecks: DailyCheckItem[];
  toasts: ToastData[];
  isLoading: boolean;
  apiStatus: ApiStatus;
  
  // API management
  refreshAll: () => Promise<void>;
  updateApiEndpoint: (newUrl: string) => Promise<void>;
  resetApiEndpoint: () => Promise<void>;

  // Toast
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'reminder') => void;
  
  // Plant actions (PHP + SQLite persistants)
  addPlant: (plant: Omit<Plant, 'id' | 'addedDate'>) => Promise<void>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  toggleFavorite: (plantId: string) => Promise<void>;
  
  // Care actions
  logCareAction: (data: {
    plantId: string;
    type: CareType;
    amountOrDetails?: string;
    notes?: string;
    date?: string;
    performedBy?: string;
  }) => Promise<void>;
  quickWaterPlant: (plantId: string) => Promise<void>;
  quickMistPlant: (plantId: string) => Promise<void>;
  completeTodayCheck: (checkId: string) => Promise<void>;
  deleteCareLog: (logId: string) => Promise<void>;
  
  // User profile actions
  addUser: (name: string, role?: UserProfile['role']) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  setCurrentUser: (user: UserProfile) => void;
  
  // Preferences & Data
  updatePreferences: (updates: Partial<ReminderPreferences>) => Promise<void>;
  triggerReminderSimulation: () => void;
  resetToDefaults: () => Promise<void>;
  exportDataJson: () => Promise<string>;
  importDataJson: (json: string) => Promise<boolean>;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'accueil' | 'plantes' | 'suivi' | 'parametres'>('accueil');

  const [plants, setPlants] = useState<Plant[]>(INITIAL_PLANTS);
  const [careLogs, setCareLogs] = useState<CareLog[]>(INITIAL_CARE_LOGS);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [preferences, setPreferences] = useState<ReminderPreferences>(INITIAL_PREFERENCES);
  const [completedCheckIds, setCompletedCheckIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    connected: false,
    activeUrl: getActiveApiUrl(),
    targetUrl: getTargetApiUrl(),
    isFallback: false,
  });

  const showToast = useCallback(
    (title: string, message: string, type: 'success' | 'info' | 'reminder' = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Chargement initial depuis l'API PHP / SQLite
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Vérification santé API
      const health = await plantApi.checkHealth();
      setApiStatus({
        connected: health.connected,
        activeUrl: health.url,
        targetUrl: getTargetApiUrl(),
        isFallback: health.isFallback,
        phpVersion: health.phpVersion,
        database: health.database,
        error: health.error,
        lastChecked: new Date().toLocaleTimeString('fr-FR'),
      });

      if (!health.connected) {
        console.warn('[Folia] API PHP inaccessible pour l\'instant, conservation des données locales');
        setIsLoading(false);
        return;
      }

      // 2. Récupération parallèle des données
      const [fetchedPlants, fetchedLogs, fetchedUsers, fetchedPrefs, fetchedChecks] = await Promise.all([
        plantApi.getPlants(),
        plantApi.getLogs(),
        plantApi.getUsers(),
        plantApi.getPreferences(),
        plantApi.getCompletedChecks(),
      ]);

      if (Array.isArray(fetchedPlants) && fetchedPlants.length > 0) {
        setPlants(fetchedPlants);
      }
      if (Array.isArray(fetchedLogs)) {
        setCareLogs(fetchedLogs);
      }
      if (Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
        // Conserver l'utilisateur actif s'il existe toujours
        setCurrentUser((curr) => {
          const match = fetchedUsers.find((u) => u.id === curr.id);
          return match || fetchedUsers[0];
        });
      }
      if (fetchedPrefs && typeof fetchedPrefs === 'object') {
        setPreferences(fetchedPrefs);
      }
      if (fetchedChecks && Array.isArray(fetchedChecks.completedCheckIds)) {
        setCompletedCheckIds(fetchedChecks.completedCheckIds);
      }
    } catch (err: any) {
      console.error('[Folia] Erreur de synchronisation avec l\'API PHP :', err);
      setApiStatus((prev) => ({
        ...prev,
        connected: false,
        error: err.message,
        lastChecked: new Date().toLocaleTimeString('fr-FR'),
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Changer l'adresse de l'API (ex: passer de 192.168.1.157 à localhost ou vice-versa)
  const updateApiEndpoint = async (newUrl: string) => {
    setCustomApiUrl(newUrl);
    await refreshAll();
    showToast('API PHP mise à jour', `Nouvelle adresse active : ${newUrl}`, 'info');
  };

  const resetApiEndpoint = async () => {
    resetCustomApiUrl();
    await refreshAll();
    showToast('Adresse API réinitialisée', 'Retour à la configuration par défaut.', 'info');
  };

  // Liste des vérifications du jour
  const rawChecks = generateTodayChecks(plants);
  const todayChecks: DailyCheckItem[] = rawChecks.map((item) => ({
    ...item,
    completed: completedCheckIds.includes(item.id),
  }));

  // 1. Ajouter une plante
  const addPlant = async (newPlantData: Omit<Plant, 'id' | 'addedDate'>) => {
    try {
      const created = await plantApi.createPlant(newPlantData);
      setPlants((prev) => [created, ...prev]);
      
      // Recharger aussi les logs car un log initial a été créé en base
      const updatedLogs = await plantApi.getLogs();
      setCareLogs(updatedLogs);

      showToast('Plante enregistrée', `${created.name} a été persistée dans SQLite !`, 'success');
    } catch (err: any) {
      showToast('Erreur d\'ajout', err.message || 'Impossible d\'ajouter la plante.', 'info');
      throw err;
    }
  };

  // 2. Modifier une plante
  const updatePlant = async (id: string, updates: Partial<Plant>) => {
    // Mise à jour optimiste
    setPlants((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    try {
      const updated = await plantApi.updatePlant(id, updates);
      setPlants((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast('Modifications enregistrées', 'La plante a été mise à jour dans SQLite.', 'info');
    } catch (err: any) {
      showToast('Erreur de mise à jour', err.message || 'Impossible de mettre à jour la plante.', 'info');
      refreshAll();
    }
  };

  // 3. Supprimer une plante
  const deletePlant = async (id: string) => {
    const previous = plants;
    const plant = plants.find((p) => p.id === id);
    setPlants((prev) => prev.filter((p) => p.id !== id));
    setCareLogs((prev) => prev.filter((l) => l.plantId !== id));

    try {
      await plantApi.deletePlant(id);
      showToast('Plante retirée', `${plant?.name || 'La plante'} a été supprimée de SQLite.`, 'info');
    } catch (err: any) {
      setPlants(previous);
      showToast('Erreur de suppression', err.message, 'info');
    }
  };

  // 4. Basculer favori
  const toggleFavorite = async (plantId: string) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, favorite: !p.favorite } : p))
    );
    try {
      const updated = await plantApi.toggleFavorite(plantId);
      setPlants((prev) => prev.map((p) => (p.id === plantId ? updated : p)));
    } catch (err: any) {
      console.error(err);
      refreshAll();
    }
  };

  // 5. Enregistrer une action de soin
  const logCareAction = async ({
    plantId,
    type,
    amountOrDetails,
    notes,
    date = new Date().toISOString(),
    performedBy = currentUser.name,
  }: {
    plantId: string;
    type: CareType;
    amountOrDetails?: string;
    notes?: string;
    date?: string;
    performedBy?: string;
  }) => {
    const targetPlant = plants.find((p) => p.id === plantId);
    if (!targetPlant) return;

    try {
      const newLog = await plantApi.createLog({
        plantId,
        type,
        amountOrDetails,
        notes,
        date,
        performedBy,
      });

      setCareLogs((prev) => [newLog, ...prev]);

      // Mettre à jour la plante localement
      setPlants((prev) =>
        prev.map((plant) => {
          if (plant.id !== plantId) return plant;
          const updates: Partial<Plant> = {};
          if (type === 'arrosage') updates.lastWatered = date;
          if (type === 'brumisation') updates.lastMisted = date;
          if (type === 'engrais') updates.lastFertilized = date;
          return { ...plant, ...updates };
        })
      );

      // Marquer la vérification comme validée
      const checkId = `check-${plantId}-${type}`;
      if (!completedCheckIds.includes(checkId)) {
        setCompletedCheckIds((prev) => [...prev, checkId]);
        plantApi.completeCheck(checkId).catch(console.error);
      }

      const careLabels: Record<CareType, string> = {
        arrosage: 'Arrosage effectué',
        brumisation: 'Brumisation effectuée',
        engrais: 'Fertilisation enregistrée',
        rempotage: 'Rempotage noté',
        taille: 'Taille enregistrée',
        nettoyage: 'Nettoyage des feuilles effectué',
      };

      showToast(
        careLabels[type] || 'Soin enregistré',
        `Soin persisté dans SQLite pour ${targetPlant.nickname || targetPlant.name} par ${performedBy}.`,
        'success'
      );
    } catch (err: any) {
      showToast('Erreur', err.message || 'Impossible d\'enregistrer le soin.', 'info');
    }
  };

  // 6. Arrosage rapide
  const quickWaterPlant = async (plantId: string) => {
    try {
      const { plant, log } = await plantApi.waterPlant(
        plantId,
        currentUser.name,
        'Arrosage régulier'
      );
      setPlants((prev) => prev.map((p) => (p.id === plantId ? plant : p)));
      setCareLogs((prev) => [log, ...prev]);

      const checkId = `check-${plantId}-arrosage`;
      if (!completedCheckIds.includes(checkId)) {
        setCompletedCheckIds((prev) => [...prev, checkId]);
        plantApi.completeCheck(checkId).catch(console.error);
      }

      showToast('Arrosage effectué', `${plant.nickname || plant.name} a été arrosée (enregistré dans SQLite).`, 'success');
    } catch (err: any) {
      showToast('Erreur', err.message, 'info');
    }
  };

  // 7. Brumisation rapide
  const quickMistPlant = async (plantId: string) => {
    try {
      const { plant, log } = await plantApi.mistPlant(
        plantId,
        currentUser.name,
        'Brumisation du feuillage'
      );
      setPlants((prev) => prev.map((p) => (p.id === plantId ? plant : p)));
      setCareLogs((prev) => [log, ...prev]);

      const checkId = `check-${plantId}-brumisation`;
      if (!completedCheckIds.includes(checkId)) {
        setCompletedCheckIds((prev) => [...prev, checkId]);
        plantApi.completeCheck(checkId).catch(console.error);
      }

      showToast('Brumisation effectuée', `${plant.nickname || plant.name} a été brumisée (enregistré dans SQLite).`, 'success');
    } catch (err: any) {
      showToast('Erreur', err.message, 'info');
    }
  };

  // 8. Cocher / Décocher check du jour
  const completeTodayCheck = async (checkId: string) => {
    const check = todayChecks.find((c) => c.id === checkId);
    if (!check) return;

    if (check.completed) {
      setCompletedCheckIds((prev) => prev.filter((id) => id !== checkId));
    } else {
      setCompletedCheckIds((prev) => [...prev, checkId]);
      try {
        await plantApi.completeCheck(checkId);
      } catch (e) {
        console.error(e);
      }
      await logCareAction({
        plantId: check.plantId,
        type: check.careType,
        amountOrDetails: `Vérification du jour validée`,
      });
    }
  };

  // 9. Supprimer un log de soin
  const deleteCareLog = async (logId: string) => {
    setCareLogs((prev) => prev.filter((l) => l.id !== logId));
    try {
      await plantApi.deleteLog(logId);
      showToast('Entrée supprimée', 'L\'historique de soin a été mis à jour dans SQLite.', 'info');
    } catch (err: any) {
      showToast('Erreur', err.message, 'info');
      refreshAll();
    }
  };

  // 10. Utilisateurs
  const addUser = async (name: string, role: UserProfile['role'] = 'Secondaire') => {
    try {
      const newUser = await plantApi.createUser(name, role);
      setUsers((prev) => [...prev, newUser]);
      showToast('Profil ajouté', `Le profil ${newUser.name} a été créé dans SQLite.`, 'success');
    } catch (err: any) {
      showToast('Erreur', err.message, 'info');
    }
  };

  const deleteUser = async (userId: string) => {
    if (users.length <= 1) {
      showToast('Action impossible', 'Vous devez conserver au moins un profil utilisateur.', 'info');
      return;
    }
    const previous = users;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser.id === userId) {
      const nextUser = users.find((u) => u.id !== userId);
      if (nextUser) setCurrentUser(nextUser);
    }

    try {
      await plantApi.deleteUser(userId);
      showToast('Profil supprimé', 'L\'utilisateur a été retiré de la base SQLite.', 'info');
    } catch (err: any) {
      setUsers(previous);
      showToast('Erreur', err.message, 'info');
    }
  };

  // 11. Préférences
  const updatePreferences = async (updates: Partial<ReminderPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
    try {
      const updated = await plantApi.updatePreferences(updates);
      setPreferences(updated);
      showToast('Préférences enregistrées', 'Vos paramètres de rappel ont été persistés dans SQLite.', 'success');
    } catch (err: any) {
      showToast('Erreur', err.message, 'info');
    }
  };

  // 12. Simulation de rappel
  const triggerReminderSimulation = () => {
    const overdueCount = todayChecks.filter((c) => c.isOverdue && !c.completed).length;
    const dueCount = todayChecks.filter((c) => !c.isOverdue && !c.completed).length;

    let message = '';
    if (overdueCount > 0) {
      message = `Attention : ${overdueCount} soin(s) en retard et ${dueCount} soin(s) prévus aujourd'hui !`;
    } else if (dueCount > 0) {
      message = `${dueCount} soin(s) vous attendent aujourd'hui pour garder vos plantes en pleine forme.`;
    } else {
      message = 'Toutes vos plantes sont hydratées et choyées. Rien à signaler aujourd\'hui !';
    }

    showToast('🌿 Rappel Folia (Test)', message, 'reminder');
  };

  // 13. Réinitialiser aux valeurs d'exemple
  const resetToDefaults = async () => {
    try {
      await plantApi.resetData();
      await refreshAll();
      showToast('Données réinitialisées', 'La base SQLite contient les données botaniques initiales.', 'success');
    } catch (err: any) {
      showToast('Erreur', err.message, 'info');
    }
  };

  // 14. Export JSON
  const exportDataJson = async (): Promise<string> => {
    try {
      const data = await plantApi.exportData();
      return JSON.stringify(data, null, 2);
    } catch (err) {
      return JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          plants,
          careLogs,
          users,
          preferences,
        },
        null,
        2
      );
    }
  };

  // 15. Import JSON
  const importDataJson = async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString);
      await plantApi.importData(parsed);
      await refreshAll();
      showToast('Import réussi', 'La base de données SQLite a été mise à jour.', 'success');
      return true;
    } catch (e: any) {
      showToast('Erreur lors de l\'import', e.message || 'Format JSON invalide.', 'info');
      return false;
    }
  };

  return (
    <PlantContext.Provider
      value={{
        activeTab,
        setActiveTab,
        plants,
        careLogs,
        users,
        currentUser,
        preferences,
        todayChecks,
        toasts,
        isLoading,
        apiStatus,
        refreshAll,
        updateApiEndpoint,
        resetApiEndpoint,
        dismissToast,
        showToast,
        addPlant,
        updatePlant,
        deletePlant,
        toggleFavorite,
        logCareAction,
        quickWaterPlant,
        quickMistPlant,
        completeTodayCheck,
        deleteCareLog,
        addUser,
        deleteUser,
        setCurrentUser,
        updatePreferences,
        triggerReminderSimulation,
        resetToDefaults,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
};

export const usePlantContext = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlantContext must be used within a PlantProvider');
  }
  return context;
};
