/**
 * Helium AI Agent Attribution Component
 * Developed by NeuralArc Inc (neuralarc.ai)
 * 
 * This component displays NeuralArc Inc branding and attribution
 * throughout the Helium AI Agent interface
 */

import React from 'react';
import { Brain, ExternalLink, Zap } from 'lucide-react';

interface HeliumAttributionProps {
  variant?: 'header' | 'footer' | 'sidebar' | 'modal';
  showLogo?: boolean;
  showLink?: boolean;
  className?: string;
}

export const HeliumAttribution: React.FC<HeliumAttributionProps> = ({
  variant = 'footer',
  showLogo = true,
  showLink = true,
  className = ''
}) => {
  const baseClasses = 'flex items-center space-x-2 text-gray-500 dark:text-gray-400';
  
  const variantClasses = {
    header: 'text-sm',
    footer: 'text-xs',
    sidebar: 'text-xs',
    modal: 'text-sm'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {showLogo && (
        <div className="flex items-center space-x-1">
          <div className="relative">
            <Brain className="w-4 h-4 text-blue-500" />
            <Zap className="w-2 h-2 text-yellow-400 absolute -top-0.5 -right-0.5" />
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Helium</span>
        </div>
      )}
      
      <span className="text-gray-500 dark:text-gray-400">
        Developed by
      </span>
      
      {showLink ? (
        <a
          href="https://neuralarc.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <span className="font-semibold">NeuralArc Inc</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          NeuralArc Inc
        </span>
      )}
    </div>
  );
};

export const HeliumPoweredBy: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
    <span>Powered by</span>
    <div className="flex items-center space-x-1">
      <Brain className="w-3 h-3 text-blue-500" />
      <span className="font-semibold text-blue-500">Helium AI</span>
    </div>
    <span>•</span>
    <a
      href="https://neuralarc.ai"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
    >
      NeuralArc Inc
    </a>
  </div>
);

export const HeliumBranding: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        <Brain className={`${iconSizes[size]} text-blue-500`} />
        <Zap className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} text-yellow-400 absolute -top-1 -right-1`} />
      </div>
      <div className="flex flex-col">
        <h1 className={`${sizeClasses[size]} font-bold text-gray-900 dark:text-white`}>
          Helium
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          by NeuralArc Inc
        </p>
      </div>
    </div>
  );
};

export default HeliumAttribution;

