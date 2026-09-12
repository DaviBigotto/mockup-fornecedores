// ==============================================================================
// GESTÃO DOCUMENTAL DO FORNECEDOR - PLURIX ORGANIZER
// Repositório completo de certidões, contratos e alvarás com upload simulado
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, SupplierDocument } from '../../types';
import { DocumentStatusBadge } from '../../components/common/StatusBadges';
import { formatDate, formatFileSize } from '../../utils/formatters';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  Download,
  RotateCcw,
  X,
  FileCheck2,
  Clock,
} from 'lucide-react';

const REQUIRED_DOC_TYPES = [
  { code: 'CONTRATO_SOCIAL', name: 'Contrato Social Consolidado', desc: 'Última alteração contratual consolidada arquivada na Junta Comercial' },
  { code: 'CARTAO_CNPJ', name: 'Comprovante de Inscrição no CNPJ', desc: 'Emitido no site da Receita Federal há menos de 30 dias' },
  { code: 'CND_FEDERAL', name: 'Certidão Negativa Federal e Previdenciária', desc: 'Certidão Conjunta de Tributos Federais e Dívida Ativa da União' },
  { code: 'CND_ESTADUAL', name: 'Certidão Negativa Estadual', desc: 'Regularidade fiscal emitida pela SEFAZ do domicílio' },
  { code: 'CND_MUNICIPAL', name: 'Certidão Negativa Municipal', desc: 'Regularidade de Tributos Mobiliários emitida pela Prefeitura' },
  { code: 'CND_TRABALHISTA', name: 'Certidão Negativa Trabalhista (CNDT)', desc: 'Emitida pelo Tribunal Superior do Trabalho (TST)' },
  { code: 'ALVARA', name: 'Alvará de Funcionamento / Licença Sanitária', desc: 'Alvará municipal vigente ou Certificado de Vistoria do Bombeiro' },
  { code: 'COMPROVANTE_BANCARIO', name: 'Comprovante de Domicílio Bancário', desc: 'Extrato ou carta bancária confirmando titularidade e conta da empresa' },
];

