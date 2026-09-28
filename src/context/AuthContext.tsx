import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { STORAGE_KEYS } from "@/config/site";
import { seedUsers } from "@/data/users";
import { uid } from "@/lib/format";
import { isCloudEnabled } from "@/lib/supabase";
import { cloudLogin, cloudRegister, cloudSave, type CloudProfileData } from "@/lib/cloudProfile";
import { emails } from "@/lib/email";
import {
  apiEnabled,
  clearAdminSession,
  clearCustomerSession,
  createCustomerAddress,
  createCustomerPet,
  deleteCustomerPet,
  getAdminMe,
  getCustomerMe,
  hasAdminSession,
  hasCustomerSession,
  loginAdmin,
  loginCustomer,
  registerCustomer,
  updateCustomerAddress,
  updateCustomerPet,
  updateCustomerProfile,
  type ApiCustomer,
} from "@/lib/api";
import type { Address, Pet, User } from "@/types";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface RegisterInput {
  name: string;
  phone: string;
  email: string;
  password: string;
  address?: User["address"];
  preference: User["preference"];
}

export interface GoogleProfile {
  name: string;
  email: string;
  picture?: string;
  googleId?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  cloudSync: boolean;

  register: (data: RegisterInput) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: (profile: GoogleProfile) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (data: Partial<Omit<User, "id" | "pets">>) => void;
  resetPassword: (email: string, newPassword: string) => AuthResult;

  addPet: (pet: Omit<Pet, "id">) => void;
  updatePet: (id: string, data: Partial<Pet>) => void;
  removePet: (id: string) => void;

  adminLogin: (email: string, password: string) => Promise<AuthResult>;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function emptyAddress(): Address {
  return { street: "", neighborhood: "", city: "" };
}

function apiCustomerToUser(customer: ApiCustomer, existing?: User): User {
  const primary = customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0];
  const address: Address = primary
    ? {
        id: primary.id,
        label: primary.label,
        isDefault: primary.isDefault,
        street: primary.street,
        number: primary.number,
        complement: primary.complement ?? undefined,
        neighborhood: primary.neighborhood,
        city: primary.city,
        state: primary.state,
        zip: primary.zip,
      }
    : existing?.address ?? emptyAddress();

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    password: existing?.password ?? "",
    avatar: customer.avatar ?? existing?.avatar,
    address,
    preference: customer.preference === "PICKUP" ? "retirada" : "entrega",
    pets: customer.pets.map((pet) => ({
      id: pet.id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      size: pet.size,
      age: pet.age,
      weight: pet.weight,
      restrictions: pet.restrictions ?? undefined,
      notes: pet.notes ?? undefined,
    })),
    createdAt: new Date(customer.createdAt).getTime(),
  };
}

/** Extrai só os campos do perfil usados pelo fallback Supabase. */
function toCloud(u: {
  name?: string; phone?: string; avatar?: string; googleId?: string;
  address?: User["address"]; preference?: User["preference"]; pets?: Pet[]; createdAt?: number;
}): CloudProfileData {
  return {
    name: u.name,
    phone: u.phone,
    avatar: u.avatar,
    googleId: u.googleId,
    address: u.address,
    preference: u.preference,
    pets: u.pets,
    createdAt: u.createdAt,
  };
}

