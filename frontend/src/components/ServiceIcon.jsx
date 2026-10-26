import { serviceIcons } from "./serviceIcons";

export default function ServiceIcon({ name, className }) {
  return <img className={className} src={serviceIcons[name] || serviceIcons["C1.png"]} alt="" aria-hidden="true" />;
}
