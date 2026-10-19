import { createBrowserRouter } from "react-router";
import Login from "./pages/login";
import Chat from "./pages/chat";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/chat", element: <Chat /> },
  //   { path: "/login" },
]);

export { router };
