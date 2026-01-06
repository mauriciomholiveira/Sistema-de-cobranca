# Sistema de Cobrança Premium

Sistema moderno e minimalista para gestão de clientes e envio de cobranças via WhatsApp.

## 🚀 Como Rodar

### 1. Iniciar o Banco de Dados
Certifique-se de que o Docker está rodando e execute na raiz do projeto:

```bash
docker-compose up -d
```

### 2. Iniciar o Servidor (Backend)
Em um terminal separado:

```bash
cd backend
npm install  # Caso não tenha instalado ainda
npm start
```

### 3. Acessar o Sistema
Abra o arquivo `frontend/index.html` no seu navegador. 

> **Dica**: Para uma melhor experiência (e evitar problemas de CORS em alguns navegadores), recomendo usar o "Live Server" do VS Code ou um servidor simples de http.
>
> Se você tiver python instalado, pode rodar na pasta `frontend`:
> `python3 -m http.server 8000`
> E acessar `http://localhost:8000`

## ✨ Funcionalidades

- **Clientes**: Cadastro completo com persistência no banco de dados.
- **Cobrança**: 
  - Tabela com todos os alunos.
  - **Valor Editável**: Altere o valor da mensalidade na hora (ex: desconto pontual) sem mudar o padrão do cliente.
  - **Botão WhatsApp**: Abre o WhatsApp Web já com a mensagem personalizada e o valor correto.

## 🛠 Tecnologias

- **Frontend**: HTML5, Premium CSS (Glassmorphism), Vanilla JS.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL 15 (Docker).
