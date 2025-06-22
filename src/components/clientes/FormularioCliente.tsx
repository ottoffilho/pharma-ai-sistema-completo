// =====================================================
// FORMULÁRIO DE CLIENTE - CRIAR/EDITAR
// =====================================================

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, InfoIcon, UserIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  formatarCPF, 
  formatarCNPJ, 
  formatarTelefone, 
  validarCPF, 
  validarCNPJ, 
  validarEmail,
  validarDataNascimento,
  determinarTipoDocumento,
  apenasNumeros 
} from '@/lib/utils/validacao';
import type { Cliente, ClienteFormData } from '@/types/cliente';

// =====================================================
// SCHEMA DE VALIDAÇÃO
// =====================================================

const esquemaCliente = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome não pode exceder 255 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  cpf: z.string()
    .optional()
    .refine((val) => !val || validarCPF(val), 'CPF inválido'),
  
  cnpj: z.string()
    .optional()
    .refine((val) => !val || validarCNPJ(val), 'CNPJ inválido'),
  
  telefone: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const numeros = apenasNumeros(val);
      return numeros.length === 10 || numeros.length === 11;
    }, 'Telefone deve ter 10 ou 11 dígitos'),
  
  email: z.string()
    .optional()
    .refine((val) => !val || validarEmail(val), 'Email inválido'),
  
  endereco: z.string()
    .max(500, 'Endereço não pode exceder 500 caracteres')
    .optional(),
  
  data_nascimento: z.string()
    .optional()
    .refine((val) => !val || validarDataNascimento(val), 'Data de nascimento não pode ser futura'),
  
  pontos_fidelidade: z.number()
    .min(0, 'Pontos não podem ser negativos')
    .optional(),
  
  ativo: z.boolean().optional(),
}).refine((data) => {
  // Pelo menos um documento deve ser fornecido
  return data.cpf || data.cnpj;
}, {
  message: 'Informe pelo menos CPF ou CNPJ',
  path: ['cpf'],
}).refine((data) => {
  // Não pode ter CPF e CNPJ ao mesmo tempo
  return !(data.cpf && data.cnpj);
}, {
  message: 'Informe apenas CPF ou CNPJ, não ambos',
  path: ['cnpj'],
});

type FormData = z.infer<typeof esquemaCliente>;

// =====================================================
// INTERFACE DO COMPONENTE
// =====================================================

