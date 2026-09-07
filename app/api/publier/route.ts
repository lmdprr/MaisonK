import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SOURCE_BRANCH, TARGET_BRANCH } from '@/lib/publish'
import type { PublishError, PublishResult, PublishStatus } from '@/lib/publish'

/**
 * Mise en ligne du site depuis l'admin.
 *
 * - `GET` : nombre de commits de `SOURCE_BRANCH` pas encore sur `TARGET_BRANCH`.
 * - `POST` : avance `TARGET_BRANCH` sur `SOURCE_BRANCH` (fast-forward), ce qui
 *   déclenche le build Cloudflare. Crée la cible à la première mise en ligne.
 *
 * Authentification : on réutilise le token GitHub de la session Keystatic
 * (cookie `keystatic-gh-access-token`, posé par le route handler Keystatic).
 * Tous les appels à GitHub sont faits avec ce token : c'est l'éditeur qui
 * publie, avec ses propres droits, aucun secret supplémentaire côté serveur.
 * Le droit d'écriture est vérifié explicitement avant de toucher aux refs.
 *
 * Fast-forward plutôt que merge : personne ne commite sur la cible, elle doit
 * rester un simple pointeur vers un commit de la source. GitHub refuse la mise
 * à jour (422) si ce n'est plus le cas, on le remonte comme `conflict`.
 */

const GITHUB_API = 'https://api.github.com'
const TOKEN_COOKIE = 'keystatic-gh-access-token'

/** Dépôt cible, ou `null` en stockage local (variables absentes). */
function repoPath(): string | null {
  const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER
  const name = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME
  return owner && name ? `/repos/${owner}/${name}` : null
}

function error(code: PublishError['error'], status: number) {
  return NextResponse.json<PublishError>({ error: code }, { status })
}

class GitHubError extends Error {
  constructor(public readonly status: number) {
    super(`GitHub ${status}`)
  }
}

/** Appel GitHub authentifié. Lève `GitHubError` hors 2xx (le 404 est laissé passer si `allow404`). */
async function github<T>(token: string, path: string, init: RequestInit & { allow404?: boolean } = {}): Promise<T | null> {
  const { allow404, ...rest } = init
  const res = await fetch(GITHUB_API + path, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'maisonk-publish',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (res.status === 404 && allow404) return null
  if (!res.ok) throw new GitHubError(res.status)
  return (await res.json()) as T
}

/** SHA de la tête d'une branche, `null` si elle n'existe pas. */
async function branchSha(token: string, repo: string, branch: string) {
  const ref = await github<{ object: { sha: string } }>(token, `${repo}/git/ref/heads/${branch}`, { allow404: true })
  return ref?.object.sha ?? null
}

/** Traduit une erreur GitHub en réponse HTTP pour le bouton. */
function fromGitHubError(err: unknown) {
  if (!(err instanceof GitHubError)) throw err
  if (err.status === 401) return error('unauthenticated', 401)
  if (err.status === 403) return error('forbidden', 403)
  if (err.status === 422 || err.status === 409) return error('conflict', 409)
  return error('upstream', 502)
}

async function session() {
  const repo = repoPath()
  const token = (await cookies()).get(TOKEN_COOKIE)?.value
  return { repo, token }
}

export async function GET() {
  const { repo, token } = await session()
  if (!repo) return error('unconfigured', 404)
  if (!token) return error('unauthenticated', 401)

  try {
    const compare = await github<{ ahead_by: number }>(
      token,
      `${repo}/compare/${TARGET_BRANCH}...${SOURCE_BRANCH}`,
      { allow404: true }
    )
    return NextResponse.json<PublishStatus>({ ahead: compare?.ahead_by ?? null })
  } catch (err) {
    return fromGitHubError(err)
  }
}

export async function POST() {
  const { repo, token } = await session()
  if (!repo) return error('unconfigured', 404)
  if (!token) return error('unauthenticated', 401)

  try {
    const meta = await github<{ permissions?: { push?: boolean } }>(token, repo)
    if (!meta?.permissions?.push) return error('forbidden', 403)

    const sourceSha = await branchSha(token, repo, SOURCE_BRANCH)
    if (!sourceSha) return error('upstream', 502)

    const targetSha = await branchSha(token, repo, TARGET_BRANCH)
    if (targetSha === sourceSha) return NextResponse.json<PublishResult>({ outcome: 'up-to-date' })

    if (!targetSha) {
      await github(token, `${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${TARGET_BRANCH}`, sha: sourceSha }),
      })
      return NextResponse.json<PublishResult>({ outcome: 'created' })
    }

    await github(token, `${repo}/git/refs/heads/${TARGET_BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: sourceSha, force: false }),
    })
    return NextResponse.json<PublishResult>({ outcome: 'published' })
  } catch (err) {
    return fromGitHubError(err)
  }
}
