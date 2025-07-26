"use client"

import { Card, CardFooter, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"

interface AgentCardProps {
  name: string
  onClick?: () => void
  href?: string // optional if you want it to navigate
}

const AgentCard = ({ name, onClick, href }: AgentCardProps) => {
  const initial = name.charAt(0).toUpperCase()
  const router = useRouter()

  const handleClick = () => {
    if (onClick) return onClick()
    if (href) return router.push(href)
    }
    
    

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            onClick={handleClick}
            className="w-full h-70 flex flex-col overflow-hidden shadow-md p-0 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Top */}
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="h-32 w-32 flex items-center justify-center rounded-full bg-muted text-6xl font-bold text-primary">
                {initial}
              </div>
            </CardContent>

            {/* Bottom */}
            <CardFooter className="h-[60px] w-full bg-secondary text-secondary-foreground text-center px-3 py-2">
              <p className="text-sm font-semibold line-clamp-2 w-full">{name}</p>
            </CardFooter>
          </Card>
        </TooltipTrigger>

        {/* Full name on hover */}
        <TooltipContent side="bottom">
          <p className="text-sm">{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default AgentCard
