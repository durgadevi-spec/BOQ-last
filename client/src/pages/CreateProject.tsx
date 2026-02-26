import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  MapPin,
  User,
  Receipt,
  Calculator,
  Library,
  History,
  Trash2,
  ChevronRight,
  ChevronDown,
  Briefcase
} from "lucide-react";
import apiFetch from "@/lib/api";

export default function CreateProject() {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [templateProjectId, setTemplateProjectId] = useState<string>("none");
  const [selectedVersionId, setSelectedVersionId] = useState<string>("none");

  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [projectVersions, setProjectVersions] = useState<Record<string, any[]>>(
    {},
  );
  const [versionItems, setVersionItems] = useState<Record<string, any[]>>({});
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/api/boq-projects", { headers: {} });
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (e) {
        console.warn("Failed to load projects", e);
      }
    };
    load();
  }, []);

  const addProject = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiFetch("/api/boq-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          client: client.trim(),
          budget: budget.trim(),
          location: location.trim(),
          client_address: clientAddress.trim(),
          gst_no: gstNo.trim(),
          project_value: projectValue.trim(),
          base_version_id: selectedVersionId !== "none" ? selectedVersionId : null,
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setName("");
        setClient("");
        setBudget("");
        setLocation("");
        setClientAddress("");
        setGstNo("");
        setProjectValue("");
        setTemplateProjectId("none");
        setSelectedVersionId("none");
        setProjects((p) => [newProject, ...p]);
        toast({ title: "Success", description: "Project created" });
      } else {
        toast({
          title: "Error",
          description: "Failed to create project",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to create project:", err);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const loadProjectVersions = async (projectId: string) => {
    if (projectVersions[projectId]) return;
    try {
      const res = await apiFetch(
        `/api/boq-versions/${encodeURIComponent(projectId)}`,
        { headers: {} },
      );
      if (res.ok) {
        const data = await res.json();
        setProjectVersions((pv) => ({
          ...pv,
          [projectId]: data.versions || [],
        }));
        return data.versions;
      }
    } catch (e) {
      console.warn("Failed to load versions", e);
    }
  };

  const toggleProject = async (projectId: string) => {
    setExpanded((s) => ({ ...s, [projectId]: !s[projectId] }));

    // if expanding and versions not loaded, fetch versions
    if (!expanded[projectId]) {
      const versions = await loadProjectVersions(projectId);
      if (versions) {
        // preload items for all versions (both draft and submitted)
        versions.forEach(async (v: any) => {
          try {
            const r = await apiFetch(
              `/api/boq-items/version/${encodeURIComponent(v.id)}`,
              { headers: {} },
            );
            if (r.ok) {
              const items = await r.json();
              setVersionItems((vi) => ({
                ...vi,
                [v.id]: items.items || [],
              }));
            }
          } catch (e) {
            console.warn("Failed to load items for version", v.id, e);
          }
        });
      }
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      return;
    }

    try {
      const response = await apiFetch(`/api/boq-projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProjects((p) => p.filter((proj) => proj.id !== projectId));
        toast({ title: "Success", description: "Project deleted" });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const renderStep11Table = (items: any[]) => {
    // items is array of boq_items rows; each has table_data.step11_items
    const rows = items.flatMap((it) =>
      (it.table_data?.step11_items || []).map((si: any, idx: number) => ({
        ...si,
        _sourceId: it.id,
        _idx: idx,
      })),
    );
    if (rows.length === 0)
      return (
        <div className="text-sm text-muted-foreground">No Step 11 items</div>
      );

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border px-2 py-1">S.No</th>
              <th className="border px-2 py-1">Item</th>
              <th className="border px-2 py-1">Description</th>
              <th className="border px-2 py-1">Unit</th>
              <th className="border px-2 py-1">Qty</th>
              <th className="border px-2 py-1">Supply Rate</th>
              <th className="border px-2 py-1">Install Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr
                key={`${r._sourceId}-${r._idx}`}
                className="border-b hover:bg-blue-50"
              >
                <td className="border px-2 py-1 text-center">{i + 1}</td>
                <td className="border px-2 py-1">
                  {r.title || r.bill_no || "—"}
                </td>
                <td className="border px-2 py-1">{r.description || ""}</td>
                <td className="border px-2 py-1 text-center">
                  {r.unit || "pcs"}
                </td>
                <td className="border px-2 py-1 text-right">{r.qty ?? "0"}</td>
                <td className="border px-2 py-1 text-right">
                  {r.supply_rate ?? "0"}
                </td>
                <td className="border px-2 py-1 text-right">
                  {r.install_rate ?? "0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Create Project</h1>

        <Card className="border-blue-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center gap-3">
            <Library className="w-5 h-5 text-white/90" />
            <div>
              <h2 className="text-lg font-bold text-white">Create New Project</h2>
              <p className="text-blue-100 text-[11px] opacity-80">Fill in the project details below. All fields will be saved to the database.</p>
            </div>
          </div>
          <CardContent className="space-y-6 pt-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
              <div className="space-y-1.5 group">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 text-indigo-400" /> Project Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name..."
                  className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all rounded-lg"
                />
              </div>
              <div className="space-y-1.5 group">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <User className="w-3 h-3 text-indigo-400" /> Client Name
                </Label>
                <Input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Full name of the client"
                  className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all rounded-lg"
                />
              </div>
              <div className="space-y-1.5 group">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Receipt className="w-3 h-3 text-indigo-400" /> GST No.
                </Label>
                <Input
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  placeholder="GSTIN (Optional)"
                  className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all rounded-lg"
                />
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-indigo-400" /> Project Location
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City / Site Area"
                  className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all rounded-lg"
                />
              </div>
              <div className="space-y-1.5 group md:col-span-2">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-indigo-400" /> Client Billing Address
                </Label>
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Detailed address for reports and invoices"
                  className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all rounded-lg"
                />
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Calculator className="w-3 h-3 text-indigo-400" /> Target Budget
                </Label>
                <Input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Allocated budget..."
                  className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all rounded-lg"
                />
              </div>
              <div className="space-y-1.5 group">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Receipt className="w-3 h-3 text-indigo-400" /> Project Value
                </Label>
                <Input
                  value={projectValue}
                  onChange={(e) => setProjectValue(e.target.value)}
                  placeholder="Final contract value..."
                  className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <History className="w-3 h-3 text-indigo-400" /> Version Template
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={templateProjectId}
                    onValueChange={(val) => {
                      setTemplateProjectId(val);
                      setSelectedVersionId("none");
                      if (val !== "none") loadProjectVersions(val);
                    }}
                  >
                    <SelectTrigger className="border-slate-200 rounded-lg flex-1 text-xs">
                      <SelectValue placeholder="Use existing project..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">New empty project</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {templateProjectId !== "none" && (
                    <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                      <SelectTrigger className="border-slate-200 rounded-lg w-24 bg-blue-50/50 text-xs">
                        <SelectValue placeholder="Ver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {(projectVersions[templateProjectId] || []).map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>V{v.version_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5 italic">Leave empty for a fresh new project</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button onClick={addProject} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-2.5 rounded-lg shadow-md hover:shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2">
                <Library className="w-4 h-4" /> Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Projects list */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-lg font-semibold">Existing Projects</h2>
            {projects.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No projects yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {projects.map((p) => (
                  <li key={p.id} className="border rounded">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-4">
                        <button
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                          onClick={() => toggleProject(p.id)}
                          aria-expanded={!!expanded[p.id]}
                        >
                          {expanded[p.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800">{p.name}</span>
                            <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-bold border border-slate-200 uppercase tracking-tight">V{p.current_version || 1}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            <span className="flex items-center gap-1 font-medium"><User className="w-3 h-3 text-slate-400" /> {p.client || "—"}</span>
                            <span className="flex items-center gap-1 font-medium"><MapPin className="w-3 h-3 text-slate-400" /> {p.location || "—"}</span>
                            <span className="flex items-center gap-1 font-medium"><Calculator className="w-3 h-3 text-slate-400" /> {p.budget || "—"}</span>
                            {p.gst_no && <span className="flex items-center gap-1 font-medium"><Receipt className="w-3 h-3 text-slate-400" /> {p.gst_no}</span>}
                            {p.project_value && <span className="flex items-center gap-1 font-medium"><History className="w-3 h-3 text-slate-400" /> Value: {p.project_value}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => deleteProject(p.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    {expanded[p.id] && (
                      <div className="p-3 border-t">
                        {projectVersions[p.id] ? (
                          projectVersions[p.id].length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                              No versions for this project.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {projectVersions[p.id].map((v: any) => (
                                <div key={v.id} className="border rounded p-3 bg-gray-50 flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedVersions.has(v.id)}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedVersions);
                                      if (e.target.checked) {
                                        newSelected.add(v.id);
                                      } else {
                                        newSelected.delete(v.id);
                                      }
                                      setSelectedVersions(newSelected);
                                    }}
                                    className="mt-1 w-4 h-4 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium">
                                        V{v.version_number}
                                      </div>
                                      <div
                                        className={`text-xs px-2 py-0.5 rounded ${v.status === "submitted" ? "bg-green-100 text-green-800" : "bg-gray-100 text-muted-foreground"}`}
                                      >
                                        {v.status}
                                      </div>
                                    </div>

                                    {v.status === "submitted" ? (
                                      <div className="mb-2">
                                        {versionItems[v.id] ? (
                                          versionItems[v.id].length > 0 ? (
                                            renderStep11Table(versionItems[v.id])
                                          ) : (
                                            <div className="text-sm text-muted-foreground">
                                              No items in this version
                                            </div>
                                          )
                                        ) : (
                                          <div className="text-sm text-muted-foreground">
                                            Loading items...
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="mb-2">
                                        {versionItems[v.id] ? (
                                          versionItems[v.id].length > 0 ? (
                                            renderStep11Table(versionItems[v.id])
                                          ) : (
                                            <div className="text-sm text-muted-foreground">
                                              No items added yet
                                            </div>
                                          )
                                        ) : (
                                          <div className="text-sm text-muted-foreground">
                                            Loading items...
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Loading versions...
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
