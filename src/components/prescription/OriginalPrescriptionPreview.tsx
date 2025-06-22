
import React from 'react';
import { FileText } from 'lucide-react';

interface OriginalPrescriptionPreviewProps {
  previewUrl: string | null;
  originalFiles: File[];
}

const OriginalPrescriptionPreview: React.FC<OriginalPrescriptionPreviewProps> = ({
  previewUrl,
  originalFiles
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Receita Original</h3>
      
      {previewUrl ? (
        <div className="border rounded-md overflow-hidden h-64 bg-gray-50">
          <img 
            src={previewUrl} 
            alt="Receita" 
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center border rounded-md h-64 bg-gray-50">
          {originalFiles.length > 0 && (
            <div className="flex flex-col items-center text-muted-foreground">
              <FileText className="h-8 w-8 mb-2" />
              <span>{originalFiles[0].name}</span>
              <a 
                href={URL.createObjectURL(originalFiles[0])}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-homeo-blue mt-2"
              >
                Abrir arquivo
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <p className="text-sm text-muted-foreground">
          {originalFiles.length > 1 && (
            <>Mais {originalFiles.length - 1} arquivo(s) anexado(s)</>
          )}
        </p>
      </div>
    </div>
  );
};

export default OriginalPrescriptionPreview;
