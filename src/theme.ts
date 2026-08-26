import { createTheme, rem } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "clubBlue",
  colors: {
    clubBlue: [
      "#eef6ff",
      "#d9eaff",
      "#bcd9ff",
      "#8fc0ff",
      "#5ba2f8",
      "#3787eb",
      "#2471d5",
      "#205eb0",
      "#204f8b",
      "#1d436f",
    ],
  },
  defaultRadius: "md",
  fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  headings: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
    fontWeight: "650",
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Paper: {
      defaultProps: {
        radius: "lg",
      },
    },
    Modal: {
      defaultProps: {
        radius: "lg",
      },
      styles: {
        title: {
          fontSize: "var(--mantine-h3-font-size)",
          fontWeight: 650,
          lineHeight: "var(--mantine-h3-line-height)",
        },
      },
    },
  },
  cursorType: "pointer",
  focusRing: "auto",
  respectReducedMotion: true,
  scale: 1,
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  },
});
