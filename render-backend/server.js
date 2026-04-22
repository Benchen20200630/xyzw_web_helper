import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import { GameClient } from './lib/gameClient.js';
import http from 'http';

// ===== 配置 =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== 游戏客户端实例池 =====
const gameClients = new Map(); // tokenId -> GameClient

function getClient(tokenId) {
 return gameClients.get(tokenId);
}

async function getOrCreateClient(tokenId) {
 let client = gameClients.get(tokenId);
 if (client) return client;

 // 从数据库取 token 配置
 const { data: tok } = await supabase
 .from('tokens')
 .select('*')
 .eq('id', tokenId)
 .single();

 if (!tok) throw new Error(`Token ${tokenId} 不存在`);

 const tokenData = typeof tok.token === 'string' ? JSON.parse(tok.token) : tok.token;
 client = new GameClient(tokenData, tok.ws_url || null);
 gameClients.set(tokenId, client);
 return client;
}

// ===== 定时调度器 =====
async function loadAndRunTasks() {
 const { data: tasks } = await supabase
 .from('cron_tasks')
 .select('*')
 .eq('enabled', true);

 for (const task of tasks || []) {
 const cronExpr = task.cron_expr;
 if (!cron.validate(cronExpr)) continue;

 const now = new Date();
 if (!checkCronMatch(cronExpr, now)) continue;

 console.log(`[${now.toISOString()}] 执行任务: ${task.name}`);

 const results = [];
 for (const tokenId of task.selected_tokens || []) {
 for (const taskName of task.selected_tasks || []) {
 try {
 const client = await getOrCreateClient(tokenId);
 await client.connect();
 let result;
 switch (taskName) {
 case 'sign': result = await client.signIn(); break;
 case 'hangup': result = await client.claimHangUp(); break;
 case 'tower': result = await client.climbTower(); break;
 case 'getinfo': result = await client.getRoleInfo(); break;
 default: result = { error: `未知任务: ${taskName}` };
 }
 results.push({ tokenId, taskName, ...result });
 } catch (e) {
 results.push({ tokenId, taskName, error: e.message });
 }
 await sleep(500);
 }
 }

 await supabase.from('task_logs').insert({
 task_id: task.id, status: 'completed', result: JSON.stringify(results),
 });
 await supabase.from('cron_tasks')
 .update({ last_run: now.toISOString() })
 .eq('id', task.id);
 }
}

function checkCronMatch(expr, now) {
 const parts = expr.trim().split(/\s+/);
 if (parts.length < 5) return false;
 const [min, hour] = parts;
 return (min === '*' || parseInt(min) === now.getMinutes())
 && (hour === '*' || parseInt(hour) === now.getHours());
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Render 免费版：每小时检查一次
cron.schedule('0 * * * *', loadAndRunTasks);

// ===== HTTP API =====
const server = http.createServer(async (req, res) => {
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Content-Type', 'application/json');

 if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

 const url = new URL(req.url, `http://${req.headers.host}`);
 const path = url.pathname;

 try {
 if (path === '/health') {
 res.writeHead(200);
 res.end(JSON.stringify({
 status: 'ok', timestamp: new Date().toISOString(),
 service: 'xyzw-backend', uptime: process.uptime(),
 }));

 } else if (path === '/api/tasks') {
 const { data } = await supabase.from('cron_tasks').select('*');
 res.writeHead(200); res.end(JSON.stringify(data));

 } else if (path === '/api/game/connect') {
 const tokenId = parseInt(url.searchParams.get('tokenId'));
 if (!tokenId) { res.writeHead(400); res.end(JSON.stringify({ error: 'tokenId required' })); return; }
 const client = await getOrCreateClient(tokenId);
 await client.connect();
 res.writeHead(200); res.end(JSON.stringify({ success: true, tokenId }));

 } else if (path === '/api/game/send') {
 const tokenId = parseInt(url.searchParams.get('tokenId'));
 const cmd = url.searchParams.get('cmd');
 if (!tokenId || !cmd) { res.writeHead(400); res.end(JSON.stringify({ error: 'tokenId and cmd required' })); return; }
 const client = await getOrCreateClient(tokenId);
 await client.connect();
 const result = await client.sendAndWait(cmd);
 res.writeHead(200); res.end(JSON.stringify({ success: true, cmd, data: result }));

 } else {
 res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' }));
 }
 } catch (e) {
 res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
 }
});

function readBody(req) {
 return new Promise((resolve, reject) => {
 let d = '';
 req.on('data', c => d += c);
 req.on('end', () => resolve(d));
 req.on('error', reject);
 });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
 console.log(`服务启动，监听端口 ${PORT}`);
 loadAndRunTasks();
});
