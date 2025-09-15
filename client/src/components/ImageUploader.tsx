import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isUploading?: boolean;
}

export default function ImageUploader({ onImageUpload, isUploading = false }: ImageUploaderProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onImageUpload(acceptedFiles[0]);
      }
    }
  });

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div
        {...getRootProps()}
        className={`
          relative w-full max-w-lg p-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${isDragActive 
            ? 'border-primary bg-primary/5 scale-105' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        data-testid="upload-zone"
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-colors
            ${isDragActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
          `}>
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {isDragActive ? 'Drop your image here' : 'Upload your outdoor photo'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isUploading 
                ? 'Processing image...' 
                : 'Drag and drop your JPG or PNG image, or click to browse'
              }
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            disabled={isUploading}
            data-testid="button-browse"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
        </div>
      </div>
    </div>
  );
}