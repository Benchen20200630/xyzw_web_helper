/**
 * XYZW 游戏自动化后端 - Express + Supabase + Render
 * 支持定时任务执行，自动连接游戏服务器
 */
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import { GameClient } from "./lib/gameClient.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ==================== Supabase 客户端 ====================
const supabase = createClient(
 process.env.SUPABASE_URL,
 process.env.SUPABASE_KEY
);

// ==================== 任务定义 ====================
const TASK_DEFINITIONS = {
 signIn: { name: "签到", commands: [{ cmd: "system_signinreward", params: {} }] },
 claimHangup: { name: "领取挂机奖励", commands: [{ cmd: "system_claimhangupreward", params: {} }] },
 claimDaily: { name: "领取日常奖励", commands: [{ cmd: "task_claimdailyreward", params: { rewardId: 0 } }] },
 claimDailyPoint: { name: "领取每日积分", commands: [{ cmd: "task_claimdailypoint", params: { taskId: 1 } }] },
 climbTower: { name: "爬塔领奖励", commands: [{ cmd: "tower_getinfo", params: {} }, { cmd: "tower_claimreward", params: {} }] },
 climbWeirdTower: { name: "怪异塔", commands: [{ cmd: "evotower_getinfo", params: {} }, { cmd: "evotower_claimreward", params: {} }] },
 arenaFight: { name: "竞技场", commands: [{ cmd: "arena_startarea", params: {} }, { cmd: "arena_getareatarget", params: { refresh: false } }] },
 claimMail: { name: "领取邮件附件", commands: [{ cmd: "mail_claimallattachment", params: { category: 0 } }] },
 claimCar: { name: "领取车辆", commands: [{ cmd: "car_getrolecar", params: {} }] },
 refreshCar: { name: "刷新车辆", commands: [{ cmd: "car_refresh", params: {} }] },
 legacyHangup: { name: "功法挂机", commands: [{ cmd: "legacy_getinfo", params: {} }, { cmd: "legacy_claimhangup", params: {} }] },
 heroRecruit: { name: "武将招募", commands: [{ cmd: "hero_recruit", params: { byClub: false, recruitNumber: 1, recruitType: 3 } }] },
 studyGame: { name: "学习问答", commands: [{ cmd: "study_startgame", params: {} }] },
 genieSweep: { name: "灯神", commands: [{ cmd: "genie_sweep", params: { genieId: 1 } }] },
 openBox: { name: "开箱", commands: [{ cmd: "item_openbox", params: { itemId: 2001, number: 10 } }] },
 legionSignIn: { name: "军团签到", commands: [{ cmd: "legion_getinfo", params: {} }, { cmd: "legion_signin", params: {} }] },
 bossTower: { name: "咸王宝库", commands: [{ cmd: "bosstower_getinfo", params: {} }, { cmd: "bosstower_startboss", params: {} }, { cmd: "bosstower_startbox", params: {} }] },
 mergeBox: { name: "合并魔盒", commands: [{ cmd: "mergebox_getinfo", params: {} }, { cmd: "mergebox_claimfreeenergy", params: {} }, { cmd: "mergebox_openbox", params: {} }] },
 dailyBundle: { name: "一键日常", commands: [
 { cmd: "system_signinreward", params: {} },
 { cmd: "system_claimhangupreward", params: {} },
 { cmd: "task_claimdailyreward", params: { rewardId: 0 } },
 { cmd: "tower_getinfo", params: {} },
 { cmd: "tower_claimreward", params: {} },
 { cmd: "mail_claimallattachment", params: { category: 0 } },
 { cmd: "legacy_getinfo", params: {} },
 { cmd: "legacy_claimhangup", params: {} },
 ]},
};

// ==================== 日志存储 ====================
const LOG_MAX = 500;
const logs = [];

function addLog(level, category, message, meta = {}) {
 const entry = { ts: new Date().toISOString(), level, category, message, ...meta };
 logs.unshift(entry);
 if (logs.length > LOG_MAX) logs.pop();
 console.log(`[${level}] [${category}] ${message}`, meta);
}

