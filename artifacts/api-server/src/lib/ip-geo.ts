interface GeoResult {
  city: string;
  region: string;
  country: string;
  flag: string;
  label: string;
}

const cache = new Map<string, GeoResult>();

export async function getIpGeo(ip: string): Promise<GeoResult> {
  const fallback: GeoResult = { city: "-", region: "-", country: "-", flag: "🌐", label: "-" };

  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("::")) return fallback;
  if (cache.has(ip)) return cache.get(ip)!;

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return fallback;
    const data = await res.json() as {
      status: string;
      country?: string;
      countryCode?: string;
      regionName?: string;
      city?: string;
    };
    if (data.status !== "success") return fallback;

    const result: GeoResult = {
      city: data.city ?? "-",
      region: data.regionName ?? "-",
      country: data.country ?? "-",
      flag: countryFlag(data.countryCode ?? ""),
      label: [data.city, data.regionName, data.country].filter(Boolean).join(", "),
    };
    cache.set(ip, result);
    return result;
  } catch {
    return fallback;
  }
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}
