import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Import our components
import OriginalPrescriptionPreview from './prescription/OriginalPrescriptionPreview';
import PatientPrescriberInfo from './prescription/PatientPrescriberInfo';
import MedicationsSection from './prescription/MedicationsSection';
import SuccessView from './prescription/SuccessView';
import ValidationSection from './prescription/ValidationSection';
import { Medication } from './prescription/MedicationForm';

interface PrescriptionData {
  medications: Medication[];
  patient_name?: string;
  patient_dob?: string;
  prescriber_name?: string;
  prescriber_identifier?: string;
  validation_notes?: string;
}

interface PrescriptionReviewFormProps {
  initialData: PrescriptionData;
  onSubmit: (data: PrescriptionData) => void;
  originalFiles: File[];
  showMobilePreview?: boolean;
}

const PrescriptionReviewForm: React.FC<PrescriptionReviewFormProps> = ({ 
  initialData, 
  onSubmit,
  originalFiles,
  showMobilePreview = false
}) => {
  const [formData, setFormData] = useState<PrescriptionData>({
    ...initialData,
    medications: initialData.medications.map(med => ({
      ...med,
      unit: med.unit || 'unidades' // Ensure unit field exists
    })),
    validation_notes: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const { toast } = useToast();
  
  // Preview file functionality
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    // Generate preview for the first file
    if (originalFiles.length > 0) {
      const file = originalFiles[0];
      if (file.type.includes('image')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }
  }, [originalFiles]);

  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { 
          name: '', 
          dinamization: '', 
          form: '', 
          quantity: 1, 
          unit: 'unidades',
          dosage_instructions: '' 
        }
      ]
    });
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = [...formData.medications];
    updatedMedications.splice(index, 1);
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  const handleMedicationChange = (index: number, field: keyof Medication, value: string | number) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  const handlePatientChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handlePrescriberChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validateForm = () => {
    // Basic validation - check that all medications have at least a name
    if (formData.medications.length === 0) {
      toast({
        title: "Validação falhou",
        description: "Adicione pelo menos um medicamento à receita",
        variant: "destructive",
      });
      return false;
    }
    
    for (const med of formData.medications) {
      if (!med.name || med.name.trim() === '') {
        toast({
          title: "Validação falhou",
          description: "Todos os medicamentos devem ter um nome",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      await onSubmit(formData);
      setReviewComplete(true);
      toast({
        title: "Receita validada com sucesso",
        description: "Os dados foram salvos e um pedido foi criado",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar receita",
        description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (reviewComplete) {
    return <SuccessView />;
  }

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original prescription preview - hidden on mobile unless toggled */}
        {(!showMobilePreview && window.innerWidth < 768) ? null : (
          <div className="order-2 md:order-1">
            <OriginalPrescriptionPreview 
              previewUrl={previewUrl}
              originalFiles={originalFiles}
            />
          </div>
        )}

        {/* Patient and prescriber info */}
        <div className="order-1 md:order-2">
          <PatientPrescriberInfo 
            patientName={formData.patient_name || ''}
            patientDob={formData.patient_dob || ''}
            prescriberName={formData.prescriber_name || ''}
            prescriberIdentifier={formData.prescriber_identifier || ''}
            onPatientChange={handlePatientChange}
            onPrescriberChange={handlePrescriberChange}
          />
        </div>
      </div>

      <Separator />

      {/* Medications section */}
      <MedicationsSection 
        medications={formData.medications}
        onMedicationChange={handleMedicationChange}
        onAddMedication={handleAddMedication}
        onRemoveMedication={handleRemoveMedication}
      />

      <Separator />

      {/* Validation section with notes and buttons */}
      <ValidationSection
        validationNotes={formData.validation_notes || ''}
        onValidationNotesChange={(value) => handlePatientChange('validation_notes', value)}
        onSubmit={handleSubmit}
        onCancel={() => onSubmit(initialData)}
        isSaving={isSaving}
        disableSubmit={formData.medications.length === 0}
      />
    </div>
  );
};

export default PrescriptionReviewForm;
