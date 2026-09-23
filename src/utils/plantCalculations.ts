import { Plant, CareType, DailyCheckItem } from '../types/plant';

// Fixed simulated reference date or current date
export const getReferenceDate = (): Date => {
  // Use today's realistic date
  return new Date();
};

export const getDaysDifference = (targetDate: Date, baseDate: Date = getReferenceDate()): number => {
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const diffTime = target.getTime() - base.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateNextCareDate = (lastCareIso: string, frequencyDays: number): Date => {
  const lastDate = new Date(lastCareIso);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + frequencyDays);
  return nextDate;
};

export interface PlantCareStatus {
  nextWaterDate: Date;
  waterDaysDiff: number; // < 0 overdue, 0 today, > 0 future
  waterDueState: 'overdue' | 'today' | 'upcoming';
  nextMistDate?: Date;
  mistDaysDiff?: number;
  mistDueState?: 'overdue' | 'today' | 'upcoming';
  nextFertilizerDate?: Date;
  fertilizerDaysDiff?: number;
  fertilizerDueState?: 'overdue' | 'today' | 'upcoming';
}

export const getPlantCareStatus = (plant: Plant): PlantCareStatus => {
  const now = getReferenceDate();
  
  // Water
  const nextWaterDate = calculateNextCareDate(plant.lastWatered, plant.wateringFrequencyDays);
  const waterDaysDiff = getDaysDifference(nextWaterDate, now);
  const waterDueState: 'overdue' | 'today' | 'upcoming' =
    waterDaysDiff < 0 ? 'overdue' : waterDaysDiff === 0 ? 'today' : 'upcoming';

  // Mist
  let nextMistDate: Date | undefined;
  let mistDaysDiff: number | undefined;
  let mistDueState: 'overdue' | 'today' | 'upcoming' | undefined;
  if (plant.mistingFrequencyDays && plant.lastMisted) {
    nextMistDate = calculateNextCareDate(plant.lastMisted, plant.mistingFrequencyDays);
    mistDaysDiff = getDaysDifference(nextMistDate, now);
    mistDueState = mistDaysDiff < 0 ? 'overdue' : mistDaysDiff === 0 ? 'today' : 'upcoming';
  }

  // Fertilizer
  let nextFertilizerDate: Date | undefined;
  let fertilizerDaysDiff: number | undefined;
  let fertilizerDueState: 'overdue' | 'today' | 'upcoming' | undefined;
  if (plant.fertilizerFrequencyDays && plant.lastFertilized) {
    nextFertilizerDate = calculateNextCareDate(plant.lastFertilized, plant.fertilizerFrequencyDays);
    fertilizerDaysDiff = getDaysDifference(nextFertilizerDate, now);
    fertilizerDueState = fertilizerDaysDiff < 0 ? 'overdue' : fertilizerDaysDiff === 0 ? 'today' : 'upcoming';
  }

  return {
    nextWaterDate,
    waterDaysDiff,
    waterDueState,
    nextMistDate,
    mistDaysDiff,
    mistDueState,
    nextFertilizerDate,
    fertilizerDaysDiff,
    fertilizerDueState,
  };
};

export const formatRelativeDateLabel = (daysDiff: number): string => {
  if (daysDiff < -1) return `En retard de ${Math.abs(daysDiff)} jours`;
  if (daysDiff === -1) return 'En retard d\'un jour';
  if (daysDiff === 0) return 'Aujourd\'hui';
  if (daysDiff === 1) return 'Demain';
  return `Dans ${daysDiff} jours`;
};

export const formatFrenchDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
};

export const formatFrenchDateTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
};

export const generateTodayChecks = (plants: Plant[]): DailyCheckItem[] => {
  const items: DailyCheckItem[] = [];

  plants.forEach((plant) => {
    const status = getPlantCareStatus(plant);

    // Watering check: due if today or overdue
    if (status.waterDaysDiff <= 0) {
      items.push({
        id: `check-${plant.id}-arrosage`,
        plantId: plant.id,
        plantName: plant.nickname ? `${plant.nickname} (${plant.name})` : plant.name,
        plantLocation: plant.location,
        careType: 'arrosage',
        dueDate: status.nextWaterDate.toISOString(),
        isOverdue: status.waterDaysDiff < 0,
        daysDiff: status.waterDaysDiff,
        completed: false,
      });
    }

    // Misting check: due if misting is configured and due/overdue
    if (status.mistDaysDiff !== undefined && status.mistDaysDiff <= 0) {
      items.push({
        id: `check-${plant.id}-brumisation`,
        plantId: plant.id,
        plantName: plant.nickname ? `${plant.nickname} (${plant.name})` : plant.name,
        plantLocation: plant.location,
        careType: 'brumisation',
        dueDate: status.nextMistDate!.toISOString(),
        isOverdue: status.mistDaysDiff < 0,
        daysDiff: status.mistDaysDiff,
        completed: false,
      });
    }

    // Fertilizer check: due if fertilizer is configured and due/overdue
    if (status.fertilizerDaysDiff !== undefined && status.fertilizerDaysDiff <= 0) {
      items.push({
        id: `check-${plant.id}-engrais`,
        plantId: plant.id,
        plantName: plant.nickname ? `${plant.nickname} (${plant.name})` : plant.name,
        plantLocation: plant.location,
        careType: 'engrais',
        dueDate: status.nextFertilizerDate!.toISOString(),
        isOverdue: status.fertilizerDaysDiff < 0,
        daysDiff: status.fertilizerDaysDiff,
        completed: false,
      });
    }
  });

  // Sort: overdue first, then by plant name
  return items.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.daysDiff - b.daysDiff;
  });
};
