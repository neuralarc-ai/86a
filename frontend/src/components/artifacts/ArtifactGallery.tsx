"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Heart, 
  Eye, 
  Download, 
  Share2,
  Clock,
  User,
  Sparkles,
  TrendingUp,
  Calendar,
  Image as ImageIcon,
  Presentation,
  Globe,
  BarChart3,
  BookOpen,
  FileText,
  Star,
  Users
} from 'lucide-react';

/**
 * Helium AI Agent - Artifact Gallery Component
 * 
 * Community gallery for discovering and sharing AI-generated artifacts
 * Developed by NeuralArc Inc (neuralarc.ai)
 */

interface SharedArtifact {
  id: string;
  title: string;
  description: string;
  artifact_type: string;
  author: {
    name: string;
    avatar?: string;
  };
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  tags: string[];
  stats: {
    views: number;
    likes: number;
    downloads: number;
  };
  is_featured: boolean;
  is_public: boolean;
}

const ARTIFACT_TYPE_COLORS = {
  image: 'bg-gradient-to-br from-orange-500 to-red-500',
  slides: 'bg-gradient-to-br from-green-500 to-emerald-500',
  webpage: 'bg-gradient-to-br from-pink-500 to-purple-500',
  visualization: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  playbook: 'bg-gradient-to-br from-red-500 to-pink-500',
  document: 'bg-gradient-to-br from-purple-500 to-indigo-500'
};

const ARTIFACT_TYPE_ICONS = {
  image: ImageIcon,
  slides: Presentation,
  webpage: Globe,
  visualization: BarChart3,
  playbook: BookOpen,
  document: FileText
};

