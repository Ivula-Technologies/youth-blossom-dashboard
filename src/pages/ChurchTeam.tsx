import { useEffect, useState } from "react";
import { CheckCircle, Copy, ShieldCheck, UserCog, UserX } from "lucide-react";
import { useAuth, type ChurchMembershipStatus, type ChurchRole } from "@/auth/AuthContext";
import { supabaseRequest } from "@/lib/supabaseRest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TeamMemberRow {
  membership_id: string;
  user_id: string;
  email: string;
  role: ChurchRole;
  status: ChurchMembershipStatus;
  created_at: string;
  updated_at: string;
}

const roleLabels: Record<ChurchRole, string> = {
  owner: "Owner",
  admin: "Admin",
  leader: "Leader",
  volunteer: "Volunteer",
  viewer: "Regular member",
};

const statusLabels: Record<ChurchMembershipStatus, string> = {
  active: "Active",
  invited: "Pending",
  disabled: "Disabled",
};

function getStatusClass(status: ChurchMembershipStatus) {
  if (status === "active") return "bg-success/10 text-success border-success/20";
  if (status === "invited") return "bg-warning/10 text-warning border-warning/20";
  return "bg-muted text-muted-foreground border-border";
}

export default function ChurchTeam() {
  const { session, activeMembership, canManageChurch } = useAuth();
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadMembers() {
    if (!activeMembership?.churchId || !canManageChurch) return;

    setIsLoading(true);
    try {
      const rows = await supabaseRequest<TeamMemberRow[]>("rpc/list_church_team", {
        method: "POST",
        body: JSON.stringify({ target_church_id: activeMembership.churchId }),
      });
      setMembers(rows);
    } catch (error) {
      toast({
        title: "Unable to load team",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [activeMembership?.churchId, canManageChurch]);

  async function updateMember(member: TeamMemberRow, role: ChurchRole, status: ChurchMembershipStatus) {
    setUpdatingId(member.membership_id);
    try {
      await supabaseRequest<TeamMemberRow[]>("rpc/update_church_team_member", {
        method: "POST",
        body: JSON.stringify({
          target_membership_id: member.membership_id,
          requested_role: role,
          requested_status: status,
        }),
      });
      await loadMembers();
      toast({ title: "Team access updated", description: `${member.email} is now ${statusLabels[status].toLowerCase()}.` });
    } catch (error) {
      toast({
        title: "Unable to update access",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function copyJoinCode() {
    if (!activeMembership?.churchJoinCode) return;

    await navigator.clipboard.writeText(activeMembership.churchJoinCode);
    toast({ title: "Join code copied", description: "Share it with people who should request access." });
  }

  if (!activeMembership) {
    return null;
  }

  if (!canManageChurch) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Team Access</h1>
          <p className="page-description">Only owners and admins can manage church team access.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>Your current role is {roleLabels[activeMembership.role]}.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const pendingCount = members.filter((member) => member.status === "invited").length;
  const activeCount = members.filter((member) => member.status === "active").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Team Access</h1>
        <p className="page-description">Approve requests and manage who can use {activeMembership.churchName}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Join Code
            </CardTitle>
            <CardDescription>Give this to people who should request access.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <code className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {activeMembership.churchJoinCode ?? "Not available"}
            </code>
            <Button variant="outline" size="sm" onClick={copyJoinCode} disabled={!activeMembership.churchJoinCode}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Requests</CardTitle>
            <CardDescription>People waiting for approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Team</CardTitle>
            <CardDescription>Approved users in this church.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Members and Requests
          </CardTitle>
          <CardDescription>Approve access, assign levels, or disable a user.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isCurrentUser = member.user_id === session?.user?.id;
                const isUpdating = updatingId === member.membership_id;

                return (
                  <TableRow key={member.membership_id} className={cn(member.status === "disabled" && "opacity-60")}>
                    <TableCell className="font-medium">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusClass(member.status)}>
                        {statusLabels[member.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-40">
                      <Select
                        value={member.role}
                        onValueChange={(value) => updateMember(member, value as ChurchRole, member.status)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="leader">Leader</SelectItem>
                          <SelectItem value="volunteer">Volunteer</SelectItem>
                          <SelectItem value="viewer">Regular member</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {member.status !== "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMember(member, member.role, "active")}
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => updateMember(member, member.role, "disabled")}
                          disabled={isUpdating || isCurrentUser}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Disable
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No team members found yet.
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Loading team access...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
