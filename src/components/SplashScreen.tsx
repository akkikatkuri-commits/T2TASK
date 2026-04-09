import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-neutral-900 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Logo Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 1.5, 
            ease: "backOut",
            delay: 0.5 
          }}
          className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-white/10"
        >
          <CheckCircle2 className="text-neutral-900 w-10 h-10" />
        </motion.div>

        {/* Text Reveal Animation */}
        <div className="flex gap-4 overflow-hidden">
          <motion.h1 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 1.5
            }}
            className="text-5xl md:text-7xl font-black text-white tracking-tighter"
          >
            TASK
          </motion.h1>
          <motion.h1 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 1.8
            }}
            className="text-5xl md:text-7xl font-black text-neutral-500 tracking-tighter"
          >
            FLOW
          </motion.h1>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full mt-12 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 4, 
              ease: "easeInOut",
              delay: 1
            }}
            className="h-full bg-white"
          />
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
          className="text-neutral-500 mt-6 text-sm uppercase tracking-[0.3em] font-medium"
        >
          Elevating Productivity
        </motion.p>
      </div>

      {/* Background Accents */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ delay: 1, duration: 2 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[120px]" />
      </motion.div>
    </motion.div>
  );
}
