import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Define the type for lote data
type Lote = {
  id: string;
  insumo_id: string;
  numero_lote: string;
  data_validade: string | null;
  quantidade_inicial: number;
  quantidade_atual: number;
  unidade_medida: string;
  fornecedor_id: string | null;
  custo_unitario_lote: number | null;
  localizacao: string | null;
  notas: string | null;
  fornecedores: {
    nome: string | null;
  } | null;
  is_deleted: boolean;
};

interface LotesInsumoTableProps {
  insumoId: string;
  insumoNome?: string;
}

const LotesInsumoTable: React.FC<LotesInsumoTableProps> = ({ insumoId, insumoNome }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loteToDelete, setLoteToDelete] = useState<Lote | null>(null);

  // Fetch lotes data for the specified insumo - filter out deleted items
  const { data: lotes, isLoading, isError, error } = useQuery({
    queryKey: ['lotes', insumoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lotes_produtos')
        .select(`
          *,
          produto:produto_id(
            id,
            nome,
            codigo_interno
          ),
          fornecedor:fornecedor_id(
            id,
            nome
          )
        `)
        .eq('insumo_id', insumoId)
        .eq('is_deleted', false)
        .order('data_validade', { ascending: true });
      
      if (error) throw error;
      return data as Lote[];
    },
    enabled: !!insumoId,
  });

  // Mutation for soft delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lotes_produtos')
        .update({ is_deleted: true })
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['lotes', insumoId] });
      
      toast({
        title: "Lote excluído",
        description: "O lote foi excluído com sucesso.",
        variant: "success",
      });
      
      setDeleteDialogOpen(false);
      setLoteToDelete(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir lote:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o lote. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (id: string) => {
    navigate(`/admin/estoque/lotes/editar/${id}`);
  };

  const handleDelete = (lote: Lote) => {
    setLoteToDelete(lote);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (loteToDelete) {
      deleteMutation.mutate(loteToDelete.id);
    }
  };

  const handleAddNew = () => {
    navigate(`/admin/estoque/lotes/novo?insumoId=${insumoId}`);
  };

  // Format currency values
  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Lotes do Insumo {insumoNome ? `"${insumoNome}"` : ''}</h3>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Novo Lote
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            <p>Erro ao carregar lotes: {(error as Error).message}</p>
          </div>
        ) : lotes && lotes.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número do Lote</TableHead>
                  <TableHead>Quantidade Atual</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Data de Validade</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Custo Unitário</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotes.map((lote) => (
                  <TableRow key={lote.id}>
                    <TableCell>{lote.numero_lote}</TableCell>
                    <TableCell>
                      <span 
                        className={
                          lote.quantidade_atual <= (lote.quantidade_inicial * 0.2) // Less than 20% of initial
                            ? "text-red-600 font-semibold" 
                            : ""
                        }
                      >
                        {lote.quantidade_atual}
                      </span>
                    </TableCell>
                    <TableCell>{lote.unidade_medida}</TableCell>
                    <TableCell>
                      {lote.data_validade 
                        ? format(new Date(lote.data_validade), 'dd/MM/yyyy', { locale: ptBR }) 
                        : '-'}
                    </TableCell>
                    <TableCell>{lote.fornecedores?.nome || '-'}</TableCell>
                    <TableCell>{formatCurrency(lote.custo_unitario_lote)}</TableCell>
                    <TableCell>{lote.localizacao || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(lote.id)}>
                          <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(lote)}
                          disabled={deleteMutation.isPending && loteToDelete?.id === lote.id}
                        >
                          {deleteMutation.isPending && loteToDelete?.id === lote.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-md">
            <p className="text-gray-600 mb-4">Nenhum lote encontrado para este insumo.</p>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Lote
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lote <strong>{loteToDelete?.numero_lote}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LotesInsumoTable;
