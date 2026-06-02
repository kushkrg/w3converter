import { getSettings } from "./settings";
import { decrypt } from "./crypto";

export async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const s = await getSettings(["recaptcha.enabled", "recaptcha.secretKeyEnc", "recaptcha.v3Threshold"]);
    
    // If not enabled or no secret key, bypass verification cleanly
    if (s["recaptcha.enabled"] !== "true") {
      return true;
    }
    
    const secretEnc = s["recaptcha.secretKeyEnc"];
    if (!secretEnc) {
      console.warn("[recaptcha] Enabled but secretKeyEnc is missing.");
      return true;
    }

    const secret = decrypt(secretEnc);
    const threshold = parseFloat(s["recaptcha.v3Threshold"] || "0.5");

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });

    if (!response.ok) {
      console.error("[recaptcha] Google API verify error status:", response.status);
      return false;
    }

    const data = await response.json();
    if (!data.success) {
      console.warn("[recaptcha] Verification failed:", data["error-codes"]);
      return false;
    }

    if (data.score !== undefined && data.score < threshold) {
      console.warn(`[recaptcha] Score ${data.score} below threshold ${threshold}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[recaptcha] Verification exception:", err);
    return false;
  }
}
