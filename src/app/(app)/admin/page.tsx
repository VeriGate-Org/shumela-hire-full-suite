'use client';

import React, { useCallback, useEffect, useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar from '@/components/record/DecisionBar';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import { complianceService } from '@/services/complianceService';
import { departmentService } from '@/services/departmentService';
import {
  ConsoleTile,
  complianceDetail,
  countDetail,
  orderTiles,
  overdueRequests,
} from '@/components/admin/console';

/**
 * The administration console.
 *
 * <p>Seventeen admin pages existed and none of them was a front door — every other area of this
 * product has one. Administration is also the only area where the useful question is not "what is
 * here" but <b>"is anything wrong"</b>, so the tiles are ordered by whether something is rather
 * than alphabetically, and a tile with nothing to report says what it holds and stops.
 *
 * <p><b>No tile claims a figure this page cannot cheaply get.</b> Three the design drew are absent
 * for that reason and are recorded in {@code OMITTED} rather than quietly dropped — most notably
 * "last changed" on roles, which the API returns as a hardcoded 2024 date for every role.
 */

/** How many requests are read to find the overdue ones. Beyond this the count is a floor. */
const DSAR_SCAN = 100;

export default function AdminConsolePage() {
  const [tiles, setTiles] = useState<ConsoleTile[]>([]);
  const [overdue, setOverdue] = useState(0);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);

    // Each source is read independently. One failure narrows its own tile to "could not be read"
    // rather than emptying the console — an administration home that goes blank because one
    // endpoint is down is worse than one that says which part it cannot see.
    // A source is only read when this viewer may see the tile it feeds. An HR Manager has no
    // business issuing a request to /api/admin/roles, and a 403 in the console would report as
    // "could not be read" when the truth is "not yours to read".
    const skip = Promise.reject(new Error('not permitted'));
    const [requests, departments, documents, roles, policies] = await Promise.allSettled([
      hasPermission('manage_compliance')
        ? complianceService.getAllDsars(undefined, 0, DSAR_SCAN) : skip,
      hasPermission('manage_departments') ? departmentService.getAll() : skip,
      hasPermission('manage_company_documents')
        ? apiFetch('/api/company-documents/all').then((r) => (r.ok ? r.json() : Promise.reject()))
        : skip,
      hasPermission('manage_permissions')
        ? apiFetch('/api/admin/roles').then((r) => (r.ok ? r.json() : Promise.reject())) : skip,
      hasPermission('manage_company_documents')
        ? apiFetch('/api/admin/retention-policies').then((r) => (r.ok ? r.json() : Promise.reject()))
        : skip,
    ]);

    const built: ConsoleTile[] = [];

    if (requests.status === 'fulfilled') {
      const page = requests.value;
      const rows = Array.isArray(page?.content) ? page.content : [];
      const total = typeof page?.totalElements === 'number' ? page.totalElements : rows.length;
      const { detail, state } = complianceDetail(rows, total > DSAR_SCAN);
      setOverdue(overdueRequests(rows).length);
      built.push({
        id: 'compliance',
        permission: 'manage_compliance',
        label: 'Compliance',
        href: '/admin/compliance',
        description: 'POPIA consents, data-subject requests and retention reminders',
        detail,
        state,
      });
    } else {
      built.push({
        id: 'compliance',
        permission: 'manage_compliance',
        label: 'Compliance',
        href: '/admin/compliance',
        description: 'POPIA consents, data-subject requests and retention reminders',
        detail: null,
        state: 'unknown',
      });
    }

    const count = (result: PromiseSettledResult<unknown>): number | null => {
      if (result.status !== 'fulfilled') return null;
      const value = result.value as unknown;
      if (Array.isArray(value)) return value.length;
      const content = (value as { content?: unknown[] })?.content;
      return Array.isArray(content) ? content.length : null;
    };

    const departmentCount = countDetail(count(departments), 'department', 'departments');
    built.push({
      id: 'departments',
      permission: 'manage_departments',
      label: 'Departments',
      href: '/admin/departments',
      description: 'The organisational units vacancies are raised against',
      ...departmentCount,
    });

    const documentCount = countDetail(count(documents), 'document', 'documents');
    built.push({
      id: 'company-documents',
      permission: 'manage_company_documents',
      label: 'Company documents',
      href: '/admin/company-documents',
      description: 'Policies staff acknowledge',
      ...documentCount,
    });

    const roleCount = countDetail(count(roles), 'role', 'roles');
    built.push({
      id: 'permissions',
      permission: 'manage_permissions',
      label: 'Role permissions',
      href: '/admin/permissions',
      description: 'What each role may see and do',
      ...roleCount,
    });

    const policyCount = countDetail(count(policies), 'policy', 'policies');
    built.push({
      id: 'retention',
      permission: 'manage_company_documents',
      label: 'Document retention',
      href: '/admin/document-retention',
      description: 'How long each document type is kept before disposal',
      ...policyCount,
    });

    // Two areas carry no figure by design. The audit log's size says nothing about whether
    // anything is wrong, and branding is either set or it is not — neither is worth a request.
    built.push({
      id: 'audit-logs',
      permission: 'view_audit_logs',
      label: 'Audit log',
      href: '/admin/audit-logs',
      description: 'Every recorded action, append-only',
      detail: null,
      state: 'settled',
    });
    built.push({
      id: 'branding',
      permission: 'manage_permissions',
      label: 'Branding',
      href: '/admin/branding',
      description: 'Logo and colours applied across the tenant',
      detail: null,
      state: 'settled',
    });

    // Filtered last, so a tile's figure is never computed for somebody who will not see it.
    setTiles(orderTiles(built.filter((tile) => hasPermission(tile.permission))));
    setLoading(false);
  }, [hasPermission]);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadable = tiles.filter((tile) => tile.state === 'unknown').length;

  return (
    <PageWrapper>
      <div className="space-y-4">
        <IdentityBand
          eyebrow="Administration"
          title="Console"
          subtitle="Tenant configuration, access and compliance"
          figures={
            loading
              ? []
              : [
                  {
                    label: 'Past deadline',
                    value: overdue,
                    tone: (overdue > 0 ? 'critical' : undefined) as 'critical' | undefined,
                  },
                  { label: 'Areas', value: tiles.length },
                ]
          }
        />

        {overdue > 0 && (
          <DecisionBar
            ask={`${overdue} data-subject request${overdue === 1 ? ' is' : 's are'} past the 30-day statutory deadline.`}
            why="POPIA sets the deadline, not this product. Overdue requests are the one thing on this page somebody is accountable for."
            tone="stopped"
          />
        )}

        {unreadable > 0 && (
          <DecisionBar
            ask={`${unreadable} ${unreadable === 1 ? 'area' : 'areas'} could not be read.`}
            why="Those tiles say so rather than showing a zero. Nothing here is a count of nothing."
            tone="owed"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((tile) => (
            <a
              key={tile.id}
              href={tile.href}
              className={`enterprise-card p-5 block hover:border-primary transition-colors border-l-4 ${
                tile.state === 'wrong'
                  ? 'border-l-error'
                  : tile.state === 'attention'
                    ? 'border-l-accent-gold'
                    : tile.state === 'unknown'
                      ? 'border-l-border'
                      : 'border-l-accent-teal'
              }`}
            >
              <h2 className="text-sm font-extrabold text-foreground">{tile.label}</h2>
              <p className="text-xs text-muted-foreground mt-1">{tile.description}</p>
              <p
                className={`text-sm mt-3 font-bold ${
                  tile.state === 'wrong' ? 'text-error' : 'text-muted-foreground'
                }`}
              >
                {/*
                  A tile with nothing to report says what it holds and stops. One whose source could
                  not be read says that — it does not show a zero, which would read as "nothing
                  here" when it means "we could not look".
                */}
                {tile.detail ?? (tile.state === 'unknown' ? 'Could not be read' : ' ')}
              </p>
            </a>
          ))}
        </div>

        {loading && <p className="text-sm text-muted-foreground">Reading each area…</p>}
      </div>
    </PageWrapper>
  );
}
