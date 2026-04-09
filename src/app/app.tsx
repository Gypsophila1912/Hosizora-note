import { registerRootComponent } from "expo";
import Navigation from "../navigation";
import "../features/Chat/store/chatEvents";

export default function App() {
  return <Navigation />;
}
registerRootComponent(App);
