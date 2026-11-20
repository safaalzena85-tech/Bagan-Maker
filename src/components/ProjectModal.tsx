import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Calendar,
  Layers,
  X,
  Pencil,
  Check,
  FileText,
} from 'lucide-react';
import { SavedProject } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  currentProjectId?: string;
  onSaveCurrentAsNew: (title: string) => void;
  onLoadProject: (project: SavedProject) => void;
  onDuplicateProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newTitle: string) => void;
  onExportProjectJson: (project?: SavedProject) => void;
  onImportProjectJson: (file: File) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSaveCurrentAsNew,
  onLoadProject,
  onDuplicateProject,
  onDeleteProject,
  onRenameProject,
  onExportProjectJson,
  onImportProjectJson,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingText, setRenamingText] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onSaveCurrentAsNew(newTitle.trim());
    setNewTitle('');
    setIsCreatingNew(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportProjectJson(file);
      e.target.value = '';
    }
  };

  const formatStyleBadge = (style: string) => {
    switch (style) {
      case 'style1':
        return 'Gaya 1: Tree';
      case 'style2':
        return 'Gaya 2: Pill';
      case 'style3':
        return 'Gaya 3: Soal';
      case 'style4':
        return 'Gaya 4: Radial';
      case 'style5':
        return 'Gaya 5: Slide';
      default:
        return style;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="nb-skin nb-modal w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Daftar Proyek Saya
              </h2>
              <p className="text-[11px] text-slate-500">
                Kelola, simpan, dan lanjutkan pekerjaan dokumen bagan Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan Dokumen Saat Ini</span>
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-all">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka File JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => onExportProjectJson()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-all"
            title="Download proyek saat ini dalam file JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor JSON</span>
          </button>
        </div>

        {/* Modal Body: Create new project input */}
        {isCreatingNew && (
          <form
            onSubmit={handleCreateSubmit}
            className="px-6 py-3 bg-indigo-50/70 border-b border-indigo-200 flex items-center gap-2 text-xs"
          >
            <input
              type="text"
              value={newTitle}
              autoFocus
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Beri judul dokumen (contoh: Bagan Instrumen Keuangan 2026)"
              className="flex-1 px-3 py-1.5 rounded-xl border border-indigo-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 cursor-pointer"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Batal
            </button>
          </form>
        )}

        {/* List of Projects */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {projects.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-600" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada dokumen tersimpan
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Klik tombol "Simpan Dokumen Saat Ini" di atas untuk menyimpan bagan yang sedang Anda buat ke daftar proyek lokal.
              </p>
            </div>
          ) : (
            projects.map((proj) => {
              const isCurrent = proj.id === currentProjectId;
              const dateStr = new Date(proj.updatedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={proj.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {renamingId === proj.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renamingText}
                            autoFocus
                            onChange={(e) => setRenamingText(e.target.value)}
                            className="px-2 py-0.5 text-xs border border-indigo-400 rounded-lg focus:outline-none w-full max-w-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (renamingText.trim()) {
                                onRenameProject(proj.id, renamingText.trim());
                              }
                              setRenamingId(null);
                            }}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-xs font-bold text-slate-800 truncate"
                            title={proj.title}
                          >
                            {proj.title}
                          </h3>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {formatStyleBadge(proj.diagramStyle)}
                        </span>
                        <span>•</span>
                        <span>{proj.canvasDimension?.preset || '16:9'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadProject(proj);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      Buka
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportProjectJson(proj)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Unduh File JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(proj.id);
                        setRenamingText(proj.title);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Ganti Nama Dokumen"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateProject(proj)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Duplikasi Dokumen"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Semua proyek otomatis tersimpan di penyimpanan browser Anda (localStorage).</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
