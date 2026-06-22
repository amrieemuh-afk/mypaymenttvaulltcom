interface GeoResult {
  city: string;
  region: string;
  country: string;
  district: string;
  zip: string;
  isp: string;
  flag: string;
  label: string;
}

const cache = new Map<string, GeoResult>();

export async function getIpGeo(ip: string): Promise<GeoResult> {
  const fallback: GeoResult = { city: "-", region: "-", country: "-", district: "-", zip: "-", isp: "-", flag: "🌐", label: "-" };

  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("::")) return fallback;
  if (cache.has(ip)) return cache.get(ip)!;

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,district,zip,isp`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return fallback;
    const data = await res.json() as {
      status: string;
      country?: string;
      countryCode?: string;
      regionName?: string;
      city?: string;
      district?: string;
      zip?: string;
      isp?: string;
    };
    if (data.status !== "success") return fallback;

    const parts = [data.country, data.regionName, data.city, data.district].filter(v => v && v.trim());
    const result: GeoResult = {
      city: data.city ?? "-",
      region: data.regionName ?? "-",
      country: data.country ?? "-",
      district: data.district ?? "-",
      zip: data.zip ?? "-",
      isp: data.isp ?? "-",
      flag: countryFlag(data.countryCode ?? ""),
      label: parts.join(" › "),
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
