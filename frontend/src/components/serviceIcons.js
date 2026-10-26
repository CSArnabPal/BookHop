const iconSources = Object.entries(
  import.meta.glob("../assets/icons/*.png", { eager: true, import: "default" }),
)
  .sort(([first], [second]) => first.localeCompare(second))
  .map(([path, source]) => [path.split("/").pop(), source]);

export const serviceIcons = Object.fromEntries(iconSources);
export const serviceIconNames = iconSources.map(([name]) => name);
