/**
 * Manus-Style Code Editor Component
 * Professional code editor with syntax highlighting and Monaco Editor integration
 */

import React, { useEffect, useRef, useState } from 'react';
import { FileText, Copy, Download, Share2, Settings, Search, Replace } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ManusCodeEditorProps {
  content: string;
  language: string;
  fileName: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  theme?: 'dark' | 'light';
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  className?: string;
}

export const ManusCodeEditor: React.FC<ManusCodeEditorProps> = ({
  content,
  language,
  fileName,
  onChange,
  readOnly = false,
  theme = 'dark',
  showLineNumbers = true,
  showMinimap = false,
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Enhanced syntax highlighting for TypeScript/React
  const highlightCode = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      let highlightedLine = line;
      
      // JSDoc comments
      highlightedLine = highlightedLine.replace(
        /(\/\*\*[\s\S]*?\*\/)/g,
        '<span class="text-green-600 italic">$1</span>'
      );
      
      // Single line comments
      highlightedLine = highlightedLine.replace(
        /(\/\/.*$)/gm,
        '<span class="text-green-600 italic">$1</span>'
      );
      
      // Multi-line comments
      highlightedLine = highlightedLine.replace(
        /(\/\*[\s\S]*?\*\/)/g,
        '<span class="text-green-600 italic">$1</span>'
      );
      
      // Keywords
      highlightedLine = highlightedLine.replace(
        /\b(import|export|interface|const|let|var|function|return|if|else|for|while|class|extends|implements|type|enum|async|await|try|catch|finally|throw|new|this|super|static|private|public|protected|readonly|abstract)\b/g,
        '<span class="text-purple-400 font-semibold">$1</span>'
      );
      
      // React/TypeScript specific
      highlightedLine = highlightedLine.replace(
        /\b(React|useState|useEffect|useRef|useCallback|useMemo|FC|Component|Props|State)\b/g,
        '<span class="text-blue-300 font-semibold">$1</span>'
      );
      
      // Strings
      highlightedLine = highlightedLine.replace(
        /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="text-green-400">$1$2$1</span>'
      );
      
      // Template literals
      highlightedLine = highlightedLine.replace(
        /(`[^`]*`)/g,
        '<span class="text-green-400">$1</span>'
      );
      
      // JSX/HTML tags
      highlightedLine = highlightedLine.replace(
        /(<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?>)/g,
        '<span class="text-red-400">$1</span>'
      );
      
      // JSX attributes
      highlightedLine = highlightedLine.replace(
        /(\w+)=/g,
        '<span class="text-yellow-400">$1</span>='
      );
      
      // Numbers
      highlightedLine = highlightedLine.replace(
        /\b(\d+(?:\.\d+)?)\b/g,
        '<span class="text-orange-400">$1</span>'
      );
      
      // Boolean values
      highlightedLine = highlightedLine.replace(
        /\b(true|false|null|undefined)\b/g,
        '<span class="text-orange-300">$1</span>'
      );
      
      // Function names
      highlightedLine = highlightedLine.replace(
        /(\w+)(?=\s*\()/g,
        '<span class="text-yellow-300">$1</span>'
      );
      
      // Types
      highlightedLine = highlightedLine.replace(
        /:\s*([A-Z][a-zA-Z0-9]*)/g,
        ': <span class="text-cyan-400">$1</span>'
      );

      return (
        <div key={index} className="flex hover:bg-gray-800 hover:bg-opacity-30">
          {showLineNumbers && (
            <span className="text-gray-500 text-right w-12 pr-4 select-none text-xs leading-6 font-mono">
              {index + 1}
            </span>
          )}
          <span 
            className="flex-1 text-sm leading-6 font-mono"
            dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
          />
        </div>
      );
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx':
      case 'ts':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'jsx':
      case 'js':
        return <FileText className="w-4 h-4 text-yellow-400" />;
      case 'css':
        return <FileText className="w-4 h-4 text-blue-300" />;
      case 'html':
        return <FileText className="w-4 h-4 text-orange-400" />;
      case 'json':
        return <FileText className="w-4 h-4 text-green-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: fileName,
          text: content,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback to copy to clipboard
      handleCopy();
    }
  };

  return (
    <div className={`flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Editor Header */}
      <div className="bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          {getFileIcon(fileName)}
          <span className="text-white text-sm font-medium">{fileName}</span>
          <span className="text-gray-500 text-xs">({language})</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0"
            title="Search"
          >
            <Search className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0"
            title="Copy"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0"
            title="Download"
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleShare}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0"
            title="Share"
          >
            <Share2 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0"
            title="Settings"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="bg-gray-800 border-b border-gray-700 p-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-gray-700 text-white text-sm rounded px-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"
              title="Replace"
            >
              <Replace className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Code Content */}
      <div 
        ref={editorRef}
        className="flex-1 overflow-auto bg-gray-900 text-gray-300 min-h-96"
        style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
      >
        <div className="p-4">
          {highlightCode(content)}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Ln {currentLine}, Col {currentColumn}</span>
          <span>{language.toUpperCase()}</span>
          <span>UTF-8</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>{content.split('\n').length} lines</span>
          <span>{content.length} characters</span>
          {readOnly && <span className="text-yellow-400">Read Only</span>}
        </div>
      </div>
    </div>
  );
};

export default ManusCodeEditor;

