import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onUploadComplete: () => void;
}

interface FileWithProgress {
  file: File;
  progress: number;
  uploading: boolean;
  error?: string;
}

export function FileUploadZone({ onUploadComplete }: FileUploadZoneProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [dragging, setDragging] = useState(false);
  const [folder, setFolder] = useState('');
  const [tags, setTags] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const fileWithProgress = newFiles.map((file) => ({
      file,
      progress: 0,
      uploading: false,
    }));
    setFiles((prev) => [...prev, ...fileWithProgress]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (fileWithProgress: FileWithProgress, index: number) => {
    if (!user) return;

    const { file } = fileWithProgress;

    // Update state to show uploading
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, uploading: true } : f))
    );

    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null;
      
      const { error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        file_name: fileName,
        original_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        folder: folder || null,
        tags: tagArray,
      });

      if (dbError) throw dbError;

      // Update progress to 100%
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 100, uploading: false } : f))
      );

      toast.success(`${file.name} uploaded successfully`);
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, uploading: false, error: error.message || 'Upload failed' }
            : f
        )
      );
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const handleUploadAll = async () => {
    const uploadPromises = files
      .filter((f) => !f.uploading && f.progress === 0)
      .map((f, i) => {
        const originalIndex = files.indexOf(f);
        return uploadFile(f, originalIndex);
      });

    await Promise.all(uploadPromises);

    // Check if all uploads completed
    const allCompleted = files.every((f) => f.progress === 100 || f.error);
    if (allCompleted) {
      onUploadComplete();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-12 text-center transition-all',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">
          Drag and drop files here, or click to select
        </p>
        <p className="text-sm text-muted-foreground">
          Supports PDF, images, documents, spreadsheets, and more (max 50MB per file)
        </p>
      </div>

      {/* Folder and Tags Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="folder">Folder (optional)</Label>
          <Input
            id="folder"
            placeholder="e.g., Work, Personal"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            placeholder="e.g., important, tax, invoice"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Files to Upload ({files.length})</h3>
            <Button onClick={handleUploadAll} disabled={files.every((f) => f.uploading || f.progress === 100)}>
              Upload All
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((fileWithProgress, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileWithProgress.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileWithProgress.file.size)}
                  </p>
                  {fileWithProgress.uploading && (
                    <Progress value={fileWithProgress.progress} className="mt-2" />
                  )}
                  {fileWithProgress.error && (
                    <p className="text-xs text-destructive mt-1">{fileWithProgress.error}</p>
                  )}
                </div>
                {!fileWithProgress.uploading && fileWithProgress.progress === 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {fileWithProgress.progress === 100 && (
                  <span className="text-sm text-green-600 dark:text-green-400">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}