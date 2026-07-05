import { Suspense, useEffect } from "react";
import Loader from "../components/common/Loader";

import { type AppRoute } from "./routes.config";

interface RouteWrapperProps {
  component: AppRoute["component"];
  title: AppRoute["title"];
}

const RouteWrapper = ({ component: Component, title }: RouteWrapperProps) => {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  );
};

export default RouteWrapper;