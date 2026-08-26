/**
 * What each connector is, and where its configuration actually lives.
 *
 * Kept beside the page rather than inside it because two of these facts are not in
 * `/api/integrations/status` at all:
 *
 *  - **Where a connector is configured.** Sage has four screens, SSO has two, the LMS has one,
 *    and the rest have none. The hub linked to none of them, so the only way in was to know the
 *    URL. That is the single largest thing this page was missing.
 *  - **That SSO and the LMS exist.** Both ship working configuration screens and neither appears
 *    in the status endpoint's list, so the hub has never mentioned them.
 */

export type ConnectorState = 'live' | 'failing' | 'available' | 'unlisted';

export interface Destination {
  label: string;
  href: string;
}

export interface ConnectorMeta {
  /** Said in the user's terms — what happens when this is on, not what it integrates with. */
  does: string;
  /** Where it is configured. Empty means no screen exists; the row says so rather than
   *  offering a control that goes nowhere. */
  destinations: Destination[];
  /** Shown when there is nowhere to go, so the row still answers "what would I have to do". */
  blocked?: string;
}

export const CONNECTOR_META: Record<string, ConnectorMeta> = {
  sage: {
    does: 'Registers a new employee, salary and tax when an offer is accepted',
    destinations: [
      { label: 'Configure', href: '/integrations/sage/config' },
      { label: 'Logs', href: '/integrations/sage/logs' },
      { label: 'Mappings', href: '/integrations/sage/mappings' },
      { label: 'Schedules', href: '/integrations/sage/schedules' },
    ],
  },
  docusign: {
    does: 'Sends offer letters and contracts for signing, and tracks envelopes',
    destinations: [{ label: 'Settings', href: '/integrations/docusign' }],
  },
  linkedin: {
    does: 'Posts vacancies and sources candidates from your company page',
    destinations: [{ label: 'Settings', href: '/integrations/job-boards' }],
  },
  indeed: {
    does: 'Posts vacancies and sponsored listings',
    destinations: [{ label: 'Settings', href: '/integrations/job-boards' }],
  },
  pnet: {
    does: 'South African board — posts by XML feed',
    destinations: [{ label: 'Settings', href: '/integrations/job-boards' }],
  },
  'career-junction': {
    does: 'South African board — posting and candidate matching',
    destinations: [{ label: 'Settings', href: '/integrations/job-boards' }],
  },
  'ms-teams': {
    does: 'Posts hiring and interview updates to a channel',
    destinations: [],
    blocked: 'Needs a webhook',
  },
  outlook: {
    does: 'Puts interviews in calendars and handles rescheduling',
    destinations: [],
    blocked: 'Needs credentials',
  },
  'aws-ses': {
    does: 'Delivers every transactional email the system sends',
    destinations: [{ label: 'Settings', href: '/integrations/email' }],
  },
};

/**
 * Integrations the application genuinely has, with working screens, that the status endpoint
 * does not return. Listing them here is the honest alternative to pretending the hub is the
 * complete picture.
 */
export interface UnlistedConnector {
  id: string;
  name: string;
  category: string;
  meta: ConnectorMeta;
}

export const UNLISTED_CONNECTORS: UnlistedConnector[] = [
  {
    id: 'sso',
    name: 'Active Directory SSO',
    category: 'Identity',
    meta: {
      does: 'Signs staff in with their existing directory account',
      destinations: [
        { label: 'Configure', href: '/integrations/sso' },
        { label: 'Group mappings', href: '/integrations/sso/mappings' },
      ],
    },
  },
  {
    id: 'lms',
    name: 'Learning management',
    category: 'Training',
    meta: {
      does: 'Syncs courses, enrolments and completions with your LMS',
      destinations: [{ label: 'Configure', href: '/integrations/lms' }],
    },
  },
];

/**
 * `configured` and `status` are two separate facts and the old page collapsed them into one
 * grey "Disconnected" pill — so seven untouched job boards made a healthy tenant look broken.
 * Kept apart, "available" reads as what it is: not set up, and not a fault.
 */
export function connectorState(status: string): ConnectorState {
  if (status === 'connected') return 'live';
  if (status === 'error') return 'failing';
  return 'available';
}

export const STATE_LABEL: Record<ConnectorState, string> = {
  live: 'Live',
  failing: 'Failing',
  available: 'Available',
  unlisted: 'Not listed',
};
