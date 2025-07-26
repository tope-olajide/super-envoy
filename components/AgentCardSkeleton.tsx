
const AgentCardSkeleton = () => {
  return (
    <div className="w-full h-70 flex flex-col overflow-hidden shadow-md p-0 rounded-xl animate-pulse">
      {/* Top */}
      <div className="flex-1 flex items-center justify-center">
        <div className="h-32 w-32 rounded-full bg-muted" />
      </div>

      {/* Bottom */}
      <div className="h-[60px] w-full bg-secondary px-3 py-2 flex items-center justify-center">
        <div className="w-3/4 h-4 bg-muted rounded" />
      </div>
    </div>
  )
}

export default AgentCardSkeleton