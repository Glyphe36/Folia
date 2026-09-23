/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlantProvider, usePlantContext } from './context/PlantContext';
import { Header } from './components/Header';
import { HomeTab } from './components/HomeTab';
import { PlantsTab } from './components/PlantsTab';
import { TrackingTab } from './components/TrackingTab';
import { SettingsTab } from './components/SettingsTab';
import { PlantModal } from './components/PlantModal';
import { PlantDetailModal } from './components/PlantDetailModal';
import { CareActionModal } from './components/CareActionModal';
import { NotificationToast } from './components/NotificationToast';
import { Plant } from './types/plant';

function MainAppContent() {
  const { activeTab, setActiveTab } = usePlantContext();

  // Modals state
  const [isAddPlantOpen, setIsAddPlantOpen] = useState(false);
  const [plantToEdit, setPlantToEdit] = useState<Plant | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [isQuickCareOpen, setIsQuickCareOpen] = useState(false);
  const [quickCarePlantId, setQuickCarePlantId] = useState<string | null>(null);

  const handleOpenAddPlant = () => {
    setPlantToEdit(null);
    setIsAddPlantOpen(true);
  };

  const handleEditPlant = (plant: Plant) => {
    setPlantToEdit(plant);
    setIsAddPlantOpen(true);
  };

  const handleOpenQuickCareWithPlant = (plantId: string) => {
    setQuickCarePlantId(plantId);
    setIsQuickCareOpen(true);
  };

  const handleOpenGeneralQuickCare = () => {
    setQuickCarePlantId(null);
    setIsQuickCareOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Top Header */}
      <Header
        onOpenAddPlant={handleOpenAddPlant}
        onOpenQuickCare={handleOpenGeneralQuickCare}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'accueil' && (
          <HomeTab
            onSelectPlant={(id) => setSelectedPlantId(id)}
            onOpenQuickCare={handleOpenGeneralQuickCare}
          />
        )}

        {activeTab === 'plantes' && (
          <PlantsTab
            onSelectPlant={(id) => setSelectedPlantId(id)}
            onOpenAddPlant={handleOpenAddPlant}
          />
        )}

        {activeTab === 'suivi' && (
          <TrackingTab
            onOpenQuickCare={handleOpenGeneralQuickCare}
            onSelectPlant={(id) => setSelectedPlantId(id)}
          />
        )}

        {activeTab === 'parametres' && <SettingsTab />}
      </main>

      {/* Modals & Drawers */}
      <PlantModal
        isOpen={isAddPlantOpen}
        onClose={() => {
          setIsAddPlantOpen(false);
          setPlantToEdit(null);
        }}
        plantToEdit={plantToEdit}
      />

      <PlantDetailModal
        plantId={selectedPlantId}
        onClose={() => setSelectedPlantId(null)}
        onEditPlant={handleEditPlant}
        onOpenCareWithPlant={handleOpenQuickCareWithPlant}
      />

      <CareActionModal
        isOpen={isQuickCareOpen}
        onClose={() => {
          setIsQuickCareOpen(false);
          setQuickCarePlantId(null);
        }}
        preselectedPlantId={quickCarePlantId}
      />

      {/* Floating Notifications */}
      <NotificationToast />

      {/* Clean quiet footer */}
      <footer className="mt-auto border-t border-stone-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-800">Folia</span>
            <span>—</span>
            <span>Gestionnaire d'arrosage et carnet de soins botaniques</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('accueil')}
              className="hover:text-stone-900 transition-colors"
            >
              Accueil
            </button>
            <button
              onClick={() => setActiveTab('plantes')}
              className="hover:text-stone-900 transition-colors"
            >
              Mes plantes
            </button>
            <button
              onClick={() => setActiveTab('suivi')}
              className="hover:text-stone-900 transition-colors"
            >
              Suivi
            </button>
            <button
              onClick={() => setActiveTab('parametres')}
              className="hover:text-stone-900 transition-colors"
            >
              Paramètres
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PlantProvider>
      <MainAppContent />
    </PlantProvider>
  );
}
