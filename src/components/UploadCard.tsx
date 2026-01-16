import { useState, useRef, useCallback } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import clsx from 'clsx';
import { useApi } from '../contexts/ApiContext';
import { CatVibe, ProofOfCat } from '../types';
import { VIBE_OPTIONS } from '../lib/constants';
import { ProofOfCatReveal } from './ProofOfCatReveal';

interface UploadCardProps {
  userId: string | undefined;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function UploadCard({ userId, onSuccess, onError }: UploadCardProps) {
  const api = useApi();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [vibes, setVibes] = useState<CatVibe[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Proof of Cat reveal state
  const [proofReveal, setProofReveal] = useState<{
    proof: ProofOfCat;
    catName: string;
    catImageUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setPreview(null);
    setFile(null);
    setName('');
    setVibes([]);
    setIsModalOpen(false);
  };

  const toggleVibe = (vibe: CatVibe) => {
    setVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      onError('File too large! Max 5MB.');
      return;
    }

    const isVideo = selectedFile.type.startsWith('video/');
    const isImage = selectedFile.type.startsWith('image/');

    if (!isVideo && !isImage) {
      onError('Please select an image or video.');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleUpload = async () => {
    if (!file || !name.trim() || !userId) return;

    setUploading(true);

    try {
      // Convert file to base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload via cloud function
      const uploadResult = await api.callUploadMedia({
        fileData,
        contentType: file.type,
        fileName: file.name,
      });

      const { mediaUrl, mediaType } = uploadResult.data as { mediaUrl: string; mediaType: string };

      // Create cat in Firestore via Cloud Function
      const addCatResult = await api.callAddCat({
        name: name.trim(),
        mediaUrl,
        mediaType,
        vibes: vibes.length > 0 ? vibes : undefined,
      });

      const { proofOfCat } = addCatResult.data as { proofOfCat: ProofOfCat };

      // Close the upload modal and show the proof reveal!
      const catName = name.trim();
      setIsModalOpen(false);

      // Show the proof of cat reveal
      setProofReveal({
        proof: proofOfCat,
        catName,
        catImageUrl: mediaUrl,
      });

    } catch (err) {
      console.error('Upload error:', err);
      onError('Failed to add cat. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProofRevealClose = () => {
    const catName = proofReveal?.catName || 'Your cat';
    setProofReveal(null);
    resetForm();
    onSuccess(`${catName} has joined Cat TV!`);
  };

  return (
    <>
      {/* Upload Trigger Card */}
      <div
        onClick={() => setIsModalOpen(true)}
        className={clsx(
          'bg-white rounded-card shadow-card overflow-hidden cursor-pointer',
          'border-2 border-dashed border-accent-orange/30 hover:border-accent-orange',
          'transition-all hover:scale-[1.02]',
          'flex flex-col items-center justify-center aspect-square'
        )}
      >
        <div className="w-16 h-16 rounded-full bg-accent-orange/10 flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-accent-orange" />
        </div>
        <span className="font-display text-lg font-semibold text-text-main">
          Add a Cat
        </span>
        <span className="text-sm text-text-soft mt-1">
          Share a furry friend
        </span>
      </div>

      {/* Proof of Cat Reveal Modal */}
      {proofReveal && (
        <ProofOfCatReveal
          proof={proofReveal.proof}
          catName={proofReveal.catName}
          catImageUrl={proofReveal.catImageUrl}
          onClose={handleProofRevealClose}
        />
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && resetForm()}
        >
          <div className="bg-white rounded-card p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-semibold">
                Add a Cat
              </h2>
              <button
                onClick={resetForm}
                className="text-text-soft hover:text-text-main"
              >
                <X size={24} />
              </button>
            </div>

            {/* Preview / Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                'aspect-square rounded-xl mb-4 cursor-pointer transition-colors',
                'border-2 border-dashed flex items-center justify-center',
                dragActive
                  ? 'border-accent-orange bg-accent-orange/5'
                  : 'border-gray-200 bg-gray-50 hover:border-accent-orange/50',
                preview && 'border-none'
              )}
            >
              {preview ? (
                file?.type.startsWith('video/') ? (
                  <video
                    src={preview}
                    className="w-full h-full object-cover rounded-xl"
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                )
              ) : (
                <div className="text-center p-6">
                  <Upload className="w-12 h-12 text-text-soft mx-auto mb-3" />
                  <p className="text-text-soft">
                    Drop image/video or click to browse
                  </p>
                  <p className="text-sm text-text-soft/70 mt-1">
                    Max 5MB
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {/* Name Input */}
            <input
              type="text"
              placeholder="Cat's name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className={clsx(
                'w-full px-4 py-3 rounded-xl border-2 border-gray-200 mb-4',
                'font-body text-text-main placeholder:text-text-soft',
                'focus:outline-none focus:border-accent-orange transition-colors'
              )}
            />

            {/* Vibe Selector */}
            <div className="mb-4">
              <p className="text-sm text-text-soft mb-2">Vibe tags (optional)</p>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleVibe(option.value)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      vibes.includes(option.value)
                        ? 'bg-accent-lavender text-white'
                        : 'bg-gray-100 text-text-soft hover:bg-gray-200'
                    )}
                  >
                    {option.emoji} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-text-soft bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || !name.trim() || uploading}
                className={clsx(
                  'flex-1 px-4 py-3 rounded-xl font-semibold transition-all',
                  file && name.trim() && !uploading
                    ? 'bg-accent-orange text-white hover:bg-opacity-90'
                    : 'bg-gray-100 text-text-soft cursor-not-allowed'
                )}
              >
                {uploading ? 'Adding...' : 'Add Cat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
