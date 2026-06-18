import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, requestJson, resolveApiBaseUrlFromLocation, login } from "./api";

describe("resolveApiBaseUrlFromLocation", () => {
  it("uses backend port 8081 when the frontend is served from 8080", () => {
    expect(
      resolveApiBaseUrlFromLocation({
        protocol: "http:",
        hostname: "127.0.0.1",
        port: "8080",
        origin: "http://127.0.0.1:8080",
      }),
    ).toBe("http://127.0.0.1:8081");
  });

  it("uses an explicit configured base URL without a trailing slash", () => {
    expect(
      resolveApiBaseUrlFromLocation(
        {
          protocol: "http:",
          hostname: "127.0.0.1",
          port: "8080",
          origin: "http://127.0.0.1:8080",
        },
        "http://localhost:9000/",
      ),
    ).toBe("http://localhost:9000");
  });
});

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends credentials and parses JSON responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "UP" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson("/api/v1/health", { baseUrl: "http://api.local" })).resolves.toEqual({ status: "UP" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/health", {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });

  it("throws ApiError with the backend message on failed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    try {
      await requestJson("/api/v1/versions", { baseUrl: "http://api.local" });
      throw new Error("Expected requestJson to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status: 401,
        message: "Authentication required",
      });
    }
  });

  it("posts credentials to the existing login endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true, username: "admin", role: "ADMIN" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(login("admin", "admin123", "http://api.local")).resolves.toEqual({
      authenticated: true,
      username: "admin",
      role: "ADMIN",
    });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", password: "admin123" }),
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    });
  });
});
