import React, { useState, useEffect } from 'react';
import { usePlantContext } from '../context/PlantContext';
import { Plant, LightLevel, HealthStatus } from '../types/plant';
import { PRESET_IMAGES, COMMON_LOCATIONS } from '../data/initialData';
import { X, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';

interface PlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantToEdit?: Plant | null;
}

export const PlantModal: React.FC<PlantModalProps> = ({ isOpen, onClose, plantToEdit }) => {
  const { addPlant, updatePlant } = usePlantContext();

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('Salon');
  const [customLocation, setCustomLocation] = useState('');
  const [lightRequirement, setLightRequirement] = useState<LightLevel>('Lumière indirecte');
  const [wateringFrequencyDays, setWateringFrequencyDays] = useState<number>(7);
  const [mistingFrequencyDays, setMistingFrequencyDays] = useState<number>(0);
  const [fertilizerFrequencyDays, setFertilizerFrequencyDays] = useState<number>(30);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('Excellente');
  const [potSizeCm, setPotSizeCm] = useState<number>(20);
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>(PRESET_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');

  useEffect(() => {
    if (plantToEdit) {
      setName(plantToEdit.name);
      setNickname(plantToEdit.nickname || '');
      setSpecies(plantToEdit.species);
      if (COMMON_LOCATIONS.includes(plantToEdit.location)) {
        setLocation(plantToEdit.location);
        setCustomLocation('');
      } else {
        setLocation('Autre');
        setCustomLocation(plantToEdit.location);
      }
      setLightRequirement(plantToEdit.lightRequirement);
      setWateringFrequencyDays(plantToEdit.wateringFrequencyDays);
      setMistingFrequencyDays(plantToEdit.mistingFrequencyDays || 0);
      setFertilizerFrequencyDays(plantToEdit.fertilizerFrequencyDays || 0);
      setHealthStatus(plantToEdit.healthStatus);
      setPotSizeCm(plantToEdit.potSizeCm || 20);
      setNotes(plantToEdit.notes || '');
      setSelectedImage(plantToEdit.imageUrl);
    } else {
      // Reset form
      setName('');
      setNickname('');
      setSpecies('');
      setLocation('Salon');
      setCustomLocation('');
      setLightRequirement('Lumière indirecte');
      setWateringFrequencyDays(7);
      setMistingFrequencyDays(0);
      setFertilizerFrequencyDays(30);
      setHealthStatus('Excellente');
      setPotSizeCm(20);
      setNotes('');
      setSelectedImage(PRESET_IMAGES[0].url);
      setCustomImageUrl('');
    }
  }, [plantToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalLocation = location === 'Autre' ? customLocation.trim() || 'Intérieur' : location;

    if (plantToEdit) {
      updatePlant(plantToEdit.id, {
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        species: species.trim() || name.trim(),
        location: finalLocation,
        lightRequirement,
        wateringFrequencyDays: Number(wateringFrequencyDays) || 7,
        mistingFrequencyDays: mistingFrequencyDays > 0 ? Number(mistingFrequencyDays) : undefined,
        fertilizerFrequencyDays: fertilizerFrequencyDays > 0 ? Number(fertilizerFrequencyDays) : undefined,
        healthStatus,
        potSizeCm: Number(potSizeCm) || undefined,
        notes: notes.trim(),
        imageUrl: customImageUrl.trim() || selectedImage,
      });
    } else {
      addPlant({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        species: species.trim() || name.trim(),
        location: finalLocation,
        lightRequirement,
        wateringFrequencyDays: Number(wateringFrequencyDays) || 7,
        mistingFrequencyDays: mistingFrequencyDays > 0 ? Number(mistingFrequencyDays) : undefined,
        fertilizerFrequencyDays: fertilizerFrequencyDays > 0 ? Number(fertilizerFrequencyDays) : undefined,
        lastWatered: new Date().toISOString(),
        lastMisted: mistingFrequencyDays > 0 ? new Date().toISOString() : undefined,
        lastFertilized: fertilizerFrequencyDays > 0 ? new Date().toISOString() : undefined,
        healthStatus,
        potSizeCm: Number(potSizeCm) || undefined,
        notes: notes.trim(),
        imageUrl: customImageUrl.trim() || selectedImage,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">
              {plantToEdit ? 'Modifier la plante' : 'Ajouter une nouvelle plante'}
            </h2>
            <p className="text-xs text-stone-500">
              Renseignez les détails botaniques et le rythme d'entretien.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Photo Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Photo de la plante
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setSelectedImage(preset.url);
                    setCustomImageUrl('');
                  }}
                  className={`relative aspect-4/3 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === preset.url && !customImageUrl
                      ? 'border-emerald-700 ring-2 ring-emerald-200'
                      : 'border-stone-200 hover:border-stone-400 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[10px] text-white py-0.5 px-1 truncate text-center">
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom file or URL upload */}
            <div className="flex items-center gap-3 text-xs">
              <label className="px-3 py-1.5 border border-stone-200 rounded-lg bg-stone-50 hover:bg-stone-100 cursor-pointer flex items-center gap-1.5 text-stone-700 font-medium">
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>Téléverser une photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <span className="text-stone-400">ou URL :</span>
              <input
                type="text"
                placeholder="https://..."
                value={customImageUrl}
                onChange={(e) => {
                  setCustomImageUrl(e.target.value);
                  if (e.target.value) setSelectedImage(e.target.value);
                }}
                className="flex-1 px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Plant Name & Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nom vernaculaire / Plante *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. Monstera Deliciosa"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Surnom affectif (optionnel)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="ex. Monty, Jungle Queen..."
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Species & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Espèce botanique
              </label>
              <input
                type="text"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="ex. Monstera deliciosa Liebm."
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Emplacement / Pièce *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-700"
              >
                {COMMON_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                <option value="Autre">Autre pièce...</option>
              </select>
              {location === 'Autre' && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Nom de la pièce..."
                  className="w-full mt-2 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              )}
            </div>
          </div>

          {/* Care Cycles: Watering, Misting, Fertilizer */}
          <div className="pt-2 border-t border-stone-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Rythme d'entretien
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Arrosage tous les *
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={wateringFrequencyDays}
                    onChange={(e) => setWateringFrequencyDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                  />
                  <span className="text-xs text-stone-500">jours</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Brumisation tous les
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={mistingFrequencyDays}
                    onChange={(e) => setMistingFrequencyDays(Number(e.target.value))}
                    placeholder="0 = désactivé"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                  />
                  <span className="text-xs text-stone-500">jours</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Engrais tous les
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={fertilizerFrequencyDays}
                    onChange={(e) => setFertilizerFrequencyDays(Number(e.target.value))}
                    placeholder="0 = désactivé"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                  />
                  <span className="text-xs text-stone-500">jours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Light, Health Status, Pot Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Luminosité requise
              </label>
              <select
                value={lightRequirement}
                onChange={(e) => setLightRequirement(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-700"
              >
                <option value="Faible">Faible (ombre douce)</option>
                <option value="Lumière indirecte">Lumière indirecte</option>
                <option value="Lumière vive">Lumière vive</option>
                <option value="Soleil direct">Soleil direct</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                État de santé
              </label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-700"
              >
                <option value="Excellente">Excellente</option>
                <option value="Bonne">Bonne</option>
                <option value="Besoin d'attention">Besoin d'attention</option>
                <option value="Critique">Critique</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Diamètre du pot
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={potSizeCm}
                  onChange={(e) => setPotSizeCm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                />
                <span className="text-xs text-stone-500">cm</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Notes & Conseils personnalisés
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sensibilité à l'eau calcaire, substrat spécifique, historique de rempotage..."
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              {plantToEdit ? 'Enregistrer les modifications' : 'Ajouter à mes plantes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
