// Polyfill Request/Response/Headers for jsdom
if (typeof globalThis.Request === "undefined") {
  (globalThis as any).Request = class Request {
    url: string;
    method: string;
    headers: any;
    body: any;
    constructor(input: string | Request, init?: any) {
      this.url = typeof input === "string" ? input : input.url;
      this.method = init?.method || "GET";
      this.headers = init?.headers || {};
      this.body = init?.body || null;
    }
    json() {
      return Promise.resolve(JSON.parse(this.body || "{}"));
    }
  };
}

if (typeof globalThis.Response === "undefined") {
  (globalThis as any).Response = class Response {
    body: any;
    status: number;
    headers: any;
    constructor(body?: any, init?: any) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = init?.headers || {};
    }
    json() {
      return Promise.resolve(this.body);
    }
  };
}
