import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  FilePlus,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { mockPrograms, mockYouths } from "@/data/mockData";
import { downloadCsv, downloadExcel, downloadHtmlReport } from "@/lib/exportUtils";
import { toast } from "@/hooks/use-toast";

const recentExportDates = [
  { suffix: "Engagement Report.pdf", date: "2026-01-26", size: "245 KB" },
  { suffix: "Retention Analysis.pdf", date: "2026-01-15", size: "1.2 MB" },
  { suffix: "Directory Export.csv", date: "2026-01-10", size: "89 KB" },
  { suffix: "Participation Snapshot.xlsx", date: "2025-12-31", size: "156 KB" },
];

const Reports = () => {
  const { activeMembership } = useAuth();
  const memberLabel = activeMembership?.memberLabel ?? "People";
  const programLabel = activeMembership?.programLabel ?? "Programs";
  const attendanceLabel = activeMembership?.attendanceLabel ?? "Attendance";
  const primaryFocus = activeMembership?.primaryFocus ?? "Organizational Health";
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState("html");
  const [dateRange, setDateRange] = useState("month");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);

  const reportTemplates = useMemo(() => [
    {
      id: "retention",
      name: `${memberLabel} Retention Report`,
      description: `Track retention, dropoff patterns, and re-engagement success for your ${memberLabel.toLowerCase()}`,
      icon: TrendingUp,
      category: "engagement",
      lastGenerated: "2026-01-25",
    },
    {
      id: "attendance",
      name: `${attendanceLabel} Summary`,
      description: `Weekly and monthly ${attendanceLabel.toLowerCase()} trends across your ${programLabel.toLowerCase()}`,
      icon: Calendar,
      category: "participation",
      lastGenerated: "2026-01-26",
    },
    {
      id: "program-impact",
      name: `${programLabel} Impact Analysis`,
      description: `Measure effectiveness, participation, and outcomes across ${programLabel.toLowerCase()}`,
      icon: BarChart3,
      category: "programs",
      lastGenerated: "2026-01-20",
    },
    {
      id: "demographics",
      name: `${memberLabel} Overview`,
      description: `Age, education, work status, and engagement distribution for your ${memberLabel.toLowerCase()}`,
      icon: Users,
      category: "people",
      lastGenerated: "2026-01-15",
    },
    {
      id: "at-risk",
      name: `Follow-Up ${memberLabel} Report`,
      description: `Identify disengaged ${memberLabel.toLowerCase()} with practical follow-up recommendations`,
      icon: Users,
      category: "engagement",
      lastGenerated: "2026-01-26",
    },
    {
      id: "leadership",
      name: "Leadership Pipeline Report",
      description: "Track leadership development progress and potential team leads",
      icon: TrendingUp,
      category: "growth",
      lastGenerated: "2026-01-18",
    },
  ], [attendanceLabel, memberLabel, programLabel]);

  const recentExports = recentExportDates.map((file) => ({
    ...file,
    name: `${primaryFocus} ${file.suffix}`,
  }));

  const peopleRows = mockYouths.map((person) => ({
    Name: `${person.firstName} ${person.lastName}`,
    Email: person.email,
    Phone: person.phone,
    Status: person.status,
    Engagement: person.engagementStatus,
    "Engagement Score": person.engagementScore,
    "Attendance Rate": person.attendanceRate,
    Group: person.smallGroup ?? "",
  }));

  const programRows = mockPrograms.map((program) => ({
    Name: program.name,
    Category: program.category,
    Schedule: program.schedule,
    Leader: program.leader,
    Active: program.isActive,
    Participants: program.participantCount,
    "Average Attendance": program.averageAttendance,
    "Engagement Score": program.engagementScore,
  }));

  const buildReportRows = () => {
    if (selectedReport === "program-impact" || selectedReport === "attendance") return programRows;
    return peopleRows;
  };

  const downloadRows = (filenameBase: string, rows: Record<string, string | number | boolean>[]) => {
    if (exportFormat === "csv") {
      downloadCsv(filenameBase, rows);
    } else if (exportFormat === "xlsx") {
      downloadExcel(filenameBase, rows);
    } else {
      downloadHtmlReport(filenameBase, filenameBase, rows);
    }
  };

  const handleGenerate = () => {
    const report = reportTemplates.find((item) => item.id === selectedReport);
    if (!report) return;

    downloadRows(`${activeMembership?.churchName ?? "Organization"} ${report.name}`, buildReportRows());
    toast({
      title: "Report downloaded",
      description: `${report.name} has been generated for ${dateRange.replace("-", " ")}.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports & Export</h1>
        <p className="page-description">
          Generate reports for {primaryFocus.toLowerCase()}, engagement, participation, and operational visibility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Report Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTemplates.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedReport === report.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold truncate">{report.name}</h3>
                          <Badge variant="outline" className="text-xs capitalize">
                            {report.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Last: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Configure Report</h2>
          <Card>
            <CardContent className="pt-6 space-y-6">
              {selectedReport ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Export Format</label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="html">Printable HTML Report</SelectItem>
                        <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                        <SelectItem value="xlsx">Excel Workbook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Options</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="charts"
                          checked={includeCharts}
                          onCheckedChange={(c) => setIncludeCharts(!!c)}
                        />
                        <label htmlFor="charts" className="text-sm">
                          Include visualizations
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="raw"
                          checked={includeRawData}
                          onCheckedChange={(c) => setIncludeRawData(!!c)}
                        />
                        <label htmlFor="raw" className="text-sm">
                          Include raw data tables
                        </label>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleGenerate}>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Select a report template to configure</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Export</CardTitle>
              <CardDescription>Export operational data at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  downloadCsv(`${activeMembership?.churchName ?? "Organization"} ${memberLabel} Data`, peopleRows);
                  toast({ title: `${memberLabel} export downloaded` });
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export {memberLabel} Data (CSV)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  downloadCsv(`${activeMembership?.churchName ?? "Organization"} ${programLabel} Data`, programRows);
                  toast({ title: `${programLabel} export downloaded` });
                }}
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Export {programLabel} Data (CSV)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentExports.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.date).toLocaleDateString()} - {file.size}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    downloadRows(file.name, file.name.includes("Participation") ? programRows : peopleRows);
                    toast({ title: "Export downloaded", description: file.name });
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
