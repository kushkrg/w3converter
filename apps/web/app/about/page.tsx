import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Shield, Zap, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about w3converter — who we are and why we built a free, privacy-first PDF platform.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-4xl font-extrabold mb-4">About w3converter</h1>
          <p className="text-lg text-muted-foreground mb-10">
            We built w3converter because online PDF utilities shouldn&apos;t require accounts, paywalls, or giving
            away your files to third-party servers.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {[
              { icon: Shield, title: "Privacy First", desc: "Your files are processed on our servers and deleted automatically after 1 hour. We never read, index, or share your documents." },
              { icon: Zap, title: "Fast & Free", desc: "All 26+ tools are free with no registration. Files under 10MB typically process in under 5 seconds." },
              { icon: Heart, title: "Open Source Engines", desc: "We use trusted open-source libraries: pdf-lib, Ghostscript, qpdf, Poppler, LibreOffice, and Sharp." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border p-5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold mb-3">Our Mission</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            w3converter was created to give everyone — individuals, small businesses, and developers — a reliable,
            free alternative to expensive PDF software. We believe document utilities should be accessible to anyone
            with an internet connection, without subscriptions or hidden fees.
          </p>

          <h2 className="text-xl font-bold mb-3">Technology</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Built on Next.js 16, Node.js, and a suite of battle-tested open-source PDF libraries. Processing jobs
            run in isolated background workers and all data is stored temporarily before being permanently deleted.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
