import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div
      className="relative bg-black flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6 md:p-10"
      style={{
        backgroundImage: "url('/final.gif')",
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundBlendMode: "exclusion",
      }}
    >
      <div className="absolute inset-0 bg-black/80 z-0"></div>

      <div className="flex w-full flex-col gap-6 z-10">
        <a href="#" className="flex items-center gap-2 self-center font-mono">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          MarketLens Inc.
        </a>
        <LoginForm />
      </div>
    </div>
  )
}