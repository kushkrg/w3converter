import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { sendContactEmail } from "@/lib/mail";
import { verifyRecaptcha } from "@/lib/recaptcha";

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

async function getIpLocation(ip: string): Promise<string> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return "Local Development (localhost)";
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return "Unknown Location";
    const data = await res.json();
    if (data.status === "fail") return `Unknown Location (${data.message || "IP lookup failed"})`;
    
    return [
      data.city,
      data.regionName,
      data.country,
    ].filter(Boolean).join(", ") + ` (ISP: ${data.isp || "Unknown"})`;
  } catch (err) {
    console.error("[ip-lookup] Error fetching IP location:", err);
    return "Unknown Location";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, email, message } = parsed.data;
    const recaptchaToken = (body.recaptchaToken as string) || "";

    // Verify reCAPTCHA token
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return NextResponse.json({ error: "reCAPTCHA verification failed. Please try again." }, { status: 400 });
    }

    // Resolve client IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "127.0.0.1";

    // Resolve location from IP
    const location = await getIpLocation(ip);

    // 1. Store in database
    const msg = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message,
        ip,
        location,
      },
    });

    // 2. Fetch admin email
    const adminEmail = await getSetting("site.contactEmail");

    // 3. Send email to admin
    if (adminEmail) {
      try {
        await sendContactEmail({
          to: adminEmail,
          name,
          email,
          message,
          ip,
          location,
        });
      } catch (mailErr) {
        console.error("[contact-api] Failed to send email to admin:", mailErr);
        // Do not fail the request if only the email send fails, since it is saved in the database!
      }
    } else {
      console.warn("[contact-api] site.contactEmail is not configured, skipping email notification.");
    }

    return NextResponse.json({ ok: true, id: msg.id });
  } catch (err) {
    console.error("[contact-api] Request error:", err);
    return NextResponse.json({ error: "Server error processing message" }, { status: 500 });
  }
}
