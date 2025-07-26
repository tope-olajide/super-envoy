/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { authClient } from "../lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Github } from "lucide-react"

export function SignupForm() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        image: undefined,
        callbackURL: "/dashboard/lab",
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => {
          toast.success("Account created! Redirecting to dashboard...")
          router.push("/dashboard/lab")
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Something went wrong")
          setLoading(false)
        },
      }
    )

    setLoading(false)
  }

  async function handleGithubSignup() {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard/lab"
      })
    } catch (err) {
      toast.error("GitHub sign-in failed")
    }
  }

  return (
    <div className="max-w-md w-full mx-auto p-6 border border-border rounded-2xl shadow-md bg-white dark:bg-zinc-900 space-y-6 mt-15">
      {/* Header */}
      <div className="text-center space-y-1">
        {/* <Logo /> */}
        <h1 className="text-2xl font-bold">Create your SuperEnvoy account</h1>
        <p className="text-sm text-muted-foreground">Start building your personal AI today</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Sign Up"}
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

      <Button variant="outline" onClick={handleGithubSignup} className="w-full">
        <Github className="mr-2 h-4 w-4" /> Continue with GitHub
      </Button>
    </div>
  )
}
