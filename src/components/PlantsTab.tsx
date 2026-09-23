import React, { useState, useMemo } from 'react';
import { usePlantContext } from '../context/PlantContext';
import {
  Search,
  Plus,
  SlidersHorizontal,
  Droplets,
  Wind,
  Sun,
  Heart,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { Plant } from '../types/plant';
import {
  getPlantCareStatus,
  formatRelativeDateLabel,
  formatFrenchDate,
} from '../utils/plantCalculations';

interface PlantsTabProps {
  onSelectPlant: (plantId: string) => void;
  onOpenAddPlant: () => void;
}

export const PlantsTab: React.FC<PlantsTabProps> = ({ onSelectPlant, onOpenAddPlant }) => {
  const { plants, toggleFavorite, quickWaterPlant, quickMistPlant } = usePlantContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Tous');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'due' | 'overdue' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'care' | 'name' | 'location' | 'recent'>('care');

  // Compute all available locations from plant dataset
  const availableLocations = useMemo(() => {
    const locs = Array.from(new Set(plants.map((p) => p.location))).filter(Boolean);
    return ['Tous', ...locs];
  }, [plants]);

  // Filter & sort logic
  const filteredPlants = useMemo(() => {
    return plants
      .filter((plant) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = plant.name.toLowerCase().includes(q);
          const matchSpecies = plant.species.toLowerCase().includes(q);
          const matchNickname = plant.nickname?.toLowerCase().includes(q);
          const matchLocation = plant.location.toLowerCase().includes(q);
          if (!matchName && !matchSpecies && !matchNickname && !matchLocation) return false;
        }

        // Location filter
        if (selectedLocation !== 'Tous' && plant.location !== selectedLocation) {
          return false;
        }

        // Status filter
        const status = getPlantCareStatus(plant);
        if (selectedFilter === 'due' && status.waterDaysDiff > 0) {
          return false;
        }
        if (selectedFilter === 'overdue' && status.waterDaysDiff >= 0) {
          return false;
        }
        if (selectedFilter === 'favorites' && !plant.favorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'location') {
          return a.location.localeCompare(b.location);
        }
        if (sortBy === 'recent') {
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        }
        // default: care (most urgent next watering first)
        const statusA = getPlantCareStatus(a);
        const statusB = getPlantCareStatus(b);
        return statusA.waterDaysDiff - statusB.waterDaysDiff;
      });
  }, [plants, searchQuery, selectedLocation, selectedFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header controls: Search & Quick actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Mes plantes</h1>
          <p className="text-xs text-stone-500 mt-1">
            {plants.length} plantes répertoriées · Filtrez par pièce ou besoin d'arrosage
          </p>
        </div>

        <button
          onClick={onOpenAddPlant}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Ajouter une plante
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, surnom ou espèce..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
            />
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500 whitespace-nowrap">Trier par :</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-700"
            >
              <option value="care">Urgence arrosage</option>
              <option value="name">Nom alphabétique</option>
              <option value="location">Emplacement</option>
              <option value="recent">Récemment ajoutée</option>
            </select>
          </div>
        </div>

        {/* Emplacement Filters (Segmented Control Buttons) */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-stone-500 mr-1.5">Emplacement :</span>
          {availableLocations.map((loc) => {
            const count = loc === 'Tous' ? plants.length : plants.filter((p) => p.location === loc).length;
            const isActive = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {loc} <span className="text-[11px] opacity-75 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Care Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-medium text-stone-500 mr-1.5">Statut :</span>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-stone-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setSelectedFilter('due')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              selectedFilter === 'due'
                ? 'bg-sky-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            À arroser
          </button>
          <button
            onClick={() => setSelectedFilter('overdue')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              selectedFilter === 'overdue'
                ? 'bg-amber-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            En retard
          </button>
          <button
            onClick={() => setSelectedFilter('favorites')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              selectedFilter === 'favorites'
                ? 'bg-rose-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Favoris
          </button>
        </div>
      </div>

      {/* Plant Cards Grid */}
      {filteredPlants.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">Aucune plante trouvée</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Aucune plante ne correspond à vos filtres actuels. Modifiez la recherche ou l'emplacement sélectionné.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLocation('Tous');
              setSelectedFilter('all');
            }}
            className="mt-4 px-3.5 py-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPlants.map((plant) => {
            const careStatus = getPlantCareStatus(plant);
            const isDueToday = careStatus.waterDaysDiff === 0;
            const isOverdue = careStatus.waterDaysDiff < 0;

            return (
              <div
                key={plant.id}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col group"
              >
                {/* Photo container */}
                <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                  <img
                    src={plant.imageUrl}
                    alt={plant.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />

                  {/* Gradient scrim for top buttons */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10 pointer-events-none" />

                  {/* Heart favorite button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(plant.id);
                    }}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                      plant.favorite
                        ? 'bg-rose-500 text-white'
                        : 'bg-black/30 text-white/90 hover:bg-black/50'
                    }`}
                    title={plant.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>

                  {/* Location badge on photo */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/50 text-white backdrop-blur-md">
                    {plant.location}
                  </div>

                  {/* Health status badge */}
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-semibold backdrop-blur-md bg-white/90 text-stone-800 shadow-xs">
                    {plant.healthStatus}
                  </div>
                </div>

                {/* Content body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Plant Titles */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3
                        onClick={() => onSelectPlant(plant.id)}
                        className="font-serif text-lg font-bold text-stone-900 hover:text-emerald-800 cursor-pointer truncate"
                      >
                        {plant.nickname ? plant.nickname : plant.name}
                      </h3>
                    </div>
                    {plant.nickname && (
                      <div className="text-xs text-stone-500 italic truncate -mt-0.5">
                        {plant.name}
                      </div>
                    )}

                    {/* Unboxed Metadata (Rules: Zero Pill for static metadata) */}
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-2">
                      <span>Tous les {plant.wateringFrequencyDays}j</span>
                      <span aria-hidden="true">·</span>
                      <span>{plant.lightRequirement}</span>
                      {plant.potSizeCm && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Pot {plant.potSizeCm}cm</span>
                        </>
                      )}
                    </div>

                    {/* Next watering schedule status */}
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5 text-sky-600" />
                          Prochain arrosage
                        </span>
                        <span
                          className={`font-semibold tabular-nums ${
                            isOverdue
                              ? 'text-amber-700'
                              : isDueToday
                              ? 'text-sky-700'
                              : 'text-stone-700'
                          }`}
                        >
                          {formatRelativeDateLabel(careStatus.waterDaysDiff)}
                        </span>
                      </div>

                      {/* Mini progress line indicator */}
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full rounded-full ${
                            isOverdue
                              ? 'bg-amber-500'
                              : isDueToday
                              ? 'bg-sky-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{
                            width: `${Math.max(
                              10,
                              Math.min(
                                100,
                                ((plant.wateringFrequencyDays - Math.max(0, careStatus.waterDaysDiff)) /
                                  plant.wateringFrequencyDays) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => quickWaterPlant(plant.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                        title="Arroser maintenant"
                      >
                        <Droplets className="w-3 h-3 text-emerald-700" />
                        <span>Arroser</span>
                      </button>

                      {plant.mistingFrequencyDays && (
                        <button
                          onClick={() => quickMistPlant(plant.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1"
                          title="Brumiser le feuillage"
                        >
                          <Wind className="w-3 h-3 text-teal-700" />
                          <span>Brumiser</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectPlant(plant.id)}
                      className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Voir la fiche détaillée"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
