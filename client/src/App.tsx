import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Loader from "./components/common/Loader";
import { UserProvider } from "../src/context/UserContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import AppRoutes from "./routes/AppRoutes";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
        <UserProvider>
            <RealtimeProvider>
            <BrowserRouter>
            <Suspense fallback={<Loader />}>
                <AppRoutes />
            </Suspense>
            </BrowserRouter>
            </RealtimeProvider>
        <Toaster position="bottom-right" />
        </UserProvider>
    </QueryClientProvider>
  );
};

export default App;