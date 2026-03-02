type ScrollBehaviorMode = "auto" | "smooth";

function getMainNavHeight() {
  if (typeof document === "undefined") return 0;
  const nav = document.querySelector<HTMLElement>("[data-main-nav='true']");
  return nav ? nav.getBoundingClientRect().height : 0;
}

function getAnchorOffset() {
  const navHeight = getMainNavHeight();
  const extra = typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 22;
  return navHeight + extra;
}

export function scrollToAnchor(anchorId: string, behavior: ScrollBehaviorMode = "smooth") {
  if (typeof window === "undefined") return false;
  const target = document.getElementById(anchorId);
  if (!target) return false;

  const offset = getAnchorOffset();
  const y = window.scrollY + target.getBoundingClientRect().top - offset;
  window.scrollTo({ top: Math.max(0, y), behavior });
  return true;
}

export function scrollToAnchorWithRetry(
  anchorId: string,
  behavior: ScrollBehaviorMode = "smooth",
  attempts = 12,
  delayMs = 90
) {
  let tries = 0;
  const tick = () => {
    const done = scrollToAnchor(anchorId, tries === 0 ? behavior : "auto");
    if (done) return;
    if (tries >= attempts) return;
    tries += 1;
    window.setTimeout(tick, delayMs);
  };
  tick();
}

export function scrollToHashWithRetry(hash: string, behavior: ScrollBehaviorMode = "smooth") {
  const id = hash.replace(/^#/, "").trim();
  if (!id) return;
  scrollToAnchorWithRetry(id, behavior);
}
