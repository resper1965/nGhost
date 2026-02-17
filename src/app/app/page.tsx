'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, BookOpen, Feather, Loader2, FileText,
  Trash2, Sparkles, ChevronDown, Upload, Database,
  Zap, Plus, MessageSquare, RefreshCw, Eye, X,
  Download, FileDown, FileSpreadsheet, Copy, Check,
  Mail, Newspaper, FileText as FileTextIcon, MessageCircle,
  Presentation, FileQuestion, PenTool, BarChart3, Info,
  Menu, Settings, Moon, Sun, Search, Filter, Grid,
  List, MoreVertical, Heart, Share2, Bookmark, Clock,
  TrendingUp, Award, Target, Lightbulb, Star, Globe, Lock, Edit2, Save,
  PanelLeftClose, PanelLeft, ChevronRight, Wand2, FilePlus, FolderOpen, FolderPlus, Briefcase
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { TemplateManager } from '@/components/TemplateManager'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from 'next-themes'
import { useAuth } from '@/components/providers/AuthProvider'

// Brand colors
const ACCENT_COLOR = '#00ade8'
const ACCENT_LIGHT = '#e6f7fd'
const ACCENT_DARK = '#0095c9'
const ACCENT_GRADIENT = 'linear-gradient(135deg, #00ade8 0%, #0095c9 100%)'

// Pen Icon SVG Component
function PenIcon({ className, color = ACCENT_COLOR }: { className?: string; color?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color}
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Pen body */}
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      {/* Writing trail/ink */}
      <path d="M15 5l2 2" strokeWidth="1.5" />
      {/* Ink drop accent */}
      <circle cx="4" cy="20" r="0.5" fill={color} stroke="none" />
      <circle cx="3" cy="21" r="0.3" fill={color} stroke="none" opacity="0.6" />
    </svg>
  )
}

// Gabi Logo Component - Pen + "Gabi." with Montserrat Medium
function GabiLogo({ size = 'md', variant = 'default', showIcon = true }: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  variant?: 'default' | 'light' | 'dark';
  showIcon?: boolean;
}) {
  const sizeConfig = {
    sm: { text: 'text-sm', icon: 'w-3.5 h-3.5', gap: 'gap-1' },
    md: { text: 'text-base', icon: 'w-4 h-4', gap: 'gap-1.5' },
    lg: { text: 'text-lg', icon: 'w-5 h-5', gap: 'gap-2' },
    xl: { text: 'text-2xl', icon: 'w-6 h-6', gap: 'gap-2' }
  }
  
  const config = sizeConfig[size]
  
  // Determine text color based on variant
  const textColor = variant === 'light' ? 'text-white' : variant === 'dark' ? 'text-black' : 'text-foreground'
  const iconColor = variant === 'light' ? '#ffffff' : variant === 'dark' ? '#000000' : 'currentColor'
  
  return (
    <div className={cn('flex items-center', config.gap)}>
      {showIcon && (
        <div className="relative">
          <PenIcon className={config.icon} color={ACCENT_COLOR} />
        </div>
      )}
      <span className={cn(config.text, 'font-medium tracking-tight')} style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}>
        <span className={textColor}>Gabi</span>
        <span style={{ color: ACCENT_COLOR }}>.</span>
      </span>
    </div>
  )
}

// Full Logo with tagline
function GabiFullLogo({ variant = 'default' }: { variant?: 'default' | 'light' | 'dark' }) {
  const textColor = variant === 'light' ? 'text-white' : variant === 'dark' ? 'text-black' : 'text-foreground'
  const subtextColor = variant === 'light' ? 'text-white/70' : variant === 'dark' ? 'text-black/60' : 'text-muted-foreground'
  
  return (
    <div className="flex flex-col items-center">
      <GabiLogo size="xl" variant={variant} />
      <div className={cn('text-xs mt-1', subtextColor)} style={{ fontFamily: 'Montserrat, sans-serif' }}>
        Ghost Writer • <span>powered by <span className={textColor}>ness</span><span style={{ color: ACCENT_COLOR }}>.</span></span>
      </div>
    </div>
  )
}

