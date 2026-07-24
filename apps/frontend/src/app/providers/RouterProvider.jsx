import { RouterProvider as ReactRouterProvider } from "react-router-dom";

import router from "@/app/router";

const RouterProvider = () => {
  return <ReactRouterProvider router={router} />;
};

export default RouterProvider;