
import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MedicationForm, { Medication } from './MedicationForm';

interface MedicationsSectionProps {
  medications: Medication[];
  onMedicationChange: (index: number, field: keyof Medication, value: string | number | undefined) => void;
  onAddMedication: () => void;
  onRemoveMedication: (index: number) => void;
}

const MedicationsSection: React.FC<MedicationsSectionProps> = ({
  medications,
  onMedicationChange,
  onAddMedication,
  onRemoveMedication
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Medicamentos</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddMedication}
          type="button"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Adicionar Medicamento
        </Button>
      </div>
      
      <div className="space-y-4">
        {medications.map((medication, index) => (
          <MedicationForm
            key={index}
            medication={medication}
            index={index}
            onChange={onMedicationChange}
            onRemove={onRemoveMedication}
          />
        ))}

        {medications.length === 0 && (
          <div className="text-center py-8 border border-dashed rounded-md">
            <p className="text-muted-foreground">Nenhum medicamento adicionado</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddMedication}
              type="button"
              className="mt-2"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Adicionar Medicamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationsSection;
