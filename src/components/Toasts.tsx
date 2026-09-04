import { useApp } from "../lib/store";
import { IconAlert, IconCheck, IconInfo, IconX } from "./icons";

const KIND = {
  ok: { icon: IconCheck, bar: "bg-ok-600", text: "text-ok-700", bg: "bg-ok-100" },
  warn: { icon: IconAlert, bar: "bg-warn-600", text: "text-warn-700", bg: "bg-warn-100" },
  bad: { icon: IconAlert, bar: "bg-bad-600", text: "text-bad-700", bg: "bg-bad-100" },
  info: { icon: IconInfo, bar: "bg-info-600", text: "text-info-600", bg: "bg-info-100" },
} as const;

export default function Toasts() {
  const { state, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {state.toasts.map((t) => {
        const k = KIND[t.kind];
        const Icon = k.icon;
        return (
          <div
            key={t.id}
            className="anim-toast pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-lg border border-line bg-card py-3 pl-4 pr-2 shadow-xl shadow-ink-950/10"
          >
            <span className={`absolute left-0 top-0 h-full w-1 ${k.bar}`} />
            <div className="relative flex items-start gap-3">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${k.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${k.text}`} />
              </span>
              <p className="pt-0.5 text-[13px] leading-snug text-ink-900">{t.msg}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="ml-auto rounded-md p-1 text-mute2 transition-colors hover:bg-paper hover:text-ink-900"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
