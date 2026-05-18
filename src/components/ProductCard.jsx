import React, { useState, useEffect } from 'react'
import { useViewContext } from '../context/ViewContext'

function formatPrice(value, currency) {
  const safe = Number(value)
  if (!Number.isFinite(safe)) return ''
  const symbol = currency === 'PLN' ? 'zł' : currency
  return `${safe.toFixed(2).replace('.', ',')} ${symbol}`
}

export default function ProductCard({ product }) {
  const { gridView } = useViewContext()
  const [imgIndex, setImgIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const images = Array.isArray(product?.images)
    ? product.images
        .map((x) => (typeof x === 'string' ? x : x?.url))
        .filter(Boolean)
    : []

  useEffect(() => {
    let interval
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setImgIndex((prev) => (prev + 1) % images.length)
      }, 3000)
    } else {
      setImgIndex(0)
    }
    return () => clearInterval(interval)
  }, [isHovered, images.length])

  const currentImage = images[imgIndex] || images[0]
  const isMinimal = gridView === 'minimal'
  const title = product?.name || ''
  const priceLabel = formatPrice(product?.basePrice, product?.currency)

  return (
    <a 
      href={`/product/${product.id}`} 
      className="group block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full bg-paper text-black overflow-hidden border border-black/5 rounded-2xl group-hover:shadow-lg transition-shadow">
        <div className={`relative flex items-center justify-center ${isMinimal ? 'aspect-square' : 'aspect-[3/4]'}`}>
          {currentImage ? (
            <img 
              src={currentImage} 
              alt={title}
              className="w-full h-full object-contain p-6 opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out" 
            />
          ) : (
            <div className="w-full h-full p-6 flex items-center justify-center">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-accent-deep/20 to-accent-cyan/25" />
            </div>
          )}
          {isMinimal && isHovered && images.length > 1 && (
            <div className="absolute bottom-3 right-3 flex space-x-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-accent-cyan' : 'bg-black/20'}`}
                />
              ))}
            </div>
          )}
        </div>
      
      {!isMinimal && (
        <div className="px-5 pb-5">
          <h3 className="pt-4 text-base md:text-lg font-semibold tracking-tight text-black leading-snug">
            {title}
          </h3>
          <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
            <span className="text-sm text-black/70 font-medium">{priceLabel}</span>
            <span className="text-[11px] tracking-[0.22em] text-black/45 uppercase">Zobacz</span>
          </div>
        </div>
      )}
      </div>
    </a>
  )
}
