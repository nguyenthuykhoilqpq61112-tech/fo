import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../hooks/useToast';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, toast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          let Icon = Info;
          let bgColor = 'bg-sky-500/10 border-sky-500/20 text-sky-400';
          
          if (t.type === 'success') {
            Icon = CheckCircle;
            bgColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            bgColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
          } else if (t.type === 'error') {
            Icon = XCircle;
            bgColor = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
          }

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 p-3 rounded-xl border backdrop-blur-md pointer-events-auto shadow-lg uppercase font-mono tracking-wide cursor-pointer ${bgColor} bg-[#0b0e14]`}
              onClick={() => toast.dismiss(t.id)}
            >
              <Icon size={16} className="shrink-0" />
              <p className="text-xs font-bold leading-snug">{t.message}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
