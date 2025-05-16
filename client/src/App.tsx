import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "./components/ui/toaster";
import Home from "./pages/home";
import { FilterProvider } from "./context/FilterContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import './App.css';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FilterProvider>
          <Toaster />
          <div className="app">
            <Router />
          </div>
        </FilterProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
