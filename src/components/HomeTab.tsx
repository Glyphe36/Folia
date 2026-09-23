import React from 'react';
import { usePlantContext } from '../context/PlantContext';
import {
  Droplets,
  Wind,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  Heart,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { BOTANICAL_TIPS } from '../data/initialData';
import { formatFrenchDate, formatFrenchDateTime } from '../utils/plantCalculations';

interface HomeTabProps {
  onSelectPlant: (plantId: string) => void;
  onOpenQuickCare: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onSelectPlant, onOpenQuickCare }) => {
  const {
    plants,
    careLogs,
    currentUser,
    todayChecks,
    completeTodayCheck,
    setActiveTab,
    quickWaterPlant,
    quickMistPlant,
  } = usePlantContext();

  const totalPlants = plants.length;
  const pendingChecks = todayChecks.filter((c) => !c.completed);
  const completedChecks = todayChecks.filter((c) => c.completed);
  const completionPercentage =
    todayChecks.length > 0
      ? Math.round((completedChecks.length / todayChecks.length) * 100)
      : 100;

  const healthyPlantsCount = plants.filter(
    (p) => p.healthStatus === 'Excellente' || p.healthStatus === 'Bonne'
  ).length;

  // Recent activity: top 6 logs
  const recentLogs = careLogs.slice(0, 6);

  // Today tip based on day of month
  const tipIndex = new Date().getDate() % BOTANICAL_TIPS.length;
  const todayTip = BOTANICAL_TIPS[tipIndex];

  const getCareIcon = (type: string) => {
    switch (type) {
      case 'arrosage':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'brumisation':
        return <Wind className="w-4 h-4 text-teal-600" />;
      case 'engrais':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      default:
        return <Droplets className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getCareLabel = (type: string) => {
    switch (type) {
      case 'arrosage':
        return 'Arrosage';
      case 'brumisation':
        return 'Brumisation';
      case 'engrais':
        return 'Apport d\'engrais';
      case 'rempotage':
        return 'Rempotage';
      case 'taille':
        return 'Taille';
      case 'nettoyage':
        return 'Nettoyage';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Snapshot */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Tableau de bord quotidien
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Bonjour, {currentUser.name}
            </h1>
            <p className="text-sm text-stone-600 mt-1 max-w-xl">
              Voici le récapitulatif des soins nécessaires pour maintenir vos {totalPlants} plantes en parfaite santé aujourd'hui.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3">
              <div className="text-xs text-stone-500">Collection</div>
              <div className="text-xl font-bold text-stone-900 tabular-nums mt-0.5">
                {totalPlants} <span className="text-xs font-normal text-stone-500">plantes</span>
              </div>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3">
              <div className="text-xs text-stone-500">À soigner</div>
              <div className="text-xl font-bold text-stone-900 tabular-nums mt-0.5">
                {pendingChecks.length}{' '}
                <span className="text-xs font-normal text-stone-500">
                  {pendingChecks.length > 1 ? 'soins' : 'soin'}
                </span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-stone-50 border border-stone-200/80 rounded-lg p-3">
              <div className="text-xs text-stone-500">Santé globale</div>
              <div className="text-xl font-bold text-emerald-800 tabular-nums mt-0.5">
                {healthyPlantsCount}/{totalPlants}{' '}
                <span className="text-xs font-normal text-stone-500">vigoureuses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar of today checks */}
        {todayChecks.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-stone-600 font-medium">Progression des vérifications du jour</span>
              <span className="text-stone-700 font-semibold tabular-nums">
                {completedChecks.length} sur {todayChecks.length} terminées ({completionPercentage}%)
              </span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Main Grid: Left = Vérifications du jour, Right = Activité récente & Conseil */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Vérifications du jour */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900">Vérifications du jour</h2>
              {pendingChecks.length > 0 && (
                <span className="text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-medium">
                  {pendingChecks.length} en attente
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTab('plantes')}
              className="text-xs font-medium text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
            >
              Voir toutes les plantes
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayChecks.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-stone-900">Tout est à jour !</h3>
              <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto">
                Aucun arrosage ni soin n'est requis aujourd'hui. Vos plantes profitent de leur cycle régulier.
              </p>
              <button
                onClick={onOpenQuickCare}
                className="mt-4 px-4 py-2 text-xs font-medium text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Enregistrer un soin spontané
              </button>
            </div>
          ) : pendingChecks.length === 0 ? (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-emerald-950">
                Bravo ! Toutes les vérifications sont complétées
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Toutes les plantes prévues pour aujourd'hui ont reçu leurs soins.
              </p>
            </div>
          ) : null}

          {/* List of checks */}
          <div className="space-y-2.5">
            {todayChecks.map((check) => {
              const plant = plants.find((p) => p.id === check.plantId);
              return (
                <div
                  key={check.id}
                  className={`bg-white border rounded-xl p-4 transition-all duration-150 ${
                    check.completed
                      ? 'border-stone-200/60 opacity-60 bg-stone-50/50'
                      : check.isOverdue
                      ? 'border-amber-300 shadow-xs'
                      : 'border-stone-200 hover:border-emerald-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Checkbox circle */}
                      <button
                        onClick={() => completeTodayCheck(check.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          check.completed
                            ? 'bg-emerald-700 text-white'
                            : 'border-2 border-stone-300 hover:border-emerald-700 text-transparent'
                        }`}
                        title={check.completed ? 'Marquer comme non fait' : 'Valider ce soin'}
                      >
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                      </button>

                      {/* Plant Image Thumbnail */}
                      {plant && (
                        <div
                          onClick={() => onSelectPlant(plant.id)}
                          className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-stone-200 cursor-pointer"
                        >
                          <img
                            src={plant.imageUrl}
                            alt={plant.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => plant && onSelectPlant(plant.id)}
                            className="text-sm font-semibold text-stone-900 hover:text-emerald-800 truncate text-left"
                          >
                            {check.plantName}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <span>{check.plantLocation}</span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1">
                            {getCareIcon(check.careType)}
                            <span className="capitalize">{getCareLabel(check.careType)}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              check.isOverdue
                                ? 'text-amber-700 font-semibold'
                                : 'text-stone-600'
                            }
                          >
                            {check.isOverdue
                              ? `En retard (${Math.abs(check.daysDiff)}j)`
                              : 'Aujourd\'hui'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Button */}
                    {!check.completed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {check.careType === 'arrosage' && (
                          <button
                            onClick={() => quickWaterPlant(check.plantId)}
                            className="px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <Droplets className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Arroser</span>
                          </button>
                        )}
                        {check.careType === 'brumisation' && (
                          <button
                            onClick={() => quickMistPlant(check.plantId)}
                            className="px-3 py-1.5 text-xs font-medium text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <Wind className="w-3.5 h-3.5 text-teal-700" />
                            <span>Brumiser</span>
                          </button>
                        )}
                        {check.careType === 'engrais' && (
                          <button
                            onClick={() => completeTodayCheck(check.id)}
                            className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                            <span>Fertiliser</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Activité récente & Conseil de saison */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section: Activité récente */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900">Activité récente</h2>
              <button
                onClick={() => setActiveTab('suivi')}
                className="text-xs font-medium text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                Journal complet
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">
                Aucun soin enregistré pour l'instant.
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {recentLogs.map((log) => {
                  return (
                    <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-stone-100 shrink-0">
                        {getCareIcon(log.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-stone-800">
                          <span className="font-semibold text-stone-900">{log.performedBy}</span> a{' '}
                          {log.type === 'arrosage'
                            ? 'arrosé'
                            : log.type === 'brumisation'
                            ? 'brumisé'
                            : log.type === 'engrais'
                            ? 'fertilisé'
                            : log.type === 'rempotage'
                            ? 'rempoté'
                            : log.type === 'nettoyage'
                            ? 'nettoyé'
                            : 'soigné'}{' '}
                          <button
                            onClick={() => onSelectPlant(log.plantId)}
                            className="font-medium text-emerald-800 hover:underline"
                          >
                            {log.plantName}
                          </button>
                        </div>
                        {log.amountOrDetails && (
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {log.amountOrDetails}
                          </div>
                        )}
                        <div className="text-[11px] text-stone-400 mt-1 tabular-nums">
                          {formatFrenchDateTime(log.date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Conseil Botanique du Jour */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-5">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Conseil botanique</span>
            </div>
            <h3 className="font-serif text-base font-bold text-amber-950 mt-1.5">
              {todayTip.title}
            </h3>
            <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
              {todayTip.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
