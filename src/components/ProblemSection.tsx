import React from 'react';
import { AlertTriangle, Clock, FileSearch, BarChart3, Brain } from 'lucide-react';

interface ChallengeItem {
  icon: JSX.Element;
  title: string;
  description: string;
}

const challenges: ChallengeItem[] = [
  {
    icon: <FileSearch className="h-8 w-8 text-homeo-green" />,
    title: 'Interpretação Manual de Receitas',
    description: 'Tempo excessivo e risco de erros na análise manual de receitas homeopáticas complexas.'
  },
  {
    icon: <Clock className="h-8 w-8 text-homeo-blue" />,
    title: 'Atendimento Demorado',
    description: 'Clientes esperando enquanto farmacêuticos conferem cálculos e fórmulas manualmente.'
  },
  {
    icon: <AlertTriangle className="h-8 w-8 text-homeo-accent" />,
    title: 'Erros no Processo',
    description: 'Riscos de erros humanos em dosagens, diluições e seleção de componentes.'
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-homeo-green" />,
    title: 'Gestão Desintegrada',
    description: 'Múltiplos sistemas ou planilhas não conectados gerando retrabalho e ineficiência.'
  },
  {
    icon: <Brain className="h-8 w-8 text-homeo-blue" />,
    title: 'Falta de Inteligência de Negócio',
    description: 'Ausência de insights e previsões para melhor gestão do estoque e atendimento.'
  }
];

const ProblemSection: React.FC = () => {
  return (
    <section id="problemas" className="relative bg-white">
      <div className="container-section pb-32">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="heading-lg gradient-text mb-6">
            Desafios das Farmácias de Manipulação Hoje
          </h2>
          <p className="paragraph">
            As farmácias de manipulação homeopáticas enfrentam desafios únicos que sistemas convencionais não conseguem resolver.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {challenges.map((challenge: ChallengeItem, index: number) => (
            <div 
              key={index} 
              className="feature-card hover:border-l-4 hover:border-homeo-green transition-all"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4">
                {challenge.icon}
              </div>
              <h3 className="heading-sm mb-3 text-homeo-gray-dark">
                {challenge.title}
              </h3>
              <p className="text-homeo-gray">
                {challenge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-white via-white/50 to-homeo-green-light/50 pointer-events-none"></div>
    </section>
  );
};

export default ProblemSection;
