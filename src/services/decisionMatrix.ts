// ==============================================================================
// MATRIZ DE DECISÃO DE SOURCING - PLURIX ORGANIZER
// ==============================================================================

import { DecisionPath, DecisionFlow, DecisionFlowStep, SourcingAward } from '../types/index.js';

export interface DecisionMatrixInput {
  supplierId: string;
  hasErpRegistration: boolean;
  contractValue: number;
  needsContract?: boolean;
}

export interface SuggestedStep {
  stepName: string;
  description: string;
  responsibleArea: 'Aprovadores' | 'Compras' | 'Governança & ERP' | 'Integração' | 'Jurídico';
  responsiblePerson: string;
  actionType: 'concluir' | 'visualizar' | 'acompanhar';
}

export interface DecisionMatrixEvaluation {
  pathCode: DecisionPath;
  pathName: string;
  rationale: string;
  suggestedSteps: SuggestedStep[];
}

/**
 * Avalia a Matriz de Decisão de Sourcing Plurix com base na existência de cadastro no ERP
 * e no valor total da contratação (Threshold: R$ 50.000,00).
 */
export function evaluateDecisionMatrix(input: DecisionMatrixInput): DecisionMatrixEvaluation {
  const { hasErpRegistration, contractValue } = input;
  const isHighValue = contractValue > 50000;

  if (!hasErpRegistration) {
    if (!isHighValue) {
      // Caminho A: Sem ERP, <= R$ 50k
      return {
        pathCode: 'A',
        pathName: 'Caminho A: Criação Simplificada no ERP (Até R$ 50 mil)',
        rationale:
          'Fornecedor sem cadastro prévio no ERP e contratação de valor menor ou igual a R$ 50.000,00. Fluxo ágil com aprovação de alçada, preenchimento cadastral e integração direta.',
        suggestedSteps: [
          {
            stepName: '1. Alçada de Aprovação',
            description: 'Validação da contratação pela alçada diretiva competente no Organizer.',
            responsibleArea: 'Aprovadores',
            responsiblePerson: 'Comitê Executivo / Alçada',
            actionType: 'visualizar',
          },
          {
            stepName: '2. Fase de Cadastro',
            description: 'Envio automático das informações fiscais e bancárias para o time de Cadastro.',
            responsibleArea: 'Governança & ERP',
            responsiblePerson: 'Time de Cadastro',
            actionType: 'acompanhar',
          },
          {
            stepName: '3. Triagem e Validação Cadastral para ERP',
            description: 'Conferência de dados cadastrais, validação fiscal, tributária e bancária pelo time de governança.',
            responsibleArea: 'Governança & ERP',
            responsiblePerson: 'Roberto Valente (Governança ERP)',
            actionType: 'acompanhar',
          },
          {
            stepName: '4. Cadastro via API (ERP)',
            description: 'Disparo de integração para geração do código do fornecedor no Protheus/SAP.',
            responsibleArea: 'Integração',
            responsiblePerson: 'Conector Protheus / SAP',
            actionType: 'visualizar',
          },
          {
            stepName: '5. Liberação para Pedido de Compra',
            description: 'Emissão liberada para a equipe de Compras emitir o pedido formal.',
            responsibleArea: 'Compras',
            responsiblePerson: 'Mariana Esteves (Comprador)',
            actionType: 'concluir',
          },
        ],
      };
    } else {
      // Caminho B: Sem ERP, > R$ 50k
      return {
        pathCode: 'B',
        pathName: 'Caminho B: Criação Estruturada com BC Legal (> R$ 50 mil)',
        rationale:
          'Fornecedor sem cadastro prévio no ERP com valor superior a R$ 50.000,00. Exige diligência completa: Alçada, Background Check Legal (BC Legal), formalização contratual e aceite operacional.',
        suggestedSteps: [
          {
            stepName: '1. Alçada de Aprovação',
            description: 'Aprovação executiva e diretiva da contratação de alto valor.',
            responsibleArea: 'Aprovadores',
            responsiblePerson: 'Diretoria Executiva',
            actionType: 'visualizar',
          },
          {
            stepName: '2. BC Legal (Background Check)',
            description: 'Diligência jurídica, consulta de certidões negativas e análise de conformidade de sócios.',
            responsibleArea: 'Jurídico',
            responsiblePerson: 'Time Jurídico / Compliance',
            actionType: 'acompanhar',
          },
          {
            stepName: '3. Assinatura de Contrato',
            description: 'Formalização da minuta contratual via assinatura digital corporativa.',
            responsibleArea: 'Jurídico',
            responsiblePerson: 'Gestão de Contratos',
            actionType: 'acompanhar',
          },
          {
            stepName: '4. Triagem e Validação Cadastral para ERP',
            description: 'Revisão das garantias fiscais e bancárias pelo time de governança cadastral.',
            responsibleArea: 'Governança & ERP',
            responsiblePerson: 'Roberto Valente (Governança ERP)',
            actionType: 'acompanhar',
          },
          {
            stepName: '5. Cadastro via API (ERP)',
            description: 'Criação do código ERP com dados contratuais indexados.',
            responsibleArea: 'Integração',
            responsiblePerson: 'Conector Protheus / SAP',
            actionType: 'visualizar',
          },
          {
            stepName: '6. Liberação para Pedido de Compra',
            description: 'Fornecedor apto para emissão da ordem de compra formal.',
            responsibleArea: 'Compras',
            responsiblePerson: 'Mariana Esteves (Comprador)',
            actionType: 'concluir',
          },
        ],
      };
    }
  } else {
    // Já possui cadastro no ERP
    if (!isHighValue) {
      // Caminho C: Com ERP, <= R$ 50k
      return {
        pathCode: 'C',
        pathName: 'Caminho C: Utilização de Cadastro Existente (Até R$ 50 mil)',
        rationale:
          'Fornecedor já cadastrado no ERP e contratação de até R$ 50.000,00. Fluxo mais rápido da operação: validação de alçada e liberação imediata do código existente.',
        suggestedSteps: [
          {
            stepName: '1. Alçada de Aprovação',
            description: 'Confirmação orçamentária e de alçada de Compras.',
            responsibleArea: 'Aprovadores',
            responsiblePerson: 'Gestor de Compras',
            actionType: 'visualizar',
          },
          {
            stepName: '2. Utilização / Atualização do Cadastro',
            description: 'Checagem de vigência de dados bancários e tributários no cadastro já ativo.',
            responsibleArea: 'Governança & ERP',
            responsiblePerson: 'Roberto Valente (Governança ERP)',
            actionType: 'acompanhar',
          },
          {
            stepName: '3. Liberação para Pedido de Compra',
            description: 'Fornecedor já apto para emissão imediata da ordem de fornecimento.',
            responsibleArea: 'Compras',
            responsiblePerson: 'Mariana Esteves (Comprador)',
            actionType: 'concluir',
          },
        ],
      };
    } else {
      // Caminho D: Com ERP, > R$ 50k
      return {
        pathCode: 'D',
        pathName: 'Caminho D: Atualização com BC Legal e Aditivo/Contrato (> R$ 50 mil)',
        rationale:
          'Fornecedor já cadastrado no ERP, porém com valor superior a R$ 50.000,00. Requer revalidação de BC Legal e formalização do instrumento contratual ou aditivo antes do pedido.',
        suggestedSteps: [
          {
            stepName: '1. Alçada de Aprovação',
            description: 'Aprovação executiva para contratação de alto valor com parceiro existente.',
            responsibleArea: 'Aprovadores',
            responsiblePerson: 'Diretoria Executiva',
            actionType: 'visualizar',
          },
          {
            stepName: '2. BC Legal (Background Check)',
            description: 'Revalidação preventiva de certidões e riscos societários.',
            responsibleArea: 'Jurídico',
            responsiblePerson: 'Time Jurídico / Compliance',
            actionType: 'acompanhar',
          },
          {
            stepName: '3. Contrato / Aditivo Formal',
            description: 'Elaboração e assinatura de termo de fornecimento ou contrato de serviços.',
            responsibleArea: 'Jurídico',
            responsiblePerson: 'Gestão de Contratos',
            actionType: 'acompanhar',
          },
          {
            stepName: '4. Atualização e Validação do Cadastro',
            description: 'Adequação de condições comerciais no registro ERP existente.',
            responsibleArea: 'Governança & ERP',
            responsiblePerson: 'Roberto Valente (Governança ERP)',
            actionType: 'acompanhar',
          },
          {
            stepName: '5. Liberação para Pedido de Compra',
            description: 'Fornecedor apto para emissão do pedido de compra.',
            responsibleArea: 'Compras',
            responsiblePerson: 'Mariana Esteves (Comprador)',
            actionType: 'concluir',
          },
        ],
      };
    }
  }
}

/**
 * Cria a estrutura de DecisionFlow com etapas para gravação
 */
export function buildDecisionFlow(
  awardId: string,
  supplierId: string,
  input: DecisionMatrixInput
): DecisionFlow {
  const evalResult = evaluateDecisionMatrix(input);
  const now = new Date().toISOString();

  const steps: DecisionFlowStep[] = evalResult.suggestedSteps.map((step, idx) => ({
    id: `step-${Date.now()}-${idx + 1}`,
    stepIndex: idx + 1,
    stepName: step.stepName,
    description: step.description,
    responsibleArea: step.responsibleArea,
    responsiblePerson: step.responsiblePerson,
    actionType: step.actionType,
    startedAt: idx === 0 ? now : undefined,
    status: idx === 0 ? 'Em andamento' : 'Não iniciada',
    notes: idx === 0 ? 'Aguardando validação da alçada no sistema' : undefined,
  }));

  return {
    id: `df-${Date.now()}`,
    awardId,
    supplierId,
    pathCode: evalResult.pathCode,
    pathName: evalResult.pathName,
    rationale: evalResult.rationale,
    status: 'Em andamento',
    isReadyForPurchaseOrder: false,
    steps,
    createdAt: now,
    updatedAt: now,
  };
}
