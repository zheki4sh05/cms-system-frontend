// src/mocks/handlers_rules.ts

import { http, HttpResponse, delay } from 'msw';
import type {
  Rule,
  RulesListResponse,
  RuleStatistics,
  RuleTriggerHistory,
  CreateRuleRequest,
  UpdateRuleRequest,
  TestRuleRequest,
  TestRuleResponse,
  ValidateScriptRequest,
  ValidateScriptResponse,
} from '@shared/types/rulesTypes';
import type { RuleShortInfo } from '@shared/types/incidentTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const RULES_API_ROOT = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

// Моковые правила С GROOVY СКРИПТАМИ
let mockRules: Rule[] = [
  {
    id: 'RULE-001',
    name: 'Конфликт интересов при закупках',
    description: 'Проверяет, не является ли сотрудник совладельцем компании-поставщика или имеет родственные связи с руководством поставщика.',
    category: 'ETHICS',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    conditions: [
      {
        id: 'COND-001',
        field: 'employee.ownedCompanies',
        operator: 'CONTAINS',
        value: 'vendorId',
        logicalOperator: 'OR',
      },
      {
        id: 'COND-002',
        field: 'employee.relatedPersons',
        operator: 'CONTAINS',
        value: 'vendor.ownerId',
      },
    ],
    actions: [
      {
        id: 'ACT-001',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'CRITICAL',
          autoAssign: true,
        },
      },
      {
        id: 'ACT-002',
        type: 'SEND_NOTIFICATION',
        parameters: {
          recipients: ['supervisor', 'compliance_officer'],
          template: 'conflict_of_interest',
        },
      },
    ],
    groovyScript: `// Проверка конфликта интересов
def employee = binding.getVariable("employee")
def vendor = binding.getVariable("vendor")

// Проверка совладения компанией
def hasOwnership = employee.ownedCompanies?.contains(vendor.id)

// Проверка родственных связей
def hasRelation = employee.relatedPersons?.contains(vendor.ownerId)

if (hasOwnership || hasRelation) {
    return [
        violation: true,
        message: "Обнаружен конфликт интересов: сотрудник \${employee.name} связан с поставщиком \${vendor.name}",
        severity: "CRITICAL",
        details: [
            ownership: hasOwnership,
            relation: hasRelation
        ]
    ]
}

return [violation: false]`,
    scriptFileName: 'conflict_of_interest_check.groovy',
    scriptUploadedAt: '2024-09-15T10:00:00Z',
    totalTriggers: 8,
    truePositives: 8,
    falsePositives: 0,
    accuracy: 100,
    createdBy: '2',
    createdByName: 'Петр Петров',
    createdAt: '2024-09-15T10:00:00Z',
    updatedAt: '2024-11-15T10:00:00Z',
    lastTriggeredAt: '2024-12-01T14:30:00Z',
    isActive: true,
    priority: 10,
  },
  {
    id: 'RULE-002',
    name: 'Превышение лимита без согласования',
    description: 'Выявляет случаи превышения утвержденного бюджета на закупку без дополнительного согласования с руководством.',
    category: 'FINANCIAL',
    severity: 'HIGH',
    status: 'ACTIVE',
    conditions: [
      {
        id: 'COND-003',
        field: 'purchase.amount',
        operator: 'GREATER_THAN',
        value: 'purchase.approvedBudget',
      },
      {
        id: 'COND-004',
        field: 'purchase.additionalApproval',
        operator: 'IS_NULL',
        value: null,
        logicalOperator: 'AND',
      },
    ],
    actions: [
      {
        id: 'ACT-003',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'HIGH',
          autoAssign: true,
        },
      },
      {
        id: 'ACT-004',
        type: 'BLOCK_TRANSACTION',
        parameters: {
          requireApproval: true,
        },
      },
    ],
    groovyScript: `// Проверка превышения бюджета
def purchase = binding.getVariable("purchase")

def approvedBudget = purchase.approvedBudget ?: 0
def currentAmount = purchase.amount ?: 0
def threshold = 1.1 // 10% допустимое отклонение

if (currentAmount > approvedBudget * threshold && !purchase.additionalApproval) {
    def difference = currentAmount - approvedBudget
    def percentageOver = ((difference / approvedBudget) * 100).round(2)
    
    return [
        violation: true,
        message: "Превышение бюджета на \${difference} руб. (\${percentageOver}%) без дополнительного согласования",
        severity: "HIGH",
        details: [
            approvedBudget: approvedBudget,
            currentAmount: currentAmount,
            difference: difference,
            percentageOver: percentageOver
        ]
    ]
}

return [violation: false]`,
    scriptFileName: 'budget_overrun_check.groovy',
    scriptUploadedAt: '2024-08-20T14:30:00Z',
    totalTriggers: 45,
    truePositives: 41,
    falsePositives: 4,
    accuracy: 91,
    createdBy: '2',
    createdByName: 'Петр Петров',
    createdAt: '2024-08-20T14:30:00Z',
    updatedAt: '2024-10-20T14:30:00Z',
    lastTriggeredAt: '2024-12-02T16:45:00Z',
    isActive: true,
    priority: 8,
    threshold: 1.1,
  },
  {
    id: 'RULE-003',
    name: 'Истекшая лицензия поставщика',
    description: 'Контролирует сроки действия лицензий поставщиков на осуществление деятельности и уведомляет о необходимости продления.',
    category: 'COMPLIANCE',
    severity: 'HIGH',
    status: 'ACTIVE',
    conditions: [
      {
        id: 'COND-005',
        field: 'vendor.license.expiryDate',
        operator: 'LESS_THAN',
        value: 'CURRENT_DATE',
      },
    ],
    actions: [
      {
        id: 'ACT-005',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'HIGH',
          autoAssign: true,
        },
      },
      {
        id: 'ACT-006',
        type: 'SEND_NOTIFICATION',
        parameters: {
          recipients: ['compliance_officer', 'procurement_manager'],
          template: 'license_expired',
        },
      },
    ],
    groovyScript: `// Проверка срока действия лицензии
import java.time.LocalDate
import java.time.temporal.ChronoUnit

def vendor = binding.getVariable("vendor")

if (!vendor.license || !vendor.license.expiryDate) {
    return [
        violation: true,
        message: "У поставщика \${vendor.name} отсутствует информация о лицензии",
        severity: "HIGH",
        details: [reason: "NO_LICENSE_DATA"]
    ]
}

def expiryDate = LocalDate.parse(vendor.license.expiryDate.toString().substring(0, 10))
def today = LocalDate.now()
def daysUntilExpiry = ChronoUnit.DAYS.between(today, expiryDate)

if (daysUntilExpiry < 0) {
    return [
        violation: true,
        message: "Лицензия поставщика \${vendor.name} истекла \${Math.abs(daysUntilExpiry)} дней назад",
        severity: "HIGH",
        details: [
            expiryDate: vendor.license.expiryDate,
            daysOverdue: Math.abs(daysUntilExpiry)
        ]
    ]
} else if (daysUntilExpiry <= 30) {
    return [
        violation: true,
        message: "Лицензия поставщика \${vendor.name} истекает через \${daysUntilExpiry} дней",
        severity: "MEDIUM",
        details: [
            expiryDate: vendor.license.expiryDate,
            daysRemaining: daysUntilExpiry
        ]
    ]
}

return [violation: false]`,
    scriptFileName: 'license_expiry_check.groovy',
    scriptUploadedAt: '2024-07-10T09:00:00Z',
    totalTriggers: 12,
    truePositives: 11,
    falsePositives: 1,
    accuracy: 92,
    createdBy: '2',
    createdByName: 'Петр Петров',
    createdAt: '2024-07-10T09:00:00Z',
    updatedAt: '2024-09-10T09:00:00Z',
    lastTriggeredAt: '2024-11-28T11:20:00Z',
    isActive: true,
    priority: 7,
  },
  {
    id: 'RULE-004',
    name: 'Систематическое нарушение сроков',
    description: 'Выявляет поставщиков, которые систематически нарушают сроки поставки (более 3 раз за последние 3 месяца).',
    category: 'LOGISTICS',
    severity: 'MEDIUM',
    status: 'UNDER_REVIEW',
    conditions: [
      {
        id: 'COND-006',
        field: 'vendor.delayedDeliveries.last3Months',
        operator: 'GREATER_THAN_OR_EQUAL',
        value: 3,
      },
    ],
    actions: [
      {
        id: 'ACT-007',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'MEDIUM',
          autoAssign: true,
        },
      },
      {
        id: 'ACT-008',
        type: 'LOG_EVENT',
        parameters: {
          category: 'vendor_performance',
        },
      },
    ],
    groovyScript: `// Проверка систематических задержек поставок
def vendor = binding.getVariable("vendor")
def deliveries = vendor.deliveries ?: []

// Фильтруем задержанные поставки за последние 3 месяца
def threeMonthsAgo = new Date() - 90
def delayedCount = deliveries.findAll { delivery ->
    delivery.date >= threeMonthsAgo && delivery.delayed == true
}.size()

def threshold = 3

if (delayedCount >= threshold) {
    def totalDeliveries = deliveries.findAll { it.date >= threeMonthsAgo }.size()
    def delayRate = totalDeliveries > 0 ? (delayedCount / totalDeliveries * 100).round(2) : 0
    
    return [
        violation: true,
        message: "Поставщик \${vendor.name} систематически нарушает сроки: \${delayedCount} задержек за 3 месяца",
        severity: "MEDIUM",
        details: [
            delayedCount: delayedCount,
            totalDeliveries: totalDeliveries,
            delayRate: delayRate
        ]
    ]
}

return [violation: false]`,
    scriptFileName: 'delivery_delay_pattern.groovy',
    scriptUploadedAt: '2024-09-01T11:30:00Z',
    totalTriggers: 28,
    truePositives: 23,
    falsePositives: 5,
    accuracy: 82,
    createdBy: '2',
    createdByName: 'Петр Петров',
    createdAt: '2024-09-01T11:30:00Z',
    updatedAt: '2024-11-25T16:00:00Z',
    lastTriggeredAt: '2024-12-01T09:15:00Z',
    isActive: true,
    priority: 5,
  },
  {
    id: 'RULE-005',
    name: 'Дубликаты контрагентов',
    description: 'Обнаруживает дублирующиеся записи контрагентов в системе по ИНН, названию или адресу.',
    category: 'DATA_QUALITY',
    severity: 'LOW',
    status: 'ACTIVE',
    conditions: [
      {
        id: 'COND-007',
        field: 'vendor.inn',
        operator: 'EQUALS',
        value: 'existingVendor.inn',
      },
      {
        id: 'COND-008',
        field: 'vendor.id',
        operator: 'NOT_EQUALS',
        value: 'existingVendor.id',
        logicalOperator: 'AND',
      },
    ],
    actions: [
      {
        id: 'ACT-009',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'LOW',
          autoAssign: true,
        },
      },
      {
        id: 'ACT-010',
        type: 'SEND_NOTIFICATION',
        parameters: {
          recipients: ['data_quality_manager'],
          template: 'duplicate_vendor',
        },
      },
    ],
    groovyScript: `// Проверка дубликатов контрагентов
def vendor = binding.getVariable("vendor")
def existingVendors = binding.getVariable("existingVendors") ?: []

def duplicates = []

existingVendors.each { existing ->
    if (existing.id != vendor.id) {
        // Проверка по ИНН
        if (vendor.inn && vendor.inn == existing.inn) {
            duplicates << [type: "INN", vendor: existing]
        }
        // Проверка по названию (похожесть > 90%)
        if (vendor.name && calculateSimilarity(vendor.name, existing.name) > 0.9) {
            duplicates << [type: "NAME", vendor: existing]
        }
        // Проверка по адресу
        if (vendor.address && vendor.address == existing.address) {
            duplicates << [type: "ADDRESS", vendor: existing]
        }
    }
}

if (duplicates.size() > 0) {
    return [
        violation: true,
        message: "Обнаружены возможные дубликаты для контрагента \${vendor.name}",
        severity: "LOW",
        details: [
            duplicateCount: duplicates.size(),
            duplicates: duplicates
        ]
    ]
}

return [violation: false]

// Вспомогательная функция расчета похожести строк
def calculateSimilarity(String s1, String s2) {
    def longer = s1.length() > s2.length() ? s1 : s2
    def shorter = s1.length() > s2.length() ? s2 : s1
    if (longer.length() == 0) return 1.0
    return (longer.length() - levenshteinDistance(longer, shorter)) / (double) longer.length()
}

def levenshteinDistance(String s1, String s2) {
    def costs = new int[s2.length() + 1]
    for (int i = 0; i <= s1.length(); i++) {
        int lastValue = i
        for (int j = 0; j <= s2.length(); j++) {
            if (i == 0) {
                costs[j] = j
            } else if (j > 0) {
                int newValue = costs[j - 1]
                if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
                }
                costs[j - 1] = lastValue
                lastValue = newValue
            }
        }
        if (i > 0) costs[s2.length()] = lastValue
    }
    return costs[s2.length()]
}`,
    scriptFileName: 'vendor_duplicate_detection.groovy',
    scriptUploadedAt: '2024-08-01T11:30:00Z',
    totalTriggers: 19,
    truePositives: 15,
    falsePositives: 4,
    accuracy: 79,
    createdBy: '2',
    createdByName: 'Петр Петров',
    createdAt: '2024-08-01T11:30:00Z',
    updatedAt: '2024-11-01T11:30:00Z',
    lastTriggeredAt: '2024-11-30T15:40:00Z',
    isActive: true,
    priority: 3,
  },
  {
    id: 'RULE-006',
    name: 'Изменение цен после согласования',
    description: 'Контролирует изменение цен поставщиком после утверждения бюджета и согласования коммерческого предложения.',
    category: 'FINANCIAL',
    severity: 'HIGH',
    status: 'ACTIVE',
    conditions: [
      {
        id: 'COND-009',
        field: 'purchase.currentPrice',
        operator: 'NOT_EQUALS',
        value: 'purchase.approvedPrice',
      },
      {
        id: 'COND-010',
        field: 'purchase.budgetApproved',
        operator: 'EQUALS',
        value: true,
        logicalOperator: 'AND',
      },
    ],
    actions: [
      {
        id: 'ACT-011',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'HIGH',
          autoAssign: true,
        },
      },
      {
        id: 'ACT-012',
        type: 'BLOCK_TRANSACTION',
        parameters: {
          requireApproval: true,
        },
      },
    ],
    groovyScript: `// Проверка изменения цен после согласования
def purchase = binding.getVariable("purchase")

if (purchase.budgetApproved && purchase.currentPrice != purchase.approvedPrice) {
    def priceDifference = purchase.currentPrice - purchase.approvedPrice
    def percentageChange = ((priceDifference / purchase.approvedPrice) * 100).round(2)
    
    def severity = Math.abs(percentageChange) > 10 ? "HIGH" : "MEDIUM"
    
    return [
        violation: true,
        message: "Цена изменена на \${percentageChange}% после согласования бюджета",
        severity: severity,
        details: [
            approvedPrice: purchase.approvedPrice,
            currentPrice: purchase.currentPrice,
            difference: priceDifference,
            percentageChange: percentageChange
        ]
    ]
}

return [violation: false]`,
    scriptFileName: 'price_change_after_approval.groovy',
    scriptUploadedAt: '2024-08-05T13:00:00Z',
    totalTriggers: 34,
    truePositives: 30,
    falsePositives: 4,
    accuracy: 88,
    createdBy: '2',
    createdByName: 'Петр Петров',
    createdAt: '2024-08-05T13:00:00Z',
    updatedAt: '2024-10-05T13:00:00Z',
    lastTriggeredAt: '2024-12-02T12:30:00Z',
    isActive: true,
    priority: 8,
  },
  {
    id: 'RULE-007',
    name: 'Нарушение требований по НДС',
    description: 'Проверяет корректность расчета и применения НДС в закупках, соответствие ставок налогообложения.',
    category: 'COMPLIANCE',
    severity: 'MEDIUM',
    status: 'UNDER_REVIEW',
    conditions: [
      {
        id: 'COND-011',
        field: 'purchase.vatRate',
        operator: 'NOT_IN',
        value: [0, 10, 20],
      },
    ],
    actions: [
      {
        id: 'ACT-013',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'MEDIUM',
          autoAssign: true,
        },
      },
    ],
    totalTriggers: 7,
    truePositives: 5,
    falsePositives: 2,
    accuracy: 71,
    createdBy: '2',
    createdByName: 'Петр Петров',
    createdAt: '2024-09-10T10:15:00Z',
    updatedAt: '2024-11-10T10:15:00Z',
    lastTriggeredAt: '2024-11-25T14:20:00Z',
    isActive: true,
    priority: 6,
  },
  {
    id: 'RULE-008',
    name: 'Превышение рыночной цены',
    description: 'Сравнивает цены закупок с рыночными аналогами и выявляет значительные превышения (более 20% от средней рыночной цены).',
    category: 'FINANCIAL',
    severity: 'MEDIUM',
    status: 'DISABLED',
    conditions: [
      {
        id: 'COND-012',
        field: 'purchase.price',
        operator: 'GREATER_THAN',
        value: 'marketData.averagePrice * 1.2',
      },
    ],
    actions: [
      {
        id: 'ACT-014',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'MEDIUM',
          autoAssign: true,
        },
      },
    ],
    totalTriggers: 23,
    truePositives: 14,
    falsePositives: 9,
    accuracy: 61,
    createdBy: '2',
    createdByName: 'Петр Петров',
    createdAt: '2024-10-01T15:45:00Z',
    updatedAt: '2024-11-28T15:45:00Z',
    lastTriggeredAt: '2024-11-20T10:30:00Z',
    isActive: false,
    priority: 4,
  },
  {
    id: 'RULE-009',
    name: 'Закупка у ненадежного поставщика',
    description: 'Предупреждает о попытке закупки у поставщика с низким рейтингом надежности или историей нарушений.',
    category: 'VENDOR',
    severity: 'MEDIUM',
    status: 'DRAFT',
    conditions: [
      {
        id: 'COND-013',
        field: 'vendor.reliabilityRating',
        operator: 'LESS_THAN',
        value: 50,
      },
    ],
    actions: [
      {
        id: 'ACT-015',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'MEDIUM',
          autoAssign: true,
        },
      },
      {
        id: 'ACT-016',
        type: 'SEND_NOTIFICATION',
        parameters: {
          recipients: ['procurement_manager'],
          template: 'unreliable_vendor',
        },
      },
    ],
    totalTriggers: 0,
    truePositives: 0,
    falsePositives: 0,
    accuracy: 0,
    createdBy: '3',
    createdByName: 'Иван Иванов',
    createdAt: '2024-11-28T09:00:00Z',
    updatedAt: '2024-11-28T09:00:00Z',
    isActive: false,
    priority: 5,
  },
  {
    id: 'RULE-010',
    name: 'Отсутствие обязательных документов',
    description: 'Проверяет наличие обязательных документов (договор, счет, акт приемки) для закупки.',
    category: 'COMPLIANCE',
    severity: 'MEDIUM',
    status: 'DRAFT',
    conditions: [
      {
        id: 'COND-014',
        field: 'purchase.documents',
        operator: 'NOT_CONTAINS',
        value: 'contract',
        logicalOperator: 'OR',
      },
      {
        id: 'COND-015',
        field: 'purchase.documents',
        operator: 'NOT_CONTAINS',
        value: 'invoice',
      },
    ],
    actions: [
      {
        id: 'ACT-017',
        type: 'CREATE_INCIDENT',
        parameters: {
          severity: 'MEDIUM',
          autoAssign: true,
        },
      },
    ],
    totalTriggers: 0,
    truePositives: 0,
    falsePositives: 0,
    accuracy: 0,
    createdBy: '4',
    createdByName: 'Петр Петров',
    createdAt: '2024-11-29T14:00:00Z',
    updatedAt: '2024-11-29T14:00:00Z',
    isActive: false,
    priority: 6,
  },
];

