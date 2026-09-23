import React from 'react';
import { usePlantContext } from '../context/PlantContext';
import { CheckCircle2, Info, BellRing, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { toasts, dismissToast } = usePlantContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isReminder = toast.type === 'reminder';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 ${
              isReminder
                ? 'bg-amber-900/95 border-amber-700 text-amber-50'
                : isSuccess
                ? 'bg-emerald-950/95 border-emerald-800 text-emerald-50'
                : 'bg-stone-900/95 border-stone-700 text-stone-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isReminder && <BellRing className="w-5 h-5 text-amber-300" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {!isReminder && !isSuccess && <Info className="w-5 h-5 text-stone-300" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold">{toast.title}</div>
              <div className="text-xs opacity-90 mt-0.5 leading-snug">{toast.message}</div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
