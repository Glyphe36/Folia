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
  } = usePlantContext();

  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserProfile['role']>('Secondaire');
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    addUser(newUserName.trim(), newUserRole);
    setNewUserName('');
  };

  const toggleDay = (day: string) => {
    const current = preferences.selectedDays;
    const exists = current.includes(day);
    const updated = exists ? current.filter((d) => d !== day) : [...current, day];
    updatePreferences({ selectedDays: updated });
  };

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folia-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const ok = importDataJson(importText);
    if (ok) {
      setImportText('');
      setShowImportBox(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Paramètres</h1>
        <p className="text-xs text-stone-500 mt-1">
          Gérez les profils d'utilisateurs et personnalisez vos préférences de notification et rappels.
        </p>
      </div>

      {/* SECTION 1: Utilisateurs */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Gestion des utilisateurs</h2>
              <p className="text-xs text-stone-500">
                Partagez l'entretien de vos plantes avec les membres du foyer ou vos proches.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md tabular-nums">
            {users.length} profil{users.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* User list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {users.map((u) => {
            const isActive = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isActive
                    ? 'border-emerald-700 bg-emerald-50/40 shadow-xs'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-9 h-9 rounded-full ${u.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-xs`}
                    >
                      {u.name.charAt(0)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-stone-900">{u.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">{u.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isActive && (
                      <button
                        onClick={() => setCurrentUser(u)}
                        className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-md transition-colors shadow-2xs"
                      >
                        Sélectionner
                      </button>
                    )}
                    {users.length > 1 && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Supprimer ce profil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add user form */}
        <form onSubmit={handleAddUser} className="pt-4 border-t border-stone-100">
          <div className="text-xs font-semibold text-stone-700 mb-2">Ajouter un nouveau membre</div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Prénom ou pseudo..."
              className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as any)}
              className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-700"
            >
              <option value="Principal">Principal</option>
              <option value="Secondaire">Secondaire</option>
              <option value="Invité">Invité / Plant-sitter</option>
            </select>
            <button
              type="submit"
              disabled={!newUserName.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 2: Préférences de rappel */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Préférences de rappel</h2>
              <p className="text-xs text-stone-500">
                Configurez la fréquence et le calendrier des notifications pour ne rien oublier.
              </p>
            </div>
          </div>

          {/* Master toggle */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={(e) => updatePreferences({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
          </label>
        </div>

        <div className={`space-y-6 ${!preferences.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* Time & Days Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Preferred Time */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 mb-2">
                <Clock className="w-4 h-4 text-stone-500" />
                Heure du rappel quotidien
              </label>
              <input
                type="time"
                value={preferences.reminderTime}
                onChange={(e) => updatePreferences({ reminderTime: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Moment idéal pour faire le tour de vos plantes avant de commencer la journée.
              </p>
            </div>

            {/* Quiet Hours */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 mb-2">
                <Moon className="w-4 h-4 text-stone-500" />
                Heures calmes (Ne pas déranger)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={(e) => updatePreferences({ quietHoursStart: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
                <span className="text-xs text-stone-400">à</span>
                <input
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={(e) => updatePreferences({ quietHoursEnd: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Aucune alerte sonore ne sera émise durant cette période.
              </p>
            </div>
          </div>

          {/* Days selector */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 mb-2">
              <Calendar className="w-4 h-4 text-stone-500" />
              Jours de vérification actifs
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = preferences.selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
            <h2 className="text-base font-bold text-stone-900">Données & Sauvegarde</h2>
            <p className="text-xs text-stone-500">
              Exportez votre collection en JSON ou restaurez les données d'exemple.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-stone-600" />
            Exporter mes données (JSON)
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
              Collez le contenu JSON à importer :
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
