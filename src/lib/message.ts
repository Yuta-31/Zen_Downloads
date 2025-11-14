export type MsgExportRules = {
  type: "export-rules";
  filename: string;
  json: string;
}

export type MsgPing = { type: "ping" }

export type AppMessage = 
  | MsgExportRules
  | MsgPing

export type Ok<T = unknown> = { ok: true, data?: T }
export type Err = { ok: false; error: string }
export type AppResponse<T = unknown> = Ok<T> | Err


export const sendMessage = async <R = unknown>(
  msg: AppMessage,
  timeoutMs = 8000,
): Promise<AppResponse<R>> => {
  const timer = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error("Message timeout")), timeoutMs));
  try {
    const res = (await Promise.race([
      chrome.runtime.sendMessage(msg),
      timer,
    ])) as AppResponse<R>;
    if (!res || typeof res !== "object" || !("ok" in res)) {
      return { ok: false, error: "Invalid response" };
    }
    return res
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e)}
  }
}

type Handler<T extends AppMessage = AppMessage, R = unknown> = 
  (msg: T, sender: chrome.runtime.MessageSender) => Promise<AppResponse<R>> | AppResponse<R>;

const routes = new Map<AppMessage["type"], Handler>();

export const registerHandler = <T extends AppMessage, R = unknown>(
  type: T["type"],
  handler: Handler<T, R>
) => {
  routes.set(type, handler as Handler);
}

export const attachMessageListener = () => {
  if ((globalThis as any).__APP_MSG_ATTACHED__) return;
  chrome.runtime.onMessage.addListener((msg: AppMessage, sender, sendResponse) => {
    (async () => {
      try {
        const route = routes.get(msg?.type);
        if (!route) return sendResponse({ ok: false, error: `No handler for ${msg?.type}` });
        const res = await route(msg, sender);
        sendResponse(res ?? { ok: true });
      } catch (e: any) {
        sendResponse({ ok: false, error: String(e?.message ?? e )});
      }
    })();
    return true;
  });
  (globalThis as any).__APP_MSG_ATTACHED__ = true;
}