'use client'

import { makePage } from '@keystatic/next/ui/app'
import config from '../../keystatic.config'

/**
 * Application Keystatic (React, côté client).
 *
 * L'entrée `react-server` de `@keystatic/core/ui` rend `null` : ce fichier
 * doit rester un composant client, monté par `app/keystatic/layout.tsx`.
 */
export default makePage(config)