// ==================== Token 加载 ====================
async function loadTokens() {
 const { data, error } = await supabase.from("tokens").select("*").eq("enabled", true);
 if (error) {
 addLog("ERROR", "supabase", "加载tokens失败", { error: error.message });
 return [];
 }
 addLog("INFO", "supabase", `加载${data?.length || 0}个tokens`);
 return data || [];
}

// ==================== 任务执行引擎 ====================
async function executeTask(task) {
 addLog("INFO", "task", `开始执行任务: ${task.name}`, { taskId: task.id });

 let tokenIds = task.token_ids;
 if (typeof tokenIds === "string") {
 try { tokenIds = JSON.parse(tokenIds); } catch { tokenIds = []; }
 }
 if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
 addLog("WARN", "task", "没有选中的token，跳过", { taskId: task.id });
 return;
 }

 const taskDef = TASK_DEFINITIONS[task.task_type];
 if (!taskDef) {
 addLog("ERROR", "task", `未知task_type: ${task.task_type}`, { taskId: task.id });
 return;
 }

 const allTokens = await loadTokens();
 const targetTokens = allTokens.filter((t) => tokenIds.includes(t.id));
 if (targetTokens.length === 0) {
 addLog("WARN", "task", "没有找到匹配的tokens", { taskId: task.id });
 return;
 }

 addLog("INFO", "task", `将执行于 ${targetTokens.length} 个角色`, { taskId: task.id });

 for (const token of targetTokens) {
 let tokenData;
 try {
 tokenData = typeof token.token === "string" && token.token.startsWith("{")
 ? JSON.parse(token.token)
 : { roleToken: token.token, roleId: token.roleId, sessId: token.sessId, connId: token.connId, isRestore: token.isRestore };
 } catch (err) {
 addLog("ERROR", "task", `Token解析失败: ${token.name}`, { error: err.message });
 continue;
 }

 tokenData.name = token.name;
 const client = new GameClient(tokenData, token.ws_url);

 try {
 await client.connect(15000);
 try {
 await client.sendWithPromise("role_getroleinfo", {}, 8000);
 await sleep(500);
 } catch (e) {
 addLog("WARN", "task", `获取角色信息失败 (${token.name})`, { error: e.message });
 }

 const cmdResults = await client.executeBatch(taskDef.commands, 800);

 for (const r of cmdResults) {
 const logLevel = r.success ? "INFO" : "ERROR";
 addLog(logLevel, "task", `[${token.name}] ${r.cmd}: ${r.success ? "OK" : r.error}`, { taskId: task.id });
 await logToDb(task.id, token.name, r.cmd, r.success ? "success" : "error", r.success ? undefined : r.error);
 }
 } catch (err) {
 addLog("ERROR", "task", `执行失败 (${token.name}): ${err.message}`, { taskId: task.id });
 await logToDb(task.id, token.name, taskDef.name, "error", err.message);
 } finally {
 client.disconnect();
 }
 await sleep(2000);
 }

 await supabase.from("cron_tasks").update({ last_run_at: new Date().toISOString() }).eq("id", task.id);
 addLog("INFO", "task", `任务完成: ${task.name}`, { taskId: task.id });
}

async function logToDb(taskId, tokenName, taskType, status, message) {
 try {
 await supabase.from("task_logs").insert({ task_id: taskId, token_name: tokenName, task_type: taskType, status, message: message || null });
 } catch (e) {
 console.error("写入日志失败:", e.message);
 }
}

// ==================== 定时任务调度 ====================
const cronJobs = new Map();

async function registerAllCrons() {
 for (const job of cronJobs.values()) job.stop();
 cronJobs.clear();

 const { data: tasks } = await supabase.from("cron_tasks").select("*").eq("enabled", true);
 if (!tasks) return;

 for (const task of tasks) {
 registerCron(task);
 }
 addLog("INFO", "cron", `已注册 ${tasks.length} 个定时任务`);
}

