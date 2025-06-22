import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  Image, 
  FileArchive, 
  File, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Split, 
  Eye, 
  Plus, 
  Trash,
  Sparkles,
  Brain,
  Zap,
  Target,
  Upload,
  Scan,
  Bot,
  Wand2,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { cn } from '@/lib/utils';
import { processRecipe, saveProcessedRecipe, validatePrescriptionData, IAExtractedData, Medication, ProcessingResult } from '@/services/receitaService';

const NovaReceitaPage: React.FC = () => {
  const [uploadMethod, setUploadMethod] = useState<'upload_arquivo' | 'digitacao'>('upload_arquivo');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<IAExtractedData | null>(null);
  const [uploadedRecipeId, setUploadedRecipeId] = useState<string | null>(null);
  const [showValidationArea, setShowValidationArea] = useState(false);
  const [validationView, setValidationView] = useState<'split' | 'preview'>('split');
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationNotes, setValidationNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [rawRecipeId, setRawRecipeId] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Modo de desenvolvimento para mostrar a interface diretamente
  const [devMode, setDevMode] = useState(false);

  // Toggle validation view function
  const toggleValidationView = () => {
    setValidationView(validationView === 'split' ? 'preview' : 'split');
  };

  const handleFilesChange = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    // Reset states when new files are added
    setProcessStatus('idle');
    setExtractedData(null);
    setUploadedRecipeId(null);
    setShowValidationArea(false);
    setValidationProgress(0);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleProcessarReceita = async () => {
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProcessStatus('processing');
    setValidationProgress(0);
    
    try {
      // Usar o primeiro arquivo selecionado
      const file = files[0];
      
      // Simular progresso durante o processamento
      const progressInterval = setInterval(() => {
        setValidationProgress(prev => {
          const newProgress = prev + (2 + Math.random() * 5);
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);
      
      // Processar receita com IA real (serviço oficial)
      const result: ProcessingResult = await processRecipe(file);
      
      // Parar simulação de progresso
      clearInterval(progressInterval);
      setValidationProgress(100);
      
      if (result.success && result.extracted_data && result.raw_recipe_id) {
        setProcessStatus('success');
        setExtractedData(result.extracted_data);
        setRawRecipeId(result.raw_recipe_id);
        setShowValidationArea(true);
        
        toast({
          title: "Processamento concluído",
          description: `A IA extraiu ${result.extracted_data.medications.length} medicamento(s) da receita em ${Math.round((result.processing_time || 0) / 1000)}s.`,
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido no processamento');
      }
      
    } catch (error: unknown) {
      setProcessStatus('error');
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no processamento";
      
      toast({
        title: "Erro ao processar a receita",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Processing error:", error);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  // Handle medication changes
  const handleMedicationChange = (index: number, field: keyof Medication, value: string | number) => {
    if (extractedData) {
      const updatedData = { ...extractedData };
      updatedData.medications[index] = {
        ...updatedData.medications[index],
        [field]: value
      };
      setExtractedData(updatedData);
    }
  };

  // Handle adding new medication
  const handleAddMedication = () => {
    if (extractedData) {
      const updatedData = { ...extractedData };
      updatedData.medications.push({
        name: '',
        dinamization: '',
        form: '',
        quantity: 0,
        unit: '',
        dosage_instructions: ''
      });
      setExtractedData(updatedData);
    }
  };

  // Handle removing medication
  const handleRemoveMedication = (index: number) => {
    if (extractedData) {
      const updatedData = { ...extractedData };
      updatedData.medications.splice(index, 1);
      setExtractedData(updatedData);
    }
  };

  // Handle patient data changes
  const handlePatientChange = (field: string, value: string) => {
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        [field]: value
      });
    }
  };

  // Handle prescriber data changes
  const handlePrescriberChange = (field: string, value: string) => {
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        [field]: value
      });
    }
  };

  const handleSaveProcessedRecipe = async () => {
    if (!extractedData) {
      toast({
        title: "Erro",
        description: "Nenhum dado para salvar.",
        variant: "destructive",
      });
      return;
    }

    if (!rawRecipeId) {
      toast({
        title: 'Erro',
        description: 'ID da receita bruta não encontrado. Tente processar novamente.',
        variant: 'destructive'
      });
      return;
    }

    // Validar dados extraídos (lança erro caso inválido)
    try {
      validatePrescriptionData(extractedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha na validação dos dados da receita';
      toast({
        title: 'Dados inválidos',
        description: message,
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    try {
      const newRecipeId = await saveProcessedRecipe(rawRecipeId, extractedData, validationNotes);

      toast({
        title: 'Receita salva com sucesso',
        description: 'A receita foi processada e salva no sistema.'
      });

      navigate(`/admin/pedidos/${newRecipeId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar";
      
      toast({
        title: "Erro ao salvar receita",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancela o processo de validação, limpando estados locais
   * e retornando para a listagem de pedidos.
   */
  const handleCancelValidation = () => {
    setShowValidationArea(false);
    setExtractedData(null);
    setValidationNotes('');
    setProcessStatus('idle');
    setValidationProgress(0);
    navigate('/admin/pedidos');
  };

  // Generate preview URL for the first file if it's an image
  const previewUrl = React.useMemo(() => {
    if (files.length > 0 && files[0].type.includes('image')) {
      return URL.createObjectURL(files[0]);
    }
    return null;
  }, [files]);

  // Navega de volta para a Central de Pedidos
  const handleBack = () => navigate('/admin/pedidos');

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-indigo-950/20" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4YjVjZjYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40 dark:opacity-20" />
          
          <div className="relative px-6 py-16">
            <div className="flex items-center justify-between">
              <div className="space-y-6 max-w-3xl">
                <div className="flex items-center gap-4">
                  {/* Botão de Voltar (discreto) */}
                  <Link to="/admin/pedidos" className="bg-violet-50/80 dark:bg-violet-900/30 p-2 rounded-full shadow-sm hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </Link>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl blur-xl opacity-20" />
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                      <Brain className="h-10 w-10" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Nova Receita
                    </h1>
                    <p className="text-xl text-muted-foreground mt-3 leading-relaxed">
                      Processamento inteligente de receitas com IA avançada e validação humana
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50 px-3 py-1">
                    <Brain className="h-3 w-3 mr-1" />
                    IA Avançada
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 px-3 py-1">
                    <Scan className="h-3 w-3 mr-1" />
                    OCR Inteligente
                  </Badge>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 px-3 py-1">
                    <Target className="h-3 w-3 mr-1" />
                    Validação Humana
                  </Badge>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 blur-3xl opacity-20 animate-pulse dark:animate-none dark:opacity-10" />
                  <div className="relative">
                    <FileText className="h-40 w-40 text-violet-600/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-6 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm">
                        <Bot className="h-16 w-16 text-violet-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {devMode && (
          <div className="mx-6">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">Modo de desenvolvimento ativo</p>
                    <p className="text-sm text-amber-700">
                      Interface de validação exibida automaticamente com dados mockados. Autenticação temporariamente desativada para testes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 px-6">
          {/* Left column: Upload area */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40">
                  <Upload className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Upload de Receita</CardTitle>
                  <CardDescription className="mt-1">
                    Faça o upload de receitas para processamento pela IA
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <Tabs defaultValue="upload_arquivo" onValueChange={(value) => setUploadMethod(value as 'upload_arquivo' | 'digitacao')}>
                <TabsList className="mb-6 bg-gray-100 dark:bg-slate-800/60 dark:border dark:border-slate-700 rounded-lg">
                  <TabsTrigger value="upload_arquivo" className="dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-gray-100 rounded-md px-4 py-1">Upload de Arquivo</TabsTrigger>
                  <TabsTrigger value="digitacao" disabled className="opacity-50 dark:text-gray-400">Digitação Manual</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload_arquivo">
                  <div className="space-y-6">
                    {/* Simple file upload without dropzone */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf,.docx"
                        onChange={(e) => {
                          const selectedFiles = Array.from(e.target.files || []);
                          handleFilesChange(selectedFiles);
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-center mb-1 font-medium">
                          Clique para selecionar arquivos
                        </p>
                        <p className="text-center text-sm text-gray-500">
                          Arquivos suportados: JPG, PNG, PDF, DOCX (máximo 5 arquivos, 10MB cada)
                        </p>
                      </label>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Arquivos selecionados:</h3>
                        </div>
                        <div className="space-y-3">
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white shadow-sm">
                                  {file.type.includes('image') ? (
                                    <Image className="h-5 w-5 text-violet-600" />
                                  ) : file.type.includes('pdf') ? (
                                    <FileText className="h-5 w-5 text-red-600" />
                                  ) : file.type.includes('document') ? (
                                    <FileArchive className="h-5 w-5 text-blue-600" />
                                  ) : (
                                    <File className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{file.name}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {processStatus !== 'idle' && !devMode && (
                      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              {processStatus === 'processing' && (
                                <>
                                  <div className="p-2 rounded-lg bg-violet-100">
                                    <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-violet-900">Processando receita com IA...</p>
                                    <p className="text-sm text-violet-700">Analisando conteúdo e extraindo informações</p>
                                  </div>
                                </>
                              )}
                              {processStatus === 'success' && (
                                <>
                                  <div className="p-2 rounded-lg bg-emerald-100">
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-emerald-900">Processamento concluído com sucesso!</p>
                                    <p className="text-sm text-emerald-700">Dados extraídos e prontos para validação</p>
                                  </div>
                                </>
                              )}
                              {processStatus === 'error' && (
                                <>
                                  <div className="p-2 rounded-lg bg-red-100">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-red-900">Erro ao processar a receita</p>
                                    <p className="text-sm text-red-700">Tente novamente ou verifique o arquivo</p>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {processStatus === 'processing' && (
                              <div className="space-y-2">
                                <Progress value={validationProgress} className="h-2" />
                                <div className="flex justify-between text-xs text-violet-600">
                                  <span>
                                    {validationProgress < 30 && "Analisando arquivo..."}
                                    {validationProgress >= 30 && validationProgress < 60 && "Extraindo texto..."}
                                    {validationProgress >= 60 && validationProgress < 90 && "Processando com IA..."}
                                    {validationProgress >= 90 && "Finalizando..."}
                                  </span>
                                  <span>{Math.round(validationProgress)}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="digitacao">
                  <Card className="border-dashed border-gray-300 bg-gray-50">
                    <CardContent className="p-8 text-center">
                      <div className="p-4 rounded-full bg-gray-200 w-fit mx-auto mb-4">
                        <Wand2 className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium mb-2">Digitação Manual</p>
                      <p className="text-sm text-gray-500">
                        Esta funcionalidade estará disponível em breve.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40">
              {!devMode && (
                <Button 
                  onClick={handleProcessarReceita} 
                  disabled={isUploading || files.length === 0 || processStatus === 'processing'}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando arquivo...
                    </>
                  ) : processStatus === 'processing' ? (
                    <>
                      <Brain className="mr-2 h-5 w-5" />
                      Processando com IA...
                    </>
                  ) : processStatus === 'success' ? (
                    <>
                      <Eye className="mr-2 h-5 w-5" />
                      Visualizar Dados Extraídos
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Processar Receita com IA
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Right column: Validation area (visible only after successful processing) */}
          {showValidationArea && extractedData && (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Validação de Dados</CardTitle>
                      <CardDescription className="mt-1">
                        Revise e ajuste os dados extraídos pela IA antes de criar o pedido
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA Processada
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleValidationView}
                    className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
                  >
                    {validationView === 'split' ? (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Modo Visualização</span>
                      </>
                    ) : (
                      <>
                        <Split className="h-4 w-4" />
                        <span>Modo Dividido</span>
                      </>
                    )}
                  </Button>
                </div>
                
                <div className={cn(
                  "grid gap-6",
                  validationView === 'split' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                )}>
                  {/* Original prescription preview */}
                  {validationView === 'split' && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Receita Original
                      </h3>
                      {previewUrl ? (
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={previewUrl} 
                            alt="Receita original" 
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">Preview não disponível para este tipo de arquivo</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Prescription data validation form */}
                  <div className={validationView === 'preview' ? "border rounded-lg p-4 bg-gray-50/50" : ""}>
                    <div className="space-y-6">
                      {/* Patient and Prescriber Information */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Dados Extraídos
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="patient_name">Nome do Paciente</Label>
                            <Input
                              id="patient_name"
                              value={extractedData.patient_name || ''}
                              onChange={(e) => handlePatientChange('patient_name', e.target.value)}
                              placeholder="Nome completo do paciente"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="patient_dob">Data de Nascimento</Label>
                            <Input
                              id="patient_dob"
                              type="date"
                              value={extractedData.patient_dob || ''}
                              onChange={(e) => handlePatientChange('patient_dob', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prescriber_name">Nome do Prescritor</Label>
                            <Input
                              id="prescriber_name"
                              value={extractedData.prescriber_name || ''}
                              onChange={(e) => handlePrescriberChange('prescriber_name', e.target.value)}
                              placeholder="Nome do médico/prescritor"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prescriber_identifier">Identificação do Prescritor</Label>
                            <Input
                              id="prescriber_identifier"
                              value={extractedData.prescriber_identifier || ''}
                              onChange={(e) => handlePrescriberChange('prescriber_identifier', e.target.value)}
                              placeholder="CRM, CRF, etc."
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Medications */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Medicamentos</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddMedication}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          {extractedData.medications.map((medication, index) => (
                            <Card key={index} className="border border-gray-200">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-4">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Medicamento {index + 1}</h4>
                                  {extractedData.medications.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMedication(index)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Nome do Medicamento</Label>
                                    <Input
                                      value={medication.name}
                                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                      placeholder="Nome do medicamento"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Dinamização</Label>
                                    <Input
                                      value={medication.dinamization || ''}
                                      onChange={(e) => handleMedicationChange(index, 'dinamization', e.target.value)}
                                      placeholder="Ex: 30CH, 6CH"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Forma Farmacêutica</Label>
                                    <Input
                                      value={medication.form || ''}
                                      onChange={(e) => handleMedicationChange(index, 'form', e.target.value)}
                                      placeholder="Ex: Glóbulos, Gotas"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Quantidade</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        value={medication.quantity || ''}
                                        onChange={(e) => handleMedicationChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                        placeholder="Qtd"
                                        className="flex-1"
                                      />
                                      <Input
                                        value={medication.unit || ''}
                                        onChange={(e) => handleMedicationChange(index, 'unit', e.target.value)}
                                        placeholder="Unidade"
                                        className="flex-1"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Instruções de Uso</Label>
                                    <Textarea
                                      value={medication.dosage_instructions || ''}
                                      onChange={(e) => handleMedicationChange(index, 'dosage_instructions', e.target.value)}
                                      placeholder="Instruções de dosagem e uso"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Validation Notes and Submit */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="validation_notes">Observações de Validação</Label>
                          <Textarea
                            id="validation_notes"
                            value={validationNotes}
                            onChange={(e) => setValidationNotes(e.target.value)}
                            placeholder="Adicione observações sobre a validação dos dados..."
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelValidation}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSaveProcessedRecipe}
                            disabled={isSaving || extractedData.medications.length === 0}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Criar Pedido
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default NovaReceitaPage;
