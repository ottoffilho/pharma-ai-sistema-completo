import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Hash,
  Calendar,
  Building2
} from 'lucide-react';
import { baixarXMLNotaFiscal, visualizarDANFE } from '@/services/notaFiscalService';
import { toast } from 'sonner';

interface NotaFiscalHeaderProps {
  notaFiscal: {
    id: string;
    numero_nf: string;
    serie: string;
    status: string;
    chave_acesso: string;
    data_emissao: string;
    fornecedor: {
      nome_fantasia?: string;
      razao_social: string;
      cnpj: string;
    };
  };
}

export function NotaFiscalHeader({ notaFiscal }: NotaFiscalHeaderProps) {
  const navigate = useNavigate();

  const handleBaixarXML = async () => {
    try {
      await baixarXMLNotaFiscal(notaFiscal.id);
      toast.success('XML baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao baixar XML');
    }
  };

  const handleVisualizarDANFE = async () => {
    try {
      await visualizarDANFE(notaFiscal.id);
      toast.success('DANFE aberto em nova janela');
    } catch (error) {
      console.error('Erro ao visualizar DANFE:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao visualizar DANFE');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSADA':
        return <CheckCircle className="h-3 w-3" />;
      case 'ERRO':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PROCESSADA':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0';
      case 'ERRO':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-8">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/estoque/importacao-nf')}
            className="gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBaixarXML}
              className="gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70"
            >
              <Download className="h-4 w-4" />
              Baixar XML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVisualizarDANFE}
              className="gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70"
            >
              <Eye className="h-4 w-4" />
              Visualizar DANFE
            </Button>

          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-xl">
            <FileText className="h-12 w-12 text-white" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Nota Fiscal {notaFiscal.numero_nf}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span className="font-mono text-sm">Série {notaFiscal.serie}</span>
              </div>
              <Badge className={getStatusBadgeClass(notaFiscal.status)}>
                {getStatusIcon(notaFiscal.status)}
                {notaFiscal.status}
              </Badge>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">{notaFiscal.fornecedor.nome_fantasia || notaFiscal.fornecedor.razao_social}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {new Date(notaFiscal.data_emissao).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
            
            {/* Chave de Acesso */}
            <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Chave de Acesso</span>
              </div>
              <p className="font-mono text-xs break-all">{notaFiscal.chave_acesso}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 