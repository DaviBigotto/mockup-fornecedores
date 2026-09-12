// ==============================================================================
// BADGES DE STATUS INDEPENDENTES - PLURIX ORGANIZER
// Regra Central: Homologação, ERP e Documentos são sempre exibidos separadamente!
// ==============================================================================

import React from 'react';
import {
  SupplierRegistrationStatus,
  ErpStatus,
  DocumentStatus,
  FlowStepStatus,
} from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileCheck2,
  Database,
  Building2,
} from 'lucide-react';

interface RegistrationStatusBadgeProps {
  status: SupplierRegistrationStatus;
  showIcon?: boolean;
}

export const RegistrationStatusBadge: React.FC<RegistrationStatusBadgeProps> = ({
  status,
  showIcon = true,
}) => {
  switch (status) {
    case 'Homologado':
      return (
        <span className="badge badge-success" title="Fornecedor homologado e qualificado para fornecimento">
          {showIcon && <ShieldCheck size={13} />}
          Homologado
        </span>
      );
    case 'Cadastro completo':
      return (
        <span className="badge badge-info" title="Todas as 8 etapas preenchidas; aguardando homologação">
          {showIcon && <CheckCircle2 size={13} />}
          Cadastro completo
        </span>
      );
    case 'Em validação':
    case 'Enviado':
      return (
        <span className="badge badge-info" title="Cadastro submetido para validação documental">
          {showIcon && <Clock size={13} />}
          {status}
        </span>
      );
    case 'Em preenchimento':
    case 'Pré-cadastro':
      return (
        <span className="badge badge-neutral" title="Cadastro ainda em elaboração pelo fornecedor">
          {showIcon && <Clock size={13} />}
          {status}
        </span>
      );
    case 'Ajuste solicitado':
      return (
        <span className="badge badge-warning" title="Pendências identificadas exigindo retificação">
          {showIcon && <AlertTriangle size={13} />}
          Ajuste solicitado
        </span>
      );
    case 'Suspenso':
    case 'Inativo':
      return (
        <span className="badge badge-danger" title="Cadastro suspenso ou bloqueado administrativamente">
          {showIcon && <XCircle size={13} />}
          {status}
        </span>
      );
    default:
      return <span className="badge badge-neutral">{status}</span>;
  }
};

interface ErpStatusBadgeProps {
  status: ErpStatus;
  erpCode?: string;
  showIcon?: boolean;
}

export const ErpStatusBadge: React.FC<ErpStatusBadgeProps> = ({
  status,
  erpCode,
  showIcon = true,
}) => {
  switch (status) {
    case 'Concluído':
    case 'Já cadastrado':
      return (
        <span
          className="badge badge-success"
          title={`Ativo no ERP Protheus/SAP ${erpCode ? `(Código: ${erpCode})` : ''}`}
        >
          {showIcon && <Database size={13} />}
          {erpCode ? `ERP: ${erpCode}` : 'Ativo no ERP'}
        </span>
      );
    case 'Em cadastro':
    case 'Em triagem':
      return (
        <span className="badge badge-info" title="Processo de cadastramento em andamento pelo Time de Cadastro">
          {showIcon && <Clock size={13} />}
          ERP: {status}
        </span>
      );
    case 'Encaminhado':
      return (
        <span className="badge badge-warning" title="Encaminhado para a fila do Time de Cadastro">
          {showIcon && <Building2 size={13} />}
          ERP: Encaminhado
        </span>
      );
    case 'Aguardando informação':
      return (
        <span className="badge badge-warning" title="Aguardando documentação ou retorno para conclusão no ERP">
          {showIcon && <AlertCircle size={13} />}
          ERP: Aguardando info
        </span>
      );
    case 'Não cadastrado':
    case 'Não verificado':
      return (
        <span
          className="badge badge-neutral"
          title="Disponível na base consultada mas sem cadastro ativo no ERP (criação sob demanda de contratação)"
        >
          {showIcon && <span className="badge-dot" style={{ backgroundColor: 'var(--text-muted)' }} />}
          Não cadastrado no ERP
        </span>
      );
    case 'Cancelado':
      return (
        <span className="badge badge-danger" title="Solicitação de criação no ERP cancelada">
          {showIcon && <XCircle size={13} />}
          ERP: Cancelado
        </span>
      );
    default:
      return <span className="badge badge-neutral">ERP: {status}</span>;
  }
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  showIcon?: boolean;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  showIcon = true,
}) => {
  switch (status) {
    case 'Válido':
      return (
        <span className="badge badge-success" title="Todas as certidões e documentos estão vigentes">
          {showIcon && <FileCheck2 size={13} />}
          Documentação Válida
        </span>
      );
    case 'Vencendo':
      return (
        <span className="badge badge-warning" title="Certidão ou documento vencendo nos próximos 30 dias">
          {showIcon && <AlertTriangle size={13} />}
          Vencendo em breve
        </span>
      );
    case 'Vencido':
      return (
        <span className="badge badge-danger" title="Documento ou certidão com prazo de validade expirado">
          {showIcon && <AlertCircle size={13} />}
          Documento Vencido
        </span>
      );
    case 'Pendente':
    case 'Não enviado':
      return (
        <span className="badge badge-warning" title="Documentos obrigatórios pendentes de envio">
          {showIcon && <Clock size={13} />}
          Pendente
        </span>
      );
    case 'Em validação':
    case 'Enviado':
      return (
        <span className="badge badge-info" title="Documentos enviados aguardando análise">
          {showIcon && <Clock size={13} />}
          Em validação
        </span>
      );
    case 'Rejeitado':
      return (
        <span className="badge badge-danger" title="Documento rejeitado por inconsistência ou ilegibilidade">
          {showIcon && <XCircle size={13} />}
          Rejeitado
        </span>
      );
    default:
      return <span className="badge badge-neutral">{status}</span>;
  }
};

interface FlowStepBadgeProps {
  status: FlowStepStatus;
}

export const FlowStepBadge: React.FC<FlowStepBadgeProps> = ({ status }) => {
  switch (status) {
    case 'Concluída':
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} /> Concluída
        </span>
      );
    case 'Em andamento':
      return (
        <span className="badge badge-info">
          <Clock size={12} /> Em andamento
        </span>
      );
    case 'Bloqueada':
      return (
        <span className="badge badge-danger">
          <AlertCircle size={12} /> Bloqueada
        </span>
      );
    case 'Não aplicável':
      return <span className="badge badge-neutral">N/A</span>;
    case 'Não iniciada':
    default:
      return <span className="badge badge-neutral">Não iniciada</span>;
  }
};
