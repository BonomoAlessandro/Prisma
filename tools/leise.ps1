# Legt den Prozess pid samt allen künftigen Unterprozessen in ein Job-Objekt mit harter CPU-Obergrenze (Prozent der
# ganzen Maschine) und Priorität „Leerlauf“. Unterprozesse können den Job nicht verlassen; Chrome setzt Priorität und
# Kernmaske seiner Prozesse selbst zurück, die Obergrenze des Jobs nicht.
param([int]$ProcessId, [int]$Percent = 20)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class LeiseJob {
  [StructLayout(LayoutKind.Sequential)] struct CpuRate { public uint Flags; public uint Rate; }
  [StructLayout(LayoutKind.Sequential)] struct BasicLimit {
    public long PerProcessUserTimeLimit; public long PerJobUserTimeLimit; public uint LimitFlags;
    public UIntPtr MinimumWorkingSetSize; public UIntPtr MaximumWorkingSetSize; public uint ActiveProcessLimit;
    public UIntPtr Affinity; public uint PriorityClass; public uint SchedulingClass;
  }
  [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr CreateJobObject(IntPtr attr, string name);
  [DllImport("kernel32.dll", SetLastError = true)] static extern bool SetInformationJobObject(IntPtr job, int cls, IntPtr info, uint len);
  [DllImport("kernel32.dll", SetLastError = true)] static extern bool AssignProcessToJobObject(IntPtr job, IntPtr proc);
  [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr OpenProcess(uint access, bool inherit, int pid);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  static void Set<T>(IntPtr job, int cls, T value) {
    int len = Marshal.SizeOf(typeof(T));
    IntPtr p = Marshal.AllocHGlobal(len);
    try {
      Marshal.StructureToPtr(value, p, false);
      if (!SetInformationJobObject(job, cls, p, (uint)len)) throw new Exception("SetInformationJobObject " + cls + ": " + Marshal.GetLastWin32Error());
    } finally { Marshal.FreeHGlobal(p); }
  }
  public static void Apply(int pid, int percent) {
    IntPtr job = CreateJobObject(IntPtr.Zero, null);
    if (job == IntPtr.Zero) throw new Exception("CreateJobObject: " + Marshal.GetLastWin32Error());
    Set(job, 15, new CpuRate { Flags = 0x1 | 0x4, Rate = (uint)(percent * 100) });   // CPU-Rate: an, harte Grenze
    Set(job, 2, new BasicLimit { LimitFlags = 0x20, PriorityClass = 0x40 });          // Prioritätsklasse: Leerlauf
    IntPtr proc = OpenProcess(0x0100 | 0x0001, false, pid);                           // SET_QUOTA | TERMINATE
    if (proc == IntPtr.Zero) throw new Exception("OpenProcess: " + Marshal.GetLastWin32Error());
    if (!AssignProcessToJobObject(job, proc)) throw new Exception("AssignProcessToJobObject: " + Marshal.GetLastWin32Error());
    CloseHandle(proc);
    CloseHandle(job); // der Job bleibt, solange Prozesse darin laufen
  }
}
'@
[LeiseJob]::Apply($ProcessId, $Percent)
