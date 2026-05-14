"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { DASHBOARD_MODAL } from "@/lib/dashboard-ui-standards";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`${DASHBOARD_MODAL.backdrop} sm:p-6`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
    >
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        className={`relative w-full ${maxWidth} bg-surface-container-lowest dark:bg-gray-900 rounded-xl shadow-2xl border border-outline-variant/25 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className={DASHBOARD_MODAL.header}>
          <h3 id="dashboard-modal-title" className={DASHBOARD_MODAL.title}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className={`${DASHBOARD_MODAL.closeButton} absolute right-4 top-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-surface-container-lowest dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
}
