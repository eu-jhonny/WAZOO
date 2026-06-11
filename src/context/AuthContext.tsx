import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { STORAGE_KEYS, site } from "@/config/site";
import { seedUsers } from "@/data/users";
import { uid } from "@/lib/format";
import { isCloudEnabled } from "@/lib/supabase";
import { cloudLogin, cloudRegister, cloudSave, type CloudProfileData } from "@/lib/cloudProfile";
import type { Pet, User } from "@/types";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface RegisterInput {
  name: string;
  phone: string;
  email: string;
  password: string;
  address: User["address"];
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
  /** True quando a sincronização em nuvem está ativa (Supabase configurado). */
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

  adminLogin: (email: string, password: string) => AuthResult;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Extrai só os campos do perfil que vão para a nuvem (sem id/senha). */
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

/** Segredo usado nas RPCs: senha (e-mail) ou googleId (Google). */
const secretOf = (u: User) => u.password || u.googleId || "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = usePersistentState<User[]>(
    STORAGE_KEYS.users,
    seedUsers
  );
  const [currentUserId, setCurrentUserId] = usePersistentState<string | null>(
    STORAGE_KEYS.user,
    null
  );
  const [isAdmin, setIsAdmin] = usePersistentState<boolean>(
    STORAGE_KEYS.admin,
    false
  );

  const user = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId]
  );

  /** Aplica uma transformação ao usuário atual e persiste de imediato. */
  const mutateCurrent = (fn: (u: User) => User) => {
    if (!currentUserId) return;
    setUsers((prev) => prev.map((u) => (u.id === currentUserId ? fn(u) : u)));
  };

  /** Insere/atualiza um usuário a partir dos dados da nuvem e o torna o atual. */
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
      address: data.address ?? existing?.address ?? { street: "", neighborhood: "", city: "" },
      preference: data.preference ?? existing?.preference ?? "entrega",
      pets: (data.pets as Pet[]) ?? existing?.pets ?? [],
      createdAt: data.createdAt ?? existing?.createdAt ?? Date.now(),
    };
    setUsers((prev) =>
      existing ? prev.map((u) => (u.id === id ? merged : u)) : [...prev, merged],
    );
    setCurrentUserId(id);
  };

  /* ── Push do perfil para a nuvem quando ele muda (debounce) ── */
  const lastPush = useRef<string>("");
  useEffect(() => {
    if (!isCloudEnabled || !user) return;
    const secret = secretOf(user);
    if (!secret) return;
    const payload = toCloud(user);
    const sig = `${user.email}:${JSON.stringify(payload)}`;
    if (sig === lastPush.current) return;
    const t = setTimeout(() => {
      cloudSave(user.email, secret, payload)
        .then(() => { lastPush.current = sig; })
        .catch(() => { /* melhor esforço */ });
    }, 700);
    return () => clearTimeout(t);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isLoggedIn: !!user,
      isAdmin,
      cloudSync: isCloudEnabled,

      register: async (data) => {
        const emailLc = data.email.toLowerCase().trim();
        if (users.some((u) => u.email.toLowerCase() === emailLc)) {
          return { ok: false, error: "Este e-mail já está cadastrado." };
        }
        if (isCloudEnabled) {
          const r = await cloudRegister(emailLc, data.password, toCloud({
            name: data.name, phone: data.phone, address: data.address,
            preference: data.preference, pets: [], createdAt: Date.now(),
          }));
          if (r.exists) {
            return { ok: false, error: "Este e-mail já está cadastrado. Faça login." };
          }
        }
        const newUser: User = { ...data, id: uid("u-"), pets: [], createdAt: Date.now() };
        setUsers((prev) => [...prev, newUser]);
        setCurrentUserId(newUser.id);
        return { ok: true };
      },

      login: async (email, password) => {
        const emailLc = email.trim().toLowerCase();
        if (isCloudEnabled) {
          const data = await cloudLogin(emailLc, password);
          if (data) {
            hydrateFromCloud(emailLc, password, data);
            return { ok: true };
          }
          // Não achou na nuvem → tenta conta local (ex.: criada antes da nuvem)
        }
        const found = users.find(
          (u) =>
            u.email.toLowerCase() === emailLc &&
            u.password === password
        );
        if (!found) {
          return { ok: false, error: "E-mail ou senha inválidos." };
        }
        setCurrentUserId(found.id);
        return { ok: true };
      },

      loginWithGoogle: async (profile) => {
        const emailLc = profile.email.trim().toLowerCase();
        const gid = profile.googleId || "google";

        if (isCloudEnabled) {
          let data = await cloudLogin(emailLc, gid);
          if (!data) {
            const seed: CloudProfileData = {
              name: profile.name,
              avatar: profile.picture,
              googleId: gid,
              address: { street: "", neighborhood: "", city: "" },
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

        // Modo local
        const existing = users.find((u) => u.email.toLowerCase() === emailLc);
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
          address: { street: "", neighborhood: "", city: "" },
          preference: "entrega",
          pets: [],
          createdAt: Date.now(),
        };
        setUsers((prev) => [...prev, newUser]);
        setCurrentUserId(newUser.id);
        return { ok: true };
      },

      logout: () => setCurrentUserId(null),

      resetPassword: (email, newPassword) => {
        const found = users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!found) return { ok: false, error: "Nenhuma conta com esse e-mail." };
        if (newPassword.length < 6) return { ok: false, error: "A senha deve ter pelo menos 6 caracteres." };
        setUsers((prev) =>
          prev.map((u) => (u.id === found.id ? { ...u, password: newPassword } : u)),
        );
        // Sincroniza a nova senha como segredo na nuvem (melhor esforço).
        if (isCloudEnabled) {
          cloudSave(found.email, newPassword, toCloud(found)).catch(() => {});
        }
        return { ok: true };
      },

      updateProfile: (data) => mutateCurrent((u) => ({ ...u, ...data })),

      addPet: (pet) =>
        mutateCurrent((u) => ({
          ...u,
          pets: [...u.pets, { ...pet, id: uid("pet-") }],
        })),
      updatePet: (id, data) =>
        mutateCurrent((u) => ({
          ...u,
          pets: u.pets.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      removePet: (id) =>
        mutateCurrent((u) => ({
          ...u,
          pets: u.pets.filter((p) => p.id !== id),
        })),

      adminLogin: (email, password) => {
        if (
          email.trim().toLowerCase() === site.admin.email &&
          password === site.admin.password
        ) {
          setIsAdmin(true);
          return { ok: true };
        }
        return { ok: false, error: "Credenciais administrativas inválidas." };
      },
      adminLogout: () => setIsAdmin(false),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, users, isAdmin, currentUserId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
