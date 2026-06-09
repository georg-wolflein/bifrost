import type { CoreConfig } from "@/lib/types/config";
import type { VirtualKey } from "@/lib/types/governance";
import type { MCPClient } from "@/lib/types/mcp";
import type { HarnessPlatform, ServerScope } from "./types";

/**
 * Resolve the externally reachable Bifrost base URL used in generated commands/configs.
 * Falls back to the current window origin (normalising the dev port) or a placeholder.
 */
export function getExternalBaseUrl(clientConfig?: CoreConfig): string {
	const configuredURL = clientConfig?.mcp_external_client_url;
	if (configuredURL && !configuredURL.from_env && configuredURL.value?.trim()) {
		return configuredURL.value.trim().replace(/\/+$/, "");
	}
	if (typeof window !== "undefined" && window.location.origin) {
		const { protocol, hostname, port } = window.location;
		const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
		if (isLocalHost && port && port !== "8080") {
			return `${protocol}//${hostname}:8080`;
		}
		return window.location.origin.replace(/\/+$/, "");
	}
	return "<YOUR_BIFROST_URL>";
}

/** Quote a value for safe inclusion in a POSIX shell command. */
export function quoteShellValue(value: string): string {
	if (/^[a-zA-Z0-9_./:@%+=,-]+$/.test(value)) return value;
	return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

/** Quote a value as a TOML basic string. */
export function quoteTomlString(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** UTF-8 safe base64 encoding for the browser (used by the Cursor deeplink). */
export function encodeBase64(value: string): string {
	if (typeof window === "undefined") return "";
	return window.btoa(String.fromCharCode(...new TextEncoder().encode(value)));
}

/** Whether an MCP client is reachable using the given virtual key. */
export function isClientAllowedForVirtualKey(client: MCPClient, virtualKey: VirtualKey): boolean {
	if (client.config.disabled) return false;
	if (client.config.allow_on_all_virtual_keys) return true;
	return client.vk_configs?.some((config) => config.virtual_key_id === virtualKey.id) ?? false;
}

/** Mask a secret value, keeping a short prefix/suffix for recognisability. */
export function maskSecret(value?: string): string {
	if (!value) return "";
	if (value.length <= 12) return "********";
	return `${value.slice(0, 6)}****${value.slice(-4)}`;
}

/** Human-readable label describing how many servers a command registers. */
export function getRegistrationLabel(serverScope: ServerScope, selectedServers: MCPClient[]): string {
	if (serverScope === "selected" && selectedServers.length > 0) {
		return `${selectedServers.length} ${selectedServers.length === 1 ? "server" : "servers"}`;
	}
	return "bifrost";
}

/** The registration name used for the generated MCP server entry. */
export function getRegistrationName(selectedServers?: MCPClient[]): string {
	return selectedServers?.length === 1 ? selectedServers[0].config.name : "bifrost";
}

/** Comma-joined list of selected server names, or undefined when none are selected. */
export function getIncludeClients(selectedServers?: MCPClient[]): string | undefined {
	if (!selectedServers?.length) return undefined;
	return selectedServers.map((server) => server.config.name).join(",");
}

export function getUserHomePrefix(platform: HarnessPlatform): string {
	return platform === "windows" ? "%USERPROFILE%" : "~";
}
