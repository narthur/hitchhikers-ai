/// <reference types="astro/client" />
type ENV = {
  TOKEN_USAGE: KVNamespace;
  ARTICLES: KVNamespace;
};
type Runtime = import("@astrojs/cloudflare").Runtime<ENV>;
declare namespace App {
  interface Locals extends Runtime {}
}