// Types
interface Document {
  id: string
  filename: string
  type: 'style' | 'content'
  fileSize: number
  chunkCount: number
  createdAt: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  styleChunks?: number
  contentChunks?: number
  styleSources?: string[]
  contentSources?: string[]
  isStreaming?: boolean
  template?: string
  liked?: boolean
}

interface ChatSession {
  id: string
  title: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  documentCount: number
  chatSessionCount: number
  createdAt: string
  updatedAt: string
}

interface ChunkPreview {
  id: string
  content: string
  type: 'style' | 'content'
}

// Writing templates
const WRITING_TEMPLATES = [
  { 
    id: 'email', 
    name: 'E-mail', 
    icon: Mail,
    prompt: 'Escreva um e-mail profissional sobre: ',
    description: 'Formal',
    color: '#3b82f6'
  },
  { 
    id: 'article', 
    name: 'Artigo', 
    icon: Newspaper,
    prompt: 'Escreva um artigo sobre: ',
    description: 'Jornalístico',
    color: '#10b981'
  },
  { 
    id: 'social', 
    name: 'Social', 
    icon: MessageCircle,
    prompt: 'Escreva um post para redes sociais sobre: ',
    description: 'Engajamento',
    color: '#f59e0b'
  },
  { 
    id: 'report', 
    name: 'Relatório', 
    icon: BarChart3,
    prompt: 'Escreva um relatório sobre: ',
    description: 'Executivo',
    color: '#64748b'
  },
]

// Utility functions
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('pt-BR')
}

function countWords(text: string): { words: number; chars: number } {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length
  const chars = text.length
  return { words, chars }
}

