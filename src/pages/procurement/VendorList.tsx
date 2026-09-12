// ==============================================================================
// VENDOR LIST (BASE DE FORNECEDORES) - ÁREA DE COMPRAS
// Tabela executiva com filtros avançados e badges independentes de status
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import {
  RegistrationStatusBadge,
  ErpStatusBadge,
  DocumentStatusBadge,
} from '../../components/common/StatusBadges';
import { formatDate } from '../../utils/formatters';
import {
  Search,
  Filter,
  Download,
  Award,
  Eye,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const VendorList: React.FC = () => {
  const { openSupplierDrawer, openAwardModal, dataVersion, showToast, currentUser } = useApp();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const isCadastro = currentUser?.role === 'cadastro';

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedErpStatus, setSelectedErpStatus] = useState('Todos');
  const [selectedDocStatus, setSelectedDocStatus] = useState('Todos');
  const [selectedRegion, setSelectedRegion] = useState('Todas');
  const [selectedUnit, setSelectedUnit] = useState('Todas');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    fetch('/api/suppliers')
      .then((res) => res.json())
      .then((data: Supplier[]) => {
        setSuppliers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dataVersion]);

  // Filtragem no cliente para feedback instantâneo de alta performance
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      // Busca textual
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCnpj = s.cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
        const matchesName =
          s.corporateName.toLowerCase().includes(q) ||
          s.tradeName.toLowerCase().includes(q) ||
          (s.erpCode && s.erpCode.toLowerCase().includes(q));
        if (!matchesCnpj && !matchesName) return false;
      }

      // Categoria
      if (selectedCategory !== 'Todas' && !s.categories.includes(selectedCategory)) {
        return false;
      }

      // Situação Cadastral
      if (selectedStatus !== 'Todos' && s.status !== selectedStatus) {
        return false;
      }

      // Situação ERP
      if (selectedErpStatus !== 'Todos') {
        if (selectedErpStatus === 'Ativo no ERP' && s.erpStatus !== 'Concluído' && s.erpStatus !== 'Já cadastrado') {
          return false;
        }
        if (selectedErpStatus === 'Não cadastrado' && s.erpStatus !== 'Não cadastrado' && s.erpStatus !== 'Não verificado') {
          return false;
        }
        if (selectedErpStatus === 'Em andamento' && s.erpStatus !== 'Em cadastro' && s.erpStatus !== 'Em triagem' && s.erpStatus !== 'Encaminhado') {
          return false;
        }
      }

      // Situação Documental
      if (selectedDocStatus !== 'Todos' && s.documentStatus !== selectedDocStatus) {
        return false;
      }

      // Região
      if (selectedRegion !== 'Todas' && !s.regions.includes(selectedRegion)) {
        return false;
      }

      // Unidade
      if (selectedUnit !== 'Todas' && !s.businessUnits.includes(selectedUnit)) {
        return false;
      }

      return true;
    });
  }, [
    suppliers,
    search,
    selectedCategory,
    selectedStatus,
    selectedErpStatus,
    selectedDocStatus,
    selectedRegion,
    selectedUnit,
  ]);

  const handleExportCsv = () => {
    const headers = [
      'Razão Social',
      'Nome Fantasia',
      'CNPJ',
      'Categoria Principal',
      'Situação Cadastral',
      'Situação ERP',
      'Código ERP',
      'Situação Documental',
      'Regiões',
      'Última Atualização',
    ];

    const rows = filteredSuppliers.map((s) => [
      `"${s.corporateName}"`,
      `"${s.tradeName}"`,
      `"${s.cnpj}"`,
      `"${s.mainCategory}"`,
      `"${s.status}"`,
      `"${s.erpStatus}"`,
      `"${s.erpCode || ''}"`,
      `"${s.documentStatus}"`,
      `"${s.regions.join(', ')}"`,
      `"${formatDate(s.updatedAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendor_list_plurix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Relatório exportado com ${filteredSuppliers.length} fornecedores!`, 'success');
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('Todas');
    setSelectedStatus('Todos');
    setSelectedErpStatus('Todos');
    setSelectedDocStatus('Todos');
    setSelectedRegion('Todas');
    setSelectedUnit('Todas');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            {isCadastro ? 'Base de Fornecedores & Cadastros ERP' : 'Vendor List de Fornecedores'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {isCadastro
              ? 'Base corporativa consultiva para acompanhamento de dados mestres e registros nos ERPs das investidas do Grupo Plurix.'
              : 'Base corporativa consultiva para cotações, homologação e contratação no Grupo Plurix.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCsv}
            title="Exportar dados filtrados para CSV / Excel"
          >
            <Download size={15} /> Exportar CSV
          </button>
          {!isCadastro && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openAwardModal()}
            >
              <Award size={15} /> Registrar Fornecedor Premiado
            </button>
          )}
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Campo de Busca Textual */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={17}
              color="var(--text-subtle)"
              style={{ position: 'absolute', left: 12, top: 12 }}
            />
            <input
              type="text"
              className="input-control"
              placeholder="Buscar por Razão Social, Nome Fantasia, CNPJ ou Cód. ERP..."
              style={{ paddingLeft: 38 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filtro Categoria */}
          <select
            className="input-control"
            style={{ width: 'auto', minWidth: 160 }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="Todas">Todas as Categorias</option>
            <option value="Tecnologia">Tecnologia</option>
            <option value="Facilities">Facilities</option>
            <option value="Logística">Logística</option>
            <option value="Marketing">Marketing</option>
            <option value="Jurídico">Jurídico</option>
            <option value="Serviços profissionais">Serviços profissionais</option>
            <option value="Produtos operacionais">Produtos operacionais</option>
            <option value="Obras e manutenção">Obras e manutenção</option>
          </select>

          {/* Filtro Situação Cadastral */}
          <select
            className="input-control"
            style={{ width: 'auto', minWidth: 160 }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="Todos">Todas as Situações</option>
            <option value="Homologado">Homologado</option>
            <option value="Cadastro completo">Cadastro completo</option>
            <option value="Em validação">Em validação</option>
            <option value="Ajuste solicitado">Ajuste solicitado</option>
            <option value="Pré-cadastro">Pré-cadastro</option>
          </select>

          {/* Botão de Filtros Avançados */}
          <button
            type="button"
            className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowAdvancedFilters((v) => !v)}
          >
            <SlidersHorizontal size={14} /> Filtros
          </button>

          {(search || selectedCategory !== 'Todas' || selectedStatus !== 'Todos' || selectedErpStatus !== 'Todos') && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClearFilters}
              title="Limpar todos os filtros"
            >
              <RotateCcw size={13} /> Limpar
            </button>
          )}
        </div>

        {/* Linha de Filtros Avançados Expansível */}
        {showAdvancedFilters && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <label className="form-label" style={{ fontSize: 11 }}>Situação no ERP</label>
              <select
                className="input-control"
                value={selectedErpStatus}
                onChange={(e) => setSelectedErpStatus(e.target.value)}
              >
                <option value="Todos">Todos os Status ERP</option>
                <option value="Ativo no ERP">Ativo no ERP (Concluído/Já cadastrado)</option>
                <option value="Em andamento">Em cadastramento / Fila</option>
                <option value="Não cadastrado">Não cadastrado no ERP</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11 }}>Situação Documental</label>
              <select
                className="input-control"
                value={selectedDocStatus}
                onChange={(e) => setSelectedDocStatus(e.target.value)}
              >
                <option value="Todos">Todos os Status Docs</option>
                <option value="Válido">Documentação Válida</option>
                <option value="Vencendo">Vencendo em breve</option>
                <option value="Vencido">Documento Vencido</option>
                <option value="Pendente">Pendente de Envio</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11 }}>Região de Atendimento</label>
              <select
                className="input-control"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="Todas">Todas as Regiões</option>
                <option value="Sudeste">Sudeste</option>
                <option value="Sul">Sul</option>
                <option value="Centro-Oeste">Centro-Oeste</option>
                <option value="Nordeste">Nordeste</option>
                <option value="Norte">Norte</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11 }}>Unidade / CD Plurix</label>
              <select
                className="input-control"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="Todas">Todas as Unidades</option>
                <option value="CD Central Arujá">CD Central Arujá</option>
                <option value="CD Regional Ribeirão">CD Regional Ribeirão</option>
                <option value="Unidade Corporativa SP">Unidade Corporativa SP</option>
                <option value="Bandeira Super Sul">Bandeira Super Sul</option>
                <option value="Bandeira Mais Você">Bandeira Mais Você</option>
                <option value="Hiper Plurix Campinas">Hiper Plurix Campinas</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabela da Vendor List */}
      <div className="table-container">
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <span>Exibindo <strong>{filteredSuppliers.length}</strong> de {suppliers.length} fornecedores</span>
          <span style={{ fontSize: 11, fontStyle: 'italic' }}>
            * Homologação, ERP e Documentos são mantidos de forma independente
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando lista de fornecedores...
          </div>
        ) : suppliers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Building size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Nenhum fornecedor cadastrado na base</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Aguardando novos cadastros ou pré-cadastros enviados via Portal do Fornecedor.
            </p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum fornecedor localizado com os filtros selecionados.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fornecedor / Razão Social</th>
                <th>CNPJ</th>
                <th>Categoria Principal</th>
                <th>Regiões / CDs</th>
                <th>Situação Cadastral</th>
                <th>Situação ERP</th>
                <th>Documentação</th>
                <th>Atualização</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openSupplierDrawer(supplier.id)}
                >
                  <td style={{ maxWidth: 260 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {supplier.tradeName || supplier.corporateName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {supplier.corporateName}
                    </div>
                  </td>

                  <td style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {supplier.cnpj}
                  </td>

                  <td>
                    <span
                      style={{
                        backgroundColor: '#F1F5F9',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {supplier.mainCategory}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {supplier.regions.join(', ')}
                    </div>
                  </td>

                  {/* Badges Independentes */}
                  <td>
                    <RegistrationStatusBadge status={supplier.status} />
                  </td>

                  <td>
                    <ErpStatusBadge status={supplier.erpStatus} erpCode={supplier.erpCode} />
                  </td>

                  <td>
                    <DocumentStatusBadge status={supplier.documentStatus} />
                  </td>

                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatDate(supplier.updatedAt)}
                  </td>

                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openSupplierDrawer(supplier.id)}
                        title="Ver detalhes cadastrais e dossiê"
                      >
                        <Eye size={14} /> Detalhes
                      </button>

                      {!isCadastro && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openAwardModal(supplier.id)}
                          title="Registrar fornecedor premiado neste processo"
                          style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                        >
                          <Award size={13} /> Premiar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
