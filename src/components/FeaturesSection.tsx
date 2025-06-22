import React from 'react';
import { 
  FileSearch, 
  ChartBar, 
  Users, 
  Calendar, 
  Database, 
  ShieldCheck, 
  ChevronRight
} from 'lucide-react';

interface FeatureItem {
  id: string;
  icon: JSX.Element;
  title: string;
  description: string;
  learnMoreLink: string;
}

const featuresData: FeatureItem[] = [
  {
    id: 'atendimento-agil',
    icon: <FileSearch className="h-10 w-10 text-homeo-blue" />,
    title: 'Atendimento Ágil e Inteligente',
    description: 'Interprete receitas homeopáticas com precisão e rapidez, reduzindo o tempo de atendimento e eliminando erros comuns.',
    learnMoreLink: '#atendimento-agil-details'
  },
  {
    id: 'gestao-clientes',
    icon: <Users className="h-10 w-10 text-homeo-green" />,
    title: 'Gestão de Clientes',
    description: 'Mantenha um histórico completo de cada cliente, incluindo receitas anteriores, preferências e informações de contato.',
    learnMoreLink: '#gestao-clientes-details'
  },
  {
    id: 'orcamentacao-segundos',
    icon: <ChartBar className="h-10 w-10 text-homeo-blue" />,
    title: 'Orçamento em Segundos',
    description: 'Gere orçamentos precisos e automáticos para qualquer fórmula homeopática complexa com apenas alguns cliques.',
    learnMoreLink: '#orcamentacao-segundos-details'
  },
  {
    id: 'estoque-controle',
    icon: <Database className="h-10 w-10 text-homeo-green" />,
    title: 'Estoque Sob Controle',
    description: 'Gerencie seu inventário de insumos homeopáticos com alertas automáticos para reposição e rastreamento de validade.',
    learnMoreLink: '#estoque-controle-details'
  },
  {
    id: 'agendamento-inteligente',
    icon: <Calendar className="h-10 w-10 text-homeo-blue" />,
    title: 'Agendamento Inteligente',
    description: 'Organize retiradas e entregas com um sistema de agendamento que se integra ao fluxo de produção.',
    learnMoreLink: '#agendamento-inteligente-details'
  },
  {
    id: 'seguranca-compliance',
    icon: <ShieldCheck className="h-10 w-10 text-homeo-green" />,
    title: 'Segurança e Compliance',
    description: 'Mantenha-se em conformidade com regulamentações do setor e LGPD com nossa estrutura de segurança avançada.',
    learnMoreLink: '#seguranca-compliance-details'
  }
];

const FeaturesSection: React.FC = (): JSX.Element => {
  return (
    <section id="features" className="py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          O Pharma.AI oferece um conjunto completo de funcionalidades desenvolvidas especificamente para Farmácias de Manipulação,
          garantindo eficiência, conformidade e crescimento para o seu negócio.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {featuresData.map((feature: FeatureItem) => (
            <div 
              key={feature.id}
              className="group"
            >
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col relative overflow-hidden group-hover:-translate-y-1 transition-transform">
                <div className="absolute top-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r from-homeo-green to-homeo-blue transition-all duration-300"></div>
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="heading-sm mb-3 text-homeo-gray-dark">
                  {feature.title}
                </h3>
                <p className="text-homeo-gray flex-grow">
                  {feature.description}
                </p>
                <a
                  href={feature.learnMoreLink}
                  className="mt-auto inline-flex items-center text-sm font-medium text-homeo-green hover:underline pt-4"
                >
                  Saiba Mais <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
