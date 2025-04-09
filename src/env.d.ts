/// <reference types="astro/client" />
type KVNamespace = import("@cloudflare/workers-types").KVNamespace;
type ENV = {
  TOKEN_USAGE: KVNamespace;
};
type Runtime = import("@astrojs/cloudflare").AdvancedRuntime<ENV>;
declare namespace App {
  interface Locals {
    runtime: Runtime;
  }
}
