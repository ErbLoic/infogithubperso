import { NextResponse } from "next/server";

const githubHeaders = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const safeUsername = decodeURIComponent(username).trim();
  if (!/^[a-zA-Z0-9-]+$/.test(safeUsername)) return NextResponse.json({ error: "Le pseudo GitHub est invalide." }, { status: 400 });
  const headers = { ...githubHeaders, ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
  try {
    const [profileResponse, repositoriesResponse, eventsResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${safeUsername}`, { headers, next: { revalidate: 120 } }),
      fetch(`https://api.github.com/users/${safeUsername}/repos?per_page=100&sort=updated`, { headers, next: { revalidate: 120 } }),
      fetch(`https://api.github.com/users/${safeUsername}/events/public?per_page=30`, { headers, next: { revalidate: 120 } }),
    ]);
    if (profileResponse.status === 404) return NextResponse.json({ error: `Aucun utilisateur trouvé pour « ${safeUsername} ».` }, { status: 404 });
    if (!profileResponse.ok || !repositoriesResponse.ok || !eventsResponse.ok) return NextResponse.json({ error: "GitHub ne peut pas répondre pour le moment." }, { status: 502 });
    return NextResponse.json({ profile: await profileResponse.json(), repositories: await repositoriesResponse.json(), events: await eventsResponse.json() });
  } catch { return NextResponse.json({ error: "Impossible de joindre GitHub." }, { status: 503 }); }
}