// Avatar component
function Avatar({ role, size = 'md' }: { role: 'user' | 'assistant'; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  if (role === 'assistant') {
    return (
      <div className={cn(sizeClasses[size], 'rounded-xl flex items-center justify-center shadow-md flex-shrink-0 bg-card border border-border avatar-glow')}>
        <PenIcon className={iconSizes[size]} color={ACCENT_COLOR} />
      </div>
    )
  }

  return (
    <div className={cn(sizeClasses[size], 'rounded-xl flex items-center justify-center shadow-md flex-shrink-0')}
         style={{ background: ACCENT_GRADIENT }}>
      <span className="text-white text-sm font-semibold">U</span>
    </div>
  )
}

// Message bubble component
function MessageBubble({ msg, onShowChunks, onExport, onLike }: { 
  msg: Message; 
  onShowChunks?: (msg: Message) => void; 
  onExport?: (msg: Message, format: 'txt' | 'md' | 'html') => void;
  onLike?: (msg: Message) => void;
}) {
  const hasChunks = (msg.styleChunks || 0) > 0 || (msg.contentChunks || 0) > 0
  const [copied, setCopied] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const stats = countWords(msg.content)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = (format: 'txt' | 'md' | 'html') => {
    onExport?.(msg, format)
    setShowExportMenu(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn('flex gap-2.5 sm:gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar role={msg.role} size="md" />
      
      <div className={cn('flex-1 max-w-[85%] sm:max-w-[75%]', msg.role === 'user' ? 'items-end' : 'items-start')}>
        <div className="relative group">
          <div
            className={cn(
              'px-4 py-3 sm:px-5 sm:py-4 leading-relaxed whitespace-pre-wrap text-sm sm:text-base',
              msg.role === 'user'
                ? 'text-white rounded-2xl rounded-tr-md'
                : 'glass-card text-foreground rounded-2xl rounded-tl-md'
            )}
            style={msg.role === 'user' ? { background: ACCENT_GRADIENT } : {}}
          >
            {msg.content}
            {msg.isStreaming && (
              <span className="inline-flex gap-1 ml-2 items-center">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
            )}
          </div>
          
          {/* Quick actions */}
          <AnimatePresence>
            {msg.role === 'assistant' && !msg.isStreaming && showActions && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute -bottom-9 left-0 flex items-center gap-0.5 bg-card rounded-full shadow-lg border border-border p-0.5"
              >
                <button 
                  onClick={() => onLike?.(msg)} 
                  className={cn('p-1.5 sm:p-2 rounded-full hover:bg-accent transition-colors', msg.liked && 'text-red-500')}
                >
                  <Heart className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', msg.liked && 'fill-current')} />
                </button>
                <button onClick={handleCopy} className="p-1.5 sm:p-2 rounded-full hover:bg-accent transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />}
                </button>
                <div className="relative">
                  <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-1.5 sm:p-2 rounded-full hover:bg-accent transition-colors">
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  </button>
                  <AnimatePresence>
                    {showExportMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute bottom-full left-0 mb-2 bg-card rounded-xl border border-border shadow-xl py-1 min-w-[100px] overflow-hidden z-10"
                      >
                        <button onClick={() => handleExport('txt')} className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors">
                          <FileText className="w-3.5 h-3.5" /> TXT
                        </button>
                        <button onClick={() => handleExport('md')} className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors">
                          <FileDown className="w-3.5 h-3.5" /> MD
                        </button>
                        <button onClick={() => handleExport('html')} className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors">
                          <FileSpreadsheet className="w-3.5 h-3.5" /> HTML
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {hasChunks && (
                  <button onClick={() => onShowChunks?.(msg)} className="p-1.5 sm:p-2 rounded-full hover:bg-accent transition-colors">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Stats */}
        {msg.role === 'assistant' && !msg.isStreaming && (
          <div className="flex items-center gap-2 mt-1.5 ml-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {stats.words} palavras
            </span>
            {hasChunks && (
              <span className="text-[10px] sm:text-xs flex items-center gap-1" style={{ color: ACCENT_COLOR }}>
                <Target className="w-2.5 h-2.5" />
                {msg.styleChunks || 0}+{msg.contentChunks || 0}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Chunk preview modal
function ChunkPreviewModal({ chunks, onClose }: { chunks: ChunkPreview[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Contexto Utilizado</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Trechos que influenciaram a resposta</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 sm:p-6 space-y-3">
            {chunks.map((chunk, idx) => (
              <motion.div
                key={chunk.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative overflow-hidden p-4 rounded-xl border"
                style={{
                  backgroundColor: chunk.type === 'style' ? ACCENT_LIGHT : '#f0fdf4',
                  borderColor: chunk.type === 'style' ? `${ACCENT_COLOR}30` : '#86efac30'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-lg" style={{ backgroundColor: chunk.type === 'style' ? `${ACCENT_COLOR}20` : '#10b98120' }}>
                    {chunk.type === 'style' ? (
                      <Feather className="w-3.5 h-3.5" style={{ color: ACCENT_COLOR }} />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-green-600" />
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: chunk.type === 'style' ? ACCENT_COLOR : '#16a34a' }}>
                    {chunk.type === 'style' ? 'Estilo' : 'Conteúdo'} #{idx + 1}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">{chunk.content}</p>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  )
}

// Empty state component
function EmptyState({ onTemplate, onUpload }: { onTemplate: () => void; onUpload: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8"
    >
      {/* Full Logo with tagline */}
      <div className="mb-4 sm:mb-6">
        <GabiFullLogo variant="default" />
      </div>
      
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 text-center">
        Como posso ajudar?
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 sm:mb-8 max-w-md">
        Sua assistente de escrita com IA. Escreva textos no seu estilo único.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onTemplate}
          className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 bg-card hover:shadow-md transition-all"
        >
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${ACCENT_COLOR}15` }}>
            <Wand2 className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Usar Template</p>
            <p className="text-xs text-muted-foreground">Comece com um modelo</p>
          </div>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onUpload}
          className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 bg-card hover:shadow-md transition-all"
        >
          <div className="p-2 rounded-lg bg-green-50">
            <FilePlus className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Adicionar Docs</p>
            <p className="text-xs text-muted-foreground">Personalize o estilo</p>
          </div>
        </motion.button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-6 text-center">
        Dica: Digite sua mensagem abaixo ou use Ctrl+K para templates
      </p>
    </motion.div>
  )
}

// Document card component
function DocumentCard({ doc, onDelete }: { doc: Document; onDelete: (id: string) => void }) {
  const { authFetch } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await authFetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
      onDelete(doc.id)
    } catch (error) {
      console.error('Failed to delete:', error)
    }
    setIsDeleting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <div className="p-2 rounded-lg" style={{ backgroundColor: doc.type === 'style' ? `${ACCENT_COLOR}15` : '#10b98115' }}>
        <FileText className="w-4 h-4" style={{ color: doc.type === 'style' ? ACCENT_COLOR : '#10b981' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{doc.filename}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{doc.chunkCount} chunks</span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// Session card component
function SessionCard({ session, isActive, onClick, onDelete }: { session: ChatSession; isActive: boolean; onClick: () => void; onDelete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
        isActive 
          ? 'border-2 shadow-sm' 
          : 'bg-card border border-border hover:border-primary/30 hover:shadow-sm'
      )}
      style={isActive ? { 
        backgroundColor: ACCENT_LIGHT, 
        borderColor: ACCENT_COLOR,
      } : {}}
    >
      <div className="p-1.5 rounded-lg" style={{ backgroundColor: isActive ? `${ACCENT_COLOR}20` : 'var(--muted)' }}>
        <MessageSquare className="w-3.5 h-3.5" style={{ color: isActive ? ACCENT_COLOR : 'var(--muted-foreground)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isActive ? '' : 'text-foreground')} 
           style={isActive ? { color: ACCENT_DARK } : {}}>
          {session.title}
        </p>
        <span className="text-[10px] text-muted-foreground">{formatDate(session.updatedAt)}</span>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete() }} 
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// Sidebar content component (shared between desktop sidebar and mobile sheet)
function SidebarContent({ 
  documents, 
  sessions, 
  sessionId,
  activeTab,
  setActiveTab,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onDeleteDoc,
  onUpload,
  totalDocs,
  totalChunks,
  projects,
  currentProject,
  onSelectProject,
  onCreateProject
}: { 
  documents: Document[]
  sessions: ChatSession[]
  sessionId: string | null
  activeTab: 'style' | 'content'
  setActiveTab: (tab: 'style' | 'content') => void
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onDeleteDoc: (id: string) => void
  onUpload: () => void
  totalDocs: number
  totalChunks: number
  projects: Project[]
  currentProject: Project | null
  onSelectProject: (project: Project | null) => void
  onCreateProject: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 sm:p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-card border border-border">
              <PenIcon className="w-4 h-4" color={ACCENT_COLOR} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
              <Zap className="w-1.5 h-1.5 text-white" />
            </div>
          </div>
          <div>
            <GabiLogo size="md" variant="default" showIcon={false} />
            <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Ghost Writer • <span className="text-foreground">ness</span><span style={{ color: ACCENT_COLOR }}>.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="px-3 sm:px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <select
              value={currentProject?.id || 'all'}
              onChange={(e) => {
                const selectedId = e.target.value
                if (selectedId === 'all') {
                  onSelectProject(null)
                } else {
                  const project = projects.find(p => p.id === selectedId)
                  onSelectProject(project || null)
                }
              }}
              className="w-full px-3 py-2 pr-8 text-sm bg-muted/50 border border-border rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary truncate"
            >
              <option value="all">Todos os Projetos</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <Briefcase className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onCreateProject}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Novo Projeto</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {currentProject && (
          <p className="text-[10px] text-muted-foreground mt-1.5 truncate">
            {currentProject.documentCount} docs • {currentProject.chatSessionCount} conversas
          </p>
        )}
      </div>

      {/* New Chat */}
      <div className="p-3 sm:p-4 border-b border-border">
        <motion.button 
          whileHover={{ scale: 1.01 }} 
          whileTap={{ scale: 0.99 }}
          onClick={onNewChat} 
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium shadow-md transition-all hover:shadow-lg"
          style={{ background: ACCENT_GRADIENT }}
        >
          <Plus className="w-4 h-4" />
          Nova Conversa
        </motion.button>
      </div>

      {/* Stats */}
      <div className="px-3 sm:px-4 py-2 grid grid-cols-2 gap-2">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="text-base font-bold text-foreground">{totalDocs}</p>
          <p className="text-[10px] text-muted-foreground">Documentos</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="text-base font-bold text-foreground">{totalChunks}</p>
          <p className="text-[10px] text-muted-foreground">Chunks</p>
        </div>
      </div>

      {/* Sessions */}
      <div className="px-3 sm:px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Histórico</span>
          <span className="text-[10px] text-muted-foreground">{sessions.length}</span>
        </div>
        <ScrollArea className="h-28 sm:h-32">
          <div className="space-y-2 pr-2">
            {sessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                isActive={sessionId === session.id}
                onClick={() => onSelectSession(session.id)}
                onDelete={() => onDeleteSession(session.id)}
              />
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma conversa ainda</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Documents */}
      <div className="flex-1 px-3 sm:px-4 py-2 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab('style')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium rounded-md transition-all',
                activeTab === 'style' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Estilo
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium rounded-md transition-all',
                activeTab === 'content' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Conteúdo
            </button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onUpload}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Upload documento</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2">
            {documents.map(doc => (
              <DocumentCard key={doc.id} doc={doc} onDelete={onDeleteDoc} />
            ))}
            {documents.length === 0 && (
              <div className="text-center py-4">
                <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum documento</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

// Template selector component
function TemplateSelector({ onSelect, onClose, customTemplates, onManageTemplates }: { 
  onSelect: (template: typeof WRITING_TEMPLATES[0]) => void; 
  onClose: () => void;
  customTemplates: Array<typeof WRITING_TEMPLATES[number]>;
  onManageTemplates: () => void;
}) {
  const allTemplates = [...WRITING_TEMPLATES, ...customTemplates]
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Escolha um Template</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Selecione o tipo de texto</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { onManageTemplates(); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              Gerenciar
            </motion.button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {allTemplates.map((template, idx) => {
              const Icon = template.icon
              const isCustom = (template as { isCustom?: boolean }).isCustom
              return (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onSelect(template); onClose() }}
                  className="relative overflow-hidden flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border border-border hover:border-primary/30 bg-card hover:shadow-sm transition-all group"
                >
                  {isCustom && (
                    <div className="absolute top-1.5 right-1.5">
                      <Star className="w-2.5 h-2.5" style={{ color: template.color }} />
                    </div>
                  )}
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${template.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: template.color }} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm font-medium text-foreground">{template.name}</p>
                    <p className="text-[10px] text-muted-foreground">{template.description}</p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </ScrollArea>
        {customTemplates.length === 0 && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => { onManageTemplates(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Criar Template</span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// Project Modal component
function ProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (project: Project) => void }) {
  const { authFetch } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#00ade8')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setIsLoading(true)

    try {
      const res = await authFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color })
      })
      const data = await res.json()
      if (data.success) {
        onCreated(data.project)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Novo Projeto</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Organize seus documentos e conversas</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Blog Corporativo"
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Breve descrição do projeto"
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cor</label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-border"
              />
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-sm font-medium"
          >
            Cancelar
          </button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
            className="flex-1 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            style={{ backgroundColor: color }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Criar Projeto'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main component
export default function GhostWriterApp() {
  const { theme, setTheme } = useTheme()
  const { authFetch } = useAuth()
  
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'style' | 'content'>('style')
  const [documents, setDocuments] = useState<Document[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [toneInstruction, setToneInstruction] = useState('Formal e direto')
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ progress: number; filename: string } | null>(null)
  const [previewChunks, setPreviewChunks] = useState<ChunkPreview[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof WRITING_TEMPLATES[0] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<Array<typeof WRITING_TEMPLATES[number]>>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await authFetch('/api/projects')
      const data = await res.json()
      if (data.success) {
        setProjects(data.projects)
        // Set first project as current if none selected
        if (!currentProject && data.projects.length > 0) {
          setCurrentProject(data.projects[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }, [currentProject])

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const projectId = currentProject?.id || 'all'
      const res = await authFetch(`/api/documents?type=${activeTab}&projectId=${projectId}`)
      const data = await res.json()
      if (data.success) setDocuments(data.documents)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }, [activeTab, currentProject])

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const projectId = currentProject?.id || 'all'
      const res = await authFetch(`/api/chat?projectId=${projectId}`)
      const data = await res.json()
      if (data.success) setSessions(data.sessions)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }, [currentProject])

  // Fetch custom templates
  const fetchCustomTemplates = useCallback(async () => {
    try {
      const res = await authFetch('/api/custom-templates')
      const data = await res.json()
      if (data.success) {
        const converted = data.templates.map((t: {
          id: string
          name: string
          description?: string
          prompt: string
          category?: string
          icon?: string
          color?: string
        }) => ({
          id: t.id,
          name: t.name,
          description: t.description || t.category || 'Personalizado',
          prompt: t.prompt,
          color: t.color || ACCENT_COLOR,
          icon: FileText,
          isCustom: true
        }))
        setCustomTemplates(converted)
      }
    } catch (error) {
      console.error('Failed to fetch custom templates:', error)
    }
  }, [])

  // Load session messages
  const loadSession = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/chat/${id}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages)
        setSessionId(id)
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchProjects()
    fetchDocuments()
    fetchSessions()
    fetchCustomTemplates()
  }, [fetchProjects, fetchDocuments, fetchSessions, fetchCustomTemplates])

  // Refetch when project changes
  useEffect(() => {
    fetchDocuments()
    fetchSessions()
  }, [currentProject, fetchDocuments, fetchSessions])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (const file of files) {
      setUploadProgress({ progress: 0, filename: file.name })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', activeTab)
      if (currentProject) {
        formData.append('projectId', currentProject.id)
      }

      try {
        setUploadProgress({ progress: 30, filename: file.name })
        const res = await authFetch('/api/documents', { method: 'POST', body: formData })
        setUploadProgress({ progress: 80, filename: file.name })
        const data = await res.json()
        setUploadProgress({ progress: 100, filename: file.name })
        if (!data.success) throw new Error(data.error || 'Upload failed')
        await fetchDocuments()
      } catch (error) {
        console.error('Upload error:', error)
      } finally {
        setTimeout(() => setUploadProgress(null), 500)
      }
    }
  }

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files)
  }

  // New chat
  const startNewChat = () => {
    setMessages([])
    setSessionId(null)
    setSelectedTemplate(null)
    setSidebarOpen(false)
  }

  // Regenerate
  const regenerateLast = async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMessage) return
    setMessages(prev => {
      const newMsgs = [...prev]
      const lastAssistant = newMsgs.findLastIndex(m => m.role === 'assistant')
      if (lastAssistant !== -1) newMsgs.splice(lastAssistant, 1)
      return newMsgs
    })
    await sendMessage(lastUserMessage.content)
  }

  // Send message with streaming
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage = messageText.trim()
    setInput('')
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
      template: selectedTemplate?.id
    }])
    setIsLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true
    }])

    try {
      const response = await authFetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId, toneInstruction, projectId: currentProject?.id })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let currentSessionId = sessionId
      let styleChunks = 0
      let contentChunks = 0
      let styleSources: string[] = []
      let contentSources: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              switch (data.type) {
                case 'session':
                  if (!currentSessionId) {
                    currentSessionId = data.sessionId
                    setSessionId(data.sessionId)
                    fetchSessions()
                  }
                  break
                case 'context':
                  styleChunks = data.styleChunks
                  contentChunks = data.contentChunks
                  styleSources = data.styleSources || []
                  contentSources = data.contentSources || []
                  break
                case 'token':
                  setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + data.content } : m))
                  break
                case 'done':
                  setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false, styleChunks, contentChunks, styleSources, contentSources } : m))
                  break
                case 'error':
                  throw new Error(data.error)
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Desculpe, ocorreu um erro. Tente novamente.', isStreaming: false } : m))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle send
  const handleSend = () => {
    if (input.trim()) sendMessage(input)
  }

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Show chunks
  const handleShowChunks = async (msg: Message) => {
    if (!msg.styleSources?.length && !msg.contentSources?.length) return
    const allIds = [...(msg.styleSources || []), ...(msg.contentSources || [])]
    if (allIds.length > 0) {
      try {
        const res = await authFetch(`/api/documents/chunks?ids=${allIds.join(',')}`)
        const data = await res.json()
        if (data.success) {
          setPreviewChunks(data.chunks.map((c: { id: string; content: string }) => ({
            id: c.id,
            content: c.content,
            type: (msg.styleSources || []).includes(c.id) ? 'style' : 'content'
          })))
        }
      } catch (e) {
        console.error('Failed to fetch chunks:', e)
      }
    }
  }

  // Handle template select
  const handleTemplateSelect = (template: typeof WRITING_TEMPLATES[0]) => {
    setSelectedTemplate(template)
    setInput(template.prompt)
    inputRef.current?.focus()
  }

  // Handle export
  const handleExport = async (msg: Message, format: 'txt' | 'md' | 'html') => {
    try {
      const res = await authFetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: msg.content,
          format,
          filename: `gabi-texto-${Date.now()}`
        })
      })

      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gabi-texto-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  // Handle like
  const handleLike = (msg: Message) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, liked: !m.liked } : m))
  }

  // Delete handlers
  const handleDeleteDoc = (id: string) => setDocuments(prev => prev.filter(d => d.id !== id))
  const handleDeleteSession = async (id: string) => {
    try {
      await authFetch(`/api/chat?sessionId=${id}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== id))
      if (sessionId === id) startNewChat()
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  // Tone options
  const toneOptions = ['Formal', 'Conversacional', 'Acadêmico', 'Criativo', 'Jornalístico', 'Persuasivo']
  const canRegenerate = messages.length >= 2 && messages.some(m => m.role === 'user') && !isLoading

  // Stats
  const totalDocs = documents.length
  const totalChunks = documents.reduce((acc, doc) => acc + doc.chunkCount, 0)

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Desktop Sidebar */}
        <motion.aside 
          animate={{ width: sidebarCollapsed ? 0 : 280 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="hidden lg:flex h-full border-r border-border bg-card flex-col overflow-hidden"
        >
          <div className="w-[280px] h-full">
            <SidebarContent
              documents={documents}
              sessions={sessions}
              sessionId={sessionId}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onNewChat={startNewChat}
              onSelectSession={loadSession}
              onDeleteSession={handleDeleteSession}
              onDeleteDoc={handleDeleteDoc}
              onUpload={() => fileInputRef.current?.click()}
              totalDocs={totalDocs}
              totalChunks={totalChunks}
              projects={projects}
              currentProject={currentProject}
              onSelectProject={setCurrentProject}
              onCreateProject={() => setShowProjectModal(true)}
            />
          </div>
        </motion.aside>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SidebarContent
              documents={documents}
              sessions={sessions}
              sessionId={sessionId}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onNewChat={startNewChat}
              onSelectSession={loadSession}
              onDeleteSession={handleDeleteSession}
              onDeleteDoc={handleDeleteDoc}
              onUpload={() => { fileInputRef.current?.click(); setSidebarOpen(false); }}
              totalDocs={totalDocs}
              totalChunks={totalChunks}
              projects={projects}
              currentProject={currentProject}
              onSelectProject={(project) => { setCurrentProject(project); setSidebarOpen(false); }}
              onCreateProject={() => { setShowProjectModal(true); setSidebarOpen(false); }}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {/* Mobile menu */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
              </Sheet>
              
              {/* Desktop collapse */}
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
              >
                {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>
              
              {selectedTemplate && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {selectedTemplate.name}
                  <button onClick={() => setSelectedTemplate(null)} className="ml-1 hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Tone selector */}
              <select
                value={toneInstruction}
                onChange={(e) => setToneInstruction(e.target.value)}
                className="text-xs sm:text-sm bg-transparent border border-border rounded-lg px-2 sm:px-3 py-1.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {toneOptions.map(tone => (
                  <option key={tone} value={tone}>{tone}</option>
                ))}
              </select>

              {/* Templates */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setShowTemplates(true)}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Templates (Ctrl+K)</p>
                </TooltipContent>
              </Tooltip>

              {/* Theme toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Tema</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            <AnimatePresence>
              {dragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center z-10"
                >
                  <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border-2 border-dashed border-primary">
                    <Upload className="w-8 h-8 text-primary" />
                    <p className="text-sm font-medium text-foreground">Solte o arquivo aqui</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.length === 0 ? (
              <EmptyState 
                onTemplate={() => setShowTemplates(true)}
                onUpload={() => fileInputRef.current?.click()}
              />
            ) : (
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      onShowChunks={handleShowChunks}
                      onExport={handleExport}
                      onLike={handleLike}
                    />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-3 sm:p-4">
            {/* Upload progress */}
            <AnimatePresence>
              {uploadProgress && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-3"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="truncate">{uploadProgress.filename}</span>
                    <span>{uploadProgress.progress}%</span>
                  </div>
                  <Progress value={uploadProgress.progress} className="h-1" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2 sm:gap-3">
              {/* Regenerate */}
              {canRegenerate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={regenerateLast}
                      disabled={isLoading}
                      className="p-2 sm:p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                    >
                      <RefreshCw className={cn("w-4 h-4 sm:w-5 sm:h-5", isLoading && "animate-spin")} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Regenerar</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  className="w-full px-4 py-2.5 sm:py-3 pr-12 rounded-xl glass-input text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-sm sm:text-base"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>

              {/* Send */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-2.5 sm:p-3 rounded-xl text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: ACCENT_GRADIENT }}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </motion.button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-2 hidden sm:block">
              Enter para enviar • Shift+Enter para nova linha • Ctrl+K para templates
            </p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />

        {/* Modals */}
        <AnimatePresence>
          {showTemplates && (
            <TemplateSelector
              onSelect={handleTemplateSelect}
              onClose={() => setShowTemplates(false)}
              customTemplates={customTemplates}
              onManageTemplates={() => setShowTemplateManager(true)}
            />
          )}
          
          {previewChunks.length > 0 && (
            <ChunkPreviewModal
              chunks={previewChunks}
              onClose={() => setPreviewChunks([])}
            />
          )}

          {showTemplateManager && (
            <TemplateManager
              isOpen={showTemplateManager}
              onClose={() => {
                setShowTemplateManager(false)
                fetchCustomTemplates()
              }}
              onSelectTemplate={(template) => {
                handleTemplateSelect({
                  id: template.id,
                  name: template.name,
                  description: template.description || '',
                  prompt: template.prompt,
                  color: template.color || ACCENT_COLOR,
                  icon: FileText,
                })
                setShowTemplateManager(false)
              }}
            />
          )}

          {showProjectModal && (
            <ProjectModal
              onClose={() => setShowProjectModal(false)}
              onCreated={(project) => {
                setProjects(prev => [...prev, project])
                setCurrentProject(project)
                setShowProjectModal(false)
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
