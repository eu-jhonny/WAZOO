import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { STORAGE_KEYS, site } from "@/config/site";
import { seedUsers } from "@/data/users";
import { uid } from "@/lib/format";
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

  register: (data: RegisterInput) => AuthResult;
  login: (email: string, password: string) => AuthResult;
  loginWithGoogle: (profile: GoogleProfile) => AuthResult;
  logout: () => void;
  updateProfile: (data: Partial<Omit<User, "id" | "pets">>) => void;

  addPet: (pet: Omit<Pet, "id">) => void;
  updatePet: (id: string, data: Partial<Pet>) => void;
  removePet: (id: string) => void;

  adminLogin: (email: string, password: string) => AuthResult;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  /** Aplica uma transformação ao usuário atual dentro da lista. */
  const mutateCurrent = (fn: (u: User) => User) => {
    if (!currentUserId) return;
    setUsers((prev) => prev.map((u) => (u.id === currentUserId ? fn(u) : u)));
  };

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isLoggedIn: !!user,
      isAdmin,

      register: (data) => {
        const exists = users.some(
          (u) => u.email.toLowerCase() === data.email.toLowerCase()
        );
        if (exists) {
          return { ok: false, error: "Este e-mail já está cadastrado." };
        }
        const newUser: User = {
          ...data,
          id: uid("u-"),
          pets: [],
          createdAt: Date.now(),
        };
        setUsers((prev) => [...prev, newUser]);
        setCurrentUserId(newUser.id);
        return { ok: true };
      },

      login: (email, password) => {
        const found = users.find(
          (u) =>
            u.email.toLowerCase() === email.trim().toLowerCase() &&
            u.password === password
        );
        if (!found) {
          return { ok: false, error: "E-mail ou senha inválidos." };
        }
        setCurrentUserId(found.id);
        return { ok: true };
      },

      loginWithGoogle: (profile) => {
        const email = profile.email.trim().toLowerCase();

        // Verifica se já existe uma conta com esse e-mail
        const existing = users.find((u) => u.email.toLowerCase() === email);
        if (existing) {
          setCurrentUserId(existing.id);
          return { ok: true };
        }

        // Cria nova conta automática com dados do Google
        const newUser: User = {
          id:        uid("u-"),
          name:      profile.name,
          email:     profile.email,
          phone:     "",
          password:  "", // usuário Google não tem senha local
          address:   { street: "", neighborhood: "", city: "" },
          preference: "entrega",
          pets:      [],
          createdAt: Date.now(),
        };
        setUsers((prev) => [...prev, newUser]);
        setCurrentUserId(newUser.id);
        return { ok: true };
      },

      logout: () => setCurrentUserId(null),

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
