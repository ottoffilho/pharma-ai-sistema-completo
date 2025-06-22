
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface Medication {
  name: string;
  dinamization?: string;
  form?: string;
  quantity?: number;
  unit?: string;
  dosage_instructions?: string;
}

interface MedicationFormProps {
  medication: Medication;
  index: number;
  onChange: (index: number, field: keyof Medication, value: string | number | undefined) => void;
  onRemove: (index: number) => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({ 
  medication, 
  index, 
  onChange, 
  onRemove 
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-medium">Medicamento {index + 1}</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onRemove(index)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Nome <span className="text-red-500">*</span></label>
            <Input 
              value={medication.name}
              onChange={(e) => onChange(index, 'name', e.target.value)}
              placeholder="Nome do medicamento"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Dinamização</label>
            <Input 
              value={medication.dinamization || ''}
              onChange={(e) => onChange(index, 'dinamization', e.target.value)}
              placeholder="Ex: 30CH, 6X, LM1"
              list="dinamizacoes"
            />
            <datalist id="dinamizacoes">
              <option value="6X" />
              <option value="12X" />
              <option value="30X" />
              <option value="6CH" />
              <option value="12CH" />
              <option value="30CH" />
              <option value="200CH" />
              <option value="LM1" />
              <option value="LM3" />
            </datalist>
          </div>
          
          <div>
            <label className="text-sm font-medium">Forma Farmacêutica</label>
            <Input 
              value={medication.form || ''}
              onChange={(e) => onChange(index, 'form', e.target.value)}
              placeholder="Ex: Glóbulos, Gotas, Tabletes"
              list="formas"
            />
            <datalist id="formas">
              <option value="Glóbulos" />
              <option value="Gotas" />
              <option value="Tabletes" />
              <option value="Comprimidos" />
              <option value="Pomada" />
              <option value="Creme" />
            </datalist>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Quantidade</label>
              <Input 
                type="number" 
                value={medication.quantity || ''}
                onChange={(e) => onChange(index, 'quantity', parseInt(e.target.value) || undefined)}
                placeholder="Quantidade"
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unidade</label>
              <Input 
                value={medication.unit || 'unidades'}
                onChange={(e) => onChange(index, 'unit', e.target.value)}
                placeholder="Ex: ml, g, unidades"
                list="unidades"
              />
              <datalist id="unidades">
                <option value="ml" />
                <option value="g" />
                <option value="unidades" />
                <option value="gotas" />
                <option value="glóbulos" />
              </datalist>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Posologia / Instruções</label>
            <Textarea 
              value={medication.dosage_instructions || ''}
              onChange={(e) => onChange(index, 'dosage_instructions', e.target.value)}
              placeholder="Instruções de uso"
              className="min-h-[80px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicationForm;
