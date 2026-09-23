import React, { createContext, useContext, useState, useEffect } from 'react';
import { Plant, CareLog, UserProfile, ReminderPreferences, DailyCheckItem, CareType } from '../types/plant';
import {
  INITIAL_PLANTS,
  INITIAL_CARE_LOGS,
  INITIAL_USERS,
  INITIAL_PREFERENCES,
} from '../data/initialData';
import { generateTodayChecks } from '../utils/plantCalculations';

interface ToastData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'reminder';
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
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'reminder') => void;
  
  // Plant actions
  addPlant: (plant: Omit<Plant, 'id' | 'addedDate'>) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  toggleFavorite: (plantId: string) => void;
  
  // Care actions
  logCareAction: (data: {
    plantId: string;
    type: CareType;
    amountOrDetails?: string;
    notes?: string;
    date?: string;
    performedBy?: string;
  }) => void;
  quickWaterPlant: (plantId: string) => void;
  quickMistPlant: (plantId: string) => void;
  completeTodayCheck: (checkId: string) => void;
  deleteCareLog: (logId: string) => void;
  
  // User profile actions
  addUser: (name: string, role?: UserProfile['role']) => void;
  deleteUser: (userId: string) => void;
  setCurrentUser: (user: UserProfile) => void;
  
  // Preferences & Data
  updatePreferences: (updates: Partial<ReminderPreferences>) => void;
  triggerReminderSimulation: () => void;
  resetToDefaults: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => boolean;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PLANTS: 'folia_plants_v1',
  LOGS: 'folia_care_logs_v1',
  USERS: 'folia_users_v1',
  CURRENT_USER: 'folia_current_user_v1',
  PREFS: 'folia_preferences_v1',
  COMPLETED_CHECKS: 'folia_completed_checks_v1',
};

