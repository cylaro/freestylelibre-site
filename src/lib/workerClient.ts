export type WorkerResponse<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: boolean;
  error?: string;
} & T;

const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;

export async function callWorker<T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
  token: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  body?: Record<string, unknown>
): Promise<WorkerResponse<T>> {
  if (!workerUrl) {
    throw new Error("WORKER_URL_NOT_SET");
  }
  const res = await fetch(`${workerUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as WorkerResponse<T>;
  if (!res.ok) {
    throw new Error(data.error || "Worker request failed");
  }
  return data;
}
