import React, { useEffect, useState } from 'react'

export default function PageTransition({ children, duration = 300 }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div
      style={{
        animation: `fadeIn ${duration}ms ease-in-out`,
      }}
    >
      {children}
    </div>
  )
}