// Моковая статистика
const calculateStatistics = (): RuleStatistics => {
  const byCategory = [
    { category: 'FINANCIAL' as const, count: mockRules.filter(r => r.category === 'FINANCIAL').length },
    { category: 'COMPLIANCE' as const, count: mockRules.filter(r => r.category === 'COMPLIANCE').length },
    { category: 'ETHICS' as const, count: mockRules.filter(r => r.category === 'ETHICS').length },
    { category: 'LOGISTICS' as const, count: mockRules.filter(r => r.category === 'LOGISTICS').length },
    { category: 'DATA_QUALITY' as const, count: mockRules.filter(r => r.category === 'DATA_QUALITY').length },
    { category: 'VENDOR' as const, count: mockRules.filter(r => r.category === 'VENDOR').length },
  ];

  const bySeverity = [
    { severity: 'CRITICAL' as const, count: mockRules.filter(r => r.severity === 'CRITICAL').length },
    { severity: 'HIGH' as const, count: mockRules.filter(r => r.severity === 'HIGH').length },
    { severity: 'MEDIUM' as const, count: mockRules.filter(r => r.severity === 'MEDIUM').length },
    { severity: 'LOW' as const, count: mockRules.filter(r => r.severity === 'LOW').length },
  ];

  const activeRules = mockRules.filter(r => r.totalTriggers > 0);
  const avgAccuracy = activeRules.length > 0
    ? Math.round(activeRules.reduce((sum, r) => sum + r.accuracy, 0) / activeRules.length)
    : 0;

  return {
    total: mockRules.length,
    active: mockRules.filter(r => r.status === 'ACTIVE').length,
    disabled: mockRules.filter(r => r.status === 'DISABLED').length,
    draft: mockRules.filter(r => r.status === 'DRAFT').length,
    underReview: mockRules.filter(r => r.status === 'UNDER_REVIEW').length,
    byCategory,
    bySeverity,
    avgAccuracy,
    totalTriggers: mockRules.reduce((sum, r) => sum + r.totalTriggers, 0),
  };
};

