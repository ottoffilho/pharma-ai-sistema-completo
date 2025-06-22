import { Brain, FlaskConical, FileSearch, ChartPie } from 'lucide-react';

const aiFeatures = [
  {
    icon: <FileSearch className="h-8 w-8 text-homeo-accent" />,
    title: 'Interpretação de Receitas',
    description: 'Reconhecimento e análise de receitas homeopáticas manuscritas com precisão superior a 98%.'
  },
  {
    icon: <FlaskConical className="h-8 w-8 text-homeo-accent" />,
    title: 'Cálculos de Diluição',
    description: 'Automatização de cálculos complexos de diluições, potências e dosagens homeopáticas.'
  },
  {
    icon: <ChartPie className="h-8 w-8 text-homeo-accent" />,
    title: 'Previsão de Demanda',
    description: 'Análise preditiva para antecipação de necessidades de estoque e sazonalidades.'
  },
  {
    icon: <Brain className="h-8 w-8 text-homeo-accent" />,
    title: 'Aprendizado Contínuo',
    description: 'Sistema que evolui com o uso, adaptando-se às particularidades de cada farmácia.'
  }
];

const AISection = () => {
  return (
    <section id="ai" className="bg-gradient-to-br from-homeo-blue-dark/95 to-homeo-green-dark/95 text-white">
      <div className="container-section relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full opacity-5"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-homeo-blue-light rounded-full opacity-5"></div>
        
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="heading-lg text-white mb-6">
            A Força da Inteligência Artificial na Sua Farmácia
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-2xl mx-auto">
            Nossa tecnologia de IA especializada em gestão farmacêutica oferece precisão e agilidade nunca antes vistas
            no setor, revolucionando a maneira como as Farmácias de Manipulação operam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 mb-16">
          {aiFeatures.map((feature, index) => (
            <div 
              key={index}
              className="flex items-start space-x-6"
            >
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/80">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AISection;
