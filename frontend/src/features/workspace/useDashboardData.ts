import { useCallback, useEffect, useState } from "react";
import { fetchBackendHealth, fetchSession, fetchVersions, login } from "../../lib/api";
import { createDashboardSummary, type DashboardSummary } from "./dashboardModel";

export interface DashboardDataState {
  loading: boolean;
  authenticated: boolean;
  summary: DashboardSummary | null;
  error: string | null;
  loginError: string | null;
  loginPending: boolean;
  reload: () => void;
  login: (username: string, password: string) => Promise<void>;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "无法加载工作台数据";
}

export function useDashboardData(): DashboardDataState {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const session = await fetchSession();
        if (cancelled) {
          return;
        }
        if (!session.authenticated) {
          setAuthenticated(false);
          setSummary(null);
          return;
        }

        const [health, versions] = await Promise.all([fetchBackendHealth(), fetchVersions()]);
        if (cancelled) {
          return;
        }
        setAuthenticated(true);
        setSummary(createDashboardSummary({ session, health, versions, refreshedAt: new Date() }));
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setSummary(null);
        setError(errorMessage(loadError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const submitLogin = useCallback(async (username: string, password: string) => {
    setLoginPending(true);
    setLoginError(null);
    try {
      await login(username.trim(), password);
      setAuthenticated(true);
      reload();
    } catch (submitError) {
      setLoginError(errorMessage(submitError));
    } finally {
      setLoginPending(false);
    }
  }, [reload]);

  return { loading, authenticated, summary, error, loginError, loginPending, reload, login: submitLogin };
}
