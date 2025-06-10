"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(0 0% 100%)",
          "--normal-text": "hsl(222.2 84% 4.9%)",
          "--normal-border": "hsl(214.3 31.8% 91.4%)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
