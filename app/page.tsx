"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Repository = { id: number; name: string; html_url: string; description: string | null; language: string | null; stargazers_count: number; forks_count: number; updated_at: string };
type GitHubProfile = { login: string; name: string | null; avatar_url: string; html_url: string; bio: string | null; location: string | null; company: string | null; followers: number; following: number; public_repos: number; created_at: string };
type GitHubEvent = { id: string; type: string; repo: { name: string }; created_at: string };
type DashboardData = { profile: GitHubProfile; repositories: Repository[]; events: GitHubEvent[] };

const eventLabels: Record<string, string> = { PushEvent: "a poussé du code dans", PullRequestEvent: "a travaillé sur une pull request dans", IssuesEvent: "a ouvert une issue dans", CreateEvent: "a créé une branche dans", WatchEvent: "a ajouté une étoile à", ForkEvent: "a forké" };
function formatNumber(value: number) { return new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(value); }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }

export default function Home() {
  const [username, setUsername] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) return;
    setIsLoading(true); setError("");
    try {
      const response = await fetch(`/api/github/${encodeURIComponent(cleanUsername)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Une erreur est survenue.");
      setDashboard(data);
    } catch (requestError) {
      setDashboard(null); setError(requestError instanceof Error ? requestError.message : "Impossible de charger ce profil.");
    } finally { setIsLoading(false); }
  }

  const profile = dashboard?.profile;
  const languages = dashboard?.repositories.reduce<Record<string, number>>((result, repository) => { if (repository.language) result[repository.language] = (result[repository.language] ?? 0) + 1; return result; }, {});
  const topLanguages = languages ? Object.entries(languages).sort(([, countA], [, countB]) => countB - countA).slice(0, 5) : [];

  return (
    <main className="shell">
      <header className="topbar"><Link className="brand" href="/" aria-label="Retour à l'accueil"><span className="brand-mark">GH</span><span>GitHub <em>Lens</em></span></Link><span className="status"><span className="status-dot" /> Données publiques GitHub</span></header>
      <section className={`hero ${dashboard ? "hero-compact" : ""}`}>
        <div className="eyebrow"><span>01</span> EXPLORER UN PROFIL</div>
        <h1>Le code raconte<br /><i>une histoire.</i></h1>
        {!dashboard && <p className="hero-copy">Entrez un pseudo GitHub pour révéler les projets,<br />les langages et le rythme de développement.</p>}
        <form className="searchbar" onSubmit={handleSubmit}><span className="search-icon">@</span><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="pseudo GitHub" aria-label="Pseudo GitHub" autoComplete="off" /><button type="submit" disabled={isLoading || !username.trim()}>{isLoading ? "Chargement..." : "Analyser le profil"}<span aria-hidden="true">↗</span></button></form>
        {error && <p className="error-message">{error}</p>}
      </section>
      {!dashboard && !isLoading && !error && <section className="feature-strip" aria-label="Fonctionnalités"><div><strong>01</strong><span>Profil en vue<br /><small>Identité et présence</small></span></div><div><strong>02</strong><span>Projets récents<br /><small>Ce qui bouge maintenant</small></span></div><div><strong>03</strong><span>Signal d’activité<br /><small>Une lecture rapide</small></span></div></section>}
      {profile && <section className="dashboard" aria-label={`Tableau de bord de ${profile.login}`}>
        <div className="profile-card"><div className="profile-heading"><Image src={profile.avatar_url} alt={`Avatar de ${profile.login}`} width={92} height={92} /><div><p className="card-kicker">PROFIL PUBLIC</p><h2>{profile.name || profile.login}</h2><a href={profile.html_url} target="_blank" rel="noreferrer">@{profile.login} ↗</a></div></div><p className="bio">{profile.bio || "Aucune biographie renseignée."}</p><div className="profile-meta">{profile.location && <span>⌖ {profile.location}</span>}{profile.company && <span>◼ {profile.company}</span>}<span>Depuis {formatDate(profile.created_at)}</span></div><div className="metrics"><div><strong>{formatNumber(profile.public_repos)}</strong><span>Repos publics</span></div><div><strong>{formatNumber(profile.followers)}</strong><span>Abonnés</span></div><div><strong>{formatNumber(profile.following)}</strong><span>Abonnements</span></div></div></div>
        <div className="section-heading"><div><p className="card-kicker">BIBLIOTHÈQUE</p><h2>Projets récents</h2></div><span>{dashboard.repositories.length} dépôts</span></div><div className="repository-grid">{dashboard.repositories.slice(0, 6).map((repository) => <a className="repo-card" href={repository.html_url} target="_blank" rel="noreferrer" key={repository.id}><div className="repo-top"><span className="repo-icon">⌘</span><span>↗</span></div><h3>{repository.name}</h3><p>{repository.description || "Pas de description pour ce projet."}</p><div className="repo-meta"><span>{repository.language && <><i className="language-dot" />{repository.language}</>}</span><span>★ {formatNumber(repository.stargazers_count)} &nbsp;⑂ {formatNumber(repository.forks_count)}</span></div></a>)}</div>
        <div className="lower-grid"><div className="panel"><div className="section-heading"><div><p className="card-kicker">ACTIVITÉ</p><h2>Derniers signaux</h2></div></div><div className="activity-list">{dashboard.events.slice(0, 5).map((event) => <div className="activity-item" key={event.id}><span className="activity-mark">↗</span><p><strong>{profile.login}</strong> {eventLabels[event.type] || "a interagi avec"} <strong>{event.repo.name}</strong><small>{formatDate(event.created_at)}</small></p></div>)}</div></div><div className="panel languages"><div className="section-heading"><div><p className="card-kicker">STACK</p><h2>Langages utilisés</h2></div></div>{topLanguages.length ? topLanguages.map(([language, count], index) => <div className="language-row" key={language}><span><i className={`language-dot language-${index}`} />{language}</span><span>{count} projet{count > 1 ? "s" : ""}</span></div>) : <p className="muted">Aucun langage détecté.</p>}</div></div>
      </section>}
      <footer><span>GITHUB LENS / 2026</span><span>Construit avec l&apos;API GitHub</span></footer>
    </main>
  );
}
