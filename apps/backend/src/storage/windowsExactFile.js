const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');
const { pending } = require('../utils/storageNamespace');
let helper;
const executable = () => {
  if (helper) return helper;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'edms-exact-helper-'));
  const binary = path.join(directory, 'exact.exe');
  try {
    // No execution-policy change, download, package install, or elevated helper.
    const windows = process.env.SystemRoot || 'C:\\Windows';
    execFileSync(path.join(windows, 'System32/icacls.exe'), [directory, '/inheritance:r', '/grant:r',
      `${os.userInfo().username}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F'], { windowsHide: true, stdio: 'pipe', timeout: 5000 });
    execFileSync(path.join(windows, 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'), ['/nologo', '/target:exe',
      '/reference:System.Web.Extensions.dll', `/out:${binary}`, path.join(__dirname, 'native/WindowsExactFile.cs')],
    { windowsHide: true, stdio: 'pipe', timeout: 15000 });
  } catch (error) {
    try { fs.unlinkSync(binary); } catch { /* Compilation may not have produced an executable. */ }
    try { fs.rmdirSync(directory); } catch { /* Do not recursively remove compiler output. */ }
    throw Object.assign(pending('LOCAL_SAFE_DELETE_UNAVAILABLE'), { cause: error });
  }
  helper = binary;
  process.once('exit', () => { try { fs.unlinkSync(binary); fs.rmdirSync(directory); } catch { /* Retain only this private helper on busy shutdown. */ } });
  return helper;
};

// The helper pins ancestor and file handles. A timeout after DELETE is UNKNOWN,
// never proof that the file survived or that cleanup can safely be retried.
const operate = (root, key, expected, onPinned, kind = 'file') => new Promise((resolve, reject) => {
  if (process.platform !== 'win32') { reject(pending('LOCAL_SAFE_DELETE_UNAVAILABLE')); return; }
  let binary;
  try { binary = executable(); } catch (error) { reject(error); return; }
  const child = spawn(binary, [],
    { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let snapshot; let complete = false; let failure; let deleteSent = false;
  const timeout = setTimeout(() => { failure = pending('LOCAL_HELPER_TIMEOUT'); child.kill(); }, 15000);
  const lines = readline.createInterface({ input: child.stdout });
  child.stderr.resume();
  child.stdin.on('error', () => {});
  child.on('error', () => { failure = pending('LOCAL_SAFE_DELETE_UNAVAILABLE'); });
  lines.on('line', async (line) => {
    try {
      const message = JSON.parse(line);
      if (message.error) { failure = Object.assign(pending(message.error), { nativeError: message.nativeError, stage: message.stage }); return; }
      if (message.complete) { complete = true; return; }
      if (!message.ready || snapshot) throw pending('LOCAL_PROTOCOL_INVALID');
      snapshot = message;
      if (onPinned) await onPinned(snapshot);
      if (expected) {
        if (kind === 'tree') {
          if (snapshot.rootIdentity !== expected.rootIdentity || snapshot.objects?.length
            || snapshot.directories.some((item) => !expected.directories.some((prior) => prior.key === item.key && prior.identity === item.identity))) {
            throw pending('LOCAL_FOLDER_EVIDENCE_CHANGED');
          }
        } else if (snapshot.rootIdentity !== expected.rootIdentity || (snapshot.exists &&
          (snapshot.identity !== expected.identity || snapshot.sha256 !== expected.sha256 || snapshot.size !== expected.size))) {
          throw pending('LOCAL_IDENTITY_MISMATCH');
        }
        deleteSent = true;
        child.stdin.end(JSON.stringify({ action: kind === 'tree' ? 'CLEAN_EMPTY_TREE' : 'DELETE', ...expected }) + '\n');
      } else child.stdin.end('{"action":"INSPECT"}\n');
    } catch (error) { failure = error; child.stdin.end('{"action":"INSPECT"}\n'); }
  });
  child.on('close', (code) => {
    clearTimeout(timeout); lines.close();
    if (failure || code !== 0 || !snapshot || !complete) {
      const error = failure || pending('LOCAL_HELPER_FAILED');
      if (deleteSent) error.code = kind === 'tree' ? 'LOCAL_FOLDER_OUTCOME_UNKNOWN' : 'LOCAL_DELETE_OUTCOME_UNKNOWN';
      reject(error);
    } else resolve(snapshot);
  });
  child.stdin.write(JSON.stringify({ root, key, kind }) + '\n');
});

module.exports = { operate, operateTree: (root, key, expected, onPinned) => operate(root, key, expected, onPinned, 'tree') };
