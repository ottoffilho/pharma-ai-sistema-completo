import React, { useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { HeroSection } from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
import FeaturesSection from '@/components/FeaturesSection';
import AISection from '@/components/AISection';
import HowItWorksSection from '@/components/HowItWorksSection';
import WhyChooseSection from '@/components/WhyChooseSection';
// import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index: React.FC = () => {
  // Update the document title
  useEffect(() => {
    document.title = "Pharma.AI | Sistema de Gestão para Farmácias Homeopáticas";
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <NavBar />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <AISection />
        <HowItWorksSection />
        <WhyChooseSection />
        {/* <TestimonialsSection /> */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
