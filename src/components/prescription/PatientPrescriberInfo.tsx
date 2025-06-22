
import React from 'react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface PatientPrescriberInfoProps {
  patientName: string;
  patientDob: string;
  prescriberName: string;
  prescriberIdentifier: string;
  onPatientChange: (field: string, value: string) => void;
  onPrescriberChange: (field: string, value: string) => void;
}

const PatientPrescriberInfo: React.FC<PatientPrescriberInfoProps> = ({
  patientName,
  patientDob,
  prescriberName,
  prescriberIdentifier,
  onPatientChange,
  onPrescriberChange
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Informações Gerais</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-sm font-medium">Nome do Paciente</label>
            <Input 
              value={patientName}
              onChange={(e) => onPatientChange('patient_name', e.target.value)}
              placeholder="Nome completo do paciente"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Data de Nascimento</label>
            <Input 
              type="date" 
              value={patientDob}
              onChange={(e) => onPatientChange('patient_dob', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator className="my-4" />
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-sm font-medium">Nome do Prescritor</label>
            <Input 
              value={prescriberName}
              onChange={(e) => onPrescriberChange('prescriber_name', e.target.value)}
              placeholder="Nome do médico/prescritor"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Identificação do Prescritor (CRM)</label>
            <Input 
              value={prescriberIdentifier}
              onChange={(e) => onPrescriberChange('prescriber_identifier', e.target.value)}
              placeholder="Ex: CRM 12345-SP"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPrescriberInfo;
