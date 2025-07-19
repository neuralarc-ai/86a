import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sunrise, Sunset, Coffee, Star, Zap } from 'lucide-react';
import { AnimatedHeliumLogo } from './animated-components';

interface PersonalizedGreetingProps {
  userName?: string;
  className?: string;
  showIcon?: boolean;
  animated?: boolean;
}

interface GreetingData {
  message: string;
  icon: React.ComponentType<any>;
  gradient: string;
  timeRange: string;
}

export const PersonalizedGreeting: React.FC<PersonalizedGreetingProps> = ({
  userName,
  className = '',
  showIcon = true,
  animated = true,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Memoized greeting data based on time
  const greetingData = useMemo((): GreetingData => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      return {
        message: 'Good morning',
        icon: userName ? Sunrise : Coffee,
        gradient: 'from-orange-400 to-yellow-500',
        timeRange: 'morning',
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        message: 'Good afternoon',
        icon: Sun,
        gradient: 'from-blue-400 to-cyan-500',
        timeRange: 'afternoon',
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        message: 'Good evening',
        icon: Sunset,
        gradient: 'from-purple-400 to-pink-500',
        timeRange: 'evening',
      };
    } else {
      return {
        message: 'Good night',
        icon: userName ? Moon : Star,
        gradient: 'from-indigo-500 to-purple-600',
        timeRange: 'night',
      };
    }
  }, [currentTime, userName]);

  // Additional contextual messages
  const getContextualMessage = (): string => {
    const hour = currentTime.getHours();
    const day = currentTime.getDay();
    
    if (!userName) return '';
    
    // Weekend messages
    if (day === 0 || day === 6) {
      if (hour >= 9 && hour < 12) return "Hope you're having a relaxing weekend!";
      if (hour >= 18) return "Enjoying your weekend evening?";
    }
    
    // Weekday messages
    if (hour >= 6 && hour < 9) return "Ready to start the day?";
    if (hour >= 12 && hour < 14) return "How's your day going so far?";
    if (hour >= 17 && hour < 19) return "Wrapping up the day?";
    if (hour >= 21) return "Working late tonight?";
    
    return '';
  };

  const contextualMessage = getContextualMessage();
  const IconComponent = greetingData.icon;

  if (!animated) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showIcon && <IconComponent className="w-5 h-5 text-gray-600" />}
        <span className="text-gray-700">
          {greetingData.message}
          {userName && (
            <span className="font-medium text-gray-900">, {userName}</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center gap-3 ${className}`}
    >
      {showIcon && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.2,
            type: "spring",
            stiffness: 200 
          }}
          className={`p-2 rounded-full bg-gradient-to-r ${greetingData.gradient} text-white shadow-lg`}
        >
          <IconComponent className="w-4 h-4" />
        </motion.div>
      )}
      
      <div className="flex flex-col">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <span className="text-gray-700 text-lg">
            {greetingData.message}
          </span>
          
          <AnimatePresence>
            {userName && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className={`font-semibold bg-gradient-to-r ${greetingData.gradient} bg-clip-text text-transparent`}
              >
                , {userName}
              </motion.span>
            )}
          </AnimatePresence>
          
          {userName && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: 0.7,
                type: "spring",
                stiffness: 300 
              }}
            >
              <Zap className="w-4 h-4 text-yellow-500" />
            </motion.div>
          )}
        </motion.div>
        
        <AnimatePresence>
          {contextualMessage && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="text-sm text-gray-500 mt-1"
            >
              {contextualMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Compact version for header use
export const CompactGreeting: React.FC<PersonalizedGreetingProps> = ({
  userName,
  className = '',
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = (): string => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getTimeIcon = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) return Sunrise;
    if (hour >= 12 && hour < 17) return Sun;
    if (hour >= 17 && hour < 21) return Sunset;
    return Moon;
  };

  const greeting = getGreeting();
  const IconComponent = getTimeIcon();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <IconComponent className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-600">
        {greeting}
        {userName && (
          <span className="font-medium text-gray-800">, {userName}</span>
        )}
      </span>
    </motion.div>
  );
};

// Welcome back message for returning users
export const WelcomeBackMessage: React.FC<{ userName: string }> = ({ userName }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm"
        >
          <div className="flex items-center gap-3">
            <AnimatedHeliumLogo size={32} />
            <div>
              <p className="font-medium text-gray-800">
                Welcome back, {userName}!
              </p>
              <p className="text-sm text-gray-600">
                Ready to continue where you left off?
              </p>
            </div>
          </div>
          
          <motion.button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ×
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PersonalizedGreeting;

