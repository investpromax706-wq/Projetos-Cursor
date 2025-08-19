# Implantação da Página de Pagamento PIX no Vercel

Este guia detalha os passos para implantar a página de pagamento PIX (frontend React e backend Flask) na plataforma Vercel.

## 🚀 Pré-requisitos

- Uma conta no [GitHub](https://github.com/) (ou GitLab/Bitbucket)
- Uma conta no [Vercel](https://vercel.com/)

## 📦 Estrutura do Projeto para Vercel

O projeto está organizado da seguinte forma para facilitar a implantação no Vercel:

```
├── backend-pagamento/      # Contém o backend Flask e o frontend React buildado
│   ├── src/
│   │   ├── main.py         # Servidor principal Flask
│   │   ├── routes/         # Rotas da API
│   │   ├── static/         # Frontend React buildado (HTML, CSS, JS)
│   │   └── ...
│   ├── venv/               # Ambiente virtual Python (não será enviado para o Git)
│   ├── requirements.txt    # Dependências do Python
│   └── vercel.json         # Configuração de build e rotas para o Vercel
│
├── .gitignore              # Arquivo para ignorar pastas e arquivos desnecessários
├── README.md               # Documentação geral do projeto
└── README_VERCEL.md        # Este guia
```

**Observação**: O diretório `pagamento-pix/` (frontend React original) não é necessário para a implantação no Vercel, pois o build do frontend já está dentro de `backend-pagamento/src/static/`.

## ⚙️ Passos para Implantação

### 1. Criar um Repositório Git

Se você ainda não tem um repositório Git para este projeto, crie um novo no GitHub (ou sua plataforma preferida).

Exemplo no GitHub:
1.  Acesse [github.com/new](https://github.com/new).
2.  Dê um nome ao seu repositório (ex: `vizzionpay-pix-page`).
3.  Escolha se será público ou privado.
4.  **Não inicialize com README, .gitignore ou licença agora.** Você fará isso manualmente.
5.  Clique em "Create repository".

### 2. Fazer Upload do Código para o Repositório

Agora, você precisa enviar os arquivos do projeto para o seu novo repositório. Certifique-se de estar no diretório raiz do projeto (`/home/ubuntu/` no seu ambiente atual) e execute os seguintes comandos no seu terminal local:

```bash
# Navegue até o diretório raiz do seu projeto (onde estão backend-pagamento/ e README.md)
cd /caminho/para/seu/projeto/local

# Inicialize um novo repositório Git (se ainda não o fez)
git init

# Adicione um .gitignore para excluir arquivos desnecessários
# Crie um arquivo chamado .gitignore na raiz do seu projeto com o seguinte conteúdo:
# node_modules/
# venv/
# .DS_Store
# .env
# __pycache__/
# *.pyc
# dist/

# Adicione todos os arquivos ao stage
git add .

# Faça o primeiro commit
git commit -m "Initial commit: VizzionPay PIX Payment Page"

# Adicione o repositório remoto (substitua <SEU_USUARIO_GITHUB> e <NOME_DO_REPOSITORIO>)
git remote add origin https://github.com/<SEU_USUARIO_GITHUB>/<NOME_DO_REPOSITORIO>.git

# Envie o código para o GitHub
git push -u origin master
```

### 3. Conectar o Vercel ao seu Repositório

1.  Acesse o [Vercel Dashboard](https://vercel.com/dashboard).
2.  Clique em "Add New..." e selecione "Project".
3.  Selecione o provedor Git (GitHub, GitLab ou Bitbucket) e autorize o Vercel a acessar seus repositórios.
4.  Escolha o repositório que você acabou de criar (`vizzionpay-pix-page`).
5.  Clique em "Import".

### 4. Configurar o Projeto no Vercel

Na tela de configuração do projeto:

-   **Root Directory**: Defina como `backend-pagamento/` (o Vercel detectará automaticamente o `vercel.json` dentro dele).
-   **Build and Output Settings**: O Vercel deve detectar automaticamente as configurações do `vercel.json`.
    -   **Build Command**: `pip install -r requirements.txt` (ou deixe em branco se o Vercel detectar automaticamente).
    -   **Output Directory**: `public` (ou deixe em branco se o Vercel detectar automaticamente).
-   **Environment Variables**: Esta é a parte CRÍTICA para a API da VizzionPay.
    -   Adicione duas variáveis de ambiente:
        -   `VIZZION_PUBLIC_KEY`: `luizaugustohetfeller_y389rh0u6458g7im`
        -   `VIZZION_SECRET_KEY`: `qdzgq50prgtm6wotiruwr4ekqsuov4es48lm97byoz0ex48jxhavgv0g20l50z7r`

    **⚠️ Importante**: Em um ambiente de produção real, você deve obter essas chaves de forma segura (ex: do seu provedor de credenciais) e não as hardcodar no código. No Vercel, elas serão injetadas no ambiente de execução da sua função serverless.

### 5. Implantar

1.  Após configurar tudo, clique em "Deploy".
2.  O Vercel fará o build do seu projeto e, se tudo estiver correto, você terá um URL público para sua aplicação.

## 🐛 Resolução de Problemas

-   **Build Falhou**: Verifique os logs de build no Vercel Dashboard. Erros comuns incluem dependências ausentes (`requirements.txt` incorreto) ou problemas de configuração no `vercel.json`.
-   **Erros de API (403)**: Se você continuar recebendo o erro "You are not authorized to sell", significa que as credenciais da VizzionPay não estão ativas para vendas em produção. Você precisará entrar em contato com o suporte da VizzionPay para ativar sua conta ou obter credenciais de produção.
-   **Variáveis de Ambiente**: Certifique-se de que as variáveis `VIZZION_PUBLIC_KEY` e `VIZZION_SECRET_KEY` foram adicionadas corretamente no Vercel.

Com esses passos, você deverá conseguir implantar sua página de pagamento PIX no Vercel com sucesso!

