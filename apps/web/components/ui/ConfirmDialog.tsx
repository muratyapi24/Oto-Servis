"use client";

import Modal from "./Modal";
import { Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, isLoading = false }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50 dark:ring-red-900/10">
          <Trash2 className="w-8 h-8" />
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-8 font-medium leading-relaxed">{description}</p>
        
        <div className="flex gap-3 w-full pt-4 border-t border-slate-100 dark:border-gray-700">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200 font-extrabold tracking-wide uppercase text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-gray-600 active:scale-95 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary"
          >
            Vazgeç
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-red-600 dark:bg-red-700 text-white font-extrabold tracking-wide uppercase text-xs rounded-xl shadow-lg shadow-red-600/20 dark:shadow-red-900/30 hover:bg-red-700 dark:hover:bg-red-800 active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-red-400"
          >
            {isLoading ? <span className="animate-pulse">İşleniyor...</span> : "Evet, Onaylıyorum"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
