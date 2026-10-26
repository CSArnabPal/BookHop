const avatarSources = Object.entries(
  import.meta.glob("../assets/avatars/*.png", { eager: true, import: "default" }),
)
  .sort(([first], [second]) => first.localeCompare(second))
  .map(([, source]) => source);

export default function CustomerAvatar({ name, identity }) {
  const avatarKey = identity || name || "customer";
  let hash = 0;
  for (let index = 0; index < avatarKey.length; index += 1) {
    hash = (hash * 31 + avatarKey.charCodeAt(index)) >>> 0;
  }

  return <img className="customer-avatar" src={avatarSources[hash % avatarSources.length]} alt="" aria-hidden="true" />;
}
