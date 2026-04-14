# Checklist de Regressao Manual - ObraLog Front

Contexto: nao existe suite automatizada de testes no projeto (ver scripts em package.json).
Objetivo: validar fluxos criticos apos mudancas de contrato API e UX.

## Preparacao
- Backend ativo em http://localhost:5000
- Frontend ativo com VITE_API_BASE_URL apontando para o backend
- Usuarios de teste: administrador, gerente, encarregado

## Autenticacao
- [ ] POST /api/v1/auth/login: login com credenciais validas
- [ ] GET /api/v1/auth/me: usuario carregado ao entrar no dashboard
- [ ] PATCH /api/v1/auth/link-telegram: vinculo manual de telegram_chat_id funciona

## Regras de nivel e navegacao
- [ ] Encarrregado NAO acessa /dashboard/usuarios
- [ ] Encarrregado NAO acessa /dashboard/agent/instrucoes
- [ ] Encarrregado NAO acessa /dashboard/registros/auditoria
- [ ] Gerente acessa /dashboard/registros/auditoria
- [ ] Administrador acessa todas as rotas do dashboard

## Registros
- [ ] POST /api/v1/registros: validacao local bloqueia submit sem campos obrigatorios
- [ ] POST /api/v1/registros: envia lado_pista como principal
- [ ] POST /api/v1/registros: envia pista apenas como compatibilidade quando lado_pista vazio
- [ ] PATCH /api/v1/registros/{id}: validacoes equivalentes ao create
- [ ] GET /api/v1/registros/{id}/auditoria: trilha exibida na tela de auditoria

## Mensagens de Campo
- [ ] GET /api/v1/mensagens-campo sem filtros retorna lista
- [ ] GET /api/v1/mensagens-campo com status retorna subconjunto esperado
- [ ] GET /api/v1/mensagens-campo com telegram_chat_id retorna subconjunto esperado
- [ ] GET /api/v1/mensagens-campo com limit respeita faixa 1..200
- [ ] GET /api/v1/mensagens-campo/{id} exibe detalhe

## Lancamentos Operacionais
- [ ] GET /api/v1/lancamentos lista lancamentos
- [ ] POST /api/v1/lancamentos cria rascunho
- [ ] PATCH /api/v1/lancamentos/{id} atualiza status/metadados
- [ ] POST /api/v1/lancamentos/{id}/itens adiciona item
- [ ] POST /api/v1/lancamentos/{id}/recursos adiciona recurso
- [ ] POST /api/v1/lancamentos/{id}/midias adiciona midia
- [ ] POST /api/v1/lancamentos/{id}/confirmar altera status para confirmado
- [ ] POST /api/v1/lancamentos/{id}/descartar altera status para descartado
- [ ] POST /api/v1/lancamentos/{id}/consolidar consolida em registro

## Alertas
- [ ] GET /api/v1/alertas com filtros status/severity/apenas_nao_lidos
- [ ] POST /api/v1/alertas funciona sem description
- [ ] PATCH /api/v1/alertas/{id}/status permitido apenas para admin/gerente
- [ ] POST /api/v1/alertas/{id}/read e /unread atualizam estado de leitura

## Tratamento de Erros
- [ ] Erros de API no formato { ok: false, error } aparecem na UI
- [ ] Falha de conexao exibe mensagem padrao de conexao
- [ ] Erro 500 exibe mensagem padrao de servidor