export const SupplierDocuments: React.FC = () => {
  const { showToast, triggerRefresh, dataVersion, activeSupplierId, setActiveNav } = useApp();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal de Upload
  const [uploadModalDoc, setUploadModalDoc] = useState<typeof REQUIRED_DOC_TYPES[0] | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [uploading, setUploading] = useState(false);

  // Modal de Preview Simulado
  const [previewDoc, setPreviewDoc] = useState<SupplierDocument | null>(null);

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

  const docs = supplier?.documents || [];

  // Contadores
  const totalEnviados = docs.length;
  const validos = docs.filter((d) => d.status === 'Válido').length;
  const vencendo = docs.filter((d) => d.status === 'Vencendo').length;
  const vencidos = docs.filter((d) => d.status === 'Vencido').length;
  const obrigatoriosPendentes = REQUIRED_DOC_TYPES.filter(
    (req) => !docs.some((d) => d.documentTypeCode === req.code && (d.status === 'Válido' || d.status === 'Em validação'))
  ).length;

  const handleOpenUpload = (doc: typeof REQUIRED_DOC_TYPES[0]) => {
    setUploadModalDoc(doc);
    setUploadFileName(`${doc.code.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalDoc || !supplier) return;

    setUploading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': 'Carlos Mendes (Fornecedor)',
        },
        body: JSON.stringify({
          documentTypeCode: uploadModalDoc.code,
          documentName: uploadModalDoc.name,
          fileName: uploadFileName,
          issueDate,
          expirationDate,
        }),
      });

      if (!res.ok) throw new Error('Falha no upload');

      showToast(`Documento ${uploadModalDoc.name} enviado para análise com sucesso!`, 'success');
      setUploadModalDoc(null);
      triggerRefresh();
    } catch {
      showToast('Erro ao realizar upload do documento.', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Carregando repositório documental...</div>;
  }

  if (!supplier) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhum fornecedor vinculado</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Inicie o pré-cadastro da sua empresa para enviar os documentos e certidões exigidos.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setActiveNav('supplier-prereg')}>
          Ir para Pré-Cadastro
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          Gestão de Documentos e Certidões
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Repositório de conformidade fiscal, jurídica e técnica exigido para homologação no Grupo Plurix.
        </p>
      </div>

      {/* Cards de Métricas do Dossiê */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{totalEnviados}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Docs Enviados</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: 'var(--status-success-bg)',
              color: 'var(--status-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-success)' }}>{validos}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Válidos e Regulares</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: 'var(--status-warning-bg)',
              color: 'var(--status-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-warning)' }}>{vencendo}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vencendo em 30d</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-danger)' }}>{vencidos}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vencidos</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: '#F1F5F9',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{obrigatoriosPendentes}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Obrigatórios Pendentes</div>
          </div>
        </div>
      </div>

      {/* Tabela de Documentos Obrigatórios */}
      <div className="table-container">
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            Dossiê de Documentos Obrigatórios
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Formatos suportados: PDF, PNG, JPG (máx. 15MB)
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Documento / Descrição</th>
              <th>Arquivo Anexo</th>
              <th>Emissão</th>
              <th>Validade</th>
              <th>Situação</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {REQUIRED_DOC_TYPES.map((req) => {
              const doc = docs.find((d) => d.documentTypeCode === req.code);

              return (
                <tr key={req.code}>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {req.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {req.desc}
                    </div>
                  </td>

                  <td>
                    {doc?.fileName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={15} color="var(--color-primary)" />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{doc.fileName}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          ({formatFileSize(doc.fileSizeBytes)})
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>
                        Nenhum arquivo enviado
                      </span>
                    )}
                  </td>

                  <td>{doc?.issueDate ? formatDate(doc.issueDate) : '-'}</td>

                  <td>
                    {doc?.expirationDate ? (
                      <span
                        style={{
                          fontWeight: doc.status === 'Vencendo' || doc.status === 'Vencido' ? 700 : 400,
                          color:
                            doc.status === 'Vencido'
                              ? 'var(--status-danger)'
                              : doc.status === 'Vencendo'
                              ? 'var(--status-warning)'
                              : 'inherit',
                        }}
                      >
                        {formatDate(doc.expirationDate)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td>
                    {doc ? (
                      <DocumentStatusBadge status={doc.status} />
                    ) : (
                      <span className="badge badge-warning">Pendente</span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {doc && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setPreviewDoc(doc)}
                          title="Visualizar documento"
                        >
                          <Eye size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        className={`btn btn-sm ${doc ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleOpenUpload(req)}
                      >
                        {doc ? (
                          <>
                            <RotateCcw size={13} /> Substituir
                          </>
                        ) : (
                          <>
                            <Upload size={13} /> Anexar
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Upload Simulado */}
      {uploadModalDoc && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Anexar: {uploadModalDoc.name}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {uploadModalDoc.desc}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setUploadModalDoc(null)}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitUpload} style={{ padding: 24 }}>
              {/* Área de Dropzone */}
              <div
                style={{
                  border: '2px dashed var(--border-medium)',
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  marginBottom: 20,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const names = [
                    'certidao_negativa_federal_2025.pdf',
                    'alvara_sanitario_vigilancia.pdf',
                    'contrato_social_5_alteracao.pdf',
                    'cndt_tst_eletronica.pdf',
                  ];
                  setUploadFileName(names[Math.floor(Math.random() * names.length)]);
                }}
              >
                <Upload size={32} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Clique para selecionar ou arraste o arquivo aqui
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {uploadFileName ? `Arquivo selecionado: ${uploadFileName}` : 'Formato PDF, PNG ou JPG até 15MB'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Data de Emissão <span className="required">*</span></label>
                  <input
                    type="date"
                    className="input-control"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data de Validade <span className="required">*</span></label>
                  <input
                    type="date"
                    className="input-control"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setUploadModalDoc(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Enviando documento...' : 'Confirmar Envio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Preview Simulado do Documento */}
      {previewDoc && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: 740, height: 620 }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileCheck2 size={20} color="var(--color-primary)" />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700 }}>{previewDoc.documentName}</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {previewDoc.fileName} • Emitido em {formatDate(previewDoc.issueDate)} • Validade: {formatDate(previewDoc.expirationDate)}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => showToast(`Download simulado de ${previewDoc.fileName} iniciado!`, 'info')}
                >
                  <Download size={13} /> Baixar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPreviewDoc(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Visualização de PDF Mock */}
            <div
              style={{
                flex: 1,
                padding: 24,
                backgroundColor: '#525659',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'auto',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 540,
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  padding: 32,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontFamily: 'serif',
                }}
              >
                <div>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      REPÚBLICA FEDERATIVA DO BRASIL
                    </h3>
                    <h4 style={{ fontSize: 13, fontWeight: 600 }}>{previewDoc.documentName}</h4>
                  </div>

                  <div style={{ fontSize: 12, lineHeight: 1.8, color: '#111' }}>
                    <p>
                      Certificamos que o contribuinte <strong>{supplier?.corporateName}</strong>,
                      inscrito sob o CNPJ nº <strong>{supplier?.cnpj}</strong>, encontra-se regular
                      perante os registros correspondentes para a presente competência.
                    </p>
                    <p style={{ marginTop: 12 }}>
                      <strong>Data de Emissão:</strong> {formatDate(previewDoc.issueDate)}
                      <br />
                      <strong>Válido até:</strong> {formatDate(previewDoc.expirationDate)}
                      <br />
                      <strong>Código de Controle da Certidão:</strong> PLX-DOC-2025-9988221
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: 11, color: '#555', borderTop: '1px solid #CCC', paddingTop: 8 }}>
                  Autenticidade passível de verificação junto ao órgão expedidor ou plataforma Plurix Organizer.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