interface FormularioClienteProps {
  cliente?: Cliente;
  onSubmit: (dados: ClienteFormData) => void;
  onCancelar: () => void;
  carregando?: boolean;
  modo?: 'criar' | 'editar';
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function FormularioCliente({
  cliente,
  onSubmit,
  onCancelar,
  carregando = false,
  modo = 'criar'
}: FormularioClienteProps) {
  const [tipoDocumento, setTipoDocumento] = useState<'cpf' | 'cnpj'>('cpf');
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>(
    cliente?.data_nascimento ? new Date(cliente.data_nascimento) : undefined
  );

  const form = useForm<FormData>({
    resolver: zodResolver(esquemaCliente),
    defaultValues: {
      nome: cliente?.nome || '',
      cpf: cliente?.cpf || '',
      cnpj: cliente?.cnpj || '',
      telefone: cliente?.telefone || '',
      email: cliente?.email || '',
      endereco: cliente?.endereco || '',
      data_nascimento: cliente?.data_nascimento || '',
      pontos_fidelidade: cliente?.pontos_fidelidade || 0,
      ativo: cliente?.ativo ?? true,
    },
  });

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    if (cliente) {
      const tipoDetectado = cliente.cpf ? 'cpf' : 'cnpj';
      setTipoDocumento(tipoDetectado);
    }
  }, [cliente]);

  // =====================================================
  // MANIPULADORES DE EVENTOS
  // =====================================================

  const handleSubmit = (data: FormData) => {
    const dadosFormatados: ClienteFormData = {
      nome: data.nome.trim(),
      cpf: data.cpf ? apenasNumeros(data.cpf) : undefined,
      cnpj: data.cnpj ? apenasNumeros(data.cnpj) : undefined,
      telefone: data.telefone ? apenasNumeros(data.telefone) : undefined,
      email: data.email?.toLowerCase().trim() || undefined,
      endereco: data.endereco?.trim() || undefined,
      data_nascimento: data.data_nascimento || undefined,
      pontos_fidelidade: data.pontos_fidelidade || 0,
      ativo: data.ativo ?? true,
    };

    onSubmit(dadosFormatados);
  };

  const handleTipoDocumentoChange = (tipo: 'cpf' | 'cnpj') => {
    setTipoDocumento(tipo);
    
    // Limpar o campo não usado
    if (tipo === 'cpf') {
      form.setValue('cnpj', '');
    } else {
      form.setValue('cpf', '');
    }
    
    // Limpar erros
    form.clearErrors(['cpf', 'cnpj']);
  };

  const handleDocumentoChange = (valor: string) => {
    const numeros = apenasNumeros(valor);
    
    if (tipoDocumento === 'cpf') {
      const cpfFormatado = formatarCPF(numeros);
      form.setValue('cpf', cpfFormatado);
    } else {
      const cnpjFormatado = formatarCNPJ(numeros);
      form.setValue('cnpj', cnpjFormatado);
    }
  };

  const handleTelefoneChange = (valor: string) => {
    const telefoneFormatado = formatarTelefone(valor);
    form.setValue('telefone', telefoneFormatado);
  };

  const handleDataNascimentoChange = (data: Date | undefined) => {
    setDataNascimento(data);
    form.setValue('data_nascimento', data ? data.toISOString().split('T')[0] : '');
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          {modo === 'criar' ? 'Novo Cliente' : 'Editar Cliente'}
        </CardTitle>
        <CardDescription>
          {modo === 'criar' 
            ? 'Preencha os dados para cadastrar um novo cliente'
            : 'Altere os dados do cliente conforme necessário'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Nome Completo *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite o nome completo"
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Documento */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Documento *</Label>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleTipoDocumentoChange('cpf')}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    tipoDocumento === 'cpf'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  CPF (Pessoa Física)
                </button>
                
                <button
                  type="button"
                  onClick={() => handleTipoDocumentoChange('cnpj')}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    tipoDocumento === 'cnpj'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  CNPJ (Pessoa Jurídica)
                </button>
              </div>

              {/* Campo CPF */}
              {tipoDocumento === 'cpf' && (
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          onChange={(e) => handleDocumentoChange(e.target.value)}
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Campo CNPJ */}
              {tipoDocumento === 'cnpj' && (
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                          onChange={(e) => handleDocumentoChange(e.target.value)}
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Dados de Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Telefone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        onChange={(e) => handleTelefoneChange(e.target.value)}
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="cliente@email.com"
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Endereço */}
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Endereço</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Rua, número, bairro, cidade, CEP"
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data de Nascimento e Pontos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Data de Nascimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-10 w-full justify-start text-left font-normal",
                              !dataNascimento && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dataNascimento 
                              ? format(dataNascimento, "dd/MM/yyyy", { locale: ptBR })
                              : "Selecione a data"
                            }
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataNascimento}
                          onSelect={handleDataNascimentoChange}
                          disabled={(date) => date > new Date()}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pontos_fidelidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Pontos de Fidelidade</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        placeholder="0"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Ativo */}
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Cliente Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Clientes inativos não aparecerão nas buscas do sistema
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Aviso sobre campos obrigatórios */}
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Os campos marcados com * são obrigatórios. O cliente deve ter pelo menos um documento (CPF ou CNPJ).
              </AlertDescription>
            </Alert>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelar}
                disabled={carregando}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={carregando}
                className="min-w-[120px]"
              >
                {carregando 
                  ? 'Salvando...' 
                  : modo === 'criar' ? 'Criar Cliente' : 'Salvar Alterações'
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 