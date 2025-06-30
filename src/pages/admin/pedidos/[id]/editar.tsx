import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { parse, format } from 'date-fns';
import AdminLayout from '@/components/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash, Edit3, User, UserCheck, Calendar, Hash, Pill, FileText, Activity, CheckCircle, Save, ArrowLeft } from 'lucide-react';

interface Medication {
  name: string;
  dinamization?: string;
  form?: string;
  quantity?: number;
  unit?: string;
  dosage_instructions?: string;
}

interface ProcessedPrescription {
  id: string;
  patient_name: string | null;
  prescriber_name: string | null;
  prescriber_identifier: string | null;
  medications: Medication[];
  validation_status: string;
  validation_notes: string | null;
}

interface OrderData {
  id: string;
  total_amount: number;
  estimated_delivery_date: string | null;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'validated', label: 'Validado' },
  { value: 'rejected', label: 'Rejeitado' }
];

const EditarReceitaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: prescription, isLoading } = useQuery<ProcessedPrescription | null>({
    queryKey: ['prescription-edit', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('receitas_processadas')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ProcessedPrescription | null;
    },
    enabled: Boolean(id)
  });

  const { data: order } = useQuery<OrderData | null>({
    queryKey: ['order-edit', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('processed_recipe_id', id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as OrderData | null;
    },
    enabled: Boolean(id)
  });

  const [formData, setFormData] = useState({
    validation_status: 'pending',
    validation_notes: '',
    patient_name: '',
    patient_dob: '',
    prescriber_name: '',
    prescriber_identifier: '',
    medications: [] as Medication[],
    total_amount: 0,
    estimated_delivery_date: ''
  });

  React.useEffect(() => {
    if (!prescription) return;
    setFormData(prev => ({
      ...prev,
      validation_status: prescription.validation_status,
      validation_notes: prescription.validation_notes ?? '',
      patient_name: prescription.patient_name ?? '',
      prescriber_name: prescription.prescriber_name ?? '',
      prescriber_identifier: prescription.prescriber_identifier ?? '',
      medications: prescription.medications ?? []
    }));
  }, [prescription]);

  React.useEffect(() => {
    if (!order) return;
    setFormData(prev => ({
      ...prev,
      total_amount: order.total_amount ?? 0,
      estimated_delivery_date: order.estimated_delivery_date ?? ''
    }));
  }, [order]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID não encontrado');
      const { error } = await supabase
        .from('receitas_processadas')
        .update({
          validation_status: formData.validation_status,
          validation_notes: formData.validation_notes || null,
          patient_name: formData.patient_name || null,
          patient_dob: formData.patient_dob || null,
          prescriber_name: formData.prescriber_name || null,
          prescriber_identifier: formData.prescriber_identifier || null,
          medications: formData.medications
        })
        .eq('id', id);
      if (error) throw error;
      if (order) {
        const { error: orderErr } = await supabase
          .from('pedidos')
          .update({
            total_amount: formData.total_amount,
            estimated_delivery_date: formData.estimated_delivery_date || null
          })
          .eq('id', order.id);
        if (orderErr) throw orderErr;
      }
    },
    onSuccess: () => {
      toast({ title: 'Receita atualizada com sucesso' });
      navigate(`/admin/pedidos/${id}`);
    },
    onError: (err: unknown) => {
      toast({ title: 'Erro ao atualizar', description: err instanceof Error ? err.message : 'Erro desconhecido', variant: 'destructive' });
    }
  });

  if (isLoading || !prescription) {
    return (
      <AdminLayout>
        <div className="container-section py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-muted-foreground">Carregando dados da receita...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="space-y-8 mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/admin/pedidos/${id}`} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para detalhes
            </Link>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border shadow-sm p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                  <Edit3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">Editar Receita</h1>
                  <p className="text-base text-muted-foreground">Modifique informações da receita processada</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="cancel" asChild className="transition-colors duration-200">
                  <Link to={`/admin/pedidos/${id}`}>Cancelar</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">

          <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
              </div>
              <CardDescription>Atualize status e observações da receita</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Status da Receita
                  </label>
                  <Select
                    value={formData.validation_status}
                    onValueChange={(value) => setFormData({ ...formData, validation_status: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-600" />
                    Observações / Notas
                  </label>
                  <Textarea
                    value={formData.validation_notes}
                    onChange={(e) => setFormData({ ...formData, validation_notes: e.target.value })}
                    placeholder="Descreva observações da validação ou motivo da rejeição"
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Dados do Paciente</CardTitle>
                </div>
                <CardDescription>Informações pessoais do paciente</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Nome do Paciente
                    </label>
                    <Input 
                      value={formData.patient_name}
                      onChange={e=>setFormData({...formData,patient_name:e.target.value})}
                      placeholder="Nome completo do paciente"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      Data de Nascimento
                    </label>
                    <Input 
                      type="date" 
                      value={formData.patient_dob}
                      onChange={e=>setFormData({...formData,patient_dob:e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">Dados do Prescritor</CardTitle>
                </div>
                <CardDescription>Informações do médico responsável</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-purple-600" />
                      Nome do Prescritor
                    </label>
                    <Input 
                      value={formData.prescriber_name}
                      onChange={e=>setFormData({...formData,prescriber_name:e.target.value})}
                      placeholder="Nome completo do médico"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4 text-orange-600" />
                      Identificação (CRM | CPF)
                    </label>
                    <Input 
                      value={formData.prescriber_identifier}
                      onChange={e=>setFormData({...formData,prescriber_identifier:e.target.value})}
                      placeholder="CRM ou CPF do prescritor"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Medicamentos Prescritos</CardTitle>
              </div>
              <CardDescription>Edite ou adicione medicamentos prescritos</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {formData.medications.map((med, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">Medicamento {idx + 1}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={()=>{
                          const m=[...formData.medications]; 
                          m.splice(idx,1); 
                          setFormData({...formData,medications:m});
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4"/>
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Nome do Medicamento</label>
                        <Input 
                          placeholder="Nome do medicamento" 
                          value={med.name}
                          onChange={e=>{
                            const m=[...formData.medications];
                            m[idx].name=e.target.value; 
                            setFormData({...formData,medications:m});
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Dinamização</label>
                        <Input 
                          placeholder="Ex: 6CH, 12CH" 
                          value={med.dinamization ?? ''}
                          onChange={e=>{const m=[...formData.medications]; m[idx].dinamization=e.target.value; setFormData({...formData,medications:m});}}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Forma Farmacêutica</label>
                        <Input 
                          placeholder="Ex: Gotas, Glóbulos" 
                          value={med.form ?? ''}
                          onChange={e=>{const m=[...formData.medications]; m[idx].form=e.target.value; setFormData({...formData,medications:m});}}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Quantidade</label>
                        <Input 
                          placeholder="Quantidade" 
                          type="number" 
                          value={med.quantity ?? ''}
                          onChange={e=>{const m=[...formData.medications]; m[idx].quantity=Number(e.target.value); setFormData({...formData,medications:m});}}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Unidade</label>
                        <Input 
                          placeholder="Ex: mL, frascos" 
                          value={med.unit ?? ''}
                          onChange={e=>{const m=[...formData.medications]; m[idx].unit=e.target.value; setFormData({...formData,medications:m});}}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Instruções de Uso</label>
                        <Input 
                          placeholder="Como tomar o medicamento" 
                          value={med.dosage_instructions ?? ''}
                          onChange={e=>{const m=[...formData.medications]; m[idx].dosage_instructions=e.target.value; setFormData({...formData,medications:m});}}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={()=>{
                    setFormData({...formData,medications:[...formData.medications,{name:'',quantity:1}]});
                  }}
                  className="w-full border-dashed border-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 mr-2"/>
                  Adicionar Medicamento
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valores & Entrega</CardTitle>
              <CardDescription>
                Dados financeiros e logísticos do pedido. Se preferir que o sistema calcule o valor
                automaticamente, deixe o campo em branco e clique no botão <strong>"Gerar Orçamento"</strong>
                na tela de detalhes; caso já possua o valor final aprovado, preencha manualmente abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valor Total (R$)</label>
                <Input type="number" step="0.01" value={formData.total_amount}
                  onChange={e=>setFormData({...formData,total_amount:Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entrega Prevista</label>
                <Input type="date" value={formData.estimated_delivery_date}
                  onChange={e=>setFormData({...formData,estimated_delivery_date:e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" asChild className="transition-colors duration-200">
              <Link to={`/admin/pedidos/${id}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button 
              onClick={() => updateMutation.mutate()} 
              disabled={updateMutation.isLoading}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all duration-200 shadow-sm hover:shadow-md min-w-[140px]"
            >
              {updateMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditarReceitaPage;