-- ==============================================================================
-- PLURIX ORGANIZER - SCRIPT DE SEED PARA NEON POSTGRESQL
-- INSERÇÃO DOS DADOS INICIAIS E CENÁRIOS EMPRESARIAIS
-- ==============================================================================

-- 1. Categorias
INSERT INTO categories (name, description) VALUES
('Tecnologia', 'Sistemas em nuvem, telecomunicações, equipamentos de TI e automação'),
('Facilities', 'Limpeza técnica, portaria, recepção e vigilância patrimonial'),
('Logística', 'Transporte frigorificado, armazenagem, carga seca e cross-docking'),
('Marketing', 'Comunicação visual, eventos, agências e material promocional de PDV'),
('Jurídico', 'Serviços advocatícios, consultoria legal e auditoria corporativa'),
('Serviços profissionais', 'Consultoria de gestão, auditoria contábil e treinamentos'),
('Produtos operacionais', 'Embalagens, uniformes, EPIs, hortifruti e suprimentos de loja'),
('Obras e manutenção', 'Engenharia civil, reformas de lojas, climatização (PMOC) e elétrica')
ON CONFLICT (name) DO NOTHING;

-- 2. Unidades de Negócio Plurix
INSERT INTO business_units (code, name, region, state_uf) VALUES
('CD-ARUJA', 'CD Central Arujá', 'Sudeste', 'SP'),
('CD-RIB', 'CD Regional Ribeirão Preto', 'Sudeste', 'SP'),
('CORP-SP', 'Unidade Corporativa SP', 'Sudeste', 'SP'),
('BAN-SUL', 'Bandeira Super Sul', 'Sul', 'PR'),
('BAN-MVC', 'Bandeira Mais Você', 'Sudeste', 'SP'),
('HIP-CAMP', 'Hiper Plurix Campinas', 'Sudeste', 'SP')
ON CONFLICT (code) DO NOTHING;

-- 3. Usuários de Demonstração
INSERT INTO users (email, name, role, password_hash) VALUES
('fornecedor@demo.com', 'Carlos Mendes (TechCloud TI)', 'fornecedor', '123456'),
('compras@plurix.com', 'Mariana Esteves (Compras)', 'compras', '123456'),
('cadastro@plurix.com', 'Roberto Valente (Governança ERP)', 'cadastro', '123456')
ON CONFLICT (email) DO NOTHING;

-- 4. Tipos de Documentos
INSERT INTO document_types (code, name, description, is_mandatory) VALUES
('CONTRATO_SOCIAL', 'Contrato Social Consolidado', 'Última alteração contratual consolidada', true),
('CARTAO_CNPJ', 'Cartão CNPJ', 'Comprovante de inscrição e de situação cadastral', true),
('CND_FEDERAL', 'CND Federal e Previdenciária', 'Certidão Conjunta de Débitos Federais (RFB/PGFN)', true),
('CND_ESTADUAL', 'CND Estadual', 'Certidão de Regularidade Fiscal da Fazenda Estadual', true),
('CND_MUNICIPAL', 'CND Municipal', 'Certidão de Tributos Mobiliários do Município', true),
('CND_TRABALHISTA', 'CND Trabalhista (CNDT)', 'Certidão Negativa de Débitos Trabalhistas (TST)', true),
('ALVARA', 'Alvará de Funcionamento / Sanitário', 'Licença da Prefeitura ou Vigilância Sanitária', true),
('COMPROVANTE_BANCARIO', 'Comprovante de Domicílio Bancário', 'Extrato ou carta bancária confirmando titularidade', true)
ON CONFLICT (code) DO NOTHING;
