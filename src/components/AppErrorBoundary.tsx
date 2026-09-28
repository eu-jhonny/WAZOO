import React from "react";

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[Wazoo] erro fatal de renderização:", error, info);
  }

  private reloadCleanUi = () => {
    try {
      // Limpa somente caches/estado visual que podem ficar incompatíveis entre versões.
      const safeKeys = [
        "wazoo_notifs_v2",
        "wazoo_notifs_v3",
        "wazoo_custom_logo",
        "wazoo:admin_config:v1",
      ];
      safeKeys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Safari pode bloquear storage em alguns contextos.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#fffaf4",
          color: "#0f2a4a",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ width: "100%", maxWidth: 460, textAlign: "center" }}>
          <div style={{ fontSize: 46 }}>🐾</div>
          <h1 style={{ margin: "12px 0 8px", fontSize: 28 }}>A Wazoo encontrou um erro ao abrir</h1>
          <p style={{ margin: 0, lineHeight: 1.6, color: "#526277" }}>
            Seus dados de conta e carrinho não serão apagados. Vamos limpar apenas o cache visual desta versão.
          </p>
          <button
            type="button"
            onClick={this.reloadCleanUi}
            style={{
              marginTop: 22,
              border: 0,
              borderRadius: 999,
              padding: "13px 22px",
              background: "#ff7a1a",
              color: "white",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Corrigir e recarregar
          </button>
        </div>
      </div>
    );
  }
}
