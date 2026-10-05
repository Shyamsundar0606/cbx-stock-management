const { spawnSync, spawn } = require("node:child_process");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const probe = `const http=require('node:http');const req=http.get('http://127.0.0.1:3000/api/health',res=>{let data='';res.on('data',c=>data+=c);res.on('end',()=>{try{process.exit(JSON.parse(data).status==='ok'?0:2)}catch{process.exit(2)}})});req.on('error',()=>process.exit(1));req.setTimeout(700,()=>{req.destroy();process.exit(1)});`;
let started = false;
exports.ensureApi = () => {
  if (started || process.env.CI) return;
  started = true;
  const result = spawnSync(process.execPath, ["-e", probe], {
    timeout: 1500,
    windowsHide: true,
    stdio: "ignore",
  });
  if (result.status === 0) return;
  if (result.status === 2)
    throw new Error("Le port 3000 est déjà utilisé par un autre service.");
  const root = path.resolve(__dirname, "..");
  const child = spawn(
    process.execPath,
    [
      "--import",
      pathToFileURL(path.join(root, "backend/node_modules/tsx/dist/loader.mjs"))
        .href,
      path.join(root, "backend/src/index.ts"),
    ],
    { cwd: path.join(root, "backend"), stdio: "inherit", windowsHide: true },
  );
  child.on("error", (e) =>
    console.error("Impossible de démarrer l’API:", e.message),
  );
  const stop = () => {
    if (child.pid) child.kill("SIGTERM");
  };
  process.once("exit", stop);
};
