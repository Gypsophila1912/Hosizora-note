import { registerRootComponent } from "expo";
import Navigation from "./navigation";

export default function App() {
  return <Navigation />;
}
registerRootComponent(App);
