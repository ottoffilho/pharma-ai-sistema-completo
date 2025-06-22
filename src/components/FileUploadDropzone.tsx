import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface FileUploadDropzoneProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: Record<string, string[]>;
  maxSize?: number; // Tamanho máximo em bytes
}

const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({ 
  onFilesChange, 
  maxFiles = 5,
  acceptedFileTypes,
  maxSize = 10 * 1024 * 1024 // 10MB por padrão
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Função para validar o conteúdo real do arquivo
  const validateFileContent = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Verificar tamanho máximo
      if (file.size > maxSize) {
        console.error(`Arquivo excede o tamanho máximo: ${file.name} (${file.size} bytes)`);
        resolve(false);
        return;
      }
      
      // Para imagens, verificar o conteúdo real
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => {
            console.error(`Conteúdo de imagem inválido: ${file.name}`);
            resolve(false);
          };
          img.src = e.target?.result as string;
        };
        reader.onerror = () => {
          console.error(`Erro ao ler arquivo: ${file.name}`);
          resolve(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        // Para PDFs, verificar assinatura de arquivo
        const reader = new FileReader();
        reader.onload = (e) => {
          const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 4);
          let header = "";
          for(let i = 0; i < arr.length; i++) {
            header += arr[i].toString(16);
          }
          // Verificar assinatura de PDF (%PDF)
          const isPdf = header === "25504446";
          if (!isPdf) {
            console.error(`Assinatura de PDF inválida: ${file.name}, header: ${header}`);
          }
          resolve(isPdf);
        };
        reader.onerror = () => {
          console.error(`Erro ao ler arquivo PDF: ${file.name}`);
          resolve(false);
        };
        reader.readAsArrayBuffer(file.slice(0, 4));
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Para DOCX, verificar se tem a extensão correta
        const hasCorrectExtension = file.name.toLowerCase().endsWith('.docx');
        if (!hasCorrectExtension) {
          console.error(`Extensão DOCX inválida: ${file.name}`);
        }
        resolve(hasCorrectExtension);
      } else {
        // Tipos não suportados rejeitados
        console.error(`Tipo de arquivo não suportado: ${file.name} (${file.type})`);
        resolve(false);
      }
    });
  }, [maxSize]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsValidating(true);
    
    try {
      const validatedFiles: File[] = [];
      
      for (const file of acceptedFiles) {
        const isValid = await validateFileContent(file);
        if (isValid) {
          validatedFiles.push(file);
        }
      }
      
      onFilesChange(validatedFiles);
      
      // Notificar o usuário se alguns arquivos foram rejeitados
      if (validatedFiles.length < acceptedFiles.length) {
        console.warn(`${acceptedFiles.length - validatedFiles.length} arquivos foram rejeitados por falhar na validação`);
      }
    } finally {
      setIsValidating(false);
    }
  }, [onFilesChange, validateFileContent]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    accept: acceptedFileTypes,
    maxSize: maxSize, // Defina também o limite no Dropzone
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 transition-all
        flex flex-col items-center justify-center cursor-pointer
        ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}
        ${isDragReject ? 'border-red-500 bg-red-50' : ''}
        hover:border-emerald-400 hover:bg-emerald-25
      `}
    >
      <input {...getInputProps()} />
      {isValidating ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-center font-medium">Validando arquivos...</p>
        </div>
      ) : (
        <>
          <UploadCloud className={`h-12 w-12 mb-4 ${isDragActive ? 'text-emerald-500' : 'text-gray-400'}`} />
          <p className="text-center mb-1 font-medium">
            {isDragActive ? 'Solte os arquivos aqui' : 'Arraste e solte arquivos aqui ou clique para selecionar'}
          </p>
          <p className="text-center text-sm text-gray-500">
            Arquivos suportados: JPG, PNG, PDF, DOCX (máximo {maxFiles} arquivos, {Math.round(maxSize / (1024 * 1024))}MB cada)
          </p>
        </>
      )}
      {isDragReject && (
        <p className="text-center text-red-600 text-sm mt-2">
          Algum arquivo não é permitido. Verifique o formato e tamanho.
        </p>
      )}
    </div>
  );
};

export default FileUploadDropzone;
