**1\. Arquitetura do Sistema:**

* **Frontend (App Gestor e App Aluno):** React Native ou Flutter (para compilação iOS e Android com a mesma base de código) ou stack web responsiva (Next.js/React) encapsulada como PWA.  
* **Backend:** Node.js com framework Express ou NestJS. Arquitetura baseada em microsserviços ou monolito modular.  
* **Banco de Dados:** PostgreSQL (Relacional) para garantir a integridade de transações financeiras e histórico de alunos.

**2\. Modelagem de Dados (Entidades Principais):**

* **Users:** ID, Nome, Email, Senha, Papel (Admin, Professor, Aluno), Foto.  
* **Students (Herda de Users):** Data\_Nascimento, Contato\_Emergencia, Faixa\_Atual, Data\_Ultima\_Graduacao, Modalidade\_ID, Status (Ativo/Inativo).  
* **Classes (Aulas):** ID, Modalidade, Nivel (Kids, Iniciante), Horario, Limite\_Alunos, Professor\_ID.  
* **Techniques:** ID, Nome, Descricao, Video\_URL, Nivel\_Dificuldade.  
* **Check\_ins:** ID, Student\_ID, Class\_ID, Timestamp.  
* **Payments/Plans:** ID, Student\_ID, Valor, Vencimento, Status (Pago/Atrasado), Metodo (PIX/Cartao).

**3\. Integrações de Terceiros Necessárias no MVP:**

* **Gateway de Pagamento:** Integração com ASAAS, Stripe ou Mercado Pago para split de pagamentos, cobrança recorrente, geração de PIX automático e conciliação.  
* **Vídeos:** API de Embed do YouTube/Vimeo para exibir as técnicas diretamente no app do aluno.

**4\. Regras de Negócio Críticas:**

* **Graduação:** O sistema deve contabilizar cada `Check_in` e atualizar o progresso do aluno. Quando atingir a meta (ex: 40 aulas), o aluno entra no relatório de "Aptos para Graduação".  
* **Bloqueio de Inadimplentes:** O app do aluno deve bloquear a geração de QR Code de check-in caso haja mensalidade com mais de X dias de atraso