function registerCron(task) {
 if (cronJobs.has(task.id)) {
 cronJobs.get(task.id).stop();
 }
 if (!task.enabled || !task.cron_expression) return;

 try {
 const job = cron.schedule(task.cron_expression, () => {
 executeTask(task).catch((err) => {
 addLog("ERROR", "cron", `任务执行异常: ${task.name}`, { error: err.message });
 });
 });
 cronJobs.set(task.id, job);
 addLog("INFO", "cron", `注册定时任务: ${task.name} (${task.cron_expression})`);
 } catch (err) {
 addLog("ERROR", "cron", `注册失败: ${task.name}`, { error: err.message });
 }
}

async function init() {
 addLog("INFO", "server", "服务器启动中...");
 addLog("INFO", "server", `Supabase: ${process.env.SUPABASE_URL}`);

 await registerAllCrons();

 setInterval(async () => {
 addLog("INFO", "cron", "重新加载定时任务配置...");
 await registerAllCrons();
 }, 5 * 60 * 1000);

 addLog("INFO", "server", "服务器就绪");
}

// ==================== API 路由 ====================

app.get("/health", (req, res) => {
 res.json({ status: "ok", time: new Date().toISOString(), activeCrons: cronJobs.size, logsInMemory: logs.length });
});

app.get("/api/tokens", async (req, res) => {
 const { data, error } = await supabase.from("tokens").select("*").order("created_at");
 if (error) return res.status(500).json({ error: error.message });
 res.json(data);
});

app.post("/api/tokens", async (req, res) => {
 const { data, error } = await supabase.from("tokens").insert(req.body).select();
 if (error) return res.status(400).json({ error: error.message });
 res.json(data);
});

app.delete("/api/tokens/:id", async (req, res) => {
 const { error } = await supabase.from("tokens").delete().eq("id", req.params.id);
 if (error) return res.status(400).json({ error: error.message });
 res.json({ ok: true });
});

app.get("/api/tasks", async (req, res) => {
 const { data, error } = await supabase.from("cron_tasks").select("*").order("created_at");
 if (error) return res.status(500).json({ error: error.message });
 res.json(data);
});

app.post("/api/tasks", async (req, res) => {
 const { data, error } = await supabase.from("cron_tasks").insert(req.body).select();
 if (error) return res.status(400).json({ error: error.message });
 if (data?.[0]) registerCron(data[0]);
 res.json(data);
});

app.patch("/api/tasks/:id", async (req, res) => {
 const { data, error } = await supabase.from("cron_tasks").update(req.body).eq("id", req.params.id).select();
 if (error) return res.status(400).json({ error: error.message });
 await registerAllCrons();
 res.json(data);
});

app.delete("/api/tasks/:id", async (req, res) => {
 const { error } = await supabase.from("cron_tasks").delete().eq("id", req.params.id);
 if (error) return res.status(400).json({ error: error.message });
 await registerAllCrons();
 res.json({ ok: true });
});

app.post("/api/tasks/:id/run", async (req, res) => {
 const { data: task } = await supabase.from("cron_tasks").select("*").eq("id", req.params.id).single();
 if (!task) return res.status(404).json({ error: "任务不存在" });
 executeTask(task).catch((err) => addLog("ERROR", "api", `手动执行失败: ${err.message}`));
 res.json({ status: "running", task: task.name });
});

app.get("/api/logs", (req, res) => {
 const limit = Math.min(parseInt(req.query.limit) || 100, LOG_MAX);
 res.json(logs.slice(0, limit));
});

app.get("/api/logs/db", async (req, res) => {
 const limit = Math.min(parseInt(req.query.limit) || 100, 500);
 const { data, error } = await supabase.from("task_logs").select("*").order("created_at", { ascending: false }).limit(limit);
 if (error) return res.status(500).json({ error: error.message });
 res.json(data);
});

app.get("/api/task-definitions", (req, res) => {
 const list = Object.entries(TASK_DEFINITIONS).map(([key, val]) => ({ key, name: val.name, commands: val.commands.map((c) => c.cmd) }));
 res.json(list);
});

...(truncated)...
