import { Plant, CareLog, UserProfile, ReminderPreferences } from '../types/plant';
import monsteraImg from '../assets/images/plant_monstera_1790158839834.jpg';
import ficusImg from '../assets/images/plant_ficus_1790158853624.jpg';
import snakeImg from '../assets/images/plant_snake_1790158866750.jpg';
import calatheaImg from '../assets/images/plant_calathea_1790158886546.jpg';

export const PRESET_IMAGES = [
  { label: 'Monstera Deliciosa', url: monsteraImg },
  { label: 'Ficus Lyrata', url: ficusImg },
  { label: 'Sansevieria', url: snakeImg },
  { label: 'Calathea Orbifolia', url: calatheaImg },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-1',
    name: 'Robin',
    role: 'Principal',
    avatarBg: 'bg-emerald-600',
  },
  {
    id: 'user-2',
    name: 'Camille',
    role: 'Secondaire',
    avatarBg: 'bg-amber-600',
  },
  {
    id: 'user-3',
    name: 'Alexandre',
    role: 'Invité',
    avatarBg: 'bg-teal-600',
  },
];

export const INITIAL_PREFERENCES: ReminderPreferences = {
  enabled: true,
  reminderTime: '08:30',
  selectedDays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  notifyWatering: true,
  notifyMisting: true,
  notifyFertilizer: true,
  soundAlerts: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:30',
  autoAdjustSeason: true,
};

// Current date simulated around 2026-09-23
const todayIso = '2026-09-23T08:00:00.000Z';
const twoDaysAgo = '2026-09-21T09:30:00.000Z';
const fourDaysAgo = '2026-09-19T14:15:00.000Z';
const sevenDaysAgo = '2026-09-16T11:00:00.000Z';
const tenDaysAgo = '2026-09-13T10:00:00.000Z';
const fourteenDaysAgo = '2026-09-09T18:20:00.000Z';

export const INITIAL_PLANTS: Plant[] = [
  {
    id: 'plant-1',
    name: 'Monstera Deliciosa',
    nickname: 'Monty',
    species: 'Monstera deliciosa',
    location: 'Salon',
    lightRequirement: 'Lumière indirecte',
    wateringFrequencyDays: 7,
    mistingFrequencyDays: 3,
    fertilizerFrequencyDays: 30,
    lastWatered: sevenDaysAgo, // Due today!
    lastFertilized: fourteenDaysAgo,
    lastMisted: twoDaysAgo,
    imageUrl: monsteraImg,
    healthStatus: 'Excellente',
    notes: 'Aime que la terre sèche légèrement en surface entre deux arrosages. Nettoyer les feuilles mensuellement.',
    potSizeCm: 24,
    addedDate: '2025-04-12',
    favorite: true,
  },
  {
    id: 'plant-2',
    name: 'Ficus Lyrata',
    nickname: 'Figgy',
    species: 'Ficus lyrata',
    location: 'Salon',
    lightRequirement: 'Lumière vive',
    wateringFrequencyDays: 8,
    mistingFrequencyDays: 4,
    fertilizerFrequencyDays: 30,
    lastWatered: tenDaysAgo, // Overdue by 2 days!
    lastFertilized: fourteenDaysAgo,
    lastMisted: fourDaysAgo,
    imageUrl: ficusImg,
    healthStatus: 'Bonne',
    notes: 'Attention aux courants d\'air froids. Ne pas déplacer trop souvent pour éviter la chute des feuilles.',
    potSizeCm: 28,
    addedDate: '2025-06-18',
    favorite: true,
  },
  {
    id: 'plant-3',
    name: 'Sansevieria Trifasciata',
    nickname: 'Zelda',
    species: 'Sansevieria trifasciata',
    location: 'Bureau',
    lightRequirement: 'Faible',
    wateringFrequencyDays: 18,
    fertilizerFrequencyDays: 60,
    lastWatered: fourDaysAgo, // Healthy, due in 14 days
    lastFertilized: '2026-08-10T10:00:00.000Z',
    imageUrl: snakeImg,
    healthStatus: 'Excellente',
    notes: 'Très robuste, supporte l\'oubli d\'arrosage. Ne jamais laisser d\'eau stagner au fond de la soucoupe.',
    potSizeCm: 18,
    addedDate: '2025-01-05',
    favorite: false,
  },
  {
    id: 'plant-4',
    name: 'Calathea Orbifolia',
    nickname: 'Aura',
    species: 'Calathea orbifolia',
    location: 'Chambre',
    lightRequirement: 'Lumière indirecte',
    wateringFrequencyDays: 5,
    mistingFrequencyDays: 2,
    fertilizerFrequencyDays: 30,
    lastWatered: twoDaysAgo, // Due in 3 days, misting due today
    lastFertilized: '2026-09-01T10:00:00.000Z',
    lastMisted: twoDaysAgo,
    imageUrl: calatheaImg,
    healthStatus: 'Besoin d\'attention',
    notes: 'Exige une hygrométrie élevée. N\'utiliser que de l\'eau filtrée ou osmosée pour éviter le bout des feuilles marron.',
    potSizeCm: 20,
    addedDate: '2025-09-02',
    favorite: true,
  },
];

