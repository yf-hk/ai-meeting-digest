import { Link } from '@tanstack/react-router'

import { ModeToggle } from './mode-toggle'
import UserMenu from './user-menu'

export default function Header() {
  const links = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <div className="border-border border-b bg-card/60 backdrop-blur-sm">
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <nav className="flex gap-6 text-lg">
          {links.map(({ to, label }) => {
            return (
              <Link
                className="font-medium text-foreground transition-colors hover:text-primary"
                key={to}
                to={to}
              >
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </div>
  )
}
