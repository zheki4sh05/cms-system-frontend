// src/shared/types/rule.types.ts

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: RuleSeverity;
  status: RuleStatus;
  
  // Условия правила
  conditions: RuleCondition[];
  actions: RuleAction[];
  
  // Groovy скрипт для анализа
  groovyScript?: string;
  scriptFileName?: string;
  scriptUploadedAt?: string;
  
  // Метрики эффективности
  totalTriggers: number;
  truePositives: number;
  falsePositives: number;
  accuracy: number;
  
  // Метаданные
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  
  // Настройки
  isActive: boolean;
  priority: number;
  threshold?: number;
}

export type RuleCategory = 
  | 'FINANCIAL'
  | 'VENDOR'
  | 'COMPLIANCE'
  | 'LOGISTICS'
  | 'DATA_QUALITY'
  | 'ETHICS';

export type RuleSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RuleStatus = 
  | 'ACTIVE'
  | 'DISABLED'
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'ARCHIVED';

export interface RuleCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN_OR_EQUAL'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'IN'
  | 'NOT_IN'
  | 'IS_NULL'
  | 'IS_NOT_NULL';

export interface RuleAction {
  id: string;
  type: ActionType;
  parameters: Record<string, any>;
}

export type ActionType =
  | 'CREATE_INCIDENT'
  | 'SEND_NOTIFICATION'
  | 'ESCALATE'
  | 'BLOCK_TRANSACTION'
  | 'LOG_EVENT'
  | 'TRIGGER_WORKFLOW';

export interface CreateRuleRequest {
  name: string;
  description: string;
  category: RuleCategory;
  severity: RuleSeverity;
  conditions: Omit<RuleCondition, 'id'>[];
  actions: Omit<RuleAction, 'id'>[];
  priority: number;
  threshold?: number;
  groovyScript?: string;  
  scriptFileName?: string; 
}

export interface UpdateRuleRequest {
  name?: string;
  description?: string;
  category?: RuleCategory;
  severity?: RuleSeverity;
  conditions?: Omit<RuleCondition, 'id'>[];
  actions?: Omit<RuleAction, 'id'>[];
  priority?: number;
  threshold?: number;
  groovyScript?: string; 
  scriptFileName?: string;  
}

export interface ValidateScriptRequest {
  script: string;
}

export interface ValidateScriptResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

export interface RuleStatistics {
  total: number;
  active: number;
  disabled: number;
  draft: number;
  underReview: number;
  
  byCategory: {
    category: RuleCategory;
    count: number;
  }[];
  
  bySeverity: {
    severity: RuleSeverity;
    count: number;
  }[];
  
  avgAccuracy: number;
  totalTriggers: number;
}

export interface RuleTriggerHistory {
  id: string;
  ruleId: string;
  triggeredAt: string;
  eventData: any;
  result: 'TRUE_POSITIVE' | 'FALSE_POSITIVE' | 'PENDING';
  incidentId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface TestRuleRequest {
  conditions: Omit<RuleCondition, 'id'>[];
  testData: any;
}

export interface TestRuleResponse {
  matched: boolean;
  matchedConditions: string[];
  unmatchedConditions: string[];
  executionTime: number;
}
