import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  folder: string | null;
  tags: string[] | null;
  created_at: string;
}

interface FilePreviewModalProps {
  document: Document;
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export function FilePreviewModal({
  document,
  open,
  onClose,
  onDownload,
}: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !document) return;

    const loadPreview = async () => {
      setLoading(true);
      setPreviewUrl(null);
      setTextContent(null);

      try {
        // Get signed URL for preview
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.storage_path, 3600); // 1 hour expiry

        if (error) throw error;

        if (document.mime_type.startsWith('image/') || document.mime_type.includes('pdf')) {
          setPreviewUrl(data.signedUrl);
        } else if (document.mime_type.includes('text')) {
          // Load text content
          const response = await fetch(data.signedUrl);
          const text = await response.text();
          setTextContent(text);
        }
      } catch (error: any) {
        toast.error('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [document, open]);

  const canPreview =
    document.mime_type.startsWith('image/') ||
    document.mime_type.includes('pdf') ||
    document.mime_type.includes('text');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-8">{document.original_name}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading preview...</p>
            </div>
          ) : !canPreview ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-muted-foreground">
                Preview not available for this file type
              </p>
              <Button onClick={onDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download to View
              </Button>
            </div>
          ) : document.mime_type.includes('pdf') ? (
            <iframe
              src={previewUrl || ''}
              className="w-full h-full min-h-[600px] rounded-lg"
              title={document.original_name}
            />
          ) : document.mime_type.startsWith('image/') ? (
            <div className="flex items-center justify-center p-4">
              <img
                src={previewUrl || ''}
                alt={document.original_name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          ) : document.mime_type.includes('text') && textContent ? (
            <pre className="p-4 bg-muted rounded-lg overflow-auto text-sm font-mono max-h-[600px]">
              {textContent}
            </pre>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}