import confetti from "canvas-confetti";

export function celebrateFromElement(element: HTMLElement): void {
  requestAnimationFrame(() => {
    const icon = element.querySelector("svg");
    void element
      .animate(
        [
          { transform: "scale(0.9)" },
          { transform: "scale(1.12)", offset: 0.55 },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
      )
      .finished.catch(() => undefined);

    if (icon) {
      void icon
        .animate(
          [
            { opacity: 0.25, transform: "scale(0.55) rotate(-12deg)" },
            { opacity: 1, transform: "scale(1.18) rotate(4deg)", offset: 0.65 },
            { opacity: 1, transform: "scale(1) rotate(0deg)" },
          ],
          { duration: 420, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        )
        .finished.catch(() => undefined);
    }
  });

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
