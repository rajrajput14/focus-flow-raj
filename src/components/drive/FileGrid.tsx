import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File as FileIcon,
  Download,
  Eye,
  Trash2,
  FileArchive,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

interface FileGridProps {
  documents: Document[];
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export function FileGrid({ documents, onPreview, onDownload, onDelete }: FileGridProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive;
    return FileIcon;
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'Word';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Excel';
    if (mimeType.includes('zip')) return 'ZIP';
    if (mimeType.includes('rar')) return 'RAR';
    if (mimeType.includes('text')) return 'Text';
    return 'File';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const canPreview = (mimeType: string) => {
    return (
      mimeType.startsWith('image/') ||
      mimeType.includes('pdf') ||
      mimeType.includes('text')
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => {
        const Icon = getFileIcon(doc.mime_type);
        return (
          <Card
            key={doc.id}
            className="glass-card group hover:scale-[1.02] transition-all duration-300 hover:shadow-lg"
          >
            <CardContent className="p-4 space-y-3">
              {/* File Icon */}
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-8 w-8" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {getFileTypeLabel(doc.mime_type)}
                </Badge>
              </div>

              {/* File Info */}
              <div className="space-y-1">
                <h3 className="font-medium truncate" title={doc.original_name}>
                  {doc.original_name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {/* Folder and Tags */}
              {(doc.folder || (doc.tags && doc.tags.length > 0)) && (
                <div className="flex flex-wrap gap-1">
                  {doc.folder && (
                    <Badge variant="outline" className="text-xs">
                      📁 {doc.folder}
                    </Badge>
                  )}
                  {doc.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {doc.tags && doc.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{doc.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                {canPreview(doc.mime_type) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => onPreview(doc)}
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className={canPreview(doc.mime_type) ? 'gap-2' : 'flex-1 gap-2'}
                  onClick={() => onDownload(doc)}
                >
                  <Download className="h-3 w-3" />
                  {canPreview(doc.mime_type) ? '' : 'Download'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{doc.original_name}"? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(doc)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}