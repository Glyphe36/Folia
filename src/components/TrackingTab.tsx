import React, { useState, useMemo } from 'react';
import { usePlantContext } from '../context/PlantContext';
import {
  Droplets,
  Wind,
  Sparkles,
  Scissors,
  Layers,
  Sparkle,
  Plus,
  Trash2,
  Filter,
  Calendar,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { CareType } from '../types/plant';
import { formatFrenchDateTime } from '../utils/plantCalculations';

interface TrackingTabProps {
  onOpenQuickCare: () => void;
  onSelectPlant: (plantId: string) => void;
}

export const TrackingTab: React.FC<TrackingTabProps> = ({ onOpenQuickCare, onSelectPlant }) => {
  const { careLogs, plants, users, deleteCareLog } = usePlantContext();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Filter logs
  const filteredLogs = useMemo(() => {
    return careLogs.filter((log) => {
      if (selectedType !== 'all' && log.type !== selectedType) return false;
      if (selectedPlantId !== 'all' && log.plantId !== selectedPlantId) return false;
      if (selectedUser !== 'all' && log.performedBy !== selectedUser) return false;
      return true;
    });
  }, [careLogs, selectedType, selectedPlantId, selectedUser]);

  // Statistics
  const totalLogs = careLogs.length;
  const wateringCount = careLogs.filter((l) => l.type === 'arrosage').length;
  const mistingCount = careLogs.filter((l) => l.type === 'brumisation').length;
  const fertilizerCount = careLogs.filter((l) => l.type === 'engrais').length;
  const otherCount = totalLogs - (wateringCount + mistingCount + fertilizerCount);

  const getCareIcon = (type: CareType) => {
    switch (type) {
      case 'arrosage':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'brumisation':
        return <Wind className="w-4 h-4 text-teal-600" />;
      case 'engrais':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'rempotage':
        return <Layers className="w-4 h-4 text-amber-800" />;
      case 'taille':
        return <Scissors className="w-4 h-4 text-stone-600" />;
      case 'nettoyage':
        return <Sparkle className="w-4 h-4 text-emerald-600" />;
      default:
        return <Droplets className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getCareLabel = (type: CareType) => {
    const labels: Record<CareType, string> = {
      arrosage: 'Arrosage',
      brumisation: 'Brumisation',
      engrais: 'Engrais',
      rempotage: 'Rempotage',
      taille: 'Taille',
      nettoyage: 'Nettoyage',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Suivi des soins</h1>
          <p className="text-xs text-stone-500 mt-1">
            Historique complet des arrosages, brumisations, apports d'engrais et entretiens.
          </p>
        </div>

        <button
          onClick={onOpenQuickCare}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Enregistrer un soin
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">Total des soins</span>
            <CheckCircle className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-stone-900 tabular-nums mt-1">{totalLogs}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Toutes interventions confondues</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">Arrosages</span>
            <Droplets className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 tabular-nums mt-1">{wateringCount}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">
            {totalLogs > 0 ? `${Math.round((wateringCount / totalLogs) * 100)}% des soins` : '0%'}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">Brumisations</span>
            <Wind className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 tabular-nums mt-1">{mistingCount}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Hydratation foliaire</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">Fertilisations</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 tabular-nums mt-1">{fertilizerCount}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Nutrition & engrais</div>
        </div>
      </div>

      {/* Breakdown distribution progress bar */}
      {totalLogs > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-medium">Répartition des types de soins</span>
            <span className="text-stone-400 tabular-nums">{totalLogs} interventions</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-stone-100 flex overflow-hidden">
            <div
              className="bg-sky-500 h-full"
              style={{ width: `${(wateringCount / totalLogs) * 100}%` }}
              title={`Arrosages: ${wateringCount}`}
            />
            <div
              className="bg-teal-500 h-full"
              style={{ width: `${(mistingCount / totalLogs) * 100}%` }}
              title={`Brumisations: ${mistingCount}`}
            />
            <div
              className="bg-amber-500 h-full"
              style={{ width: `${(fertilizerCount / totalLogs) * 100}%` }}
              title={`Engrais: ${fertilizerCount}`}
            />
            <div
              className="bg-stone-400 h-full"
              style={{ width: `${(otherCount / totalLogs) * 100}%` }}
              title={`Autres: ${otherCount}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Arrosages ({wateringCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>Brumisations ({mistingCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Engrais ({fertilizerCount})</span>
            </div>
            {otherCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                <span>Autres ({otherCount})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Care Type Filter */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Type de soin</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-700"
            >
              <option value="all">Tous les types</option>
              <option value="arrosage">Arrosage</option>
              <option value="brumisation">Brumisation</option>
              <option value="engrais">Engrais</option>
              <option value="rempotage">Rempotage</option>
              <option value="taille">Taille</option>
              <option value="nettoyage">Nettoyage</option>
            </select>
          </div>

          {/* Plant Filter */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Plante ciblée</label>
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-700"
            >
              <option value="all">Toutes les plantes</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname ? `${p.nickname} (${p.name})` : p.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Soigné par</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-700"
            >
              <option value="all">Tous les utilisateurs</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedType !== 'all' || selectedPlantId !== 'all' || selectedUser !== 'all') && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedPlantId('all');
                setSelectedUser('all');
              }}
              className="text-xs text-stone-500 hover:text-stone-800 underline"
            >
              Effacer les filtres ({filteredLogs.length} résultat{filteredLogs.length > 1 ? 's' : ''})
            </button>
          </div>
        )}
      </div>

      {/* Care History Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-stone-900">Aucun historique correspondant</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Aucune action de soin ne correspond aux critères de filtre sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/75 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Plante</th>
                  <th className="py-3 px-4">Soin</th>
                  <th className="py-3 px-4">Détails / Volume</th>
                  <th className="py-3 px-4">Effectué par</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredLogs.map((log) => {
                  const plant = plants.find((p) => p.id === log.plantId);
                  return (
                    <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 text-stone-600 tabular-nums whitespace-nowrap font-medium">
                        {formatFrenchDateTime(log.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onSelectPlant(log.plantId)}
                          className="font-semibold text-stone-900 hover:text-emerald-800 transition-colors"
                        >
                          {log.plantName}
                        </button>
                        {plant && (
                          <div className="text-[11px] text-stone-400">{plant.location}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {getCareIcon(log.type)}
                          <span className="font-medium text-stone-800">{getCareLabel(log.type)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                        {log.amountOrDetails || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-stone-700">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                          {log.performedBy}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
                        {log.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => deleteCareLog(log.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                          title="Supprimer cette entrée"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
