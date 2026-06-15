'use client'

import { useEffect } from 'react'

interface ModalProps {
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ onClose, size = 'md', children }: ModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-sm bg-black/70"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${sizeClass[size]} max-h-[90dvh] overflow-y-auto rounded-2xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
