import React, { useState } from 'react';
import { usePlantContext } from '../context/PlantContext';
import { Sprout, Plus, User, Check, BellRing, Database } from 'lucide-react';

interface HeaderProps {
  onOpenAddPlant: () => void;
  onOpenQuickCare: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddPlant, onOpenQuickCare }) => {
  const {
    activeTab,
    setActiveTab,
    todayChecks,
    users,
    currentUser,
    setCurrentUser,
    triggerReminderSimulation,
    apiStatus,
  } = usePlantContext();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const pendingChecksCount = todayChecks.filter((c) => !c.completed).length;

  return (
    <header className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('accueil')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-800 text-stone-100 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
                <Sprout className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-emerald-950 group-hover:text-emerald-800 transition-colors">
                Folia
              </span>
            </button>
          </div>

          {/* Zone 2: 4 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('accueil')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors relative ${
                activeTab === 'accueil'
                  ? 'text-emerald-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Accueil
              {pendingChecksCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-semibold text-emerald-900 bg-emerald-200/80 rounded-full tabular-nums">
                  {pendingChecksCount}
                </span>
              )}
              {activeTab === 'accueil' && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-800 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('plantes')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors relative ${
                activeTab === 'plantes'
                  ? 'text-emerald-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Mes plantes
              {activeTab === 'plantes' && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-800 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('suivi')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors relative ${
                activeTab === 'suivi'
                  ? 'text-emerald-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Suivi
              {activeTab === 'suivi' && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-800 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('parametres')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors relative ${
                activeTab === 'parametres'
                  ? 'text-emerald-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Paramètres
              {activeTab === 'parametres' && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-800 rounded-full" />
              )}
            </button>
          </nav>

          {/* Zone 3: Actions (API Badge, Reminder Test, User Profile & Add Plant) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* API Status Pill */}
            <button
              onClick={() => setActiveTab('parametres')}
              title={`API Backend: ${apiStatus.activeUrl} (${apiStatus.connected ? 'Connecté SQLite' : 'Déconnecté / Fallback'})`}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${
                apiStatus.connected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  apiStatus.connected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
                }`}
              />
              <Database className="w-3 h-3 text-current" />
              <span>PHP/SQLite</span>
            </button>

            {/* Quick reminder simulation alert button */}
            <button
              onClick={triggerReminderSimulation}
              title="Tester la notification de rappel"
              className="p-2 text-stone-500 hover:text-emerald-800 hover:bg-stone-200/60 rounded-lg transition-colors"
            >
              <BellRing className="w-4 h-4" />
            </button>

            {/* User Profile Selector */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-xs font-medium text-stone-700 shadow-xs"
              >
                <span
                  className={`w-5 h-5 rounded-full ${currentUser.avatarBg} text-white flex items-center justify-center text-[10px] font-bold`}
                >
                  {currentUser.name.charAt(0)}
                </span>
                <span className="hidden sm:inline max-w-[80px] truncate">{currentUser.name}</span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-lg shadow-lg py-1.5 z-40">
                  <div className="px-3 py-1 border-b border-stone-100 text-[11px] font-semibold text-stone-400">
                    Changer d'utilisateur
                  </div>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center justify-between text-xs hover:bg-stone-50 text-stone-800"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full ${u.avatarBg} text-white flex items-center justify-center text-[9px] font-bold`}
                        >
                          {u.name.charAt(0)}
                        </span>
                        <span>{u.name}</span>
                      </div>
                      {u.id === currentUser.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                  <div className="border-t border-stone-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setActiveTab('parametres');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-stone-500 hover:text-emerald-800"
                    >
                      Gérer les profils...
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick care button */}
            <button
              onClick={onOpenQuickCare}
              className="hidden lg:flex items-center gap-1 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Enregistrer un soin
            </button>

            {/* Primary Action: Add Plant */}
            <button
              onClick={onOpenAddPlant}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter une plante</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-stone-200 py-2 justify-around">
          <button
            onClick={() => setActiveTab('accueil')}
            className={`text-xs font-medium py-1 px-2.5 rounded-md ${
              activeTab === 'accueil'
                ? 'bg-emerald-800 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Accueil {pendingChecksCount > 0 && `(${pendingChecksCount})`}
          </button>
          <button
            onClick={() => setActiveTab('plantes')}
            className={`text-xs font-medium py-1 px-2.5 rounded-md ${
              activeTab === 'plantes'
                ? 'bg-emerald-800 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Mes plantes
          </button>
          <button
            onClick={() => setActiveTab('suivi')}
            className={`text-xs font-medium py-1 px-2.5 rounded-md ${
              activeTab === 'suivi'
                ? 'bg-emerald-800 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Suivi
          </button>
          <button
            onClick={() => setActiveTab('parametres')}
            className={`text-xs font-medium py-1 px-2.5 rounded-md ${
              activeTab === 'parametres'
                ? 'bg-emerald-800 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Paramètres
          </button>
        </div>
      </div>
    </header>
  );
};
