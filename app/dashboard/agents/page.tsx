"use client";

import { useEffect, useState } from "react";

import AgentCard from "@/components/AgentCard";
import AgentCardSkeleton from "@/components/AgentCardSkeleton";
import { CreateNewAgentDialog } from "./CreateNewAgentDialog";

type Agent = {
  _id: string;
  name: string;
  description: string;
  isTrained?: boolean;
  createdAt: string;
  updatedAt: string;
};

const AllAgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/agents");

        if (res.redirected) {
          window.location.href = res.url;
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch agents");

        const data = await res.json();
        setAgents(data);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError("Failed to load agents. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
        {!loading && !error && agents.length > 0 && (
          <CreateNewAgentDialog />
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <AgentCardSkeleton key={i} />
          ))}
        </section>
      )}

      {/* Empty state */}
      {!loading && !error && agents.length === 0 && (
        <div className="w-full flex flex-col items-center justify-center text-center border border-border bg-muted/40 dark:bg-muted/10 p-8 rounded-xl space-y-4">
          <h3 className="text-xl font-semibold">No Agents yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Your agent lab is empty. Create one now to start building your personal AI assistant.
          </p>
          <CreateNewAgentDialog />
        </div>
      )}

      {/* Agents list */}
      {!loading && !error && agents.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent._id}
              name={agent.name}
              href={
                agent.isTrained
                  ? `/dashboard/${agent._id}/playground`
                  : `/dashboard/${agent._id}/train`
              }
            />
          ))}
        </section>
      )}
    </div>
  );
};

export default AllAgentsPage;
