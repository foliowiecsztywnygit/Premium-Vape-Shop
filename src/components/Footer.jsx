import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { BUSINESS } from '../config/business'
import Logo from '../assets/brand/logo.png'

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative w-full bg-ink border-t border-white/10 pt-fluid-xl pb-fluid-sm px-fluid-sm text-white overflow-hidden">
      <div className="relative z-10 max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-fluid-md mb-fluid-lg">
        
        {/* Brand / Statement */}
        <div className="md:col-span-2 pr-fluid-sm">
          <div className="flex items-center gap-4 mb-fluid-sm">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-accent-gradient opacity-70 blur-[14px]" />
              <div className="relative h-14 w-14 rounded-full bg-ink/60 ring-1 ring-white/15 shadow-cyan-glow flex items-center justify-center">
                <img
                  src={Logo}
                  alt={`${BUSINESS.name} logo`}
                  className="h-12 w-12 object-contain"
                  draggable="false"
                  loading="lazy"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">{BUSINESS.name}</p>
              <p className="text-fluid-xs text-white/60 tracking-widest uppercase">
                {BUSINESS.addressLine1}, {BUSINESS.addressLine2}
              </p>
            </div>
          </div>
          <p className="text-fluid-xs text-white/55 max-w-md leading-relaxed tracking-widest uppercase">
            Premium sklep stacjonarny na Ursynowie
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-fluid-xs font-bold tracking-widest mb-fluid-sm text-gray-200">{t('footer.info_title')}</h3>
          <ul className="space-y-4 text-fluid-xs text-gray-400 tracking-widest">
            <li><a href="#" className="metal-text-hover">{t('footer.links.shipping')}</a></li>
            <li><a href="#" className="metal-text-hover">{t('footer.links.terms')}</a></li>
            <li><a href="#" className="metal-text-hover">{t('footer.links.privacy')}</a></li>
            <li><a href="#" className="metal-text-hover">{t('footer.links.contact')}</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-fluid-xs font-bold tracking-widest mb-fluid-sm text-gray-200">{t('footer.newsletter.title')}</h3>
          <form className="flex border-b border-white/15 pb-3 group" onSubmit={e => e.preventDefault()}>
            <input 
              type="email" 
              placeholder={t('footer.newsletter.placeholder')} 
              className="w-full bg-transparent text-fluid-xs tracking-widest focus:outline-none placeholder-white/40 text-white transition-colors group-hover:placeholder-white/60"
              required 
            />
            <button type="submit" className="ml-3 text-white/60 hover:text-accent-cyan transition-colors">
              <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </form>
        </div>
        
      </div>

      {/* Copyright */}
      <div className="relative z-10 max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center text-[clamp(8px,1vw,10px)] text-white/45 tracking-widest border-t border-white/10 pt-fluid-sm">
        <p>{t('footer.copyright')}</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href={BUSINESS.social.facebook} className="hover:text-accent-cyan transition-colors" target="_blank" rel="noreferrer">
            FACEBOOK
          </a>
          <a href={BUSINESS.social.instagram} className="hover:text-accent-cyan transition-colors" target="_blank" rel="noreferrer">
            INSTAGRAM
          </a>
        </div>
      </div>
    </footer>
  )
}