export const PlantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'accueil' | 'plantes' | 'suivi' | 'parametres'>('accueil');

  // Load plants
  const [plants, setPlants] = useState<Plant[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLANTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PLANTS;
  });

  // Load care logs
  const [careLogs, setCareLogs] = useState<CareLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CARE_LOGS;
  });

  // Load users
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS;
  });

  // Current active user
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = INITIAL_USERS.find((u) => u.id === parsed.id);
        if (match) return match;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS[0];
  });

  // Preferences
  const [preferences, setPreferences] = useState<ReminderPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PREFERENCES;
  });

  // Completed daily check IDs for today
  const [completedCheckIds, setCompletedCheckIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPLETED_CHECKS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Toasts notifications
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Synchronize with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(plants));
  }, [plants]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(careLogs));
  }, [careLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPLETED_CHECKS, JSON.stringify(completedCheckIds));
  }, [completedCheckIds]);

  // Toast helper
  const showToast = (title: string, message: string, type: 'success' | 'info' | 'reminder' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Generate today checks combining raw overdue/due items and completion status
  const rawChecks = generateTodayChecks(plants);
  const todayChecks: DailyCheckItem[] = rawChecks.map((item) => ({
    ...item,
    completed: completedCheckIds.includes(item.id),
  }));

  // Add Plant
  const addPlant = (newPlantData: Omit<Plant, 'id' | 'addedDate'>) => {
    const newPlant: Plant = {
      ...newPlantData,
      id: `plant-${Date.now()}`,
      addedDate: new Date().toISOString().split('T')[0],
      favorite: false,
    };
    setPlants((prev) => [newPlant, ...prev]);
    showToast('Plante ajoutée', `${newPlant.name} a rejoint votre collection !`, 'success');
  };

  // Update Plant
  const updatePlant = (id: string, updates: Partial<Plant>) => {
    setPlants((prev) =>
      prev.map((plant) => (plant.id === id ? { ...plant, ...updates } : plant))
    );
    showToast('Modifications enregistrées', 'Fiche de la plante mise à jour.', 'info');
  };

  // Delete Plant
  const deletePlant = (id: string) => {
    const plant = plants.find((p) => p.id === id);
    setPlants((prev) => prev.filter((p) => p.id !== id));
    showToast('Plante retirée', `${plant?.name || 'La plante'} a été supprimée.`, 'info');
  };

  // Toggle favorite
  const toggleFavorite = (plantId: string) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, favorite: !p.favorite } : p))
    );
  };

  // Log Care Action
  const logCareAction = ({
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

    const newLog: CareLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      plantId,
      plantName: targetPlant.name,
      type,
      date,
      performedBy,
      amountOrDetails,
      notes,
    };

    setCareLogs((prev) => [newLog, ...prev]);

    // Update plant timestamp according to action
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

    // If there's an associated check, mark it done
    const checkId = `check-${plantId}-${type}`;
    if (!completedCheckIds.includes(checkId)) {
      setCompletedCheckIds((prev) => [...prev, checkId]);
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
      `Soin enregistré pour ${targetPlant.nickname || targetPlant.name} par ${performedBy}.`,
      'success'
    );
  };

  // Quick Water Plant
  const quickWaterPlant = (plantId: string) => {
    logCareAction({
      plantId,
      type: 'arrosage',
      amountOrDetails: 'Arrosage régulier',
    });
  };

  // Quick Mist Plant
  const quickMistPlant = (plantId: string) => {
    logCareAction({
      plantId,
      type: 'brumisation',
      amountOrDetails: 'Brumisation du feuillage',
    });
  };

  // Complete Today Check Item
  const completeTodayCheck = (checkId: string) => {
    const check = todayChecks.find((c) => c.id === checkId);
    if (!check) return;

    if (check.completed) {
      // Toggle off
      setCompletedCheckIds((prev) => prev.filter((id) => id !== checkId));
    } else {
      // Mark as completed and log action
      setCompletedCheckIds((prev) => [...prev, checkId]);
      logCareAction({
        plantId: check.plantId,
        type: check.careType,
        amountOrDetails: `Vérification du jour validée`,
      });
    }
  };

  // Delete care log
  const deleteCareLog = (logId: string) => {
    setCareLogs((prev) => prev.filter((l) => l.id !== logId));
    showToast('Entrée supprimée', 'L\'historique de soin a été mis à jour.', 'info');
  };

  // Add User
  const addUser = (name: string, role: UserProfile['role'] = 'Secondaire') => {
    const colors = ['bg-indigo-600', 'bg-rose-600', 'bg-cyan-600', 'bg-emerald-600', 'bg-amber-600', 'bg-violet-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      role,
      avatarBg: randomColor,
    };
    setUsers((prev) => [...prev, newUser]);
    showToast('Utilisateur ajouté', `${newUser.name} a été ajouté(e) aux profils.`, 'success');
  };

  // Delete User
  const deleteUser = (userId: string) => {
    if (users.length <= 1) {
      showToast('Action impossible', 'Il doit rester au moins un utilisateur.', 'info');
      return;
    }
    const userToDelete = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      setCurrentUser(remaining[0]);
    }
    showToast('Profil supprimé', `${userToDelete?.name || 'L\'utilisateur'} a été retiré.`, 'info');
  };

  // Update preferences
  const updatePreferences = (updates: Partial<ReminderPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
    showToast('Préférences enregistrées', 'Vos paramètres de rappel ont été mis à jour.', 'success');
  };

  // Trigger test reminder notification
  const triggerReminderSimulation = () => {
    const overdueCount = rawChecks.filter((c) => c.isOverdue).length;
    const dueCount = rawChecks.length;
    const msg =
      dueCount > 0
        ? `Bonjour ${currentUser.name} ! ${dueCount} soin(s) prévus aujourd'hui (dont ${overdueCount} en retard). Pensez à vos plantes !`
        : `Bonjour ${currentUser.name} ! Toutes vos plantes sont en pleine forme et à jour aujourd'hui 🌿.`;
    showToast('Rappel Folia - Soin des plantes', msg, 'reminder');
  };

  // Reset to default sample data
  const resetToDefaults = () => {
    setPlants(INITIAL_PLANTS);
    setCareLogs(INITIAL_CARE_LOGS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setPreferences(INITIAL_PREFERENCES);
    setCompletedCheckIds([]);
    showToast('Données réinitialisées', 'Les données de démonstration ont été restaurées.', 'info');
  };

  // Export JSON
  const exportDataJson = () => {
    const bundle = {
      version: 1,
      exportDate: new Date().toISOString(),
      plants,
      careLogs,
      users,
      preferences,
    };
    return JSON.stringify(bundle, null, 2);
  };

  // Import JSON
  const importDataJson = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed.plants)) setPlants(parsed.plants);
      if (Array.isArray(parsed.careLogs)) setCareLogs(parsed.careLogs);
      if (Array.isArray(parsed.users)) setUsers(parsed.users);
      if (parsed.preferences) setPreferences(parsed.preferences);
      showToast('Import réussi', 'Vos plantes et historiques ont été restaurés avec succès.', 'success');
      return true;
    } catch {
      showToast('Erreur d\'import', 'Le fichier JSON fourni est invalide.', 'info');
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
