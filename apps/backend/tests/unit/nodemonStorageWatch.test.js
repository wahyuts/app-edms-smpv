const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const backend = path.resolve(__dirname, '../..');
test('development watcher is restricted to src without changing the runtime entrypoint', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(backend, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.dev, 'nodemon --watch src src/server.js');
  assert.equal(pkg.scripts.start, 'node src/server.js');
  assert.equal(pkg.scripts.predev, 'node scripts/sync-runtime-seed.js --sync-if-source-exists --check');
  const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
  const source = path.join(backend, 'src');
  const files = walk(source).filter((file) => /\.(js|mjs|cjs|json)$/.test(file));
  assert.ok(files.length > 50);
  assert.ok(files.every((file) => !path.relative(source, file).startsWith('..')));
});

test('actual nodemon config resolves only src and --dump never starts backend', () => {
  const cli = require.resolve('nodemon/bin/nodemon.js');
  const dump = execFileSync(process.execPath, [cli, '--watch', 'src', '--dump', 'src/server.js'],
    { cwd: backend, encoding: 'utf8', windowsHide: true, timeout: 10000 });
  assert.match(dump, /run: false/);
  assert.match(dump, /lastStarted: 0/);
  assert.match(dump, /watch: \[ 'src'/);
  assert.match(dump, /dirs: \[ '[^\r\n']*src' \]/);
  assert.match(dump, /ext: 'js,mjs,cjs,json'/);
  assert.doesNotMatch(dump, /dirs: \[[^\r\n]*storage/);
  assert.match(dump, /raw: \{ executable: 'node', args: \[ 'src\/server.js' \] \}/);
});

test('fixture: normal reader close releases delete-pending child; native retry preserves sibling files',
  { skip: process.platform !== 'win32' }, () => {
    const fixture = fs.mkdtempSync(path.resolve(__dirname, '../../../../tmp/nodemon-recovery-'));
    const native = path.join(backend, 'src/storage/native/WindowsExactFile.cs');
    const script = `
$fixture = '${fixture.replaceAll("'", "''")}'
$native = '${native.replaceAll("'", "''")}'
$probe = @'
public static class WatcherRecoveryFixture {
 [StructLayout(LayoutKind.Sequential)] struct Standard {public long Allocation,Length;public uint Links;[MarshalAs(UnmanagedType.U1)]public bool DeletePending;[MarshalAs(UnmanagedType.U1)]public bool Directory;}
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern SafeFileHandle CreateFile(string p,uint access,uint share,IntPtr sec,uint creation,uint flags,IntPtr template);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetFileInformationByHandleEx(SafeFileHandle h,int kind,out Standard info,uint size);
 public static object Run(string root){
  string key="projects/TEST/documents/DOC-1";
  string child=Path.Combine(root,key.Replace('/','\\\\'),"revisions","IFR-Submitted");
  string sibling=Path.Combine(root,"projects","TEST","documents","OTHER");
  Directory.CreateDirectory(child);Directory.CreateDirectory(sibling);File.WriteAllText(Path.Combine(sibling,"keep.pdf"),"protected fixture");
  string reason=null,rootIdentity=null;bool pending=false;
  var proof=new List<Dictionary<string,object>>();
  using(var reader=CreateFile("\\\\\\\\?\\\\"+child,1,7,IntPtr.Zero,3,0x02200000,IntPtr.Zero)){
   if(reader.IsInvalid)throw new Win32Exception(Marshal.GetLastWin32Error());
   using(var session=WindowsExactFile.Open(root,key,true)){
    rootIdentity=session.RootIdentity;
    foreach(var d in session.Tree)proof.Add(new Dictionary<string,object>{{"key",d.key},{"identity",d.identity}});
    try{session.CleanTree(rootIdentity,proof);}catch(Exception e){reason=e.GetBaseException().Message;}
   }
   Standard info;if(!GetFileInformationByHandleEx(reader,1,out info,(uint)Marshal.SizeOf(typeof(Standard))))throw new Win32Exception(Marshal.GetLastWin32Error());pending=info.DeletePending;
  }
  bool goneAfterReaderClose=!Directory.Exists(child);
  using(var resumed=WindowsExactFile.Open(root,key,true)){resumed.CleanTree(rootIdentity,proof);}
  return new{reason=reason,deletePending=pending,childGoneAfterReaderClose=goneAfterReaderClose,documentRootGone=!Directory.Exists(Path.Combine(root,key.Replace('/','\\\\'))),documentsParentPreserved=Directory.Exists(Path.Combine(root,"projects","TEST","documents")),siblingContents=File.ReadAllText(Path.Combine(sibling,"keep.pdf")),mainStorageTouched=false};
 }
}
'@
$source = Get-Content -LiteralPath $native -Raw
Add-Type -TypeDefinition ($source + [Environment]::NewLine + $probe) -ReferencedAssemblies 'System.Web.Extensions.dll'
[WatcherRecoveryFixture]::Run($fixture) | ConvertTo-Json -Compress
`;
    const result = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script],
      { encoding: 'utf8', windowsHide: true, timeout: 30000 });
    const json = result.split(/\r?\n/).find((line) => line.startsWith('{'));
    assert.ok(json, result);
    const proof = JSON.parse(json);
    assert.equal(proof.reason, 'LOCAL_FOLDER_NONEMPTY');
    assert.equal(proof.deletePending, true);
    assert.equal(proof.childGoneAfterReaderClose, true);
    assert.equal(proof.documentRootGone, true);
    assert.equal(proof.documentsParentPreserved, true);
    assert.equal(proof.siblingContents, 'protected fixture');
    assert.equal(proof.mainStorageTouched, false);
  });
