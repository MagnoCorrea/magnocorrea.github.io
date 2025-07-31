# Chat P2P - Sistema de Chat Online

Um sistema de chat peer-to-peer (P2P) que funciona diretamente no navegador, sem necessidade de servidor backend ou banco de dados.

## Características

- **Comunicação P2P**: Conexão direta entre navegadores usando WebRTC
- **Sem servidor**: Funciona apenas com arquivos estáticos
- **Sem persistência**: Não armazena dados, tudo é em tempo real
- **Interface moderna**: Design responsivo e intuitivo
- **Códigos de sala**: Sistema simples de salas com códigos de 6 caracteres

## Como usar

1. **Criar uma sala**:
   - Clique em "Criar Sala"
   - Compartilhe o código gerado com outra pessoa
   - Aguarde a conexão

2. **Entrar em uma sala**:
   - Cole o código da sala recebido
   - Clique em "Entrar"
   - Comece a conversar!

## Estrutura dos arquivos

```
chat/
├── index.html      # Interface principal
├── style.css       # Estilos e layout
├── script.js       # Lógica do chat P2P
└── README.md       # Este arquivo
```

## Tecnologias utilizadas

- **HTML5**: Estrutura da página
- **CSS3**: Estilos e animações
- **JavaScript ES6+**: Lógica do aplicativo
- **WebRTC**: Comunicação P2P
- **STUN Servers**: Para estabelecer conexões NAT

## Como executar

1. Baixe todos os arquivos para uma pasta
2. Abra um servidor HTTP simples:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (com http-server)
   npx http-server
   
   # VS Code Live Server
   Clique com botão direito em index.html > "Open with Live Server"
   ```
3. Acesse `http://localhost:8000` no navegador
4. Para testar, abra duas abas/janelas do navegador

## Limitações

- **Signaling**: Esta versão usa uma simulação simples. Para uso real entre redes diferentes, seria necessário um servidor de signaling
- **NAT/Firewall**: Pode não funcionar em todas as redes corporativas
- **Compatibilidade**: Requer navegadores modernos com suporte a WebRTC

## Melhorias possíveis

- Servidor de signaling real (Socket.io, WebSocket)
- Suporte a múltiplos usuários por sala
- Envio de arquivos
- Emojis e formatação de texto
- Histórico de mensagens (localStorage)
- Notificações de áudio/visual

## Recursos de segurança

- Conexão criptografada (WebRTC usa DTLS)
- Comunicação direta P2P
- Sem armazenamento de dados
- Códigos de sala temporários

---

**Nota**: Este é um projeto educacional/demonstrativo. Para uso em produção, recomenda-se implementar um servidor de signaling adequado e considerações adicionais de segurança.
