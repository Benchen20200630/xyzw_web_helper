const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const WebSocket = require('ws');

// ===== 配置 =====
const SUPABASE_URL = '你的Supabase URL';
const SUPABASE_KEY = '你的Supabase anon key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== WebSocket 连接管理 =====
const connections = new Map(); // tokenId -> { ws, token, wsUrl }

function getWebSocketUrl(tokenId) {
 const conn = connections.get(tokenId);
 if (conn && conn.ws.readyState === WebSocket.OPEN) return conn.ws;
 return null;
}

async function connect(tokenId, token, wsUrl) {
 return new Promise((resolve, reject) => {
 const ws = new WebSocket(wsUrl || 'wss://ws.xyzw.com/game');

 const timer = setTimeout(() => {
 ws.close();
 reject(new Error('连接超时'));
 }, 10000);

 ws.on('open', () => {
 clearTimeout(timer);
 connections.set(tokenId, { ws, token, wsUrl });
 // 发送登录握手
 ws.send(JSON.stringify({ cmd: 'auth', token }));
 resolve(ws);
 });

 ws.on('message', (data) => {
 try {
 const msg = JSON.parse(data);
 // 处理消息回调
 handleMessage(tokenId, msg);
 } catch (e) {}
 });

 ws.on('error', (err) => {
 clearTimeout(timer);
 connections.delete(tokenId);
 reject(err);
 });

 ws.on('close', () => connections.delete(tokenId));
 });
}

// ===== 消息回调池 =====
const pendingCallbacks = new Map(); // msgId -> { resolve, reject, timer }

function handleMessage(tokenId, msg) {
 if (msg.id && pendingCallbacks.has(msg.id)) {
 const cb = pendingCallbacks.get(msg.id);
 clearTimeout(cb.timer);
 pendingCallbacks.delete(msg.id);
 cb.resolve(msg);
 }
}

function sendMessage(tokenId, cmd, params = {}) {
 return new Promise(async (resolve, reject) => {
 let conn = getWebSocketUrl(tokenId);
 if (!conn) {
 // 尝试重连一次
 const { data: tok } = await supabase.from('tokens').select('*').eq('id', tokenId).single();
 if (!tok) return reject(new Error('Token不存在'));
 conn = await connect(tokenId, tok.token, tok.ws_url);
 }

 const msgId = Date.now() + Math.random();
 const payload = { cmd, params, id: msgId };

 const timer = setTimeout(() => {
 pendingCallbacks.delete(msgId);
 reject(new Error(`指令 ${cmd} 超时`));
 }, 8000);

 pendingCallbacks.set(msgId, { resolve, reject, timer });
 conn.send(JSON.stringify(payload));
 });
}

// ===== 游戏指令封装（参考 dailyTaskRunner.js）=====
async function executeTask(tokenId, taskName) {
 const tasks = {
 startBatch: async () => {
 // 日常任务核心指令
 await sendMessage(tokenId, 'role_getroleinfo', {});
 await sleep(500);
 await sendMessage(tokenId, 'mail_getmaillist', {});
 await sleep(500);
 await sendMessage(tokenId, 'sign_getsignedinfo', {});
 // ... 其他日常指令（需要参考前端更多协议）
 },
 claimHangUpRewards: async () => {
 await sendMessage(tokenId, 'role_gethanguprewards', {});
 await sleep(500);
 await sendMessage(tokenId, 'role_claimhangup', {});
 },
 climbTower: async () => {
 await sendMessage(tokenId, 'tower_start', { floor: 1 });
 },
 batchFish: async () => {
 await sendMessage(tokenId, 'fish_start', { type: 1 });
 },
 };

 const fn = tasks[taskName];
 if (!fn) return { success: false, error: `未知任务: ${taskName}` };
 try {
 await fn();
 return { success: true };
 } catch (e) {
 return { success: false, error: e.message };
 }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== 定时调度器 =====
async function loadAndRunTasks() {
 const { data: tasks } = await supabase
 .from('cron_tasks')
 .select('*')
 .eq('enabled', true);

 for (const task of tasks || []) {
 const cronExpr = task.cron_expr;
 if (!cron.validate(cronExpr)) continue;
 if (!cron.validate(cronExpr)) continue;

 // 检查是否该执行
 const now = new Date();
 const shouldRun = checkCronMatch(cronExpr, now);
 if (!shouldRun) continue;

 // 记录开始
 console.log(`[${now}] 执行任务: ${task.name}`);

 const results = [];
 for (const tokenId of task.selected_tokens || []) {
 for (const taskName of task.selected_tasks || []) {
 const result = await executeTask(tokenId, taskName);
 results.push({ tokenId, taskName, ...result });
 await sleep(500); // 防频率限制
 }
 }

 // 记录日志
 await supabase.from('task_logs').insert({
 task_id: task.id,
 status: 'completed',
 result: results,
 });

 await supabase.from('cron_tasks').update({ last_run: new Date().toISOString() })
 .eq('id', task.id);
 }
}

// ===== 简化版 cron 比对（每小时跑一次检查）=====
function checkCronMatch(expr, now) {
 // Render 免费版没有精准 cron，这里用简化逻辑
 // expr 格式: "30 5 * * *" 表示每天5:30
 const parts = expr.trim().split(/\s+/);
 if (parts.length < 5) return false;
 const [min, hour] = parts;
 const nowMin = now.getMinutes();
 const nowHour = now.getHours();
 return (min === '*' || parseInt(min) === nowMin)
 && (hour === '*' || parseInt(hour) === nowHour);
}

// 每分钟检查一次
cron.schedule('* * * * *', loadAndRunTasks);

// ===== HTTP API（给前端调用）=====
const http = require('http');
const server = http.createServer(async (req, res) => {
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Content-Type', 'application/json');

 if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

 const url = new URL(req.url, `http://${req.headers.host}`);
 const path = url.pathname;

 try {
 if (path === '/health') {
 res.writeHead(200); res.end(JSON.stringify({ ok: true }));
 } else if (path === '/api/tasks') {
 if (req.method === 'GET') {
 const { data } = await supabase.from('cron_tasks').select('*');
 res.writeHead(200); res.end(JSON.stringify(data));
 } else {
 let body = await readBody(req);
 const item = JSON.parse(body);
 const { data } = await supabase.from('cron_tasks').insert(item).select().single();
 res.writeHead(200); res.end(JSON.stringify(data));
 }
 } else if (path === '/api/tokens') {
 let body = await readBody(req);
 const item = JSON.parse(body);
 const { data } = await supabase.from('tokens').insert(item).select().single();
 res.writeHead(200); res.end(JSON.stringify(data));
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
 loadAndRunTasks(); // 启动时立即检查一次
});
