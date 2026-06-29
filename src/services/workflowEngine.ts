import { WorkflowRule } from '@/types';
import { settingsService } from './settingsService';

type ApprovalKind =
  | 'Purchase Requisition'
  | 'Purchase Order'
  | 'GRN'
  | 'Stock Adjustment'
  | 'Stock Transfer'
  | 'Purchase Return'
  | 'Sales Return';

interface WorkflowNotification {
  id: string;
  ruleName: string;
  kind: ApprovalKind;
  action: 'Email' | 'Notification' | 'Auto-Approve';
  message: string;
  timestamp: Date;
}

const MODULE_MAP: Record<ApprovalKind, WorkflowRule['module']> = {
  'Purchase Requisition': 'Purchase',
  'Purchase Order': 'Purchase',
  'GRN': 'Stock',
  'Stock Adjustment': 'Stock',
  'Stock Transfer': 'Stock',
  'Purchase Return': 'Sales',
  'Sales Return': 'Sales',
};

const notifications: WorkflowNotification[] = [];

function pushNotification(
  rule: WorkflowRule,
  kind: ApprovalKind,
  message: string,
) {
  notifications.push({
    id: `${rule.id}-${Date.now()}`,
    ruleName: rule.name,
    kind,
    action: rule.action,
    message,
    timestamp: new Date(),
  });
}

export function getAndClearNotifications(): WorkflowNotification[] {
  const copy = [...notifications];
  notifications.length = 0;
  return copy;
}

function parseFieldValue(data: Record<string, unknown>, field: string): unknown {
  const lower = field.toLowerCase();
  for (const key of [field, lower, field.toUpperCase()]) {
    if (key in data) return data[key];
  }
  if (lower === 'amount') {
    return data.totalAmount ?? data.amount;
  }
  return undefined;
}

function evaluateCondition(
  condition: string,
  data: Record<string, unknown>,
): boolean {
  const trimmed = condition.trim();
  const match = trimmed.match(
    /^(\w+(?:\s*\w+)*)\s*(>=|<=|!=|==|>|<)\s*(.+)$/,
  );
  if (!match) return false;

  const [, field, operator, rawValue] = match;
  const fieldValue = parseFieldValue(data, field.trim());
  if (fieldValue === undefined) return false;

  const strValue = rawValue.trim().replace(/^"(.*)"$/, '$1');
  const numValue = Number(strValue);
  const numField = Number(fieldValue);

  if (!isNaN(numValue) && !isNaN(numField)) {
    switch (operator) {
      case '>':
        return numField > numValue;
      case '<':
        return numField < numValue;
      case '>=':
        return numField >= numValue;
      case '<=':
        return numField <= numValue;
      case '==':
        return numField === numValue;
      case '!=':
        return numField !== numValue;
    }
  }

  const strField = String(fieldValue);
  switch (operator) {
    case '==':
      return strField === strValue;
    case '!=':
      return strField !== strValue;
    default:
      return false;
  }
}

function extractEvalData(
  item: Record<string, unknown>,
  kind: ApprovalKind,
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...item };

  if (kind === 'Purchase Requisition') {
    const items = (item.items ?? []) as Array<Record<string, unknown>>;
    data.Amount = items.reduce(
      (sum, i) => sum + Number(i.estimatedPrice ?? 0) * Number(i.quantity ?? 0),
      0,
    );
  } else if (kind === 'Purchase Order') {
    data.Amount = item.totalAmount ?? 0;
  } else if (kind === 'GRN') {
    data.Amount = item.totalAmount ?? 0;
  } else if (kind === 'Stock Adjustment') {
    data.Amount = item.quantity ?? 0;
    data.Impact = item.impact;
  } else if (kind === 'Stock Transfer') {
    const items = (item.items ?? []) as Array<Record<string, unknown>>;
    data.Amount = items.reduce(
      (sum, i) => sum + Number(i.quantity ?? 0),
      0,
    );
  } else if (kind === 'Purchase Return' || kind === 'Sales Return') {
    const items = (item.items ?? []) as Array<Record<string, unknown>>;
    data.Amount = items.reduce(
      (sum, i) => sum + Number(i.quantity ?? 0),
      0,
    );
  }

  return data;
}

async function getActiveRules(): Promise<WorkflowRule[]> {
  try {
    const rules = await settingsService.getWorkflowRules();
    return rules.filter((r) => r.active);
  } catch {
    return [];
  }
}

export async function findMatchingRules(
  module: WorkflowRule['module'],
  triggerEvent: WorkflowRule['triggerEvent'],
): Promise<WorkflowRule[]> {
  const active = await getActiveRules();
  return active.filter(
    (r) => r.module === module && r.triggerEvent === triggerEvent,
  );
}

export async function shouldAutoApprove(
  item: Record<string, unknown>,
  kind: ApprovalKind,
): Promise<boolean> {
  const module = MODULE_MAP[kind];
  const rules = await findMatchingRules(module, 'Create');
  if (rules.length === 0) return false;

  const data = extractEvalData(item, kind);

  for (const rule of rules) {
    if (rule.action !== 'Auto-Approve') continue;
    if (evaluateCondition(rule.condition, data)) {
      return true;
    }
  }

  return false;
}

export async function fireNotifications(
  triggerEvent: WorkflowRule['triggerEvent'],
  item: Record<string, unknown>,
  kind: ApprovalKind,
) {
  const module = MODULE_MAP[kind];
  const rules = await findMatchingRules(module, triggerEvent);
  if (rules.length === 0) return;

  const data = extractEvalData(item, kind);

  for (const rule of rules) {
    if (rule.action === 'Auto-Approve') continue;
    if (!evaluateCondition(rule.condition, data)) continue;

    const ref = String(
      item.referenceNo ||
        item.grnNumber ||
        item.prNumber ||
        item.poNumber ||
        item.reference ||
        item.id ||
        '',
    );
    pushNotification(
      rule,
      kind,
      `"${rule.name}" triggered — ${rule.action === 'Email' ? 'email' : 'notification'} sent for ${kind} #${ref}`,
    );
  }
}
