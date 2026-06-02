import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the w3converter team.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-xl">
          <h1 className="text-3xl font-extrabold mb-2">Contact Us</h1>
          <p className="text-muted-foreground mb-8">
            Have a question, bug report, or feature request? We&apos;d love to hear from you.
          </p>
          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
