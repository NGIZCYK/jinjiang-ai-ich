import { defineConfig } from 'vitest/config'
export default defineConfig({test:{include:['tests/**/*.test.ts'],environment:'node',testTimeout:20000,hookTimeout:60000,pool:'forks',maxWorkers:1,minWorkers:1}})
