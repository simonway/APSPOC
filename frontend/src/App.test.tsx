import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { fetchBackendHealth, fetchSession, fetchVersions, login } from "./lib/api";

vi.mock("./lib/api", async () => {
  return {
    fetchBackendHealth: vi.fn(),
    fetchSession: vi.fn(),
    fetchVersions: vi.fn(),
    login: vi.fn(),
    resolveLegacyUiUrl: vi.fn(() => "http://127.0.0.1:8081/"),
  };
});

const mockedFetchSession = vi.mocked(fetchSession);
const mockedFetchBackendHealth = vi.mocked(fetchBackendHealth);
const mockedFetchVersions = vi.mocked(fetchVersions);
const mockedLogin = vi.mocked(login);

const version = {
  versionId: "v1",
  versionName: "Snow Beer dashboard baseline",
  status: "RELEASED",
  triggerType: "SAMPLE",
  scenarioDescription: "baseline",
  createdAt: "2026-06-11T08:00:00Z",
  createdBy: "admin",
  publishedAt: "2026-06-11T09:00:00Z",
  releaseNote: "published",
  totalWeightedTardiness: 0,
  totalMakespan: 480,
  lateTaskCount: 0,
  averageUtilization: 0.7,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedFetchSession.mockResolvedValue({ authenticated: true, username: "admin", role: "ADMIN" });
  mockedFetchBackendHealth.mockResolvedValue({
    service: "aps-poc-backend",
    status: "UP",
    timestamp: "2026-06-12T00:00:00Z",
  });
  mockedFetchVersions.mockResolvedValue([version]);
  mockedLogin.mockResolvedValue({ authenticated: true, username: "admin", role: "ADMIN" });
});

describe("App", () => {
  it("renders the enterprise workbench shell with live backend summary data", async () => {
    render(<App />);

    expect(screen.getByText("正在连接 APS 后端...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "智能排产工作台" })).toBeInTheDocument();
    expect(screen.getByText("Snow Beer dashboard baseline")).toBeInTheDocument();
    expect(screen.getByText("后端 UP")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "旧版控制台" })).toHaveAttribute("href", "http://127.0.0.1:8081/");
    expect(screen.getByRole("navigation", { name: "顶部模块导航" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "首页" })).toBeInTheDocument();
    expect(screen.getByLabelText("主模块导航")).toHaveClass("left-nav-rail");
    const overviewCard = screen.getByLabelText("用户消息和计划概览");
    expect(overviewCard).toBeInTheDocument();
    expect(overviewCard).toHaveClass("message-card-compact");
    expect(screen.getByRole("heading", { name: "智能排产工作台" })).toHaveClass("workspace-title-compact");
    expect(overviewCard).toContainElement(screen.getByText("待排程任务"));
    expect(overviewCard).toContainElement(screen.getByText("排程通知"));
    expect(overviewCard).toContainElement(screen.getByText("预警 / 冲突"));
    expect(screen.getByRole("link", { name: "导入样本" })).toHaveAttribute("href", "http://127.0.0.1:8081/");
    expect(screen.getByRole("link", { name: "生成场景" })).toHaveAttribute("href", "http://127.0.0.1:8081/");
    expect(screen.getByRole("link", { name: "运行排程" })).toHaveAttribute("href", "http://127.0.0.1:8081/");
    expect(screen.getByRole("link", { name: "查看 Gantt" })).toHaveAttribute("href", "http://127.0.0.1:8081/");
    expect(screen.getByRole("link", { name: "版本发布" })).toHaveAttribute("href", "http://127.0.0.1:8081/");
    expect(screen.getByLabelText("工作台右侧信息栏")).toHaveClass("dashboard-side-column");

    await waitFor(() => {
      expect(mockedFetchSession).toHaveBeenCalledTimes(1);
      expect(mockedFetchBackendHealth).toHaveBeenCalledTimes(1);
      expect(mockedFetchVersions).toHaveBeenCalledTimes(1);
    });
  });

  it("shows login form and does not request protected version data when no session exists", async () => {
    mockedFetchSession.mockResolvedValueOnce({ authenticated: false, username: null, role: null });

    render(<App />);

    expect(await screen.findByRole("heading", { name: "登录 APS高级排程工作台" })).toBeInTheDocument();
    expect(screen.getByLabelText("APS高级排程")).toBeInTheDocument();
    expect(screen.getByLabelText("用户名")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(mockedFetchVersions).not.toHaveBeenCalled();
  });

  it("loads dashboard data after successful login", async () => {
    mockedFetchSession.mockResolvedValueOnce({ authenticated: false, username: null, role: null });

    render(<App />);

    await userEvent.type(await screen.findByLabelText("用户名"), "admin");
    await userEvent.type(screen.getByLabelText("密码"), "admin123");
    await userEvent.click(screen.getByRole("button", { name: "进入工作台" }));

    expect(mockedLogin).toHaveBeenCalledWith("admin", "admin123");
    expect(await screen.findByRole("heading", { name: "智能排产工作台" })).toBeInTheDocument();
    expect(screen.getByText("Snow Beer dashboard baseline")).toBeInTheDocument();
  });

  it("shows a clear unavailable state when dashboard APIs fail", async () => {
    mockedFetchVersions.mockRejectedValueOnce(new Error("Authentication required"));

    render(<App />);

    expect(await screen.findByText("工作台数据暂不可用")).toBeInTheDocument();
    expect(screen.getByText("Authentication required")).toBeInTheDocument();
  });
});
