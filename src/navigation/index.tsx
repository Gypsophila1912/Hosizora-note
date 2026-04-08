import { NavigationContainer } from "@react-navigation/native";
import AppRoutes from "./routes/AppRoutes";

export default function Navigation() {
  return (
    <NavigationContainer>
      <AppRoutes />
    </NavigationContainer>
  );
}
