import { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLDivElement>

export default function Card({ children, className = '', ...props }: Props) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}
