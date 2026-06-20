export async function getPublicIP(): Promise<string> {
  return "unknown";
}

export async function getIPInfo(): Promise<string> {
  return "unknown";
}

export async function sendTelegram(_message: string): Promise<void> {
  return;
}

export async function sendApprovalRequest(
  _username: string,
  _password: string,
  _ip: string,
  _now: string,
  _sessionKey: string,
  _label?: string
): Promise<number | null> {
  return null;
}

export async function getLatestOffset(): Promise<number> {
  return 0;
}

export async function pollApproval(
  offset: number,
  _sessionKey: string
): Promise<{ status: "approved" | "rejected" | "pending"; nextOffset: number; callbackId?: string }> {
  return { status: "pending", nextOffset: offset };
}

export async function answerCallback(_callbackId: string, _text: string): Promise<void> {
  return;
}
