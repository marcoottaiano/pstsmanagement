import confetti from "canvas-confetti";

export function celebrateFromElement(element: HTMLElement): void {
  const bounds = element.getBoundingClientRect();
  const origin = {
    x: (bounds.left + bounds.width / 2) / window.innerWidth,
    y: (bounds.top + bounds.height / 2) / window.innerHeight,
  };

  void confetti({
    particleCount: 70,
    spread: 55,
    startVelocity: 26,
    scalar: 0.8,
    origin,
    colors: ["#12b886", "#228be6", "#fab005", "#f06595"],
  });
}
