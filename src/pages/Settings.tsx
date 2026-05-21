import { FormEvent, useEffect, useState } from "react";
import { Bell, Building2, CheckCircle, Database, Download, ExternalLink, Link, Palette, SlidersHorizontal, Upload } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { supabaseRequest } from "@/lib/supabaseRest";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrganizationSettingsRow {
  id: string;
  name: string;
  slug: string | null;
  join_code: string | null;
  organization_type: string;
  member_label: string;
  program_label: string;
  group_label: string;
  attendance_label: string;
  primary_focus: string;
}

const organizationTypeLabels: Record<string, string> = {
  church: "Church or ministry",
  nonprofit: "Nonprofit or NGO",
  school: "School or campus group",
  club: "Club or association",
  youth_program: "Youth program",
  other: "Other organization",
};

const presets = {
  church: {
    memberLabel: "Members",
    programLabel: "Ministries",
    groupLabel: "Small Groups",
    attendanceLabel: "Attendance",
    primaryFocus: "Youth Ministry",
  },
  nonprofit: {
    memberLabel: "Participants",
    programLabel: "Programs",
    groupLabel: "Cohorts",
    attendanceLabel: "Participation",
    primaryFocus: "Community Programs",
  },
  school: {
    memberLabel: "Students",
    programLabel: "Activities",
    groupLabel: "Clubs",
    attendanceLabel: "Attendance",
    primaryFocus: "Student Programs",
  },
  club: {
    memberLabel: "Members",
    programLabel: "Events",
    groupLabel: "Teams",
    attendanceLabel: "Check-ins",
    primaryFocus: "Member Engagement",
  },
  youth_program: {
    memberLabel: "Youth",
    programLabel: "Programs",
    groupLabel: "Groups",
    attendanceLabel: "Attendance",
    primaryFocus: "Youth Programs",
  },
  other: {
    memberLabel: "People",
    programLabel: "Programs",
    groupLabel: "Groups",
    attendanceLabel: "Attendance",
    primaryFocus: "Programs",
  },
};

