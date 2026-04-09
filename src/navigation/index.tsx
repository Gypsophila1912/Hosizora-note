import { NavigationContainer } from "@react-navigation/native";
//↑画面遷移を管理するためのコンポーネント。ブラウザの役割を持つ。画面移動、戻るボタンの管理、ナビゲーション状態の管理等
import AppRoutes from "./routes/AppRoutes";

export default function Navigation() {
  return (
    <NavigationContainer>
      <AppRoutes />
    </NavigationContainer>
  );
}
