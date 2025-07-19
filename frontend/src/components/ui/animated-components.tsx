import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Loader2, MessageCircle, Sparkles, Zap, Brain } from 'lucide-react';

// Animated Logo Component with breathing effect
export const AnimatedHeliumLogo = ({ size = 32 }: { size?: number }) => {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="relative z-10 bg-white rounded-full flex items-center justify-center"
        style={{ width: size - 4, height: size - 4 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Brain className="text-blue-600" size={size * 0.5} />
      </motion.div>
    </motion.div>
  );
};

// Enhanced Typing Indicator with particle effects
export const EnhancedTypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
    >
      <AnimatedHeliumLogo size={24} />
      
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        <motion.span
          className="text-sm text-gray-600 ml-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Helium is thinking...
        </motion.span>
        
        {/* Sparkle particles */}
        <div className="relative">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, Math.random() * 20 - 10],
                y: [0, Math.random() * 20 - 10],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.7,
              }}
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Animated Message Bubble
export const AnimatedMessageBubble = ({ 
  children, 
  isUser = false, 
  delay = 0 
}: { 
  children: React.ReactNode; 
  isUser?: boolean; 
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      className={`max-w-[80%] ${isUser ? 'ml-auto' : 'mr-auto'}`}
    >
      <motion.div
        className={`p-4 rounded-2xl ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
            : 'bg-white border border-gray-200 rounded-bl-md shadow-sm'
        }`}
        whileHover={{ 
          scale: 1.02,
          boxShadow: isUser 
            ? "0 8px 25px rgba(59, 130, 246, 0.3)" 
            : "0 8px 25px rgba(0, 0, 0, 0.1)"
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Floating Action Button with ripple effect
export const FloatingActionButton = ({ 
  onClick, 
  icon: Icon, 
  label,
  className = ""
}: {
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
  className?: string;
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
    onClick();
  };

  return (
    <motion.button
      className={`relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-lg ${className}`}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      aria-label={label}
    >
      <Icon className="w-6 h-6 relative z-10" />
      
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute bg-white rounded-full opacity-30"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
            initial={{ scale: 0, opacity: 0.3 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
};

// Animated Progress Bar
export const AnimatedProgressBar = ({ 
  progress, 
  label,
  color = "blue" 
}: { 
  progress: number; 
  label?: string;
  color?: "blue" | "green" | "purple";
}) => {
  const colorClasses = {
    blue: "from-blue-400 to-blue-600",
    green: "from-green-400 to-green-600",
    purple: "from-purple-400 to-purple-600",
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full relative`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    </div>
  );
};

// Staggered List Animation
export const StaggeredList = ({ 
  children, 
  staggerDelay = 0.1 
}: { 
  children: React.ReactNode[]; 
  staggerDelay?: number;
}) => {
  return (
    <div>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: index * staggerDelay,
            type: "spring",
            stiffness: 200
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Morphing Icon Button
export const MorphingIconButton = ({ 
  icons, 
  currentIndex, 
  onClick,
  size = 24 
}: {
  icons: React.ComponentType<any>[];
  currentIndex: number;
  onClick: () => void;
  size?: number;
}) => {
  return (
    <motion.button
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {React.createElement(icons[currentIndex], { size })}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

// Pulse Loading Skeleton
export const PulseLoadingSkeleton = ({ 
  lines = 3, 
  className = "" 
}: { 
  lines?: number; 
  className?: string;
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gray-200 rounded"
          style={{ width: `${100 - (i * 10)}%` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            delay: i * 0.2 
          }}
        />
      ))}
    </div>
  );
};

export default {
  AnimatedHeliumLogo,
  EnhancedTypingIndicator,
  AnimatedMessageBubble,
  FloatingActionButton,
  AnimatedProgressBar,
  StaggeredList,
  MorphingIconButton,
  PulseLoadingSkeleton,
};

