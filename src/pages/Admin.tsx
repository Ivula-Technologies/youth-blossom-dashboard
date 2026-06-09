import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Lock, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

const teamMembers = [
  { name: "Maya Roberts", email: "maya@example.org", role: "owner", status: "active" },
  { name: "Jordan Ellis", email: "jordan@example.org", role: "leader", status: "active" },
  { name: "Grace Walker", email: "grace@example.org", role: "volunteer", status: "active" },
  { name: "Marcus Williams", email: "marcus@example.org", role: "viewer", status: "pending" },
];

const rolePermissions = [
  {
    role: "Owner",
    description: "Full account, billing, organization settings, and data access.",
    permissions: ["Manage organization", "Approve access", "Export data", "Update privacy settings"],
  },
  {
    role: "Admin",
    description: "Operational administrator for teams, people, and programs.",
    permissions: ["Manage team", "Edit records", "Generate reports", "Configure programs"],
  },
  {
    role: "Leader",
    description: "Program or team lead with editing rights for day-to-day work.",
    permissions: ["Edit records", "Record participation", "View insights", "Follow up with people"],
  },
  {
    role: "Volunteer",
    description: "Limited contributor for attendance, participation, and assigned tasks.",
    permissions: ["Record participation", "View assigned details"],
  },
];

const Admin = () => {
  const { activeMembership } = useAuth();
  const memberLabel = activeMembership?.memberLabel ?? "People";
  const programLabel = activeMembership?.programLabel ?? "Programs";
  const attendanceLabel = activeMembership?.attendanceLabel ?? "Attendance";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Access & Privacy</h1>
        <p className="page-description">
          Review role permissions, data controls, and privacy expectations for this organization.
        </p>
      </div>

      <Tabs defaultValue="access" className="space-y-6">
        <TabsList>
          <TabsTrigger value="access" className="gap-2">
            <Users className="h-4 w-4" />
            Access
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Lock className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teamMembers.length}</p>
                    <p className="text-sm text-muted-foreground">Team Accounts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-success/10">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-warning/10">
                    <Shield className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Access Snapshot</CardTitle>
              <CardDescription>Example access levels for a configured organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.email} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{member.role}</Badge>
                    <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rolePermissions.map((role) => (
              <Card key={role.role}>
                <CardHeader>
                  <CardTitle className="text-base">{role.role}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.permissions.map((permission) => (
                      <li key={permission} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Data Privacy Reminder</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This workspace may contain sensitive contact, participation, and engagement information. Access should match each person's role and the organization should only collect data it has a clear reason to use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Configure data handling and visibility options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Require export justification</p>
                  <p className="text-sm text-muted-foreground">Users must provide a reason when exporting {memberLabel.toLowerCase()} data</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Limit volunteer visibility</p>
                  <p className="text-sm text-muted-foreground">Contact details are visible only to approved leaders and admins</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Enable audit logging</p>
                  <p className="text-sm text-muted-foreground">Track access, edits, {attendanceLabel.toLowerCase()}, and report exports</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Review inactive records</p>
                  <p className="text-sm text-muted-foreground">Flag inactive {memberLabel.toLowerCase()} and unused {programLabel.toLowerCase()} for review</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Confidentiality Expectations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-2">
                <p><strong>Every user with access should understand that:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>{memberLabel} information is confidential and should be protected</li>
                  <li>Data should only be used for legitimate organizational work</li>
                  <li>Sharing data with unauthorized people is prohibited</li>
                  <li>Access and changes may be logged for accountability</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