const ArtifactGallery: React.FC = () => {
  const [artifacts, setArtifacts] = useState<SharedArtifact[]>([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState<SharedArtifact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadArtifacts();
  }, []);

  useEffect(() => {
    filterAndSortArtifacts();
  }, [artifacts, searchQuery, selectedType, sortBy]);

  const loadArtifacts = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to load shared artifacts
      const response = await fetch('/api/artifacts/gallery');
      if (response.ok) {
        const data = await response.json();
        setArtifacts(data.artifacts || []);
      }
    } catch (error) {
      console.error('Failed to load artifacts:', error);
      // Use mock data for demonstration
      setArtifacts(generateMockArtifacts());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockArtifacts = (): SharedArtifact[] => {
    return [
      {
        id: '1',
        title: 'Tang Dynasty Historical Presentation',
        description: 'Comprehensive slides about the Tang Dynasty with interactive maps and detailed timelines',
        artifact_type: 'slides',
        author: { name: 'Dr. Sarah Chen' },
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        tags: ['history', 'education', 'china', 'dynasty', 'academic'],
        stats: { views: 1250, likes: 89, downloads: 45 },
        is_featured: true,
        is_public: true
      },
      {
        id: '2',
        title: 'Modern SaaS Landing Page',
        description: 'Clean, responsive landing page design for SaaS products with conversion optimization',
        artifact_type: 'webpage',
        author: { name: 'Alex Rodriguez' },
        created_at: '2024-01-14T15:45:00Z',
        updated_at: '2024-01-14T15:45:00Z',
        tags: ['web design', 'landing page', 'saas', 'responsive', 'conversion'],
        stats: { views: 890, likes: 67, downloads: 34 },
        is_featured: false,
        is_public: true
      },
      {
        id: '3',
        title: 'Sales Performance Dashboard',
        description: 'Interactive dashboard showing quarterly sales metrics with real-time data visualization',
        artifact_type: 'visualization',
        author: { name: 'Maria Santos' },
        created_at: '2024-01-13T09:20:00Z',
        updated_at: '2024-01-13T09:20:00Z',
        tags: ['dashboard', 'sales', 'analytics', 'charts', 'business'],
        stats: { views: 2100, likes: 156, downloads: 78 },
        is_featured: true,
        is_public: true
      },
      {
        id: '4',
        title: 'AI Art Portrait Collection',
        description: 'Stylized portrait series in impressionist style with vibrant color palettes',
        artifact_type: 'image',
        author: { name: 'Creative Studio' },
        created_at: '2024-01-12T14:10:00Z',
        updated_at: '2024-01-12T14:10:00Z',
        tags: ['art', 'portrait', 'impressionist', 'ai generated', 'creative'],
        stats: { views: 3400, likes: 234, downloads: 123 },
        is_featured: false,
        is_public: true
      },
      {
        id: '5',
        title: 'DevOps Best Practices Guide',
        description: 'Comprehensive playbook for implementing DevOps practices in enterprise environments',
        artifact_type: 'playbook',
        author: { name: 'Tech Team Lead' },
        created_at: '2024-01-11T11:30:00Z',
        updated_at: '2024-01-11T11:30:00Z',
        tags: ['devops', 'best practices', 'automation', 'guide', 'enterprise'],
        stats: { views: 1680, likes: 98, downloads: 67 },
        is_featured: false,
        is_public: true
      },
      {
        id: '6',
        title: 'AI Research Paper Analysis',
        description: 'Detailed analysis of recent AI research papers with key insights and implications',
        artifact_type: 'document',
        author: { name: 'Research Team' },
        created_at: '2024-01-10T16:20:00Z',
        updated_at: '2024-01-10T16:20:00Z',
        tags: ['ai', 'research', 'analysis', 'academic', 'insights'],
        stats: { views: 2890, likes: 187, downloads: 92 },
        is_featured: true,
        is_public: true
      }
    ];
  };

  const filterAndSortArtifacts = () => {
    let filtered = artifacts;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(artifact =>
        artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(artifact => artifact.artifact_type === selectedType);
    }

    // Sort artifacts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.stats.likes - a.stats.likes;
        case 'trending':
          return b.stats.views - a.stats.views;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredArtifacts(filtered);
  };

  const likeArtifact = async (artifactId: string) => {
    try {
      await fetch(`/api/artifacts/like/${artifactId}`, { method: 'POST' });
      // Update local state
      setArtifacts(prev => prev.map(artifact =>
        artifact.id === artifactId
          ? { ...artifact, stats: { ...artifact.stats, likes: artifact.stats.likes + 1 } }
          : artifact
      ));
    } catch (error) {
      console.error('Failed to like artifact:', error);
    }
  };

  const viewArtifact = (artifactId: string) => {
    // Navigate to artifact detail view
    window.open(`/artifacts/view/${artifactId}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading artifact gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Artifact Gallery
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover and share amazing AI-generated artifacts from the Helium community
        </p>
        <div className="text-sm text-gray-500">
          Powered by <span className="font-semibold text-purple-600">NeuralArc Inc</span>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search artifacts, tags, or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg border-2 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedType('all')}
                className={selectedType === 'all' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-2'}
              >
                All Types
              </Button>
              {Object.keys(ARTIFACT_TYPE_COLORS).map(type => {
                const Icon = ARTIFACT_TYPE_ICONS[type as keyof typeof ARTIFACT_TYPE_ICONS];
                return (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => setSelectedType(type)}
                    className={selectedType === type ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-2'}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSortBy('recent')}
                className={sortBy === 'recent' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'border-2'}
              >
                <Clock className="w-4 h-4 mr-2" />
                Recent
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSortBy('popular')}
                className={sortBy === 'popular' ? 'bg-gradient-to-r from-red-600 to-pink-600' : 'border-2'}
              >
                <Heart className="w-4 h-4 mr-2" />
                Popular
              </Button>
              <Button
                variant={sortBy === 'trending' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSortBy('trending')}
                className={sortBy === 'trending' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'border-2'}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Artifacts */}
      {sortBy === 'recent' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Featured Artifacts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtifacts
              .filter(artifact => artifact.is_featured)
              .slice(0, 3)
              .map(artifact => {
                const TypeIcon = ARTIFACT_TYPE_ICONS[artifact.artifact_type as keyof typeof ARTIFACT_TYPE_ICONS];
                const typeColor = ARTIFACT_TYPE_COLORS[artifact.artifact_type as keyof typeof ARTIFACT_TYPE_COLORS];
                
                return (
                  <Card key={artifact.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeColor} text-white shadow-md`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-800">
                            {artifact.artifact_type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300 bg-yellow-50">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg group-hover:text-purple-600 transition-colors line-clamp-2">
                        {artifact.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {artifact.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Author and Date */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{artifact.author.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(artifact.created_at)}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {artifact.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs px-2 py-1 bg-gray-50">
                              {tag}
                            </Badge>
                          ))}
                          {artifact.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-50">
                              +{artifact.tags.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* Stats and Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {formatNumber(artifact.stats.views)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {formatNumber(artifact.stats.likes)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="w-4 h-4" />
                              {formatNumber(artifact.stats.downloads)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => likeArtifact(artifact.id)}
                              className="border-2 hover:bg-red-50 hover:border-red-300"
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewArtifact(artifact.id)}
                              className="border-2 hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* All Artifacts */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            All Artifacts ({filteredArtifacts.length})
          </h2>
          <div className="text-sm text-gray-500">
            Showing {filteredArtifacts.length} of {artifacts.length} artifacts
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtifacts.map(artifact => {
            const TypeIcon = ARTIFACT_TYPE_ICONS[artifact.artifact_type as keyof typeof ARTIFACT_TYPE_ICONS];
            const typeColor = ARTIFACT_TYPE_COLORS[artifact.artifact_type as keyof typeof ARTIFACT_TYPE_COLORS];
            
            return (
              <Card key={artifact.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${typeColor} text-white shadow-sm`}>
                        <TypeIcon className="w-3 h-3" />
                      </div>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800">
                        {artifact.artifact_type.toUpperCase()}
                      </Badge>
                      {artifact.is_featured && (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300 bg-yellow-50">
                          <Star className="w-2 h-2 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base group-hover:text-purple-600 transition-colors line-clamp-2">
                    {artifact.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {artifact.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Author and Date */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{artifact.author.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(artifact.created_at)}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {artifact.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5 bg-gray-50">
                          {tag}
                        </Badge>
                      ))}
                      {artifact.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gray-50">
                          +{artifact.tags.length - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(artifact.stats.views)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {formatNumber(artifact.stats.likes)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => likeArtifact(artifact.id)}
                          className="h-7 w-7 p-0 border hover:bg-red-50 hover:border-red-300"
                        >
                          <Heart className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewArtifact(artifact.id)}
                          className="h-7 w-7 p-0 border hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredArtifacts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No artifacts found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>

      {/* Footer Attribution */}
      <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>Helium AI Agent Gallery powered by</span>
          <span className="font-semibold text-purple-600">NeuralArc Inc</span>
          <span>•</span>
          <a 
            href="https://neuralarc.ai" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-purple-600 hover:underline"
          >
            neuralarc.ai
          </a>
        </div>
      </div>
    </div>
  );
};

export default ArtifactGallery;

