"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Sparkles, 
  Users, 
  Zap,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import ArtifactCreator from './ArtifactCreator';
import ArtifactGallery from './ArtifactGallery';
import { motion } from 'framer-motion';

/**
 * Helium AI Agent - Main Artifacts Page
 * 
 * Central hub for artifact creation and community gallery
 * Developed by NeuralArc Inc (neuralarc.ai)
 */

const ArtifactsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');

  const stats = [
    {
      label: 'Artifacts Created',
      value: '12,847',
      icon: Sparkles,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Active Users',
      value: '3,421',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'This Week',
      value: '+847',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Avg. Time',
      value: '2.3 min',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Zap className="w-12 h-12" />
                </div>
                <h1 className="text-5xl font-bold">
                  Helium Artifacts
                </h1>
              </div>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Create professional presentations, websites, documents, and more with AI-powered workflows. 
                Join thousands of creators building amazing artifacts with Helium.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
                  >
                    <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} mb-2`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-blue-100">{stat.label}</div>
                  </div>
                );
              })}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="lg"
                onClick={() => setActiveTab('create')}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Artifact
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setActiveTab('gallery')}
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-3"
              >
                <Star className="w-5 h-5 mr-2" />
                Explore Gallery
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'create' | 'gallery')}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-14 mb-12 bg-white shadow-lg border">
            <TabsTrigger 
              value="create" 
              className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Plus className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              Gallery
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ArtifactCreator />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="gallery" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ArtifactGallery />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-gray-100 to-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Helium Artifacts?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional-grade AI workflows designed for creators, businesses, and teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered Workflows',
                description: 'Advanced AI creates professional artifacts with structured, multi-phase workflows',
                icon: Zap,
                color: 'from-blue-500 to-cyan-500'
              },
              {
                title: 'Professional Quality',
                description: 'Enterprise-grade outputs ready for presentations, websites, and business use',
                icon: Star,
                color: 'from-purple-500 to-pink-500'
              },
              {
                title: 'Community Driven',
                description: 'Share, discover, and collaborate with a growing community of creators',
                icon: Users,
                color: 'from-green-500 to-emerald-500'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold">Helium AI Agent</h3>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Empowering creators with AI-driven artifact generation. 
              Build professional presentations, websites, documents, and more with intelligent workflows.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <span>Developed by <span className="font-semibold text-blue-400">NeuralArc Inc</span></span>
              <span>•</span>
              <a 
                href="https://neuralarc.ai" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                neuralarc.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtifactsPage;

