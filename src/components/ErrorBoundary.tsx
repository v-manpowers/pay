import { Component, type ErrorInfo, type ReactNode } from "react";
import { LogoMark } from "./icons";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In a real deployment this would phone home to an observability sink.
    console.error("[switchboard] console fault", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const err = this.state.error;
    return (
      <div className="hatch flex min-h-screen flex-col items-center justify-center bg-ink-950 p-6 text-fog">
        <div className="anim-rise w-full max-w-lg rounded-xl border border-ink-700 bg-ink-900 p-6 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <div>
              <p className="font-display text-lg font-bold text-white">Console fault</p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute2">
                error boundary engaged · session preserved
              </p>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-fog">
            The console hit an unexpected fault and isolated it before it could cascade. Your ledger and
            credentials are persisted locally and were not affected.
          </p>
          <pre className="scroll-dark mt-4 max-h-36 overflow-auto rounded-lg bg-ink-950/80 p-3 font-mono text-[10.5px] leading-relaxed text-bad-100">
            {err.name}: {err.message}
            {"\n"}
            {err.stack?.split("\n").slice(1, 5).join("\n") ?? ""}
          </pre>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="flex-1 rounded-lg border border-ink-700 px-3 py-2.5 text-[13px] font-semibold text-fog transition-colors hover:bg-ink-800 hover:text-white"
            >
              Attempt recovery
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 rounded-lg bg-pine-600 px-3 py-2.5 text-[13px] font-bold text-white shadow-md shadow-pine-600/25 transition-all hover:bg-pine-500 active:translate-y-px"
            >
              Reload console
            </button>
          </div>
        </div>
      </div>
    );
  }
}
