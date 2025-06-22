
import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ValidationSectionProps {
  validationNotes: string;
  onValidationNotesChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSaving: boolean;
  disableSubmit: boolean;
}

const ValidationSection: React.FC<ValidationSectionProps> = ({
  validationNotes,
  onValidationNotesChange,
  onSubmit,
  onCancel,
  isSaving,
  disableSubmit,
}) => {
  return (
    <>
      <div>
        <label className="text-sm font-medium">Notas Adicionais da Validação</label>
        <Textarea 
          value={validationNotes}
          onChange={(e) => onValidationNotesChange(e.target.value)}
          placeholder="Observações adicionais sobre esta receita (opcional)"
          className="min-h-[80px]"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSaving || disableSubmit}
          className="min-w-[180px]"
        >
          {isSaving ? (
            <>Processando...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Validar e Criar Pedido
            </>
          )}
        </Button>
      </div>
    </>
  );
};

export default ValidationSection;
