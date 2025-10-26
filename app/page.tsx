import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Welcome</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Let's get you started with your onboarding process. We'll need a few details to set up your profile.
          </p>
        </div>
        <div className="pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto" data-testid="get-started-button">
            <Link href="/onboarding">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
