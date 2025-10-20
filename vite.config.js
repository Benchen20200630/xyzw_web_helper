import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from 'path'
import { fileURLToPath } from 'url'
//
import { ArcoResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import useAutoImport from "unplugin-auto-import/vite";
import router from "unplugin-vue-router/vite";
import UnoCSS from "unocss/vite";
import vueDevTools from "vite-plugin-vue-devtools";
// @intlify/unplugin-vue-i18n
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  plugins: [
    {
      ...router({
        routesFolder: "src/views",
        logs: true,
        exclude: ["**/components/**", "**/test**.vue", "**/**Modal.vue"],
        importMode: "async",
        dts: "dist/types/router.d.ts",
      }),
      enforce: "pre",
    },
    vue(),
    vueDevTools(),
    basicSsl(),
    UnoCSS(),
    useAutoImport({
      imports: ['vue', 'vue-router', 'vue-i18n'],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      dirs: ["src/components"],
      resolvers: [ArcoResolver({
        importStyle: false
      })],
    }),
    VueI18nPlugin({
      /* options */
      module: 'vue-i18n',
      // locale messages resource pre-compile option
      include: path.resolve(__dirname, './src/locales/**'),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@views': path.resolve(__dirname, 'src/views'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@stores': path.resolve(__dirname, 'src/stores')
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/styles/variables.scss" as vars;'
      }
    }
  }
})