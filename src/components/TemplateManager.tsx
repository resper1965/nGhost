'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Trash2, Edit2, Save, FileText, Sparkles,
  Eye, Copy, Check, Globe, Lock
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const ACCENT_COLOR = '#00ade8'
const ACCENT_LIGHT = '#e6f7fd'

interface CustomTemplate {
  id: string
  name: string
  description?: string
  prompt: string
  category?: string
  icon?: string
  color?: string
  variables: string[]
  example?: string
  isPublic: boolean
  useCount: number
  createdAt: string
}

interface TemplateManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: CustomTemplate) => void
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  FileText,
  Mail: () => <span>📧</span>,
  Newspaper: () => <span>📰</span>,
  Presentation: () => <span>📊</span>,
  MessageCircle: () => <span>💬</span>,
  PenTool: () => <span>✏️</span>,
  FileQuestion: () => <span>❓</span>,
  BarChart3: () => <span>📈</span>,
  Sparkles,
}

const CATEGORIES = ['Business', 'Creative', 'Academic', 'Marketing', 'Personal', 'Technical']

export function TemplateManager({ isOpen, onClose, onSelectTemplate }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<CustomTemplate[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'Custom',
    icon: 'FileText',
    color: '#00ade8',
    example: '',
    isPublic: false
  })

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/custom-templates')
      const data = await res.json()
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  // Load templates on open
  useState(() => {
    if (isOpen) fetchTemplates()
  })

  // Handle create/update
  const handleSave = async () => {
    if (!form.name || !form.prompt) return

    try {
      if (editingId) {
        // Update existing
        const res = await fetch('/api/custom-templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...form })
        })
        const data = await res.json()
        if (data.success) {
          setTemplates(prev => prev.map(t => t.id === editingId ? data.template : t))
          setEditingId(null)
        }
      } else {
        // Create new
        const res = await fetch('/api/custom-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        const data = await res.json()
        if (data.success) {
          setTemplates(prev => [...prev, data.template])
          setIsCreating(false)
        }
      }
      
      // Reset form
      setForm({
        name: '',
        description: '',
        prompt: '',
        category: 'Custom',
        icon: 'FileText',
        color: '#00ade8',
        example: '',
        isPublic: false
      })
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/templates?id=${id}`, { method: 'DELETE' })
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  // Handle edit
  const handleEdit = (template: CustomTemplate) => {
    setForm({
      name: template.name,
      description: template.description || '',
      prompt: template.prompt,
      category: template.category || 'Custom',
      icon: template.icon || 'FileText',
      color: template.color || '#00ade8',
      example: template.example || '',
      isPublic: template.isPublic
    })
    setEditingId(template.id)
    setIsCreating(true)
  }

  // Handle copy prompt
  const handleCopy = async (prompt: string, id: string) => {
    await navigator.clipboard.writeText(prompt)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // Extract variables from prompt
  const extractedVariables = form.prompt.match(/\{\{(\w+)\}\}/g)?.map(
    v => v.replace(/\{\{|\}\}/g, '')
  ) || []

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Gerenciar Templates</h3>
            <p className="text-sm text-gray-500 mt-0.5">Crie e gerencie seus templates personalizados</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsCreating(!isCreating)
                if (!isCreating) {
                  setEditingId(null)
                  setForm({
                    name: '',
                    description: '',
                    prompt: '',
                    category: 'Custom',
                    icon: 'FileText',
                    color: '#00ade8',
                    example: '',
                    isPublic: false
                  })
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all"
              style={{ backgroundColor: isCreating ? '#6b7280' : ACCENT_COLOR }}
            >
              {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isCreating ? 'Cancelar' : 'Novo Template'}
            </motion.button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(80vh-88px)]">
          {/* Template List */}
          <div className="w-1/2 border-r border-gray-100 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                <AnimatePresence>
                  {templates.length > 0 ? (
                    templates.map((template, idx) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{(() => {
                                const IconComponent = template.icon ? iconMap[template.icon] : null;
                                if (!IconComponent) return <FileText className="w-5 h-5" style={{ color: template.color }} />;
                                return <IconComponent className="w-5 h-5" style={{ color: template.color }} />;
                              })()}</span>
                              <h4 className="font-semibold text-gray-900">{template.name}</h4>
                              {template.isPublic ? (
                                <Globe className="w-3 h-3 text-green-500" />
                              ) : (
                                <Lock className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                            {template.description && (
                              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {template.category && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {template.category}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {template.useCount} usos
                              </span>
                              {template.variables.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  {template.variables.length} variáveis
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(template.prompt, template.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              {copied === template.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(template)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(template.id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                      <p className="text-gray-500">Nenhum template personalizado</p>
                      <p className="text-sm text-gray-400 mt-1">Clique em "Novo Template" para começar</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>

          {/* Editor */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-1/2 p-6 flex flex-col"
              >
                <h4 className="font-semibold text-gray-900 mb-4">
                  {editingId ? 'Editar Template' : 'Novo Template'}
                </h4>

                <div className="space-y-4 flex-1 overflow-y-auto">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nome *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ex: E-mail de Vendas"
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00ade8] focus:ring-2 focus:ring-[#00ade8]/20 outline-none transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Breve descrição do template"
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00ade8] focus:ring-2 focus:ring-[#00ade8]/20 outline-none transition-all"
                    />
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prompt * <span className="text-gray-400 normal-case">(use {'{{variavel}}'} para variáveis)</span>
                    </label>
                    <textarea
                      value={form.prompt}
                      onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                      placeholder="Ex: Escreva um e-mail sobre {{assunto}} para {{destinatario}}"
                      rows={4}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00ade8] focus:ring-2 focus:ring-[#00ade8]/20 outline-none transition-all resize-none"
                    />
                    {extractedVariables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {extractedVariables.map(v => (
                          <span key={v} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT_COLOR }}>
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category & Color */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</label>
                      <select
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00ade8] focus:ring-2 focus:ring-[#00ade8]/20 outline-none transition-all"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cor</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={form.color}
                          onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                        />
                        <input
                          type="text"
                          value={form.color}
                          onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00ade8] focus:ring-2 focus:ring-[#00ade8]/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Example */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Exemplo de Uso</label>
                    <input
                      type="text"
                      value={form.example}
                      onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
                      placeholder="Ex: assunto=novo produto, destinatario=cliente"
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00ade8] focus:ring-2 focus:ring-[#00ade8]/20 outline-none transition-all"
                    />
                  </div>

                  {/* Public toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-colors',
                        form.isPublic ? 'bg-green-500' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                          form.isPublic ? 'left-7' : 'left-1'
                        )}
                      />
                    </button>
                    <div className="flex items-center gap-2">
                      {form.isPublic ? (
                        <Globe className="w-4 h-4 text-green-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600">
                        {form.isPublic ? 'Template público (visível para todos)' : 'Template privado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSave}
                  disabled={!form.name || !form.prompt}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Atualizar Template' : 'Salvar Template'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state when not creating */}
          {!isCreating && templates.length > 0 && (
            <div className="w-1/2 p-6 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Selecione um template para editar</p>
                <p className="text-xs mt-1">ou crie um novo</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