export const INITIAL_CARE_LOGS: CareLog[] = [
  {
    id: 'log-1',
    plantId: 'plant-1',
    plantName: 'Monstera Deliciosa',
    type: 'arrosage',
    date: sevenDaysAgo,
    performedBy: 'Robin',
    amountOrDetails: '400 ml d\'eau tempérée',
    notes: 'Terre bien drainée, très bon développement racinaire.',
  },
  {
    id: 'log-2',
    plantId: 'plant-4',
    plantName: 'Calathea Orbifolia',
    type: 'brumisation',
    date: twoDaysAgo,
    performedBy: 'Camille',
    amountOrDetails: 'Eau osmosée fine',
    notes: 'Feuilles bien hydratées ce matin.',
  },
  {
    id: 'log-3',
    plantId: 'plant-3',
    plantName: 'Sansevieria Trifasciata',
    type: 'arrosage',
    date: fourDaysAgo,
    performedBy: 'Robin',
    amountOrDetails: '200 ml',
    notes: 'Arrosage léger de routine.',
  },
  {
    id: 'log-4',
    plantId: 'plant-2',
    plantName: 'Ficus Lyrata',
    type: 'nettoyage',
    date: fourDaysAgo,
    performedBy: 'Alexandre',
    amountOrDetails: 'Dépoussiérage au chiffon microfibre humide',
    notes: 'Toutes les grandes feuilles ont été nettoyées.',
  },
  {
    id: 'log-5',
    plantId: 'plant-1',
    plantName: 'Monstera Deliciosa',
    type: 'brumisation',
    date: twoDaysAgo,
    performedBy: 'Robin',
    amountOrDetails: 'Brumisation matinale',
  },
  {
    id: 'log-6',
    plantId: 'plant-1',
    plantName: 'Monstera Deliciosa',
    type: 'engrais',
    date: fourteenDaysAgo,
    performedBy: 'Camille',
    amountOrDetails: 'Engrais plantes vertes équilibré (1/2 dose)',
    notes: 'Accompagné d\'un tuteur en fibre de coco ajusté.',
  },
];

export const COMMON_LOCATIONS = ['Salon', 'Bureau', 'Chambre', 'Balcon', 'Cuisine', 'Salle de bain', 'Entrée'];

export const BOTANICAL_TIPS = [
  {
    title: 'Rythme de saison automne/hiver',
    content: 'La durée du jour diminue : réduisez les arrosages d\'environ 30% et stoppez progressivement les apports d\'engrais.',
  },
  {
    title: 'Test du doigt infaillible',
    content: 'Enfoncez votre index à 2 ou 3 cm de profondeur : n\'arrosez que si la terre y est totalement sèche.',
  },
  {
    title: 'L\'eau à température ambiante',
    content: 'Une eau trop froide du robinet provoque un choc thermique aux racines. Laissez décanter votre arrosoir 24h.',
  },
  {
    title: 'Lumière et photosynthèse',
    content: 'La poussière sur les feuilles bloque jusqu\'à 20% des rayons lumineux. Un nettoyage doux redonne toute sa vitalité à la plante.',
  },
];
