import { Moon, Sun } from 'lucide-react'
import { Switch } from '@base-ui/react/switch'
import { Tooltip } from '@base-ui/react/tooltip'
import { useTheme } from '../theme/use-theme.ts'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        {/* Switch.Root is the outer element here (not nested inside
            Tooltip.Trigger's render) — composing it the other way silently
            drops Tooltip's hover handlers when merged onto Switch.Root's own
            render output, so the tooltip never opens. */}
        <Switch.Root
          checked={theme === 'dark'}
          onCheckedChange={toggleTheme}
          aria-label={label}
          render={
            <Tooltip.Trigger className="rounded-full p-2 text-ink transition-colors hover:bg-toggle-hover-bg" />
          }
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
        </Switch.Root>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className="rounded-md bg-ink px-2 py-1 text-sm text-paper">
              {label}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
