// This inline script sets the color theme before React hydrates so the page does not flash between modes.
export function ThemeScript() {
  const script = `
    (function () {
      try {
        var savedTheme = window.localStorage.getItem("deebo-academy-theme");
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : (prefersDark ? "dark" : "light");
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      } catch (error) {
        document.documentElement.dataset.theme = "dark";
        document.documentElement.style.colorScheme = "dark";
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
