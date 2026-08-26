'use client';

import React from 'react';

/**
 * What actually decides a person's role when they sign in — which is not what these screens imply.
 *
 * Traced through the backend on 26 Aug 2026:
 *
 *   `CognitoJwtConverter.extractAuthorities()` reads the `cognito:groups` claim and passes each
 *   group name to `normalizeRole()`, which uppercases it, turns `-` and spaces into `_`, strips a
 *   leading `ROLE_`, and keeps it only if the result is in a hardcoded `KNOWN_ROLES` set. Anything
 *   else is logged at debug and dropped.
 *
 * It never reads `SsoConfiguration.groupMappings`. `SsoGroupMappingService` only gets, updates,
 * parses and serialises them — there is no resolution method anywhere in it, and the field appears
 * in nothing but DTOs, the entity and the Dynamo item.
 *
 * So a mapping of `IDC-HR-Managers → HR_MANAGER` normalises the *group name* to
 * `IDC_HR_MANAGERS`, finds no such role, and is discarded. The saved mapping is never consulted.
 * `defaultRole` is unused for the same reason: the final fallback is a hardcoded `ROLE_APPLICANT`.
 *
 * This component states that plainly. Silence here would leave an administrator believing they had
 * granted access they have not granted, or withheld access they have not withheld.
 */

/** Group names that currently resolve, taken from KNOWN_ROLES in CognitoJwtConverter. */
export const RESOLVING_ROLE_NAMES = [
  'PLATFORM_OWNER',
  'ADMIN',
  'EXECUTIVE',
  'HR_MANAGER',
  'LINE_MANAGER',
  'HIRING_MANAGER',
  'RECRUITER',
  'INTERVIEWER',
  'EMPLOYEE',
  'APPLICANT',
  'TA_MANAGER',
];

export default function SsoRoleResolutionNotice() {
  return (
    <section className="rounded-card border-2 border-error/40 bg-error/5 p-5">
      <h2 className="text-sm font-bold text-foreground">
        These mappings are saved, but they do not currently decide anyone&rsquo;s access
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        When someone signs in, their role is worked out from the{' '}
        <code className="text-xs font-mono text-foreground">cognito:groups</code> claim on their token.
        Each group name is uppercased, its hyphens and spaces become underscores, and it is kept only
        if the result is one of the role names below. <b className="font-semibold text-foreground">The
        mappings on this screen are not read at any point in that process.</b>
      </p>

      <p className="mt-3 text-sm text-muted-foreground">
        So a directory group called <code className="text-xs font-mono text-foreground">IDC-HR-Managers</code>{' '}
        becomes <code className="text-xs font-mono text-foreground">IDC_HR_MANAGERS</code>, matches no
        role, and is ignored — whatever it is mapped to here.
      </p>

      <div className="mt-4">
        <div className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Group names that do resolve today
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RESOLVING_ROLE_NAMES.map((r) => (
            <code
              key={r}
              className="rounded-control border border-border bg-muted px-2 py-1 text-[0.6875rem] font-mono text-foreground"
            >
              {r}
            </code>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Case and separators do not matter — <code className="text-xs font-mono">hr-manager</code> and{' '}
          <code className="text-xs font-mono">HR Manager</code> both work.
        </p>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Someone whose groups match none of these falls through to an explicit role claim, then to the
        role stored on their user record, and finally to{' '}
        <b className="font-semibold text-foreground">Applicant</b> — the least privileged role, not the
        default set on the configuration screen, which is also not applied.
      </p>

      <p className="mt-4 text-xs text-muted-foreground">
        Until the sign-in path reads these mappings, name your directory groups after the roles above.
        Making the mappings take effect is a change to how access is granted, so it needs a decision
        rather than a quiet fix.
      </p>
    </section>
  );
}