// Моковая история срабатываний
const mockTriggerHistory: Record<string, RuleTriggerHistory[]> = {
  'RULE-001': [
    {
      id: 'TRIG-001',
      ruleId: 'RULE-001',
      triggeredAt: '2024-12-01T14:30:00Z',
      eventData: {
        employeeId: 'EMP-123',
        employeeName: 'Сидоров А.И.',
        vendorId: 'VENDOR-456',
        vendorName: 'ООО "Техноком"',
        ownership: '25%',
      },
      result: 'TRUE_POSITIVE',
      incidentId: 'INC-2024-008',
      reviewedBy: 'Петр Петров',
      reviewedAt: '2024-12-01T15:00:00Z',
      notes: 'Подтвержден конфликт интересов. Сотрудник является совладельцем компании-поставщика.',
    },
    {
      id: 'TRIG-002',
      ruleId: 'RULE-001',
      triggeredAt: '2024-11-25T10:15:00Z',
      eventData: {
        employeeId: 'EMP-234',
        employeeName: 'Иванова М.П.',
        vendorId: 'VENDOR-789',
        vendorName: 'ИП Иванов С.С.',
        relationship: 'spouse',
      },
      result: 'TRUE_POSITIVE',
      incidentId: 'INC-2024-007',
      reviewedBy: 'Петр Петров',
      reviewedAt: '2024-11-25T11:00:00Z',
      notes: 'Подтвержден конфликт интересов. Супруг сотрудника является ИП-поставщиком.',
    },
  ],
  'RULE-002': [
    {
      id: 'TRIG-003',
      ruleId: 'RULE-002',
      triggeredAt: '2024-12-02T16:45:00Z',
      eventData: {
        purchaseId: 'PUR-2024-345',
        amount: 520000,
        approvedBudget: 450000,
        difference: 70000,
        percentageOver: 15.6,
      },
      result: 'TRUE_POSITIVE',
      incidentId: 'INC-2024-012',
      reviewedBy: 'Иван Иванов',
      reviewedAt: '2024-12-02T17:00:00Z',
      notes: 'Превышение бюджета на 15.6% без дополнительного согласования.',
    },
    {
      id: 'TRIG-004',
      ruleId: 'RULE-002',
      triggeredAt: '2024-12-01T12:20:00Z',
      eventData: {
        purchaseId: 'PUR-2024-344',
        amount: 305000,
        approvedBudget: 300000,
        difference: 5000,
        percentageOver: 1.7,
      },
      result: 'FALSE_POSITIVE',
      reviewedBy: 'Иван Иванов',
      reviewedAt: '2024-12-01T13:00:00Z',
      notes: 'Незначительное превышение в пределах допустимого отклонения. Ложное срабатывание.',
    },
  ],
};

