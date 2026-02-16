'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ============================================
// TOOLTIP WRAPPER - Autoexplicativo
// ============================================

interface HelpTooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function HelpTooltip({ content, children, side = 'top' }: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-center">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================
// SECTION HEADER - Títulos claros
// ============================================

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// ============================================
// EMPTY STATE - Orientação clara
// ============================================

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <div className="text-muted-foreground/50">{icon}</div>
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[240px] mb-4">{description}</p>
      {action}
    </motion.div>
  )
}

// ============================================
// STAT CARD - Métricas claras
// ============================================

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export function StatCard({ label, value, icon, trend, trendValue, className }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        'relative p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-all',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
          {trend && trendValue && (
            <p className={cn(
              'text-xs mt-1',
              trend === 'up' && 'text-emerald-600',
              trend === 'down' && 'text-red-600',
              trend === 'neutral' && 'text-muted-foreground'
            )}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================
// ACTION BUTTON - Botões com contexto
// ============================================

interface ActionButtonProps {
  icon: ReactNode
  label: string
  description?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function ActionButton({
  icon,
  label,
  description,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled,
  loading,
  className
}: ActionButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2'
  }

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
  }

  return (
    <HelpTooltip content={description || label}>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            {icon}
          </motion.div>
        ) : (
          icon
        )}
        <span>{label}</span>
      </motion.button>
    </HelpTooltip>
  )
}

// ============================================
// DIVIDER - Separadores sutis
// ============================================

interface DividerProps {
  label?: string
  className?: string
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    )
  }

  return <div className={cn('h-px bg-border', className)} />
}

// ============================================
// BADGE - Indicadores visuais
// ============================================

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-primary/10 text-primary'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs'
  }

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      {children}
    </span>
  )
}

// ============================================
// SKELETON - Loading states
// ============================================

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn(
      'animate-pulse rounded-md bg-muted',
      className
    )} />
  )
}

// ============================================
// CARD - Container elegante
// ============================================

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
}

export function Card({ children, className, hoverable, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border/50 bg-card p-4',
        hoverable && 'cursor-pointer hover:border-border hover:shadow-sm transition-all',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// INPUT HELP - Ajuda contextual
// ============================================

interface InputHelpProps {
  text: string
  type?: 'hint' | 'error' | 'success'
}

export function InputHelp({ text, type = 'hint' }: InputHelpProps) {
  const typeClasses = {
    hint: 'text-muted-foreground',
    error: 'text-red-600 dark:text-red-400',
    success: 'text-emerald-600 dark:text-emerald-400'
  }

  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('text-xs mt-1.5', typeClasses[type])}
    >
      {text}
    </motion.p>
  )
}

// ============================================
// PROGRESS INDICATOR
// ============================================

interface ProgressIndicatorProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function ProgressIndicator({
  value,
  max = 100,
  label,
  showValue,
  size = 'md',
  className
}: ProgressIndicatorProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2'
  }

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && <span className="text-xs font-medium">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full bg-primary rounded-full"
        />
      </div>
    </div>
  )
}

// ============================================
// ANIMATED COUNTER
// ============================================

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ value, duration = 1, className }: AnimatedCounterProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('tabular-nums', className)}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {value.toLocaleString()}
      </motion.span>
    </motion.span>
  )
}
