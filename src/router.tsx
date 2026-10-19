import { createBrowserRouter } from "react-router";
import Login from "./pages/login";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  //   { path: "/login" },
]);

export { router };
