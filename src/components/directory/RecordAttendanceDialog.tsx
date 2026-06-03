import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Activity,
  MessageSquare
} from "lucide-react";
import { Youth, mockPrograms } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/data/attendanceRecords";

const attendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  programId: z.string().min(1, "Please select a program"),
  attendanceStatus: z.enum(["present", "absent", "late", "excused"], {
    required_error: "Please select attendance status",
  }),
  engagementLevel: z.enum(["low", "medium", "high", "very_high"]).optional(),
  participationNotes: z.string().trim().max(500).optional(),
  followUpRequired: z.boolean().default(false),
  followUpNotes: z.string().trim().max(300).optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

interface RecordAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  youth: Youth;
  onRecordAttendance: (youth: Youth, record: AttendanceFormValues) => void;
}

export function RecordAttendanceDialog({ 
  open, 
  onOpenChange, 
  youth,
  onRecordAttendance 
}: RecordAttendanceDialogProps) {
  const [programs] = useLocalStorage(STORAGE_KEYS.PROGRAMS, mockPrograms);
  const weekendPrograms = programs.filter(p => p.scheduleType === "sabbath" && p.isActive);
  const weekdayPrograms = programs.filter(p => p.scheduleType === "weekday" && p.isActive);
  const specialPrograms = programs.filter(p => p.scheduleType === "special");

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      programId: "",
      attendanceStatus: "present",
      engagementLevel: "medium",
      participationNotes: "",
      followUpRequired: false,
      followUpNotes: "",
    },
  });

  const attendanceStatus = form.watch("attendanceStatus");

  const onSubmit = (data: AttendanceFormValues) => {
    onRecordAttendance(youth, data);
    toast({
      title: "Attendance Recorded",
      description: `Recorded ${data.attendanceStatus} for ${youth.firstName} ${youth.lastName}.`,
    });
    form.reset();
    onOpenChange(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "absent":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "late":
        return <Clock className="h-5 w-5 text-warning" />;
      case "excused":
        return <Activity className="h-5 w-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Record Attendance
          </DialogTitle>
          <DialogDescription>
            Recording for {youth.firstName} {youth.lastName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Date and Program */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program/Event *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weekendPrograms.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Weekend Programs
                              </div>
                              {weekendPrograms.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </>
                          )}
                          {weekdayPrograms.length > 0 && (
                            <>
                              <Separator className="my-1" />
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Weekday Programs
                              </div>
                              {weekdayPrograms.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </>
                          )}
                          {specialPrograms.length > 0 && (
                            <>
                              <Separator className="my-1" />
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Special Events
                              </div>
                              {specialPrograms.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Attendance Status */}
              <FormField
                control={form.control}
                name="attendanceStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendance Status *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className={cn(
                          "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                          field.value === "present" && "border-success bg-success/10"
                        )}>
                          <RadioGroupItem value="present" id="present" />
                          <Label htmlFor="present" className="flex items-center gap-2 cursor-pointer">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            Present
                          </Label>
                        </div>
                        <div className={cn(
                          "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                          field.value === "absent" && "border-destructive bg-destructive/10"
                        )}>
                          <RadioGroupItem value="absent" id="absent" />
                          <Label htmlFor="absent" className="flex items-center gap-2 cursor-pointer">
                            <XCircle className="h-4 w-4 text-destructive" />
                            Absent
                          </Label>
                        </div>
                        <div className={cn(
                          "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                          field.value === "late" && "border-warning bg-warning/10"
                        )}>
                          <RadioGroupItem value="late" id="late" />
                          <Label htmlFor="late" className="flex items-center gap-2 cursor-pointer">
                            <Clock className="h-4 w-4 text-warning" />
                            Late
                          </Label>
                        </div>
                        <div className={cn(
                          "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                          field.value === "excused" && "border-muted-foreground bg-muted"
                        )}>
                          <RadioGroupItem value="excused" id="excused" />
                          <Label htmlFor="excused" className="flex items-center gap-2 cursor-pointer">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            Excused
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Engagement Level - only show if present or late */}
              {(attendanceStatus === "present" || attendanceStatus === "late") && (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="engagementLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Engagement Level</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            {["low", "medium", "high", "very_high"].map((level) => (
                              <Button
                                key={level}
                                type="button"
                                variant={field.value === level ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "flex-1",
                                  field.value === level && level === "very_high" && "bg-success hover:bg-success/90",
                                  field.value === level && level === "high" && "bg-primary hover:bg-primary/90",
                                  field.value === level && level === "medium" && "bg-warning hover:bg-warning/90",
                                  field.value === level && level === "low" && "bg-destructive hover:bg-destructive/90"
                                )}
                                onClick={() => field.onChange(level)}
                              >
                                <Star className={cn(
                                  "h-3 w-3 mr-1",
                                  field.value === level ? "fill-current" : ""
                                )} />
                                {level === "very_high" ? "Very High" : level.charAt(0).toUpperCase() + level.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="participationNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Participation Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How did they participate? (e.g., led song service, gave testimony, helped with setup...)"
                            className="resize-none"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Follow-up for absent members */}
              {(attendanceStatus === "absent" || attendanceStatus === "excused") && (
                <>
                  <Separator />
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">Follow-Up</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="followUpNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason / Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Reason for absence and any follow-up actions needed..."
                              className="resize-none"
                              rows={2}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {getStatusIcon(attendanceStatus)}
                  <span className="ml-2">Record Attendance</span>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
