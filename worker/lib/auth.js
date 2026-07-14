function timingSafeEqual(a, b) {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

export function requireAdmin(request, env) {
  const header = request.headers.get("Authorization") || "";
  const [scheme, encoded] = header.split(" ");

  if (scheme !== "Basic" || !encoded) return null;

  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return null;

  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  if (
    timingSafeEqual(user, env.ADMIN_USER || "") &&
    timingSafeEqual(pass, env.ADMIN_PASSWORD || "")
  ) {
    return { user };
  }

  return null;
}

export function unauthorizedResponse() {
  return new Response("Authentifizierung erforderlich", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="HD Abdichtungstechnik Admin"' },
  });
}
