import React from 'react'

type Variant = 'primary' | 'secondary'

export default function Button({ variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = 'px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
  const styles = variant === 'primary'
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
    : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-200 dark:hover:bg-secondary-600'
  return <button className={`${base} ${styles} ${className}`} {...props} />
}


