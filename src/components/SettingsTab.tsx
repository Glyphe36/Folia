import React, { useState } from 'react';
import { usePlantContext } from '../context/PlantContext';
import {
  Users,
  Bell,
  Clock,
  Calendar,
  Check,
  Plus,
  Trash2,
  Volume2,
  Moon,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  BellRing,
  AlertCircle,
  Database,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { UserProfile } from '../types/plant';

const DAYS_OF_WEEK = [
  { key: 'Lun', label: 'Lundi' },
  { key: 'Mar', label: 'Mardi' },
  { key: 'Mer', label: 'Mercredi' },
  { key: 'Jeu', label: 'Jeudi' },
  { key: 'Ven', label: 'Vendredi' },
  { key: 'Sam', label: 'Samedi' },
  { key: 'Dim', label: 'Dimanche' },
];

export const SettingsTab: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUser,
    addUser,
    deleteUser,
    preferences,
    updatePreferences,
    triggerReminderSimulation,
    resetToDefaults,
    exportDataJson,
    importDataJson,
    apiStatus,
    refreshAll,
    updateApiEndpoint,
    resetApiEndpoint,
  } = usePlantContext();

  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserProfile['role']>('Secondaire');
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  
  // API URL edit state
  const [customUrlInput, setCustomUrlInput] = useState(apiStatus.targetUrl);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency?: number; msg: string } | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    await addUser(newUserName.trim(), newUserRole);
    setNewUserName('');
  };

  const toggleDay = (day: string) => {
    const current = preferences.selectedDays;
    const exists = current.includes(day);
    const updated = exists ? current.filter((d) => d !== day) : [...current, day];
    updatePreferences({ selectedDays: updated });
  };

  const handleExport = async () => {
    const jsonStr = await exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folia-backup-sqlite-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = async () => {
    if (!importText.trim()) return;
    const ok = await importDataJson(importText);
    if (ok) {
      setImportText('');
      setShowImportBox(false);
    }
  };

  const handleSaveApiUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    await updateApiEndpoint(customUrlInput.trim());
  };

  const handleTestConnection = async () => {
    setIsTestingApi(true);
    setTestResult(null);
    const start = performance.now();
    try {
      await refreshAll();
      const elapsed = Math.round(performance.now() - start);
      setTestResult({
        success: apiStatus.connected,
        latency: elapsed,
        msg: apiStatus.connected
          ? `Connexion API réussie (${elapsed} ms)`
          : `API non joignable : ${apiStatus.error || 'Erreur inconnue'}`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: `Échec : ${err.message}`,
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Paramètres</h1>
        <p className="text-xs text-stone-500 mt-1">
          Gérez l'architecture API PHP / SQLite, les profils d'utilisateurs et vos préférences de rappel.
        </p>
      </div>

      {/* SECTION 0: BACKEND API & PERSISTANCE SQLITE */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                Persistance API : React → PHP → SQLite
              </h2>
              <p className="text-xs text-stone-500">
                Toutes les plantes, historiques de soins et profils sont stockés dans la base SQLite locale.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                apiStatus.connected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  apiStatus.connected ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'
                }`}
              />
              {apiStatus.connected ? 'Connecté à SQLite' : 'Hors ligne / En attente'}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg border border-stone-200 bg-stone-50/70">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Base de données
            </div>
            <div className="text-sm font-bold text-stone-800 mt-0.5 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-700" />
              SQLite 3 (PDO)
            </div>
            <div className="text-[11px] text-stone-500 font-mono mt-1 truncate">
              backend/database.sqlite
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-stone-200 bg-stone-50/70">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Serveur Backend
            </div>
            <div className="text-sm font-bold text-stone-800 mt-0.5 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-700" />
              PHP {apiStatus.phpVersion || '8.2'}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 truncate">
              Router REST natif (port 3001)
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-stone-200 bg-stone-50/70">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Endpoint actif
            </div>
            <div className="text-sm font-bold text-stone-800 mt-0.5 truncate font-mono">
              {apiStatus.activeUrl}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Dernier contrôle : {apiStatus.lastChecked || 'À l\'instant'}
            </div>
          </div>
        </div>

        {/* API URL Config Form */}
        <div className="pt-2 border-t border-stone-100 space-y-3">
          <form onSubmit={handleSaveApiUrl} className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              Adresse de l'API PHP (VITE_API_URL) :
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="http://192.168.1.157:3001/api"
                className="flex-1 px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shadow-xs"
                >
                  Appliquer
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingApi}
                  className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingApi ? 'animate-spin' : ''}`} />
                  {isTestingApi ? 'Test en cours...' : 'Tester'}
                </button>
              </div>
            </div>
          </form>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-stone-500 text-[11px]">Raccourcis :</span>
            <button
              type="button"
              onClick={() => {
                setCustomUrlInput('http://192.168.1.157:3001/api');
                updateApiEndpoint('http://192.168.1.157:3001/api');
              }}
              className="px-2 py-1 text-[11px] font-mono bg-stone-100 hover:bg-stone-200 rounded text-stone-700 transition-colors"
            >
              http://192.168.1.157:3001/api
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomUrlInput('/api');
                updateApiEndpoint('/api');
              }}
              className="px-2 py-1 text-[11px] font-mono bg-stone-100 hover:bg-stone-200 rounded text-stone-700 transition-colors"
            >
              /api (Proxy local)
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomUrlInput('http://localhost:3001/api');
                updateApiEndpoint('http://localhost:3001/api');
              }}
              className="px-2 py-1 text-[11px] font-mono bg-stone-100 hover:bg-stone-200 rounded text-stone-700 transition-colors"
            >
              http://localhost:3001/api
            </button>
            <button
              type="button"
              onClick={() => {
                resetApiEndpoint();
                setCustomUrlInput('http://192.168.1.157:3001/api');
              }}
              className="text-[11px] text-emerald-800 hover:underline ml-auto"
            >
              Réinitialiser
            </button>
          </div>

          {/* Test feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{testResult.msg}</span>
            </div>
          )}

          {/* Architecture notes */}
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-600 space-y-1">
            <div className="font-semibold text-stone-700 flex items-center gap-1.5">
              <span>Flux de données :</span>
              <span className="font-mono text-emerald-800">React Frontend</span>
              <ArrowRight className="w-3 h-3 text-stone-400" />
              <span className="font-mono text-emerald-800">API PHP (backend/router.php)</span>
              <ArrowRight className="w-3 h-3 text-stone-400" />
              <span className="font-mono text-emerald-800">SQLite (database.sqlite)</span>
            </div>
            <div>
              Si l'adresse distante <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">192.168.1.157:3001</code> n'est pas accessible directement depuis votre navigateur (par exemple en prévisualisation HTTPS avec blocage des contenus mixtes), le client bascule automatiquement sur le proxy local <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">/api</code> exécutant le serveur PHP et SQLite.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Utilisateurs */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Gestion des profils</h2>
              <p className="text-xs text-stone-500">
                Identifiez qui s'occupe des soins pour chaque plante dans SQLite.
              </p>
            </div>
          </div>
        </div>

        {/* Profiles list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {users.map((user) => {
            const isSelected = user.id === currentUser.id;
            return (
              <div
                key={user.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-700'
                    : 'border-stone-200 bg-stone-50/30 hover:border-stone-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCurrentUser(user)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${user.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5 truncate">
                      {user.name}
                      {isSelected && (
                        <span className="text-[10px] font-normal text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 capitalize">{user.role}</div>
                  </div>
                </button>

                {users.length > 1 && (
                  <button
                    onClick={() => deleteUser(user.id)}
                    title="Supprimer ce profil"
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add user form */}
        <form onSubmit={handleAddUser} className="pt-2 border-t border-stone-100">
          <div className="text-xs font-semibold text-stone-700 mb-2">Ajouter un nouveau membre :</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Prénom ou nom (ex: Camille)"
              className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as UserProfile['role'])}
              className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="Principal">Principal</option>
              <option value="Secondaire">Secondaire</option>
              <option value="Invité">Invité</option>
            </select>
            <button
              type="submit"
              disabled={!newUserName.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 2: Rappels & Notifications */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Préférences de rappels</h2>
              <p className="text-xs text-stone-500">
                Personnalisez la fréquence, l'horaire et les types d'alertes des vérifications du jour.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={(e) => updatePreferences({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-800"></div>
          </label>
        </div>

        <div className={`space-y-6 ${!preferences.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* Horaire & Plage de repos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                Heure du rappel quotidien
              </label>
              <input
                type="time"
                value={preferences.reminderTime}
                onChange={(e) => updatePreferences({ reminderTime: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-stone-500" />
                Début heures silencieuses
              </label>
              <input
                type="time"
                value={preferences.quietHoursStart}
                onChange={(e) => updatePreferences({ quietHoursStart: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-stone-500" />
                Fin heures silencieuses
              </label>
              <input
                type="time"
                value={preferences.quietHoursEnd}
                onChange={(e) => updatePreferences({ quietHoursEnd: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Days selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              Jours actifs de vérification
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isActive = preferences.selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                      isActive
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Care Types Checklist */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Types de soins concernés par les rappels
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-stone-200 bg-stone-50/50 cursor-pointer hover:bg-stone-50">
                <input
                  type="checkbox"
                  checked={preferences.notifyWatering}
                  onChange={(e) => updatePreferences({ notifyWatering: e.target.checked })}
                  className="rounded text-emerald-800 focus:ring-emerald-700"
                />
                <span className="text-xs font-medium text-stone-800">Arrosages réguliers</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-stone-200 bg-stone-50/50 cursor-pointer hover:bg-stone-50">
                <input
                  type="checkbox"
                  checked={preferences.notifyMisting}
                  onChange={(e) => updatePreferences({ notifyMisting: e.target.checked })}
                  className="rounded text-emerald-800 focus:ring-emerald-700"
                />
                <span className="text-xs font-medium text-stone-800">Brumisations foliaires</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-stone-200 bg-stone-50/50 cursor-pointer hover:bg-stone-50">
                <input
                  type="checkbox"
                  checked={preferences.notifyFertilizer}
                  onChange={(e) => updatePreferences({ notifyFertilizer: e.target.checked })}
                  className="rounded text-emerald-800 focus:ring-emerald-700"
                />
                <span className="text-xs font-medium text-stone-800">Apports d'engrais</span>
              </label>
            </div>
          </div>

          {/* Options: Sound & Auto Adjust */}
          <div className="pt-2 border-t border-stone-100 space-y-3">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-stone-500" />
                <span className="text-xs font-medium text-stone-800">Signaux sonores de rappel</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.soundAlerts}
                onChange={(e) => updatePreferences({ soundAlerts: e.target.checked })}
                className="rounded text-emerald-800 focus:ring-emerald-700"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-stone-500" />
                <div>
                  <div className="text-xs font-medium text-stone-800">
                    Adaptation automatique aux saisons
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Rappelle d'espacer les arrosages d'environ 30% d'octobre à mars
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.autoAdjustSeason}
                onChange={(e) => updatePreferences({ autoAdjustSeason: e.target.checked })}
                className="rounded text-emerald-800 focus:ring-emerald-700"
              />
            </label>
          </div>

          {/* Test reminder action button */}
          <div className="pt-3 flex items-center justify-between bg-stone-50 p-3.5 rounded-lg border border-stone-200">
            <div>
              <div className="text-xs font-semibold text-stone-800">Tester le système de rappel</div>
              <div className="text-[11px] text-stone-500">
                Affiche une notification instantanée avec le bilan des soins du jour.
              </div>
            </div>
            <button
              type="button"
              onClick={triggerReminderSimulation}
              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <BellRing className="w-3.5 h-3.5 text-emerald-800" />
              Déclencher le rappel
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: Sauvegarde & Données */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-stone-900">Données & Sauvegarde SQLite</h2>
            <p className="text-xs text-stone-500">
              Exportez votre base SQLite en JSON ou restaurez les données d'exemple.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-stone-600" />
            Exporter la base SQLite (JSON)
          </button>

          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-stone-600" />
            Importer des données
          </button>

          <button
            onClick={resetToDefaults}
            className="px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réinitialiser les exemples
          </button>
        </div>

        {showImportBox && (
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3 mt-3">
            <label className="block text-xs font-semibold text-stone-700">
              Collez le contenu JSON à importer dans SQLite :
            </label>
            <textarea
              rows={4}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"version": 1, "plants": [...]}'
              className="w-full p-2.5 text-xs font-mono bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportBox(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg"
              >
                Valider l'import
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
