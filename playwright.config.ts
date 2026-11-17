import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'./tests',timeout:60000,use:{baseURL:'http://127.0.0.1:5175',channel:'msedge',headless:true},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5175',url:'http://127.0.0.1:5175',reuseExistingServer:true},projects:[{name:'desktop',use:{...devices['Desktop Edge']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}]});

