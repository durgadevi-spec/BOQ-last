import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  MapPin,
  IndianRupee,
  ChevronRight,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  client: string;
  budget: string;
  location: string;
  client_address: string;
  gst_no: string;
  project_value: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Version {
  id: string;
  project_id: string;
  version_number: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectVersions, setProjectVersions] = useState<Record<string, Version[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/boq-projects");
      if (response.ok) {
        const data = await response.json();
        const projectList = data.projects || [];
        setProjects(projectList);

        const versionPromises = projectList.map((p: Project) =>
          apiFetch(`/api/boq-versions/${p.id}`).then((res) => res.json())
        );

        const versionsResults = await Promise.all(versionPromises);
        const versionsMap: Record<string, Version[]> = {};
        projectList.forEach((p: Project, idx: number) => {
          versionsMap[p.id] = versionsResults[idx].versions || [];
        });

        setProjectVersions(versionsMap);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load project data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
      case "finalized":
        return (
          <Badge className="bg-gray-900 text-white border-none">
            <CheckCircle2 size={12} className="mr-1" />
            Finalized
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            <Clock size={12} className="mr-1" />
            Draft
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Loading project dashboard...</p>
        </div>
      </Layout>
    );
  }

  const totalProjects = projects.length;
  const finalizedVersions = Object.values(projectVersions)
    .flat()
    .filter((v) => v.status === "submitted").length;
  const totalVersions = Object.values(projectVersions).flat().length;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

          {/* Header */}
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
              Project Dashboard
            </h1>
            <p className="text-gray-500 mt-2">
              Overview of all BOQ projects and their version history.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Total Projects</p>
                <p className="text-3xl font-semibold mt-2">{totalProjects}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Total Versions</p>
                <p className="text-3xl font-semibold mt-2">{totalVersions}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Finalized BOQs</p>
                <p className="text-3xl font-semibold mt-2 text-gray-900">
                  {finalizedVersions}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Projects */}
          <div className="space-y-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {project.name}
                      </CardTitle>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1">
                          <User size={14} /> {project.client || "No Client"}
                        </span>

                        {project.gst_no && (
                          <span className="flex items-center gap-1">
                            <FileText size={14} /> GST: {project.gst_no}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {project.location || "N/A"}
                        </span>

                        {(project.project_value || project.budget) && (
                          <span className="flex items-center gap-1 font-medium">
                            <IndianRupee size={14} />
                            {project.project_value || project.budget}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                      onClick={() =>
                        setLocation(`/finalize-bom?projectId=${project.id}`)
                      }
                    >
                      View BOQ
                      <ExternalLink size={14} className="ml-2" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Version</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {projectVersions[project.id]?.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-8 text-gray-400"
                            >
                              No versions created yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          projectVersions[project.id]?.map((version) => (
                            <TableRow
                              key={version.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                V{version.version_number}
                              </TableCell>

                              <TableCell>
                                {getStatusBadge(version.status)}
                              </TableCell>

                              <TableCell className="text-sm text-gray-600">
                                <Calendar size={12} className="inline mr-1" />
                                {formatDate(version.created_at)}
                              </TableCell>

                              <TableCell className="text-sm text-gray-600">
                                <Clock size={12} className="inline mr-1" />
                                {formatDate(version.updated_at)}
                              </TableCell>

                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-full h-8 w-8 p-0 hover:bg-gray-100"
                                  onClick={() =>
                                    setLocation(
                                      `/finalize-bom?projectId=${project.id}&versionId=${version.id}`
                                    )
                                  }
                                >
                                  <ChevronRight size={18} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}