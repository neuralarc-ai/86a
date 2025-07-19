/**
 * Enhanced To-Do List Component
 * Beautiful, clean design with advanced functionality
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Plus, X, Edit3, Trash2, Calendar, 
  Flag, User, Tag, Clock, MoreHorizontal, Filter, Search,
  SortAsc, SortDesc, Archive, Star, StarOff, AlertCircle,
  CheckSquare, Square, ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  tags: string[];
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  starred: boolean;
  category?: string;
  subtasks?: TodoItem[];
}

interface EnhancedTodoListProps {
  items: TodoItem[];
  onItemsChange: (items: TodoItem[]) => void;
  className?: string;
  showCategories?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
}

export const EnhancedTodoList: React.FC<EnhancedTodoListProps> = ({
  items,
  onItemsChange,
  className = '',
  showCategories = true,
  showFilters = true,
  showStats = true
}) => {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'dueDate' | 'title'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCompleted, setShowCompleted] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter and sort items
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = items.filter(item => {
      // Search filter
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Priority filter
      if (filterPriority !== 'all' && item.priority !== filterPriority) {
        return false;
      }
      
      // Status filter
      if (filterStatus === 'completed' && !item.completed) return false;
      if (filterStatus === 'pending' && item.completed) return false;
      if (filterStatus === 'starred' && !item.starred) return false;
      
      // Show completed filter
      if (!showCompleted && item.completed) return false;
      
      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
        case 'created':
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [items, searchQuery, filterPriority, filterStatus, showCompleted, sortBy, sortOrder]);

  // Group items by category
  const groupedItems = React.useMemo(() => {
    if (!showCategories) return { 'All Tasks': filteredAndSortedItems };
    
    const groups: Record<string, TodoItem[]> = {};
    filteredAndSortedItems.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    
    return groups;
  }, [filteredAndSortedItems, showCategories]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = items.length;
    const completed = items.filter(item => item.completed).length;
    const pending = total - completed;
    const urgent = items.filter(item => item.priority === 'urgent' && !item.completed).length;
    const overdue = items.filter(item => 
      item.dueDate && item.dueDate < new Date() && !item.completed
    ).length;
    
    return { total, completed, pending, urgent, overdue };
  }, [items]);

  const addItem = () => {
    if (!newItemTitle.trim()) return;
    
    const newItem: TodoItem = {
      id: Date.now().toString(),
      title: newItemTitle.trim(),
      completed: false,
      priority: 'medium',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      starred: false
    };
    
    onItemsChange([...items, newItem]);
    setNewItemTitle('');
  };

  const toggleItem = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id 
        ? { ...item, completed: !item.completed, updatedAt: new Date() }
        : item
    );
    onItemsChange(updatedItems);
  };

  const deleteItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const startEditing = (item: TodoItem) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
  };

  const saveEdit = () => {
    if (!editingTitle.trim()) return;
    
    const updatedItems = items.map(item =>
      item.id === editingId
        ? { ...item, title: editingTitle.trim(), updatedAt: new Date() }
        : item
    );
    onItemsChange(updatedItems);
    setEditingId(null);
    setEditingTitle('');
  };

  const toggleStar = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id 
        ? { ...item, starred: !item.starred, updatedAt: new Date() }
        : item
    );
    onItemsChange(updatedItems);
  };

  const setPriority = (id: string, priority: TodoItem['priority']) => {
    const updatedItems = items.map(item =>
      item.id === id 
        ? { ...item, priority, updatedAt: new Date() }
        : item
    );
    onItemsChange(updatedItems);
  };

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadgeColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs"
            >
              {showCompleted ? <CheckSquare className="w-3 h-3 mr-1" /> : <Square className="w-3 h-3 mr-1" />}
              Show Completed
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-500">Total</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-green-600">{stats.completed}</div>
              <div className="text-xs text-green-500">Completed</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-yellow-500">Pending</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-red-600">{stats.urgent}</div>
              <div className="text-xs text-red-500">Urgent</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-purple-600">{stats.overdue}</div>
              <div className="text-xs text-purple-500">Overdue</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {showFilters && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="starred">Starred</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="created">Created Date</option>
                <option value="title">Title</option>
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
              </select>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-xs px-2"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        )}

        {/* Add New Item */}
        <div className="flex space-x-2 mt-4">
          <Input
            placeholder="Add a new task..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            className="flex-1"
          />
          <Button onClick={addItem} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="border-b border-gray-100 last:border-b-0">
            {showCategories && Object.keys(groupedItems).length > 1 && (
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center space-x-2">
                  {expandedCategories.has(category) ? 
                    <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  }
                  <span className="font-medium text-gray-700">{category}</span>
                  <Badge variant="outline" className="text-xs">
                    {categoryItems.length}
                  </Badge>
                </div>
              </div>
            )}
            
            <AnimatePresence>
              {(!showCategories || expandedCategories.has(category) || Object.keys(groupedItems).length === 1) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {categoryItems.map((item) => (
                    <motion.div
                      key={item.id}
                      className="group p-3 hover:bg-gray-50 transition-colors border-l-4"
                      style={{ borderLeftColor: `var(--${getPriorityColor(item.priority).replace('bg-', '')})` }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                    >
                      <div className="flex items-start space-x-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {editingId === item.id ? (
                            <div className="flex space-x-2">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                                onBlur={saveEdit}
                                className="flex-1 text-sm"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center space-x-2">
                                <span 
                                  className={`text-sm font-medium ${
                                    item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                  }`}
                                >
                                  {item.title}
                                </span>
                                
                                {item.starred && (
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                )}
                                
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getPriorityBadgeColor(item.priority)}`}
                                >
                                  {item.priority}
                                </Badge>
                              </div>
                              
                              {item.description && (
                                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                              )}
                              
                              {item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {item.dueDate && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className={`text-xs ${
                                    item.dueDate < new Date() && !item.completed 
                                      ? 'text-red-500' 
                                      : 'text-gray-500'
                                  }`}>
                                    {item.dueDate.toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleStar(item.id)}
                            className="h-6 w-6 p-0"
                          >
                            {item.starred ? (
                              <StarOff className="w-3 h-3" />
                            ) : (
                              <Star className="w-3 h-3" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(item)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(item.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {filteredAndSortedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mb-4 text-gray-400" />
            <p className="text-center">
              {items.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
            </p>
            <p className="text-sm text-center mt-1">
              {items.length === 0 ? 'Add your first task above' : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTodoList;

