import { GalleryVerticalEnd } from "lucide-react"

import { SignUpForm } from "@/components/signup-form"

export default function LoginPage() {
  return (
    <div className="bg-black flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 "
    style={{
        backgroundImage: "url('/final.gif')",
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundBlendMode: "exclusion",
      }}>
        <div className="absolute inset-0 bg-black/80 z-0"></div>

      <div className="flex w-full max-w-sm flex-col gap-6 z-1">
        <SignUpForm />
      </div>
    </div>
  )
}