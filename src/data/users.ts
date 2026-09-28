import type { User } from "@/types";

/**
 * Não existem mais contas de demonstração embutidas no storefront.
 * Em produção, clientes são cadastrados/autenticados pela API.
 * Quando a API não estiver configurada, o AuthContext continua permitindo
 * cadastro local para desenvolvimento sem depender de credenciais hardcoded.
 */
export const seedUsers: User[] = [];
