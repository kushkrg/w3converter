import geoip from "fast-geoip";

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

function countryFlag(code: string): string {
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export async function getCountryFromIp(ip: string | null): Promise<string> {
  if (!ip) return "—";
  const clean = ip.replace("::ffff:", "").trim();
  if (
    clean === "127.0.0.1" ||
    clean === "::1" ||
    clean.startsWith("192.168.") ||
    clean.startsWith("10.") ||
    clean.startsWith("172.")
  ) {
    return "🏠 Local";
  }
  try {
    const geo = await geoip.lookup(clean);
    if (!geo?.country) return "—";
    const name = COUNTRY_NAMES.of(geo.country) ?? geo.country;
    return `${countryFlag(geo.country)} ${name}`;
  } catch {
    return "—";
  }
}