const secretOf = (u: User) => u.password || u.googleId || "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = usePersistentState<User[]>(STORAGE_KEYS.users, seedUsers);
  const [currentUserId, setCurrentUserId] = usePersistentState<string | null>(
    STORAGE_KEYS.user,
    null,
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(() => hasAdminSession());

  const user = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  );

  const hydrateApiCustomer = (customer: ApiCustomer) => {
    setUsers((prev) => {
      const existing = prev.find((u) => u.id === customer.id || u.email.toLowerCase() === customer.email.toLowerCase());
      const merged = apiCustomerToUser(customer, existing);
      return existing
        ? prev.map((u) => (u.id === existing.id ? merged : u))
        : [...prev, merged];
    });
    setCurrentUserId(customer.id);
  };

  useEffect(() => {
    if (!isAdmin) return;
    getAdminMe().catch(() => {
      clearAdminSession();
      setIsAdmin(false);
    });
  }, [isAdmin]);

  // Restaura a sessão real do cliente entre dispositivos quando a API está ativa.
  useEffect(() => {
    if (!apiEnabled || !hasCustomerSession()) return;
    let active = true;
    getCustomerMe()
      .then((customer) => {
        if (active) hydrateApiCustomer(customer);
      })
      .catch(() => {
        clearCustomerSession();
        if (active) setCurrentUserId(null);
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutateCurrent = (fn: (u: User) => User) => {
    if (!currentUserId) return;
    setUsers((prev) => prev.map((u) => (u.id === currentUserId ? fn(u) : u)));
  };

  const hydrateFromCloud = (
    email: string,
    secret: string,
    data: CloudProfileData,
    googleId?: string,
  ) => {
    const emailLc = email.toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === emailLc);
    const id = existing?.id ?? uid("u-");
    const merged: User = {
      id,
      name: data.name ?? existing?.name ?? "",
      email,
      phone: data.phone ?? existing?.phone ?? "",
      password: googleId ? "" : secret,
      googleId: googleId ?? existing?.googleId,
      avatar: data.avatar ?? existing?.avatar,
      address: data.address ?? existing?.address ?? emptyAddress(),
      preference: data.preference ?? existing?.preference ?? "entrega",
      pets: (data.pets as Pet[]) ?? existing?.pets ?? [],
      createdAt: data.createdAt ?? existing?.createdAt ?? Date.now(),
    };
    setUsers((prev) =>
      existing ? prev.map((u) => (u.id === existing.id ? merged : u)) : [...prev, merged],
    );
    setCurrentUserId(id);
  };

  // Supabase continua como fallback apenas quando a API principal não está configurada.
  const lastPush = useRef<string>("");
  useEffect(() => {
    if (apiEnabled || !isCloudEnabled || !user) return;
    const secret = secretOf(user);
    if (!secret) return;
    const payload = toCloud(user);
    const sig = `${user.email}:${JSON.stringify(payload)}`;
    if (sig === lastPush.current) return;
    const timer = setTimeout(() => {
      cloudSave(user.email, secret, payload)
        .then(() => { lastPush.current = sig; })
        .catch(() => { /* melhor esforço */ });
    }, 700);
    return () => clearTimeout(timer);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoggedIn: Boolean(user),
    isAdmin,
    cloudSync: apiEnabled || isCloudEnabled,

    register: async (data) => {
      const emailLc = data.email.toLowerCase().trim();

      if (apiEnabled) {
        try {
          const session = await registerCustomer({
            name: data.name.trim(),
            phone: data.phone,
            email: emailLc,
            password: data.password,
            preference: data.preference === "retirada" ? "PICKUP" : "DELIVERY",
          });
          hydrateApiCustomer(session.user);
          void emails.welcome(session.user.email, session.user.name, "BEMVINDO");
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : "Não foi possível criar a conta." };
        }
      }

      if (users.some((u) => u.email.toLowerCase() === emailLc)) {
        return { ok: false, error: "Este e-mail já está cadastrado." };
      }

      if (isCloudEnabled) {
        const cloud = await cloudRegister(emailLc, data.password, toCloud({
          name: data.name,
          phone: data.phone,
          address: data.address ?? emptyAddress(),
          preference: data.preference,
          pets: [],
          createdAt: Date.now(),
        }));
        if (cloud.exists) {
          return { ok: false, error: "Este e-mail já está cadastrado. Faça login." };
        }
      }

      const newUser: User = {
        ...data,
        address: data.address ?? emptyAddress(),
        id: uid("u-"),
        pets: [],
        createdAt: Date.now(),
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      void emails.welcome(newUser.email, newUser.name, "BEMVINDO");
      return { ok: true };
    },

    login: async (email, password) => {
      const emailLc = email.trim().toLowerCase();

      if (apiEnabled) {
        try {
          const session = await loginCustomer(emailLc, password);
          hydrateApiCustomer(session.user);
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : "E-mail ou senha inválidos." };
        }
      }

      if (isCloudEnabled) {
        const data = await cloudLogin(emailLc, password);
        if (data) {
          hydrateFromCloud(emailLc, password, data);
          return { ok: true };
        }
      }

      const found = users.find(
        (candidate) => candidate.email.toLowerCase() === emailLc && candidate.password === password,
      );
      if (!found) return { ok: false, error: "E-mail ou senha inválidos." };
      setCurrentUserId(found.id);
      return { ok: true };
    },

    loginWithGoogle: async (profile) => {
      if (apiEnabled) {
        return {
          ok: false,
          error: "O login Google será reativado quando o OAuth estiver conectado à API da Wazoo.",
        };
      }

      const emailLc = profile.email.trim().toLowerCase();
      const gid = profile.googleId || "google";

      if (isCloudEnabled) {
        let data = await cloudLogin(emailLc, gid);
        if (!data) {
          const seed: CloudProfileData = {
            name: profile.name,
            avatar: profile.picture,
            googleId: gid,
            address: emptyAddress(),
            preference: "entrega",
            pets: [],
            createdAt: Date.now(),
          };
          await cloudRegister(emailLc, gid, seed);
          data = seed;
        }
        hydrateFromCloud(emailLc, gid, data, gid);
        return { ok: true };
      }

      const existing = users.find((candidate) => candidate.email.toLowerCase() === emailLc);
      if (existing) {
        setCurrentUserId(existing.id);
        return { ok: true };
      }

      const newUser: User = {
        id: uid("u-"),
        name: profile.name,
        email: profile.email,
        phone: "",
        password: "",
        googleId: gid,
        avatar: profile.picture,
        address: emptyAddress(),
        preference: "entrega",
        pets: [],
        createdAt: Date.now(),
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      return { ok: true };
    },

    logout: () => {
      if (apiEnabled) clearCustomerSession();
      setCurrentUserId(null);
    },

    resetPassword: (email, newPassword) => {
      if (apiEnabled) {
        return {
          ok: false,
          error: "Por segurança, a recuperação de senha da conta online será feita por link enviado ao e-mail.",
        };
      }

      const found = users.find(
        (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!found) return { ok: false, error: "Nenhuma conta com esse e-mail." };
      if (newPassword.length < 6) return { ok: false, error: "A senha deve ter pelo menos 6 caracteres." };

      setUsers((prev) =>
        prev.map((candidate) => candidate.id === found.id ? { ...candidate, password: newPassword } : candidate),
      );
      if (isCloudEnabled) cloudSave(found.email, newPassword, toCloud(found)).catch(() => {});
      void emails.passwordChanged(found.email, found.name);
      return { ok: true };
    },

    updateProfile: (data) => {
      mutateCurrent((current) => ({ ...current, ...data }));

      if (!apiEnabled || !user) return;

      const profilePatch: {
        name?: string;
        phone?: string;
        avatar?: string | null;
        preference?: "DELIVERY" | "PICKUP";
      } = {};
      if (data.name !== undefined) profilePatch.name = data.name;
      if (data.phone !== undefined) profilePatch.phone = data.phone;
      if (data.avatar !== undefined) profilePatch.avatar = data.avatar ?? null;
      if (data.preference !== undefined) {
        profilePatch.preference = data.preference === "retirada" ? "PICKUP" : "DELIVERY";
      }
      if (Object.keys(profilePatch).length) {
        void updateCustomerProfile(profilePatch).catch(console.error);
      }

      const nextAddress = data.address;
      if (
        nextAddress &&
        nextAddress.street &&
        nextAddress.number &&
        nextAddress.neighborhood &&
        nextAddress.city &&
        nextAddress.state &&
        nextAddress.zip
      ) {
        const payload = {
          label: nextAddress.label ?? "Casa",
          recipientName: data.name ?? user.name,
          street: nextAddress.street,
          number: nextAddress.number,
          complement: nextAddress.complement,
          neighborhood: nextAddress.neighborhood,
          city: nextAddress.city,
          state: nextAddress.state,
          zip: nextAddress.zip,
          isDefault: true,
        };

        if (nextAddress.id) {
          void updateCustomerAddress(nextAddress.id, payload).catch(console.error);
        } else {
          void createCustomerAddress(payload)
            .then((saved) => {
              mutateCurrent((current) => ({
                ...current,
                address: {
                  ...current.address,
                  id: saved.id,
                  label: saved.label,
                  isDefault: saved.isDefault,
                },
              }));
            })
            .catch(console.error);
        }
      }
    },

    addPet: (pet) => {
      const tempId = uid("pet-");
      mutateCurrent((current) => ({
        ...current,
        pets: [...current.pets, { ...pet, id: tempId }],
      }));

      if (apiEnabled) {
        void createCustomerPet(pet)
          .then((saved) => {
            mutateCurrent((current) => ({
              ...current,
              pets: current.pets.map((item) =>
                item.id === tempId
                  ? {
                      id: saved.id,
                      name: saved.name,
                      type: saved.type,
                      breed: saved.breed,
                      size: saved.size,
                      age: saved.age,
                      weight: saved.weight,
                      restrictions: saved.restrictions ?? undefined,
                      notes: saved.notes ?? undefined,
                    }
                  : item,
              ),
            }));
          })
          .catch(console.error);
      }
    },

    updatePet: (id, data) => {
      mutateCurrent((current) => ({
        ...current,
        pets: current.pets.map((pet) => pet.id === id ? { ...pet, ...data } : pet),
      }));
      if (apiEnabled) void updateCustomerPet(id, data).catch(console.error);
    },

    removePet: (id) => {
      mutateCurrent((current) => ({
        ...current,
        pets: current.pets.filter((pet) => pet.id !== id),
      }));
      if (apiEnabled) void deleteCustomerPet(id).catch(console.error);
    },

    adminLogin: async (email, password) => {
      try {
        await loginAdmin(email.trim().toLowerCase(), password);
        setIsAdmin(true);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Credenciais administrativas inválidas.",
        };
      }
    },

    adminLogout: () => {
      clearAdminSession();
      setIsAdmin(false);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, users, isAdmin, currentUserId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
