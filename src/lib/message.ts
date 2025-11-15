export type MsgExportRules = {
  filename: string;
  json: string;
};

const messageMap = {
  "export-rules": {} as MsgExportRules,
  ping: undefined,
};

type MessageMap = typeof messageMap;

type MsgCommand = keyof MessageMap;
type MsgPayload = MessageMap[MsgCommand];

export type AppMessage = {
  [C in MsgCommand]: {
    command: C;
    payload: MessageMap[C];
  };
}[MsgCommand];

export type Ok<T = unknown> = { ok: true; data?: T };
export type Err = { ok: false; error: string };
export type AppResponse<T = unknown> = Ok<T> | Err;

type Handler<C extends MsgCommand, R = unknown> = (
  payload: MessageMap[C],
  sender: chrome.runtime.MessageSender
) => Promise<AppResponse<R>> | AppResponse<R>;

/** 内部 cast 用の handler 型 */
type HandlerAny<R = unknown> = (
  payload: MsgPayload,
  sender: chrome.runtime.MessageSender
) => Promise<AppResponse<R>> | AppResponse<R>;

const routes: Partial<Record<MsgCommand, HandlerAny>> = {};
export const registerHandler = <C extends MsgCommand, R = unknown>(
  command: C,
  handler: Handler<C, R>
) => {
  routes[command] = handler as HandlerAny<R>;
};

export const attachMessageListener = () => {
  if ((globalThis as any).__APP_MSG_ATTACHED__) return;
  chrome.runtime.onMessage.addListener(
    (msg: AppMessage, sender, sendResponse) => {
      (async () => {
        try {
          const route = routes[msg.command];
          if (!route)
            return sendResponse({
              ok: false,
              error: `No handler for ${msg.command}`,
            });
          const res = await route(msg.payload, sender);
          sendResponse(res ?? { ok: true });
        } catch (e: any) {
          sendResponse({ ok: false, error: String(e?.message ?? e) });
        }
      })();
      return true;
    }
  );
  (globalThis as any).__APP_MSG_ATTACHED__ = true;
};

export const sendMessage = async <R = unknown>(
  msg: AppMessage,
  timeoutMs = 8000
): Promise<AppResponse<R>> => {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Message timeout")), timeoutMs)
  );
  try {
    const res = (await Promise.race([
      chrome.runtime.sendMessage(msg),
      timer,
    ])) as AppResponse<R>;
    if (!res || typeof res !== "object" || !("ok" in res)) {
      return { ok: false, error: "Invalid response" };
    }
    return res;
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
};
