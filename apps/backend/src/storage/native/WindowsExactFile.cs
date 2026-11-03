using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using Microsoft.Win32.SafeHandles;
using System.Web.Script.Serialization;

// Hold the complete directory chain until disposition and CloseHandle finish.
// Never substitute a path-based DeleteFile/unlink after validating a handle.
public sealed class WindowsExactFile : IDisposable
{
    static string stage = "initialize";
    public static int Main() {
        bool deleting = false;
        try {
            var json = new JavaScriptSerializer();
            var request = json.Deserialize<Dictionary<string, object>>(Console.ReadLine());
            bool tree = request.ContainsKey("kind") && (string)request["kind"] == "tree";
            using (var session = Open((string)request["root"], (string)request["key"], tree)) {
                if (tree) Console.WriteLine(json.Serialize(new { ready = true, exists = session.Tree.Count > 0,
                    rootIdentity = session.RootIdentity, directories = session.Tree, objects = session.Objects }));
                else Console.WriteLine(json.Serialize(new { ready = true, exists = session.Exists, rootIdentity = session.RootIdentity,
                    identity = session.Identity, sha256 = session.Sha256, size = session.Size }));
                var command = json.Deserialize<Dictionary<string, object>>(Console.ReadLine());
                if (tree && (string)command["action"] == "CLEAN_EMPTY_TREE") {
                    deleting = true;
                    session.CleanTree((string)command["rootIdentity"], (System.Collections.IEnumerable)command["directories"]);
                } else if (!tree && (string)command["action"] == "DELETE") {
                    deleting = true;
                    session.Delete((string)command["rootIdentity"], (string)command["identity"],
                        (string)command["sha256"], Convert.ToInt64(command["size"]));
                } else if ((string)command["action"] != "INSPECT") throw Reject("LOCAL_PROTOCOL_INVALID");
            }
            Console.WriteLine("{\"complete\":true}"); return 0;
        } catch (Exception e) {
            var match = System.Text.RegularExpressions.Regex.Match(e.Message, "LOCAL_[A-Z_]+|STORAGE_INVALID_KEY");
            Console.WriteLine(new JavaScriptSerializer().Serialize(new {
                error = match.Success ? match.Value : "LOCAL_HELPER_REJECTED", uncertain = deleting,
                nativeError = e is Win32Exception ? ((Win32Exception)e).NativeErrorCode : 0, stage = stage }));
            return 1;
        }
    }
    [StructLayout(LayoutKind.Sequential)]
    struct Info {
        public uint Attributes;
        public System.Runtime.InteropServices.ComTypes.FILETIME Created, Accessed, Written;
        public uint Volume, SizeHigh, SizeLow, Links, IndexHigh, IndexLow;
    }
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern SafeFileHandle CreateFile(string path, uint access, uint share, IntPtr security, uint creation, uint flags, IntPtr template);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool GetFileInformationByHandle(SafeFileHandle handle, out Info info);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool SetFileInformationByHandle(SafeFileHandle handle, int kind, byte[] data, uint length);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern uint GetFinalPathNameByHandle(SafeFileHandle handle, System.Text.StringBuilder path, uint capacity, uint flags);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct FindData {
        public uint Attributes;
        public System.Runtime.InteropServices.ComTypes.FILETIME Created, Accessed, Written;
        public uint SizeHigh, SizeLow, Reserved0, Reserved1;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string Name;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 14)] public string Alternate;
    }
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern IntPtr FindFirstFile(string pattern, out FindData data);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool FindNextFile(IntPtr handle, out FindData data);
    [DllImport("kernel32.dll")] static extern bool FindClose(IntPtr handle);

    public sealed class DirectoryEvidence {
        public string key, identity;
        [ScriptIgnore] public SafeFileHandle handle;
        [ScriptIgnore] public string path;
    }
    public readonly List<DirectoryEvidence> Tree = new List<DirectoryEvidence>();
    public readonly List<string> Objects = new List<string>();

    readonly List<SafeFileHandle> directories = new List<SafeFileHandle>();
    SafeFileHandle file;
    FileStream stream;
    public string RootIdentity { get; private set; }
    public string Identity { get; private set; }
    public string Sha256 { get; private set; }
    public long Size { get; private set; }
    public bool Exists { get; private set; }

    static Exception Reject(string code) { return new InvalidOperationException(code); }
    static string IdentityOf(Info i) {
        return i.Volume + ":" + (((ulong)i.IndexHigh << 32) | i.IndexLow) + ":" +
            (((ulong)(uint)i.Created.dwHighDateTime << 32) | (uint)i.Created.dwLowDateTime);
    }
    static Info Inspect(SafeFileHandle h, string expected, bool directory) {
        Info info;
        if (!GetFileInformationByHandle(h, out info)) throw new Win32Exception(Marshal.GetLastWin32Error());
        if ((info.Attributes & 0x400) != 0) throw Reject("LOCAL_LINK_REJECTED");
        if (((info.Attributes & 0x10) != 0) != directory) throw Reject("LOCAL_OBJECT_INVALID");
        var resolved = new System.Text.StringBuilder(32768);
        uint count = GetFinalPathNameByHandle(h, resolved, (uint)resolved.Capacity, 0);
        if (count == 0 || count >= resolved.Capacity ||
            !String.Equals(resolved.ToString().TrimEnd('\\'), ("\\\\?\\" + expected).TrimEnd('\\'), StringComparison.OrdinalIgnoreCase))
            throw Reject("LOCAL_PATH_MISMATCH");
        return info;
    }
    SafeFileHandle OpenDirectory(string name, bool driveRoot, bool owned = false) {
        stage = "directory-" + directories.Count;
        // Drive roots cannot be replaced like normal directories; other components
        // deny both write and delete sharing (including pre-existing incompatible handles).
        var h = CreateFile("\\\\?\\" + name, owned ? 0x10081u : 0x80u, driveRoot ? 3u : 1u, IntPtr.Zero, 3, 0x02200000, IntPtr.Zero);
        if (h.IsInvalid) { int code = Marshal.GetLastWin32Error(); h.Dispose(); throw new Win32Exception(code); }
        directories.Add(h);
        Inspect(h, name, true);
        return h;
    }
    public static WindowsExactFile Open(string root, string key, bool tree = false) {
        var session = new WindowsExactFile();
        try { session.Initialize(root, key, tree); return session; }
        catch { session.Dispose(); throw; }
    }
    void Initialize(string root, string key, bool tree) {
        if (String.IsNullOrEmpty(root) || !System.Text.RegularExpressions.Regex.IsMatch(root, @"^[A-Za-z]:\\") || root.StartsWith(@"\\"))
            throw Reject("LOCAL_FILESYSTEM_UNSUPPORTED");
        root = Path.GetFullPath(root).TrimEnd('\\');
        var drive = new DriveInfo(Path.GetPathRoot(root));
        if (drive.DriveType != DriveType.Fixed || drive.DriveFormat != "NTFS") throw Reject("LOCAL_FILESYSTEM_UNSUPPORTED");
        if (String.IsNullOrEmpty(key)) throw Reject("STORAGE_INVALID_KEY");
        foreach (string part in key.Split('/')) {
            if (!System.Text.RegularExpressions.Regex.IsMatch(part, @"^[A-Za-z0-9_-][A-Za-z0-9._-]*$") ||
                part.EndsWith(".") || System.Text.RegularExpressions.Regex.IsMatch(part, @"^(?i:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)"))
                throw Reject("STORAGE_INVALID_KEY");
        }
        string cursor = Path.GetPathRoot(root);
        SafeFileHandle rootHandle = OpenDirectory(cursor, true);
        foreach (string component in root.Substring(cursor.Length).Split('\\')) {
            if (component.Length == 0) throw Reject("LOCAL_PATH_MISMATCH");
            cursor = Path.Combine(cursor, component);
            rootHandle = OpenDirectory(cursor, false);
        }
        RootIdentity = IdentityOf(Inspect(rootHandle, root, true));
        string[] parts = key.Split('/');
        for (int i = 0; i < parts.Length - 1; i++) {
            cursor = Path.Combine(cursor, parts[i]);
            try { OpenDirectory(cursor, false); }
            catch (Win32Exception e) { if (e.NativeErrorCode == 2 || e.NativeErrorCode == 3) return; throw; }
        }
        string target = Path.Combine(cursor, parts[parts.Length - 1]);
        if (tree) {
            if (parts.Length != 4 || parts[0] != "projects" || parts[2] != "documents") throw Reject("LOCAL_FOLDER_SCOPE_INVALID");
            try { WalkTree(target, key, 0); }
            catch (Win32Exception e) { if ((e.NativeErrorCode == 2 || e.NativeErrorCode == 3) && Tree.Count == 0) return; throw; }
            return;
        }
        stage = "file";
        // Extended-length paths preserve exact canonical names beyond MAX_PATH.
        file = CreateFile("\\\\?\\" + target, 0x80010000, 1, IntPtr.Zero, 3, 0x00200000, IntPtr.Zero);
        if (file.IsInvalid) {
            int code = Marshal.GetLastWin32Error(); file.Dispose(); file = null;
            if (code == 2 || code == 3) return;
            throw new Win32Exception(code);
        }
        Info info = Inspect(file, target, false);
        if (info.Links != 1) throw Reject("LOCAL_SHARED_LINK");
        Identity = IdentityOf(info);
        Size = (long)(((ulong)info.SizeHigh << 32) | info.SizeLow);
        stream = new FileStream(file, FileAccess.Read);
        using (var hash = SHA256.Create()) Sha256 = BitConverter.ToString(hash.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
        Exists = true;
    }
    List<FindData> Entries(string directory) {
        var result = new List<FindData>(); FindData data;
        IntPtr h = FindFirstFile("\\\\?\\" + directory + "\\*", out data);
        if (h == new IntPtr(-1)) {
            int error = Marshal.GetLastWin32Error();
            if (error == 2) return result;
            throw new Win32Exception(error);
        }
        try {
            do { if (data.Name != "." && data.Name != "..") result.Add(data); }
            while (FindNextFile(h, out data));
            int error = Marshal.GetLastWin32Error(); if (error != 18) throw new Win32Exception(error);
        } finally { FindClose(h); }
        result.Sort((a, b) => StringComparer.Ordinal.Compare(a.Name, b.Name));
        return result;
    }
    void WalkTree(string directory, string key, int depth) {
        if (depth > 64 || Tree.Count > 4096) throw Reject("LOCAL_FOLDER_LIMIT");
        var h = OpenDirectory(directory, false, true);
        Tree.Add(new DirectoryEvidence { key = key, identity = IdentityOf(Inspect(h, directory, true)), handle = h, path = directory });
        foreach (FindData entry in Entries(directory)) {
            if ((entry.Attributes & 0x400) != 0) throw Reject("LOCAL_LINK_REJECTED");
            if (!System.Text.RegularExpressions.Regex.IsMatch(entry.Name, @"^[A-Za-z0-9_-][A-Za-z0-9._-]*$") || entry.Name.EndsWith(".") ||
                System.Text.RegularExpressions.Regex.IsMatch(entry.Name, @"^(?i:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)")) throw Reject("LOCAL_FOLDER_ALIAS_INVALID");
            string childKey = key + "/" + entry.Name;
            if ((entry.Attributes & 0x10) != 0) WalkTree(Path.Combine(directory, entry.Name), childKey, depth + 1);
            else Objects.Add(childKey);
        }
    }
    public void CleanTree(string rootIdentity, System.Collections.IEnumerable expected) {
        if (rootIdentity != RootIdentity) throw Reject("LOCAL_IDENTITY_MISMATCH");
        var approved = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (object value in expected) {
            var item = (Dictionary<string, object>)value;
            approved.Add((string)item["key"], (string)item["identity"]);
        }
        if (Objects.Count != 0) throw Reject("LOCAL_FOLDER_NONEMPTY");
        foreach (DirectoryEvidence item in Tree) {
            string identity;
            if (!approved.TryGetValue(item.key, out identity) || identity != item.identity) throw Reject("LOCAL_FOLDER_IDENTITY_MISMATCH");
        }
        for (int i = Tree.Count - 1; i >= 0; i--) {
            DirectoryEvidence item = Tree[i];
            if (IdentityOf(Inspect(item.handle, item.path, true)) != item.identity) throw Reject("LOCAL_FOLDER_IDENTITY_MISMATCH");
            if (Entries(item.path).Count != 0) throw Reject("LOCAL_FOLDER_NONEMPTY");
            if (!SetFileInformationByHandle(item.handle, 4, new byte[] { 1 }, 1)) throw new Win32Exception(Marshal.GetLastWin32Error());
            item.handle.Dispose();
        }
    }
    public void Delete(string rootIdentity, string identity, string sha256, long size) {
        if (rootIdentity != RootIdentity || String.IsNullOrEmpty(identity) || String.IsNullOrEmpty(sha256)) throw Reject("LOCAL_IDENTITY_MISMATCH");
        if (!Exists) return;
        if (identity != Identity || sha256 != Sha256 || size != Size) throw Reject("LOCAL_IDENTITY_MISMATCH");
        // FILE_DISPOSITION_INFO uses a one-byte BOOLEAN, not a four-byte Win32 BOOL.
        if (!SetFileInformationByHandle(file, 4, new byte[] { 1 }, 1)) throw new Win32Exception(Marshal.GetLastWin32Error());
    }
    public void Dispose() {
        if (stream != null) stream.Dispose();
        if (file != null) file.Dispose();
        for (int i = directories.Count - 1; i >= 0; i--) directories[i].Dispose();
    }
}
