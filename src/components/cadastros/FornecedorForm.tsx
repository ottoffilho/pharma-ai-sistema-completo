import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Adiciona classe unificada para campos de entrada (modo claro/escuro)
const inputCls = "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-emerald-600/40 dark:bg-slate-700/60 dark:border-slate-700 dark:text-white";

// Schema de validação
const fornecedorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos').max(14, 'CNPJ deve ter 14 dígitos').optional().or(z.literal('')),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(11, 'CPF deve ter 11 dígitos').optional().or(z.literal('')),
  tipo: z.enum(['juridica', 'fisica']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().min(1, 'Telefone é obrigatório').max(20, 'Telefone deve ter no máximo 20 caracteres'),
  endereco: z.string().max(300, 'Endereço deve ter no máximo 300 caracteres').optional().or(z.literal('')),
  cidade: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  estado: z.string().max(2, 'Estado deve ter 2 caracteres').optional().or(z.literal('')),
  cep: z.string().max(10, 'CEP deve ter no máximo 10 caracteres').optional().or(z.literal('')),
  observacoes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional().or(z.literal(''))
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface FornecedorFormProps {
  fornecedor?: any;
  onSubmit: (data: FornecedorFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function FornecedorForm({ 
  fornecedor, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: FornecedorFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      cpf: '',
      tipo: 'juridica',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      observacoes: ''
    }
  });

  const tipoSelecionado = watch('tipo');

  // Carregar dados do fornecedor para edição
  useEffect(() => {
    if (fornecedor) {
      reset({
        nome: fornecedor.nome || '',
        cnpj: fornecedor.cnpj || '',
        cpf: fornecedor.cpf || '',
        tipo: fornecedor.tipo || 'juridica',
        email: fornecedor.email || '',
        telefone: fornecedor.telefone || '',
        endereco: fornecedor.endereco || '',
        cidade: fornecedor.cidade || '',
        estado: fornecedor.estado || '',
        cep: fornecedor.cep || '',
        observacoes: fornecedor.observacoes || ''
      });
    }
  }, [fornecedor, reset]);

  // Função para formatar CNPJ
  const formatarCNPJ = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers.slice(0, 14);
  };

  // Função para formatar CPF
  const formatarCPF = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers.slice(0, 11);
  };

  // Função para formatar telefone
  const formatarTelefone = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers.slice(0, 15);
  };

  // Função para formatar CEP
  const formatarCEP = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers.slice(0, 8);
  };

  const handleFormSubmit = async (data: FornecedorFormData) => {
    try {
      setSubmitting(true);

      // Validar documento baseado no tipo
      if (data.tipo === 'juridica' && !data.cnpj) {
        toast({
          title: "Erro de validação",
          description: "CNPJ é obrigatório para pessoa jurídica",
          variant: "destructive"
        });
        return;
      }

      if (data.tipo === 'fisica' && !data.cpf) {
        toast({
          title: "Erro de validação", 
          description: "CPF é obrigatório para pessoa física",
          variant: "destructive"
        });
        return;
      }

      await onSubmit(data);
      
      toast({
        title: "Sucesso",
        description: `Fornecedor ${fornecedor ? 'atualizado' : 'cadastrado'} com sucesso!`,
      });

    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      toast({
        title: "Erro",
        description: error.message || `Erro ao ${fornecedor ? 'atualizar' : 'cadastrar'} fornecedor`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-sm mt-8 mb-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Nome do fornecedor"
                className={`${inputCls} ${errors.nome ? 'border-red-500' : ''}`}
              />
              {errors.nome && (
                <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de Pessoa *</Label>
              <Select 
                value={tipoSelecionado} 
                onValueChange={(value) => setValue('tipo', value as 'juridica' | 'fisica')}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoSelecionado === 'juridica' ? (
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  {...register('cnpj')}
                  placeholder="00.000.000/0000-00"
                  onChange={(e) => {
                    const formatted = formatarCNPJ(e.target.value);
                    setValue('cnpj', formatted);
                  }}
                  className={`${inputCls} ${errors.cnpj ? 'border-red-500' : ''}`}
                />
                {errors.cnpj && (
                  <p className="text-sm text-red-500 mt-1">{errors.cnpj.message}</p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                  onChange={(e) => {
                    const formatted = formatarCPF(e.target.value);
                    setValue('cpf', formatted);
                  }}
                  className={`${inputCls} ${errors.cpf ? 'border-red-500' : ''}`}
                />
                {errors.cpf && (
                  <p className="text-sm text-red-500 mt-1">{errors.cpf.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                {...register('telefone')}
                placeholder="(00) 00000-0000"
                onChange={(e) => {
                  const formatted = formatarTelefone(e.target.value);
                  setValue('telefone', formatted);
                }}
                className={`${inputCls} ${errors.telefone ? 'border-red-500' : ''}`}
              />
              {errors.telefone && (
                <p className="text-sm text-red-500 mt-1">{errors.telefone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="fornecedor@email.com"
                className={`${inputCls} ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Endereço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  {...register('endereco')}
                  placeholder="Rua, número, bairro"
                  className={`${inputCls} ${errors.endereco ? 'border-red-500' : ''}`}
                />
                {errors.endereco && (
                  <p className="text-sm text-red-500 mt-1">{errors.endereco.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  {...register('cep')}
                  placeholder="00000-000"
                  onChange={(e) => {
                    const formatted = formatarCEP(e.target.value);
                    setValue('cep', formatted);
                  }}
                  className={`${inputCls} ${errors.cep ? 'border-red-500' : ''}`}
                />
                {errors.cep && (
                  <p className="text-sm text-red-500 mt-1">{errors.cep.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  {...register('cidade')}
                  placeholder="Nome da cidade"
                  className={`${inputCls} ${errors.cidade ? 'border-red-500' : ''}`}
                />
                {errors.cidade && (
                  <p className="text-sm text-red-500 mt-1">{errors.cidade.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  {...register('estado')}
                  placeholder="UF"
                  maxLength={2}
                  className={`${inputCls} ${errors.estado ? 'border-red-500' : ''}`}
                />
                {errors.estado && (
                  <p className="text-sm text-red-500 mt-1">{errors.estado.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações adicionais sobre o fornecedor"
              rows={3}
              className={`${inputCls} ${errors.observacoes ? 'border-red-500' : ''}`}
            />
            {errors.observacoes && (
              <p className="text-sm text-red-500 mt-1">{errors.observacoes.message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting || isLoading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="flex-1"
            >
              {(submitting || isLoading) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {fornecedor ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 