/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { GithubIcon } from "lucide-react"
import { authClient } from "../lib/auth-client"

export function SigninForm() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/dashboard/lab",
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => {
          toast.success("Signed in successfully!")
          router.push("/dashboard/lab")
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Invalid credentials")
          setLoading(false)
        },
      }
    )

    setLoading(false)
  }

  async function handleGithubSignin() {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard/lab",
      })
    } catch (err) {
      toast.error("GitHub sign-in failed")
    }
  }

  return (
    <div className="max-w-md w-full mx-auto p-6 border border-border rounded-2xl shadow-md bg-white dark:bg-zinc-900 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Welcome back to SuperEnvoy</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue building your AI</p>
      </div>

      <form onSubmit={handleSignin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <Button variant="outline" onClick={handleGithubSignin} className="w-full">
        <GithubIcon className="mr-2 h-4 w-4" /> Continue with GitHub
      </Button>
    </div>
  )
}
