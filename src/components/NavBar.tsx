import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoPharmaAI from '@/assets/logo/phama-horizon.png';

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-6'}
      `}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center">
          <Link to="/" className="flex items-center">
            <img src={logoPharmaAI} alt="Logo Pharma-AI" className="h-12 w-auto" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
