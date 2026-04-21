'use client';

import { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChartBarIcon,
  ListBulletIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

interface GoalNode {
  id: number;
  title: string;
  description: string | null;
  ownerName: string | null;
  weighting: number | null;
  status: string;
  cascadeLevel: number;
  parentGoalId: number | null;
  children: GoalNode[];
  progress: number;
}

type ViewMode = 'list' | 'cascade';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
};

function GoalTreeNode({ node, depth = 0 }: { node: GoalNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}>
      <div
        className="enterprise-card p-4 mb-2 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {hasChildren && (
                <span className="text-xs text-muted-foreground">
                  {expanded ? '▼' : '▶'}
                </span>
              )}
              <h4 className="text-sm font-medium text-foreground truncate">{node.title}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[node.status] || 'bg-gray-100 text-gray-600'}`}>
                {node.status}
              </span>
            </div>
            {node.ownerName && (
              <p className="text-xs text-muted-foreground mt-1">{node.ownerName}</p>
            )}
            {node.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{node.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {node.weighting != null && (
              <span className="text-xs text-muted-foreground">{node.weighting}%</span>
            )}
            <div className="w-24">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>Progress</span>
                <span>{node.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full">
                <div
                  className="h-1.5 bg-blue-600 rounded-full transition-all"
                  style={{ width: `${node.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="space-y-1">
          {node.children.map(child => (
            <GoalTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoalCascadePage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cascade');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/performance/goals/cascade');
      if (response.ok) {
        const data = await response.json();
        setGoals(Array.isArray(data) ? data : []);
      } else {
        // Fallback: fetch flat goals and build tree client-side
        const flatResponse = await apiFetch('/api/performance/goals');
        if (flatResponse.ok) {
          const flatGoals = await flatResponse.json();
          const tree = buildTree(Array.isArray(flatGoals) ? flatGoals : []);
          setGoals(tree);
        }
      }
    } catch {
      setGoals([]);
    }
    setLoading(false);
  };

  const buildTree = useCallback((flatGoals: any[]): GoalNode[] => {
    const map = new Map<number, GoalNode>();
    const roots: GoalNode[] = [];

    flatGoals.forEach(g => {
      map.set(g.id, {
        id: g.id,
        title: g.title || 'Untitled Goal',
        description: g.description,
        ownerName: g.ownerName || null,
        weighting: g.weighting,
        status: g.isActive ? 'ACTIVE' : 'DRAFT',
        cascadeLevel: g.cascadeLevel || 0,
        parentGoalId: g.parentGoalId,
        children: [],
        progress: Math.round(Math.random() * 100), // placeholder until real progress
      });
    });

    map.forEach(node => {
      if (node.parentGoalId && map.has(node.parentGoalId)) {
        map.get(node.parentGoalId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, []);

  return (
    <PageWrapper
      title="Goal Cascade"
      subtitle="View organizational goal hierarchy and alignment"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-muted-foreground border hover:bg-muted'
            }`}
          >
            <ListBulletIcon className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setViewMode('cascade')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === 'cascade' ? 'bg-blue-600 text-white' : 'text-muted-foreground border hover:bg-muted'
            }`}
          >
            <ArrowsPointingOutIcon className="w-3.5 h-3.5" /> Cascade
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 enterprise-card">
          <ChartBarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No goals found. Create goals in a performance contract to see them here.</p>
        </div>
      ) : viewMode === 'cascade' ? (
        <div className="space-y-2">
          {goals.map(goal => (
            <GoalTreeNode key={goal.id} node={goal} />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="enterprise-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Goal</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Weight</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Progress</th>
              </tr>
            </thead>
            <tbody>
              {flattenTree(goals).map(goal => (
                <tr key={goal.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span style={{ paddingLeft: `${goal.cascadeLevel * 20}px` }} className="text-sm text-foreground">
                      {goal.cascadeLevel > 0 && <span className="text-muted-foreground mr-1">└</span>}
                      {goal.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{goal.ownerName || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">L{goal.cascadeLevel}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{goal.weighting != null ? `${goal.weighting}%` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[goal.status] || 'bg-gray-100 text-gray-600'}`}>
                      {goal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                        <div className="h-1.5 bg-blue-600 rounded-full" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{goal.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
}

function flattenTree(nodes: GoalNode[], level = 0): GoalNode[] {
  const result: GoalNode[] = [];
  for (const node of nodes) {
    result.push({ ...node, cascadeLevel: level });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, level + 1));
    }
  }
  return result;
}
