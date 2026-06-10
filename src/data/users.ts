import type { User } from "@/types";
import { site } from "@/config/site";

/**
 * Cliente de demonstração já cadastrado.
 * Login: cliente@wazoo.com · senha: 123456
 */
export const seedUsers: User[] = [
  {
    id: "u-demo",
    name: "Ana Clara Ribeiro",
    phone: "11988887777",
    email: site.demoClient.email,
    password: site.demoClient.password,
    address: {
      street: "Rua das Acácias, 245",
      neighborhood: "Jardim Primavera",
      city: "São Paulo - SP",
    },
    preference: "entrega",
    createdAt: new Date("2025-03-10T09:00:00").getTime(),
    pets: [
      {
        id: "pet-banguela",
        name: "Banguela",
        type: "cachorro",
        breed: "Border Collie",
        size: "medio",
        age: "Filhote",
        weight: "8 kg",
        restrictions: "Nenhuma",
        notes: "Gosta de brinquedos mordedores.",
      },
      {
        id: "pet-mimi",
        name: "Mimi",
        type: "gato",
        breed: "Sem raça definida",
        size: "pequeno",
        age: "Adulto",
        weight: "4 kg",
        restrictions: "Sensível a ração com corante",
        notes: "Adora sachês de peixe.",
      },
    ],
  },
];
