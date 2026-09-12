// ==============================================================================
// GESTÃO DE PENDÊNCIAS E AJUSTES - PLURIX ORGANIZER
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, SupplierPendingItem } from '../../types';
import { formatDate } from '../../utils/formatters';
import { AlertTriangle, CheckCircle2, Clock, Send, ShieldAlert } from 'lucide-react';

export const SupplierPending: React.FC = () => {
  const { showToast, triggerRefresh, dataVersion, setActiveNav, activeSupplierId } = useApp();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSupplierId) {
      fetch(`/api/suppliers/${activeSupplierId}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data: Supplier) => {
          setSupplier(data);
          setLoading(false);
        })
        .catch(() => {
          setSupplier(null);
          setLoading(false);
        });
    } else {
      fetch('/api/suppliers')
        .then((res) => res.json())
        .then((data: any[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setSupplier(data[0]);
          } else {
            setSupplier(null);
          }
          setLoading(false);
        })
        .catch(() => {
          setSupplier(null);
          setLoading(false);
        });
    }
  }, [activeSupplierId, dataVersion]);


  const pendings: SupplierPendingItem[] = supplier?.pendingItems || [];

  const handleResolve = async (pendingId: string) => {
    showToast('Notificação de retificação enviada para a equipe de governança!', 'success');
    setSelectedPendingId(null);
    setReplyText('');
    triggerRefresh();
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Carregando pendências...</div>;
  }

  if (!supplier) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhum fornecedor vinculado</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Inicie o pré-cadastro da sua empresa para acompanhar eventuais pendências e solicitações de ajuste.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setActiveNav('supplier-prereg')}>
          Ir para Pré-Cadastro
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          Pendências e Solicitações de Ajuste
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Acompanhe apontamentos feitos pela governança do Grupo Plurix e regularize suas pendências para obter homologação plena.
        </p>
      </div>

      {pendings.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'var(--status-success-bg)',
              color: 'var(--status-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Nenhuma pendência ativa no momento!
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440 }}>
              Seus dados cadastrais e documentos encontram-se em conformidade com as diretrizes do Organizer Plurix.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pendings.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                borderLeft: `4px solid ${
                  item.status === 'Resolvido'
                    ? 'var(--status-success)'
                    : item.status === 'Em análise'
                    ? 'var(--color-accent)'
                    : 'var(--status-warning)'
                }`,
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                      Prioridade: {item.priority}
                    </span>
                    <span style={{ color: 'var(--border-medium)' }}>•</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Atribuído a {item.assignedTo} em {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                </div>

                <span
                  className={`badge ${
                    item.status === 'Resolvido'
                      ? 'badge-success'
                      : item.status === 'Em análise'
                      ? 'badge-info'
                      : 'badge-warning'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {item.description}
              </div>

              {selectedPendingId === item.id ? (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    className="input-control"
                    placeholder="Descreva o esclarecimento ou confirme o envio do novo documento..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedPendingId(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleResolve(item.id)}
                    >
                      <Send size={13} /> Submeter Resposta
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveNav('supplier-documents')}
                  >
                    Ir para Documentos
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedPendingId(item.id)}
                  >
                    Responder Apontamento
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
