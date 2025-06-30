import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useUnidades } from '@/hooks/useUnidades';

interface SelectUnidadeProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SelectUnidade: React.FC<SelectUnidadeProps> = ({ value, onChange, placeholder = 'Unidade' }) => {
  const { data: unidades, isLoading } = useUnidades();

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {unidades?.map((u) => (
          <SelectItem key={u.id} value={u.codigo}>
            {u.codigo} – {u.descricao}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}; 