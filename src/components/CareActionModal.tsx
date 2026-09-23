import React, { useState, useEffect } from 'react';
import { usePlantContext } from '../context/PlantContext';
import { CareType } from '../types/plant';
import {
  X,
  Droplets,
  Wind,
  Sparkles,
  Layers,
  Scissors,
  Sparkle,
  Calendar,
  Check,
} from 'lucide-react';

interface CareActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPlantId?: string | null;
}

export const CareActionModal: React.FC<CareActionModalProps> = ({
  isOpen,
  onClose,
  preselectedPlantId,
}) => {
  const { plants, users, currentUser, logCareAction } = usePlantContext();

  const [plantId, setPlantId] = useState('');
  const [careType, setCareType] = useState<CareType>('arrosage');
  const [amountOrDetails, setAmountOrDetails] = useState('Arrosage régulier (300 ml)');
  const [performedBy, setPerformedBy] = useState(currentUser.name);
  const [notes, setNotes] = useState('');

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      if (preselectedPlantId) {
        setPlantId(preselectedPlantId);
      } else if (plants.length > 0) {
        setPlantId(plants[0].id);
      }
      setPerformedBy(currentUser.name);
      setCareType('arrosage');
      setAmountOrDetails('Arrosage régulier (300 ml)');
      setNotes('');
    }
  }, [isOpen, preselectedPlantId, plants, currentUser]);

  if (!isOpen) return null;

  const careOptions: { type: CareType; label: string; icon: React.ReactNode; defaultDetail: string }[] = [
    {
      type: 'arrosage',
      label: 'Arrosage',
      icon: <Droplets className="w-4 h-4 text-sky-600" />,
      defaultDetail: 'Arrosage régulier (300 ml)',
    },
    {
      type: 'brumisation',
      label: 'Brumisation',
      icon: <Wind className="w-4 h-4 text-teal-600" />,
      defaultDetail: 'Brumisation légère des feuilles',
    },
    {
      type: 'engrais',
      label: 'Engrais',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
      defaultDetail: 'Engrais plantes d\'intérieur (demi-dose)',
    },
    {
      type: 'nettoyage',
      label: 'Nettoyage',
      icon: <Sparkle className="w-4 h-4 text-emerald-600" />,
      defaultDetail: 'Dépoussiérage au chiffon microfibre',
    },
    {
      type: 'rempotage',
      label: 'Rempotage',
      icon: <Layers className="w-4 h-4 text-amber-800" />,
      defaultDetail: 'Terreau frais + drainage billes d\'argile',
    },
    {
      type: 'taille',
      label: 'Taille',
      icon: <Scissors className="w-4 h-4 text-stone-600" />,
      defaultDetail: 'Suppression des feuilles sèches',
    },
  ];

  const handleTypeSelect = (opt: (typeof careOptions)[0]) => {
    setCareType(opt.type);
    setAmountOrDetails(opt.defaultDetail);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantId) return;

    logCareAction({
      plantId,
      type: careType,
      amountOrDetails: amountOrDetails.trim() || undefined,
      performedBy,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">Enregistrer un soin</h2>
            <p className="text-xs text-stone-500">
              Notez l'arrosage ou l'entretien effectué dans l'historique.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Plant Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Plante concernée *
            </label>
            <select
              required
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-800"
            >
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname ? `${p.nickname} (${p.name})` : p.name} — {p.location}
                </option>
              ))}
            </select>
          </div>

          {/* Care Type Selection Buttons */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Type d'intervention *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {careOptions.map((opt) => {
                const isSelected = careType === opt.type;
                return (
                  <button
                    type="button"
                    key={opt.type}
                    onClick={() => handleTypeSelect(opt)}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold shadow-2xs'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                    }`}
                  >
                    {opt.icon}
                    <span className="text-xs truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount / Detail */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Détails ou quantité
            </label>
            <input
              type="text"
              value={amountOrDetails}
              onChange={(e) => setAmountOrDetails(e.target.value)}
              placeholder="ex. 300 ml d'eau tempérée, 1/2 dose..."
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* Performed By (User) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Effectué par *
            </label>
            <select
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-stone-800"
            >
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Observations ou remarques (optionnel)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nouvelle pousse aperçue, terre sèche, feuilles dépoussiérées..."
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
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
              Valider ce soin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
