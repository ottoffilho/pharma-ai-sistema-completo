import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import ProdutoFormModerno from '@/components/estoque/ProdutoFormModerno';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  ArrowLeft, 
  Save,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const EditarProdutoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [saveProgress, setSaveProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Buscar dados do produto para exibir no cabeçalho
  const { data: produto, isLoading: carregandoProduto } = useQuery({
    queryKey: ['produto', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, codigo_interno')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Animação de entrada
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Simular progresso de salvamento
  const handleSave = () => {
    setIsSaving(true);
    setSaveProgress(0);
    
    const interval = setInterval(() => {
      setSaveProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSaving(false);
            setSaveProgress(0);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  return (
    <AdminLayout>
      <motion.div 
        className="w-full min-h-screen"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero Section com Glass-morphism */}
        <div className="relative w-full overflow-hidden">
          {/* Background com gradiente suave */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/20 via-transparent to-transparent dark:from-amber-900/10" />
            
            {/* Padrão decorativo */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-cyan-200/30 dark:from-teal-800/20 dark:to-cyan-800/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-emerald-200/30 to-green-200/30 dark:from-emerald-800/20 dark:to-green-800/20 rounded-full blur-3xl" />
          </div>

          {/* Conteúdo do Hero */}
          <div className="relative px-6 py-8 lg:py-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Título e Navegação */}
                <div className="space-y-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/estoque/produtos')}
                    className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar para produtos
                  </Button>

                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit className="h-8 w-8" />
                    </motion.div>
                    
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        Editar Produto
                      </h1>
                      <p className="text-lg text-muted-foreground mt-1">
                        {carregandoProduto ? (
                          "Carregando informações do produto..."
                        ) : produto ? (
                          `Editando: ${produto.nome}`
                        ) : (
                          `Produto não encontrado`
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="flex flex-wrap gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/50"
                    >
                      <History className="h-4 w-4" />
                      Histórico
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg"
                    >
                      {isSaving ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Barra de Progresso de Salvamento */}
              <AnimatePresence>
                {isSaving && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6"
                  >
                    <Progress value={saveProgress} className="h-2" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Formulário Principal */}
        <div className="px-6 py-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
                <ProdutoFormModerno produtoId={id} />
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default EditarProdutoPage; 