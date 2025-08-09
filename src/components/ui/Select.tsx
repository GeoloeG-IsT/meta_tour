import React from 'react'

export default function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`form-input ${props.className || ''}`.trim()} />
}


