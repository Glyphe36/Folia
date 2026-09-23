import React, { useState } from 'react';
import { usePlantContext } from '../context/PlantContext';
import { Plant, HealthStatus } from '../types/plant';
import {
  X,
  Droplets,
  Wind,
  Sparkles,
  Heart,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Compass,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  getPlantCareStatus,
  formatRelativeDateLabel,
  formatFrenchDate,
  formatFrenchDateTime,
} from '../utils/plantCalculations';

interface PlantDetailModalProps {
  plantId: string | null;
  onClose: () => void;
  onEditPlant: (plant: Plant) => void;
  onOpenCareWithPlant: (plantId: string) => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plantId,
  onClose,
  onEditPlant,
  onOpenCareWithPlant,
}) => {
  const { plants, careLogs, toggleFavorite, quickWaterPlant, quickMistPlant, updatePlant, deletePlant } =
    usePlantContext();

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!plantId) return null;
  const plant = plants.find((p) => p.id === plantId);
  if (!plant) return null;

  const careStatus = getPlantCareStatus(plant);
  const plantLogs = careLogs.filter((l) => l.plantId === plant.id);

  const handleHealthChange = (newStatus: HealthStatus) => {
    updatePlant(plant.id, { healthStatus: newStatus });
  };

  const handleDelete = () => {
    deletePlant(plant.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Photo Header */}
        <div className="relative aspect-16/9 sm:aspect-21/9 shrink-0 bg-stone-900 overflow-hidden">
          <img
            src={plant.imageUrl}
            alt={plant.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-black/30 to-black/30" />

          {/* Top buttons */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-black/50 text-white backdrop-blur-md">
              {plant.location}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFavorite(plant.id)}
                className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                  plant.favorite ? 'bg-rose-600 text-white' : 'bg-black/40 text-white hover:bg-black/60'
                }`}
                title={plant.favorite ? 'Retirer des favoris' : 'Favori'}
              >
                <Heart className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Plant Title Overlay */}
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
              {plant.nickname ? plant.nickname : plant.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-200 mt-1">
              <span className="italic">{plant.species}</span>
              <span aria-hidden="true">·</span>
              <span>Ajoutée le {formatFrenchDate(plant.addedDate)}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Health Status & Quick Care Bar */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-stone-500 font-medium mb-1.5">État de santé actuel :</div>
              <div className="flex flex-wrap gap-1.5">
                {(['Excellente', 'Bonne', "Besoin d'attention", 'Critique'] as HealthStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleHealthChange(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      plant.healthStatus === st
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => quickWaterPlant(plant.id)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Arroser</span>
              </button>
              {plant.mistingFrequencyDays && (
                <button
                  onClick={() => quickMistPlant(plant.id)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Brumiser</span>
                </button>
              )}
              <button
                onClick={() => onOpenCareWithPlant(plant.id)}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg transition-colors"
              >
                + Soin
              </button>
            </div>
          </div>

          {/* Care Cycles Countdown Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Prochains soins programmés
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Water Card */}
              <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-sky-800 font-semibold">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    Arrosage
                  </span>
                  <span className="text-sky-950 font-mono">Tous les {plant.wateringFrequencyDays}j</span>
                </div>
                <div className="text-sm font-bold text-stone-900 mt-2">
                  {formatRelativeDateLabel(careStatus.waterDaysDiff)}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Dernier : {formatFrenchDate(plant.lastWatered)}
                </div>
              </div>

              {/* Misting Card */}
              <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-teal-800 font-semibold">
                  <span className="flex items-center gap-1">
                    <Wind className="w-4 h-4 text-teal-600" />
                    Brumisation
                  </span>
                  <span className="text-teal-950 font-mono">
                    {plant.mistingFrequencyDays ? `Tous les ${plant.mistingFrequencyDays}j` : 'Non configuré'}
                  </span>
                </div>
                <div className="text-sm font-bold text-stone-900 mt-2">
                  {careStatus.mistDaysDiff !== undefined
                    ? formatRelativeDateLabel(careStatus.mistDaysDiff)
                    : 'Optionnel'}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {plant.lastMisted ? `Dernier : ${formatFrenchDate(plant.lastMisted)}` : 'Aucun enregistrement'}
                </div>
              </div>

              {/* Fertilizer Card */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Engrais
                  </span>
                  <span className="text-amber-950 font-mono">
                    {plant.fertilizerFrequencyDays ? `Tous les ${plant.fertilizerFrequencyDays}j` : 'Non configuré'}
                  </span>
                </div>
                <div className="text-sm font-bold text-stone-900 mt-2">
                  {careStatus.fertilizerDaysDiff !== undefined
                    ? formatRelativeDateLabel(careStatus.fertilizerDaysDiff)
                    : 'Optionnel'}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {plant.lastFertilized ? `Dernier : ${formatFrenchDate(plant.lastFertilized)}` : 'Aucun apport noté'}
                </div>
              </div>
            </div>
          </div>

          {/* Plant Specifications & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-stone-700">Caractéristiques</h4>
              <div className="text-xs space-y-1.5 text-stone-600">
                <div className="flex justify-between">
                  <span className="text-stone-400">Emplacement :</span>
                  <span className="font-semibold text-stone-800">{plant.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Luminosité :</span>
                  <span className="font-semibold text-stone-800">{plant.lightRequirement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Taille du pot :</span>
                  <span className="font-semibold text-stone-800">{plant.potSizeCm ? `${plant.potSizeCm} cm` : 'Non précisé'}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-stone-700 mb-1.5">Notes & Conseils</h4>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                {plant.notes || "Aucune note particulière d'entretien ajoutée."}
              </p>
            </div>
          </div>

          {/* History of care for this plant */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Historique des soins pour cette plante
              </h3>
              <span className="text-xs text-stone-400 tabular-nums">
                {plantLogs.length} action{plantLogs.length > 1 ? 's' : ''}
              </span>
            </div>

            {plantLogs.length === 0 ? (
              <p className="text-xs text-stone-500 py-3 text-center bg-stone-50 rounded-xl border border-stone-200">
                Aucun soin enregistré pour l'instant. Utilisez les boutons du haut pour noter un premier arrosage.
              </p>
            ) : (
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                {plantLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-md bg-stone-100 font-medium">
                        {log.type === 'arrosage' && <Droplets className="w-3.5 h-3.5 text-sky-600" />}
                        {log.type === 'brumisation' && <Wind className="w-3.5 h-3.5 text-teal-600" />}
                        {log.type === 'engrais' && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                        {log.type !== 'arrosage' && log.type !== 'brumisation' && log.type !== 'engrais' && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </span>
                      <div>
                        <div className="font-semibold text-stone-800 capitalize">{log.type}</div>
                        {log.amountOrDetails && (
                          <div className="text-[11px] text-stone-400">{log.amountOrDetails}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-stone-700 font-medium">{log.performedBy}</div>
                      <div className="text-[10px] text-stone-400 tabular-nums">
                        {formatFrenchDateTime(log.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Edit / Delete */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between shrink-0">
          <div>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer la plante
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-700 font-semibold">Confirmer la suppression ?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-700"
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-200 rounded-md"
                >
                  Non
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditPlant(plant);
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Modifier
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
