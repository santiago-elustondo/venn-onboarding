import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-accent/10 p-6">
            <CheckCircle2 className="h-16 w-16 text-accent" data-testid="success-icon" />
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Welcome!</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Your profile has been successfully created. You're all set to get started.
          </p>
        </div>
        <div className="pt-4">
          <Button asChild variant="outline" data-testid="back-home-button">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
