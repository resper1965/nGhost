import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================
// Tailwind Utility
// ============================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// Security Utilities
// ============================================

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 255)
}

// ============================================
// Validation Utilities
// ============================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_CONTENT_LENGTH = 100000 // 100KB text
export const ALLOWED_FILE_TYPES = ['.txt', '.md', '.text', '.pdf', '.doc', '.docx']

/**
 * Validate file upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }
  
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  if (!ALLOWED_FILE_TYPES.includes(ext)) {
    return { valid: false, error: `Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}` }
  }
  
  return { valid: true }
}

/**
 * Validate text content
 */
export function validateContent(content: string): { valid: boolean; error?: string } {
  if (!content || !content.trim()) {
    return { valid: false, error: 'Content is empty' }
  }
  
  if (content.length > MAX_CONTENT_LENGTH) {
    return { valid: false, error: `Content too long. Maximum is ${MAX_CONTENT_LENGTH} characters` }
  }
  
  return { valid: true }
}

// ============================================
// Response Utilities
// ============================================

/**
 * Standard error response
 */
export function errorResponse(message: string, status: number = 500) {
  return Response.json({ success: false, error: message }, { status })
}

/**
 * Standard success response
 */
export function successResponse(data: Record<string, unknown>) {
  return Response.json({ success: true, ...data })
}
