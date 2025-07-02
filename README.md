# 🌍 ClimACT: Plataforma Progressiva Centrada Na Comunidade Para Redução De Riscos

Uma Progressive Web Application para ação climática colaborativa e gestão de riscos.

## 📋 Resumo

ClimACT é uma plataforma web desenvolvida para facilitar o engajamento comunitário na mitigação de riscos das mudanças climáticas através de mecanismos colaborativos de relatórios, validação e resposta.

## 🛠️ Especificações Técnicas

### Arquitetura
- **Frontend**: Next.js 15.3.3 com TypeScript 🔷
- **Backend**: Ecossistema Firebase (Firestore, Authentication, Cloud Functions) 🔥
- **Integração AI**: Google Gemini 🤖

### 🚀 Funcionalidades Principais
- 👥 Sistema multi-nível de usuários (Cidadão → Voluntário → Defesa Civil → Administrador)
- 🧠 Triagem de incidentes e moderação de conteúdo com IA
- 🤝 Fluxos de validação baseados na comunidade
- 🌤️ Integração de dados meteorológicos em tempo real via OpenWeather API
- 📱 Capacidades de Progressive Web App com suporte offline
- ♿ Conformidade com acessibilidade WCAG 2.2 AA

## 💻 Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js 20+ 📦
- Firebase CLI 🔥
- Configuração de ambiente (`.env.local`) ⚙️

### Instalação
```bash
npm install
npm run dev  # Servidor de desenvolvimento na porta 9002
```

### 🧪 Testes
```bash
npm run test          # Testes unitários
npm run test:e2e      # Testes end-to-end
npm run test:all      # Suite completa de testes
```

### 🏗️ Build
```bash
npm run build         # Build de produção
npm run typecheck     # Validação de tipos
npm run lint          # Verificações de qualidade de código
```

## ⚙️ Configuração

### Variáveis de Ambiente
```bash
NEXT_PUBLIC_OPENWEATHER_API_KEY=sua_chave_api
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
# Variáveis adicionais de configuração Firebase necessárias
```

### 🔥 Configuração Firebase
1. Configurar projeto Firebase
2. Habilitar Authentication, Firestore e Cloud Functions
3. Deploy das regras de segurança: `firebase deploy --only firestore:rules`

## 📊 Requisitos do Sistema

### 🔒 Segurança
- Autenticação Firebase com controle de acesso baseado em roles
- Conformidade LGPD para proteção de dados
- Validação e sanitização de entrada
- Gestão segura de endpoints de API

### ⚡ Performance
- Tempo de carregamento inicial inferior a 2 segundos
- Arquitetura offline-first
- Bundle otimizado e lazy loading
- Carregamento progressivo de imagens

### ♿ Acessibilidade
- Conformidade WCAG 2.2 AA
- Compatibilidade com leitores de tela
- Suporte à navegação por teclado
- Modo de alto contraste disponível

## 🔬 Aplicações de Pesquisa

Esta plataforma serve como estudo de caso para:
- 🤖 Colaboração humano-IA na moderação de conteúdo
- 🤝 Mecanismos de validação de dados baseados na comunidade
- 📱 Adoção de Progressive Web Apps em aplicações ambientais
- 🌐 Engajamento multi-stakeholder em plataformas de ação climática

## 📄 Licença

Projeto de pesquisa privado. Todos os direitos reservados.

---

**💚 Desenvolvido com coração para um futuro mais sustentável 🌱**

*ClimACT - Tecnologia a serviço do meio ambiente e das comunidades*