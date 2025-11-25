import { Upload, X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface FileAttachmentUploadProps {
  attachments: string[];
  onAttachmentsChange: (attachments: string[]) => void;
}

export function FileAttachmentUpload({ attachments, onAttachmentsChange }: FileAttachmentUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('attachments').getPublicUrl(fileName);
      
      onAttachmentsChange([...attachments, data.publicUrl]);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (url: string) => {
    onAttachmentsChange(attachments.filter(a => a !== url));
  };

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-primary">
        <Upload className="h-4 w-4" />
        <span className="text-sm">Upload File</span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
          disabled={uploading}
        />
      </label>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((url, index) => (
            <div key={index} className="flex items-center gap-2 glass-card rounded-lg p-2">
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{url.split('/').pop()}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeAttachment(url)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}