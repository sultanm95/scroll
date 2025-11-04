import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import MangaProfilePage from "./pages/MangaProfilePage";
import MangaReader from "./pages/MangaReader";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/manga/:id",
        element: <MangaProfilePage />
      },
      {
        path: "/reader/:mangaId/:chapter?",
        element: <MangaReader />
      }
    ]
  }
]);