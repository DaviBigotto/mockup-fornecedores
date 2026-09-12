// ==============================================================================
// HISTÓRICO E LINHA DO TEMPO DO FORNECEDOR - PLURIX ORGANIZER
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusHistoryEvent } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { Clock, ShieldCheck, FileCheck, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

export const SupplierHistory: React.FC = () => {
  const { dataVersion, activeSupplierId } = useApp();
  const [history, setHistory] = useState<StatusHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        let supId = activeSupplierId;
        if (!supId) {
          const resSup = await fetch('/api/suppliers');
          if (resSup.ok) {
            const list = await resSup.json();
            if (Array.isArray(list) && list.length > 0) {
              supId = list[0].id;
            }
          }
        }

        if (supId) {
          const res = await fetch(`/api/suppliers/${supId}/history`);
          if (res.ok) {
            const data = await res.json();
            setHistory(Array.isArray(data) ? data : []);
          }
        } else {
          const resAll = await fetch('/api/history');
          if (resAll.ok) {
            const data = await resAll.json();
            setHistory(Array.isArray(data) ? data : []);
          }
        }
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [activeSupplierId, dataVersion]);


  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Carregando linha do tempo...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          Linha do Tempo e Trilha de Auditoria
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Registro cronológico e imutável de todas as etapas cadastrais, alterações de status e movimentações operacionais.
        </p>
      </div>

      <div className="card" style={{ padding: '32px 28px' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
            Nenhum evento registrado até o momento.
          </div>
        ) : (
          <div className="timeline">
            {history.map((event) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-marker">
                  <Clock size={12} />
                </div>

                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '16px 20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        {event.profile}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {event.action}
                      </span>
                    </div>

                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDateTime(event.createdAt)} por <strong>{event.userName}</strong>
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                    {event.description}
                  </p>

                  {(event.previousStatus || event.newStatus) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        width: 'fit-content',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{event.previousStatus || 'Início'}</span>
                      <ArrowRight size={12} color="var(--text-subtle)" />
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{event.newStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
