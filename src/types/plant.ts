export type CareType = 'arrosage' | 'brumisation' | 'engrais' | 'rempotage' | 'taille' | 'nettoyage';

export type LightLevel = 'Faible' | 'Lumière indirecte' | 'Lumière vive' | 'Soleil direct';

export type HealthStatus = 'Excellente' | 'Bonne' | 'Besoin d\'attention' | 'Critique';

export interface Plant {
  id: string;
  name: string;
  nickname?: string;
  species: string;
  location: string; // e.g. "Salon", "Chambre", "Bureau", "Balcon", "Cuisine", "Salle de bain"
  lightRequirement: LightLevel;
  wateringFrequencyDays: number;
  mistingFrequencyDays?: number;
  fertilizerFrequencyDays?: number;
  lastWatered: string; // ISO date string
  lastFertilized?: string;
  lastMisted?: string;
  imageUrl: string;
  healthStatus: HealthStatus;
  notes: string;
  potSizeCm?: number;
  addedDate: string;
  favorite?: boolean;
}

export interface CareLog {
  id: string;
  plantId: string;
  plantName: string;
  type: CareType;
  date: string; // ISO date string
  performedBy: string; // User name
  amountOrDetails?: string; // e.g., "250 ml", "Brumisation du feuillage", "1/2 dose engrais vert"
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'Principal' | 'Secondaire' | 'Invité';
  avatarBg: string;
}

export interface ReminderPreferences {
  enabled: boolean;
  reminderTime: string; // "09:00"
  selectedDays: string[]; // ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  notifyWatering: boolean;
  notifyMisting: boolean;
  notifyFertilizer: boolean;
  soundAlerts: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  autoAdjustSeason: boolean;
}

export interface DailyCheckItem {
  id: string;
  plantId: string;
  plantName: string;
  plantLocation: string;
  careType: CareType;
  dueDate: string;
  isOverdue: boolean;
  daysDiff: number; // 0 for today, < 0 for overdue, > 0 for upcoming
  completed: boolean;
}
