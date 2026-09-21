import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import { buildSync } from "esbuild";

delete process.env.ELECTRON_RUN_AS_NODE;

function preloadPlugin(): Plugin {
  const compilePreload = () => {
    buildSync({
      entryPoints: ["electron/preload.ts"],
      bundle: true,
      platform: "node",
      format: "cjs",
      external: ["electron"],
      outfile: "dist-electron/preload.cjs",
    });
  };

  return {
    name: "vite-plugin-preload",
    buildStart() {
      compilePreload();
    },
    handleHotUpdate({ file, server }) {
      if (file.includes("preload.ts")) {
        compilePreload();
        server.ws.send({ type: "full-reload" });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    preloadPlugin(),
    electron([
      {
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5175,
  },
});
