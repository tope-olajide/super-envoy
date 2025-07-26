'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthNavbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { title: 'Sign In', href: '/sign-in' },
    { title: 'Sign Up', href: '/sign-up' },
  ]

  return (
    <header className="w-full bg-white dark:bg-zinc-900 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* App Name */}
        <div className="text-xl font-bold tracking-tight text-primary">
          <Link href="/">SuperEnvoy</Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-4 items-center">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'default' : 'ghost'}
                className="text-sm"
              >
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'default' : 'ghost'}
                className="w-full justify-start"
              >
                {item.title}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
