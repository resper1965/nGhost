import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description?: string
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboard(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if typing in input/textarea
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Allow only specific shortcuts when typing
      const typingAllowedShortcuts = ['n', 'Enter', 'Escape']
      if (!typingAllowedShortcuts.includes(event.key)) {
        return
      }
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : !event.ctrlKey
      const metaMatch = shortcut.metaKey ? event.metaKey : true // Meta is optional
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Keyboard shortcuts configuration
 */
export const SHORTCUTS = {
  NEW_CHAT: { key: 'n', ctrlKey: true, description: 'Nova conversa' },
  EXPORT: { key: 'e', ctrlKey: true, description: 'Exportar' },
  REGENERATE: { key: 'r', ctrlKey: true, description: 'Regenerar' },
  TEMPLATES: { key: '/', ctrlKey: true, description: 'Ver templates' },
  TOGGLE_SIDEBAR: { key: 'b', ctrlKey: true, description: 'Toggle sidebar' },
  SEARCH: { key: 'k', ctrlKey: true, description: 'Buscar' },
  SETTINGS: { key: ',', ctrlKey: true, description: 'Configurações' },
  HELP: { key: '?', shiftKey: true, description: 'Ajuda' },
  DARK_MODE: { key: 'd', ctrlKey: true, shiftKey: true, description: 'Toggle dark mode' },
} as const

/**
 * Hook for global app shortcuts
 */
export function useAppShortcuts({
  onNewChat,
  onExport,
  onRegenerate,
  onTemplates,
  onToggleSidebar,
  onSearch,
  onSettings,
  onHelp,
  onToggleDarkMode,
}: {
  onNewChat?: () => void
  onExport?: () => void
  onRegenerate?: () => void
  onTemplates?: () => void
  onToggleSidebar?: () => void
  onSearch?: () => void
  onSettings?: () => void
  onHelp?: () => void
  onToggleDarkMode?: () => void
}) {
  useKeyboard([
    { ...SHORTCUTS.NEW_CHAT, action: onNewChat || (() => {}) },
    { ...SHORTCUTS.EXPORT, action: onExport || (() => {}) },
    { ...SHORTCUTS.REGENERATE, action: onRegenerate || (() => {}) },
    { ...SHORTCUTS.TEMPLATES, action: onTemplates || (() => {}) },
    { ...SHORTCUTS.TOGGLE_SIDEBAR, action: onToggleSidebar || (() => {}) },
    { ...SHORTCUTS.SEARCH, action: onSearch || (() => {}) },
    { ...SHORTCUTS.SETTINGS, action: onSettings || (() => {}) },
    { ...SHORTCUTS.HELP, action: onHelp || (() => {}) },
    { ...SHORTCUTS.DARK_MODE, action: onToggleDarkMode || (() => {}) },
  ])
}
