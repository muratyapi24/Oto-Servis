"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Camera, Trash2, AlertCircle } from "lucide-react";

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface Props {
  serviceOrderId: string;
  initialDocuments?: Document[];
}

export default function PhotoUploader({ serviceOrderId, initialDocuments = [] }: Props) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("serviceOrderId", serviceOrderId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setDocuments(prev => [...prev, {
          id: data.documentId,
          fileName: file.name,
          fileUrl: data.fileUrl,
          fileType: file.type,
          fileSize: file.size,
        }]);
      }
    } catch {
      setError("Yükleme sırasında bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string, fileKey?: string) {
    try {
      await fetch(`/api/upload?id=${docId}`, { method: "DELETE" });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch {
      setError("Dosya silinemedi.");
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
        <ImageIcon className="w-4 h-4" /> Fotoğraflar & Belgeler
      </h3>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Yükleme Alanı */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          capture="environment"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-600">Fotoğraf yüklemek için tıklayın veya sürükleyin</p>
              <p className="text-xs text-gray-400">JPEG, PNG, WebP — Maks. 10MB</p>
              <div className="flex items-center gap-2 mt-1">
                <Camera className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">Mobilde kamera ile çekim yapabilirsiniz</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Yüklenen Dosyalar */}
      {documents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {documents.map(doc => (
            <div key={doc.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
              {doc.fileType.startsWith("image/") ? (
                <img
                  src={doc.fileUrl}
                  alt={doc.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                  className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                <p className="text-white text-[10px] truncate">{doc.fileName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
