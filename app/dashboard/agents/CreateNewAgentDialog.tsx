"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"






export function CreateNewAgentDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ name: "", description: "" })

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      throw new Error("Failed to create agent")
    }
    const newAgent = await res.json()
    router.push(`/dashboard/${newAgent._id}/train`)
  } catch (err) {
    console.error("Failed to create agent:", err)
  } finally {
    setLoading(false)
  }
}

    return (
        <Dialog open={open} onOpenChange={(val) => !loading && setOpen(val)}>
            <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)}>Create New Agent AI</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create A New Agent Project</DialogTitle>
                        <DialogDescription>
                            Give your Agent a name and description. You’ll train it with content next.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="agent-name">Agent Name</Label>
                            <Input
                                id="agent-name"
                                required
                                value={form.name}
                                  
                            placeholder="e.g. Sales Assistant, Workflow Optimizer, Client Manager"
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="agent-description">Description</Label>
                            <Textarea
                                id="agent-description"
                                placeholder="e.g. Handles client communications, schedules meetings, and summarizes key insights to support your business operations."
                                className="min-h-[100px]"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Agent"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
