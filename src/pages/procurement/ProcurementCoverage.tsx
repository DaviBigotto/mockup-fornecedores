// ==============================================================================
// COBERTURA DE CATEGORIAS E UNIDADES - ÁREA DE COMPRAS
// Análise de densidade de fornecimento e identificação de carências
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProcurementMetrics, Supplier } from '../../types';
import {
  PieChart,
  Building,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  ArrowRight,
} from 'lucide-react';

export const ProcurementCoverage: React.FC = () => {
  const { setActiveNav, openSupplierDrawer, dataVersion } = useApp();
  const [metrics, setMetrics] = useState<ProcurementMetrics | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/metrics/procurement').then((r) => r.json()),
      fetch('/api/suppliers').then((r) => r.json()),
    ])
      .then(([metricsData, suppliersData]) => {
        setMetrics(metricsData);
        setSuppliers(suppliersData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dataVersion]);

  if (loading || !metrics) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Carregando análise de cobertura...</div>;
  }

  const suppliersInSelectedCat = selectedCat
    ? suppliers.filter((s) => s.categories.includes(selectedCat))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          Matriz de Cobertura de Fornecedores por Categoria
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Monitoramento contínuo de concorrência e densidade de parceiros homologados por linha de suprimentos.
        </p>
      </div>

      {/* Grid de Categorias com Métricas de Densidade */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {metrics.coverageByCategory.map((cat) => {
          const isLow = cat.homologated === 0 || cat.count <= 1;
          const isSelected = selectedCat === cat.category;

          return (
            <div
              key={cat.category}
              className="card card-hoverable"
              style={{
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--color-primary)' : isLow ? '1px solid var(--status-warning-border)' : '1px solid var(--border-subtle)',
                backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
              }}
              onClick={() => setSelectedCat(cat.category)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Linha de Fornecimento
                  </span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cat.category}
                  </h3>
                </div>

                {isLow ? (
                  <span className="badge badge-warning">
                    <AlertTriangle size={12} /> Carência
                  </span>
                ) : (
                  <span className="badge badge-success">
                    <CheckCircle2 size={12} /> Adequada
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: isLow ? 'var(--status-warning-text)' : 'var(--color-primary)' }}>
                    {cat.homologated}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                    homologados
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Total: {cat.count} parceiros
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: 6,
                  backgroundColor: '#E2E8F0',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, cat.count * 25)}%`,
                    height: '100%',
                    backgroundColor: isLow ? 'var(--status-warning)' : 'var(--color-primary)',
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalhamento dos Fornecedores da Categoria Selecionada */}
      {selectedCat && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>
                Fornecedores Cadastrados em: {selectedCat}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {suppliersInSelectedCat.length} parceiros atendem esta categoria
              </p>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedCat(null)}
            >
              Fechar Detalhamento
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Razão Social / Nome Fantasia</th>
                  <th>CNPJ</th>
                  <th>Unidades Plurix Atendidas</th>
                  <th>Situação Cadastral</th>
                  <th>Situação ERP</th>
                  <th style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {suppliersInSelectedCat.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.tradeName || s.corporateName}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.corporateName}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.cnpj}</td>
                    <td>{s.businessUnits.join(', ')}</td>
                    <td>
                      <span className={`badge ${s.status === 'Homologado' ? 'badge-success' : 'badge-info'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.erpStatus === 'Concluído' ? 'badge-success' : 'badge-neutral'}`}>
                        {s.erpStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openSupplierDrawer(s.id)}
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
