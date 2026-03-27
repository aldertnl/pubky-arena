// Stub for next/server in browser test environment.
// The real next/server uses __dirname which doesn't exist in browser context.
export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  }

  static redirect(url: string | URL, status = 307) {
    return new Response(null, {
      status,
      headers: { Location: typeof url === 'string' ? url : url.toString() },
    });
  }
}

export class NextRequest extends Request {}
