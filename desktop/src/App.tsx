import React from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoadingSpinner } from "./components/common";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Dashboard } from "./pages/Dashboard";
import { EventSelect } from "./pages/EventSelect";
import { FolderScan } from "./pages/FolderScan";
import { Login } from "./pages/Login";
import { ProcessingStatus } from "./pages/ProcessingStatus";
import { Settings } from "./pages/Settings";
import { UploadProgress } from "./pages/UploadProgress";
import { AppProvider, useApp } from "./state/store";

const AppRoutes: React.FC = () => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-base">
        <LoadingSpinner message="Starting SnapFind Desktop..." />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout title="Dashboard">
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/events"
        element={
          <Layout title="Select Destination Event">
            <EventSelect />
          </Layout>
        }
      />
      <Route
        path="/scan"
        element={
          <Layout title="Local Folder Scanner">
            <FolderScan />
          </Layout>
        }
      />
      <Route
        path="/uploads"
        element={
          <Layout title="Batch Upload Queue">
            <UploadProgress />
          </Layout>
        }
      />
      <Route
        path="/processing"
        element={
          <Layout title="Server-Side AI Pipeline">
            <ProcessingStatus />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout title="Application Settings">
            <Settings />
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