const Settings = () => {
  const { activeMembership, canManageChurch } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("other");
  const [memberLabel, setMemberLabel] = useState("People");
  const [programLabel, setProgramLabel] = useState("Programs");
  const [groupLabel, setGroupLabel] = useState("Groups");
  const [attendanceLabel, setAttendanceLabel] = useState("Attendance");
  const [primaryFocus, setPrimaryFocus] = useState("Programs");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMembership) return;

    setOrganizationName(activeMembership.churchName);
    setOrganizationType(activeMembership.organizationType || "other");
    setMemberLabel(activeMembership.memberLabel || "People");
    setProgramLabel(activeMembership.programLabel || "Programs");
    setGroupLabel(activeMembership.groupLabel || "Groups");
    setAttendanceLabel(activeMembership.attendanceLabel || "Attendance");
    setPrimaryFocus(activeMembership.primaryFocus || "Programs");
  }, [activeMembership]);

  function applyPreset(type: string) {
    const preset = presets[type as keyof typeof presets] ?? presets.other;
    setOrganizationType(type);
    setMemberLabel(preset.memberLabel);
    setProgramLabel(preset.programLabel);
    setGroupLabel(preset.groupLabel);
    setAttendanceLabel(preset.attendanceLabel);
    setPrimaryFocus(preset.primaryFocus);
  }

  async function saveOrganizationSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeMembership) return;

    setIsSaving(true);
    setError(null);

    try {
      await supabaseRequest<OrganizationSettingsRow[]>("rpc/update_organization_settings", {
        method: "POST",
        body: JSON.stringify({
          target_church_id: activeMembership.churchId,
          requested_name: organizationName,
          requested_organization_type: organizationType,
          requested_member_label: memberLabel,
          requested_program_label: programLabel,
          requested_group_label: groupLabel,
          requested_attendance_label: attendanceLabel,
          requested_primary_focus: primaryFocus,
        }),
      });

      toast({ title: "Organization settings saved" });
      window.location.reload();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save organization settings";
      setError(message);
      toast({ title: "Unable to save settings", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Tailor Ivula Canopy for your organization, programs, and team language.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Profile
              </CardTitle>
              <CardDescription>Set the type, name, and terminology your team sees across the app.</CardDescription>
            </CardHeader>
            <CardContent>
              {!activeMembership ? (
                <p className="text-sm text-muted-foreground">Choose an active organization before editing settings.</p>
              ) : !canManageChurch ? (
                <p className="text-sm text-muted-foreground">Only owners and admins can edit organization settings.</p>
              ) : (
                <form onSubmit={saveOrganizationSettings} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organization-name">Organization name</Label>
                      <Input
                        id="organization-name"
                        value={organizationName}
                        onChange={(event) => setOrganizationName(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Organization type</Label>
                      <Select value={organizationType} onValueChange={applyPreset}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(organizationTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="member-label">People label</Label>
                      <Input id="member-label" value={memberLabel} onChange={(event) => setMemberLabel(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="program-label">Program label</Label>
                      <Input id="program-label" value={programLabel} onChange={(event) => setProgramLabel(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-label">Group label</Label>
                      <Input id="group-label" value={groupLabel} onChange={(event) => setGroupLabel(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendance-label">Attendance label</Label>
                      <Input id="attendance-label" value={attendanceLabel} onChange={(event) => setAttendanceLabel(event.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary-focus">Primary focus</Label>
                    <Input id="primary-focus" value={primaryFocus} onChange={(event) => setPrimaryFocus(event.target.value)} />
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    <div className="mb-2 flex items-center gap-2 font-medium">
                      <SlidersHorizontal className="h-4 w-4" />
                      Preview
                    </div>
                    <p className="text-muted-foreground">
                      {organizationName || "Your organization"} will track {memberLabel.toLowerCase()}, manage {programLabel.toLowerCase()}, organize {groupLabel.toLowerCase()}, and report on {attendanceLabel.toLowerCase()} for {primaryFocus.toLowerCase()}.
                    </p>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Organization Settings"}</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                </div>
                <Select defaultValue="light">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure when and how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Engagement alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when participation drops significantly</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Attendance warnings</p>
                  <p className="text-sm text-muted-foreground">Alert when someone misses 3+ consecutive meetings</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">New registration notifications</p>
                  <p className="text-sm text-muted-foreground">Notify when a new person registers</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Weekly summary email</p>
                  <p className="text-sm text-muted-foreground">Receive a weekly digest of key metrics</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                External Integrations
              </CardTitle>
              <CardDescription>Connect with calendars, email tools, and existing organization systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Organization database", description: "Sync people data with your existing system", connected: false },
                { name: "Planning Center", description: "Import attendance and volunteer data", connected: false },
                { name: "Mailchimp", description: "Sync contacts for email communications", connected: false },
                { name: "Google Calendar", description: "Sync program schedules and events", connected: true },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{integration.name}</p>
                      {integration.connected && (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                  <Button variant={integration.connected ? "outline" : "default"} size="sm">
                    {integration.connected ? "Configure" : "Connect"}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Import, export, and manage your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Import Data</p>
                    <p className="text-sm text-muted-foreground">Upload records from CSV or Excel files</p>
                  </div>
                </div>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>

              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Download className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Export All Data</p>
                    <p className="text-sm text-muted-foreground">Download a complete backup of all records</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Export as CSV</Button>
                  <Button variant="outline">Export as Excel</Button>
                </div>
              </div>

              <Separator />

              <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-3">
                <p className="font-medium text-destructive">Danger Zone</p>
                <p className="text-sm text-muted-foreground">These actions are irreversible. Please proceed with caution.</p>
                <Button variant="destructive" size="sm">Clear All Test Data</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