export const rulesHandlers = [
  // GET /rules - Получить все правила
  http.get(`${API_BASE_URL}/rules`, async () => {
    await delay(500);
    console.log('📋 [MSW] Fetching all rules');
    const response: RulesListResponse = {
      items: mockRules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        condition: rule.conditions
          .map((condition) => `${condition.field} ${condition.operator} ${String(condition.value)}`)
          .join('; '),
        action: rule.actions.map((action) => action.type).join(', '),
        categoryId: rule.category,
        categoryLabel: rule.category,
        priority: String(rule.priority),
        enabled: rule.isActive,
        riskObjectId: `risk-${rule.id}`,
        riskObject: {
          id: `risk-${rule.id}`,
          uuid: `risk-${rule.id}`,
          code: rule.id,
          name: rule.name,
          status: rule.status,
          updatedAt: rule.updatedAt,
          definition: rule.description,
        },
      })),
    };

    return HttpResponse.json(response);
  }),

  // GET /rules/statistics - Получить статистику правил
  http.get(`${API_BASE_URL}/rules/statistics`, async () => {
    await delay(400);
    console.log('📊 [MSW] Fetching rule statistics');
    const stats = calculateStatistics();
    return HttpResponse.json(stats);
  }),

  // GET /rules/:ruleId - Получить правило по ID
  http.get(`${API_BASE_URL}/rules/:ruleId`, async ({ params }) => {
    await delay(400);
    const { ruleId } = params;
    console.log(`📋 [MSW] Fetching rule: ${ruleId}`);
    
    const rule = mockRules.find(r => r.id === ruleId);
    
    if (!rule) {
      return HttpResponse.json(
        { message: 'Правило не найдено', code: 'RULE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(rule);
  }),

  // POST /rules - Создать новое правило
  http.post(`${API_BASE_URL}/rules`, async ({ request }) => {
    await delay(600);
    const data = await request.json() as CreateRuleRequest;
    console.log('✅ [MSW] Creating rule:', data);
    
    const newRule: Rule = {
      id: `RULE-${String(mockRules.length + 1).padStart(3, '0')}`,
      name: data.name,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: 'DRAFT',
      conditions: data.conditions.map((c, idx) => ({ 
        ...c, 
        id: `COND-${Date.now()}-${idx}` 
      })),
      actions: data.actions.map((a, idx) => ({ 
        ...a, 
        id: `ACT-${Date.now()}-${idx}` 
      })),
      groovyScript: data.groovyScript,
      scriptFileName: data.scriptFileName,
      scriptUploadedAt: data.groovyScript ? new Date().toISOString() : undefined,
      totalTriggers: 0,
      truePositives: 0,
      falsePositives: 0,
      accuracy: 0,
      createdBy: '2',
      createdByName: 'Петр Петров',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false,
      priority: data.priority,
      threshold: data.threshold,
    };
    
    mockRules.push(newRule);
    return HttpResponse.json(newRule);
  }),

  // PUT /rules/:ruleId - Обновить правило
  http.put(`${API_BASE_URL}/rules/:ruleId`, async ({ request, params }) => {
    await delay(600);
    const { ruleId } = params;
    const data = await request.json() as UpdateRuleRequest;
    console.log(`✏️ [MSW] Updating rule ${ruleId}:`, data);
    
    const index = mockRules.findIndex(r => r.id === ruleId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Правило не найдено', code: 'RULE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Создаем обновленное правило с правильной типизацией
    const updatedRule: Rule = {
      ...mockRules[index],
      updatedAt: new Date().toISOString(),
    };
    
    // Обновляем только те поля, которые были переданы
    if (data.name !== undefined) updatedRule.name = data.name;
    if (data.description !== undefined) updatedRule.description = data.description;
    if (data.category !== undefined) updatedRule.category = data.category;
    if (data.severity !== undefined) updatedRule.severity = data.severity;
    if (data.priority !== undefined) updatedRule.priority = data.priority;
    if (data.threshold !== undefined) updatedRule.threshold = data.threshold;
    
    // Обрабатываем conditions с генерацией id
    if (data.conditions !== undefined) {
      updatedRule.conditions = data.conditions.map((c, idx) => ({
        ...c,
        id: `COND-${Date.now()}-${idx}`,
      }));
    }
    
    // Обрабатываем actions с генерацией id
    if (data.actions !== undefined) {
      updatedRule.actions = data.actions.map((a, idx) => ({
        ...a,
        id: `ACT-${Date.now()}-${idx}`,
      }));
    }
    
    // Обрабатываем Groovy скрипт
    if (data.groovyScript !== undefined) {
      updatedRule.groovyScript = data.groovyScript;
      updatedRule.scriptUploadedAt = new Date().toISOString();
    }
    if (data.scriptFileName !== undefined) {
      updatedRule.scriptFileName = data.scriptFileName;
    }
    
    mockRules[index] = updatedRule;
    return HttpResponse.json(updatedRule);
  }),

  // DELETE /rules/:ruleId - Удалить правило
  http.delete(`${API_BASE_URL}/rules/:ruleId`, async ({ params }) => {
    await delay(500);
    const { ruleId } = params;
    console.log(`🗑️ [MSW] Deleting rule: ${ruleId}`);
    
    const index = mockRules.findIndex(r => r.id === ruleId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Правило не найдено', code: 'RULE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockRules.splice(index, 1);
    return HttpResponse.json({ message: 'Правило удалено' });
  }),

  // POST /rules/:ruleId/activate - Активировать правило
  http.post(`${API_BASE_URL}/rules/:ruleId/activate`, async ({ params }) => {
    await delay(500);
    const { ruleId } = params;
    console.log(`✅ [MSW] Activating rule: ${ruleId}`);
    
    const index = mockRules.findIndex(r => r.id === ruleId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Правило не найдено', code: 'RULE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockRules[index] = {
      ...mockRules[index],
      status: 'ACTIVE',
      isActive: true,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockRules[index]);
  }),

  // POST /rules/:ruleId/deactivate - Деактивировать правило
  http.post(`${API_BASE_URL}/rules/:ruleId/deactivate`, async ({ params }) => {
    await delay(500);
    const { ruleId } = params;
    console.log(`⏸️ [MSW] Deactivating rule: ${ruleId}`);
    
    const index = mockRules.findIndex(r => r.id === ruleId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Правило не найдено', code: 'RULE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockRules[index] = {
      ...mockRules[index],
      status: 'DISABLED',
      isActive: false,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockRules[index]);
  }),

  // GET /rules/:ruleId/trigger-history - Получить историю срабатываний
  http.get(`${API_BASE_URL}/rules/:ruleId/trigger-history`, async ({ params }) => {
    await delay(500);
    const { ruleId } = params;
    console.log(`📜 [MSW] Fetching trigger history for rule: ${ruleId}`);
    
    const history = mockTriggerHistory[ruleId as string] || [];
    return HttpResponse.json(history);
  }),

  // POST /rules/test - Тестировать правило
  http.post(`${API_BASE_URL}/rules/test`, async ({ request }) => {
    await delay(800);
    const data = await request.json() as TestRuleRequest;
    console.log('🧪 [MSW] Testing rule:', data);
    
    // Простая логика тестирования (можно расширить)
    const matched = Math.random() > 0.5;
    
    const result: TestRuleResponse = {
      matched,
      matchedConditions: matched
        ? data.conditions.slice(0, Math.ceil(data.conditions.length / 2)).map(c => c.field)
        : [],
      unmatchedConditions: matched
        ? data.conditions.slice(Math.ceil(data.conditions.length / 2)).map(c => c.field)
        : data.conditions.map(c => c.field),
      executionTime: Math.floor(Math.random() * 100) + 20,
    };
    
    return HttpResponse.json(result);
  }),

  // POST /rules/validate-script - Валидировать Groovy скрипт
  http.post(`${API_BASE_URL}/rules/validate-script`, async ({ request }) => {
    await delay(1000);
    const data = await request.json() as ValidateScriptRequest;
    console.log('🔍 [MSW] Validating Groovy script');
    
    const script = data.script.trim();
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Простая валидация синтаксиса
    if (!script) {
      errors.push('Скрипт не может быть пустым');
    }
    
    // Проверка базового синтаксиса Groovy
    if (script && !script.includes('def ') && !script.includes('return')) {
      warnings.push('Скрипт не содержит определений переменных или return statement');
    }
    
    // Проверка на использование binding
    if (script && !script.includes('binding.getVariable')) {
      warnings.push('Рекомендуется использовать binding.getVariable() для доступа к переменным контекста');
    }
    
    // Проверка наличия return с результатом
    if (script && !script.includes('return [')) {
      errors.push('Скрипт должен возвращать Map с полями: violation (boolean), message (String), severity (String)');
    }
    
    // Проверка на потенциальные проблемы безопасности
    if (script.includes('System.exit') || script.includes('Runtime.getRuntime()')) {
      errors.push('Использование System.exit или Runtime запрещено по соображениям безопасности');
    }
    
    // Проверка на незакрытые скобки
    const openBraces = (script.match(/\{/g) || []).length;
    const closeBraces = (script.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Несоответствие количества открывающих (${openBraces}) и закрывающих (${closeBraces}) скобок`);
    }
    
    // Рекомендации
    if (script.length > 1000) {
      suggestions.push('Рассмотрите возможность разбиения длинного скрипта на вспомогательные функции');
    }
    
    if (!script.includes('// ')) {
      suggestions.push('Добавьте комментарии для улучшения читаемости кода');
    }
    
    const valid = errors.length === 0;
    
    const response: ValidateScriptResponse = {
      valid,
      errors,
      warnings,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
    
    return HttpResponse.json(response);
  }),

  // POST /rules/:ruleId/clone - Клонировать правило
  http.post(`${API_BASE_URL}/rules/:ruleId/clone`, async ({ params }) => {
    await delay(600);
    const { ruleId } = params;
    console.log(`📋 [MSW] Cloning rule: ${ruleId}`);
    
    const originalRule = mockRules.find(r => r.id === ruleId);
    
    if (!originalRule) {
      return HttpResponse.json(
        { message: 'Правило не найдено', code: 'RULE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    const clonedRule: Rule = {
      ...originalRule,
      id: `RULE-${String(mockRules.length + 1).padStart(3, '0')}`,
      name: `${originalRule.name} (копия)`,
      status: 'DRAFT',
      scriptFileName: originalRule.scriptFileName ? `${originalRule.scriptFileName.replace('.groovy', '')}_copy.groovy` : undefined,
      scriptUploadedAt: originalRule.groovyScript ? new Date().toISOString() : undefined,
      totalTriggers: 0,
      truePositives: 0,
      falsePositives: 0,
      accuracy: 0,
      createdBy: '2',
      createdByName: 'Петр Петров',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggeredAt: undefined,
      isActive: false,
    };
    
    mockRules.push(clonedRule);
    return HttpResponse.json(clonedRule);
  }),

  // GET /rules/export - Экспортировать правила
  http.get(`${API_BASE_URL}/rules/export`, async ({ request }) => {
    await delay(1000);
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    console.log(`📥 [MSW] Exporting rules as ${format}`);
    
    let content: string;
    let mimeType: string;
    
    if (format === 'json') {
      content = JSON.stringify(mockRules, null, 2);
      mimeType = 'application/json';
    } else {
      // CSV format
      const headers = 'ID,Name,Category,Severity,Status,Triggers,Accuracy,HasScript\n';
      const rows = mockRules.map(r =>
        `${r.id},${r.name},${r.category},${r.severity},${r.status},${r.totalTriggers},${r.accuracy}%,${r.groovyScript ? 'Yes' : 'No'}`
      ).join('\n');
      content = headers + rows;
      mimeType = 'text/csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    return HttpResponse.json(blob);
  }),

  // POST /rules/import - Импортировать правила
  http.post(`${API_BASE_URL}/rules/import`, async ({ request }) => {
    await delay(1500);
    console.log('📤 [MSW] Importing rules');
    
    // Имитация импорта
    const imported = Math.floor(Math.random() * 5) + 1;
    const failed = Math.floor(Math.random() * 2);
    
    return HttpResponse.json({ imported, failed });
  }),

  // GET /api/rules/short/:ruleId — короткая карточка правила (RuleApi.getRuleShort)
  http.get(`${RULES_API_ROOT}/api/rules/short/:ruleId`, async ({ params }) => {
    await delay(200);
    const ruleId = String(params.ruleId);
    const rule = mockRules.find((r) => r.id === ruleId);

    const fallback: RuleShortInfo = {
      id: ruleId,
      companyId: 'company-1',
      name: `Правило ${ruleId}`,
      condition: '—',
      categoryId: 'COMPLIANCE',
      priority: 'MEDIUM',
      responsibleUserId: '2',
    };

    if (!rule) {
      console.log(`📋 [MSW] Rule short fallback for unknown id: ${ruleId}`);
      return HttpResponse.json(fallback);
    }

    const condition =
      typeof rule.groovyScript === 'string' && rule.groovyScript.trim().length > 0
        ? rule.groovyScript.slice(0, 400)
        : rule.description.slice(0, 400);

    const payload: RuleShortInfo = {
      id: rule.id,
      companyId: 'company-1',
      name: rule.name,
      condition,
      categoryId: rule.category,
      priority: rule.severity,
      responsibleUserId: '2',
    };

    return HttpResponse.json(payload);
  }),
];
