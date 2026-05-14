import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({ children, className = '', ...props }: Props) {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  )
}
