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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  BookOpen,
  Users,
  TrendingUp
} from "lucide-react";
import { Youth } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const youthFormSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters").max(50),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], { required_error: "Please select a gender" }),
  address: z.string().trim().min(5, "Please enter a complete address").max(200),
  
  // Employment & Education
  employmentStatus: z.enum(["student", "employed", "unemployed", "self_employed"], {
    required_error: "Please select employment status",
  }),
  isStudent: z.boolean().default(false),
  studentLevel: z.enum(["high_school", "college", "university", "postgraduate", "vocational"]).optional(),
  schoolName: z.string().trim().max(100).optional(),
  courseOfStudy: z.string().trim().max(100).optional(),
  occupation: z.string().trim().max(100).optional(),
  employer: z.string().trim().max(100).optional(),
  
  // Optional background
  isBaptized: z.boolean().default(false),
  baptismDate: z.string().optional(),
  homeChurch: z.string().trim().max(100).optional(),
  sabbathKeepingYears: z.string().optional(),
  
  // Ministry & Engagement
  smallGroup: z.string().optional(),
  ministryAreas: z.array(z.string()).default([]),
  discipleshipStatus: z.enum(["new_member", "developing", "experienced", "leader"]).default("new_member"),
  leadershipLevel: z.enum(["none", "emerging", "developing", "established"]).default("none"),
  
  // Additional
  emergencyContact: z.string().trim().max(100).optional(),
  emergencyPhone: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(500).optional(),
});

type YouthFormValues = z.infer<typeof youthFormSchema>;

interface AddYouthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (youth: Partial<Youth>) => void;
  editingYouth?: Youth | null;
}

const ministryOptions = [
  "Music/Creative",
  "Youth Leadership",
  "Learning Circle",
  "Mentorship",
  "Volunteer Team",
  "Community Service",
  "Media/Tech",
  "Hospitality",
  "Family Support",
  "Wellbeing",
  "Outreach",
  "Care Team",
];

const smallGroupOptions = [
  "Young Adults Connect",
  "Teen Warriors",
  "Junior Cohort",
  "Young Professionals",
  "College & Career",
];

export function AddYouthDialog({ open, onOpenChange, onSave, editingYouth }: AddYouthDialogProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<YouthFormValues>({
    resolver: zodResolver(youthFormSchema),
    defaultValues: {
      firstName: editingYouth?.firstName || "",
      lastName: editingYouth?.lastName || "",
      email: editingYouth?.email || "",
      phone: editingYouth?.phone || "",
      dateOfBirth: editingYouth?.dateOfBirth || "",
      gender: editingYouth?.gender,
      address: editingYouth?.address || "",
      employmentStatus: "student",
      isStudent: false,
      ministryAreas: editingYouth?.ministryAreas || [],
      discipleshipStatus: editingYouth?.discipleshipStatus || "new_member",
      leadershipLevel: editingYouth?.leadershipLevel || "none",
      isBaptized: false,
    },
  });

  const employmentStatus = form.watch("employmentStatus");
  const isStudent = form.watch("isStudent");

  const onSubmit = (data: YouthFormValues) => {
    // Map form data to Youth type
    const newYouth: Partial<Youth> = {
      id: editingYouth?.id || crypto.randomUUID(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      educationStatus: data.isStudent || data.employmentStatus === "student" 
        ? (data.studentLevel === "high_school" ? "high_school" : "college")
        : data.employmentStatus === "employed" || data.employmentStatus === "self_employed"
          ? "working"
          : "unemployed",
      occupation: data.occupation || (data.isStudent ? `${data.courseOfStudy || "Student"} at ${data.schoolName || "School"}` : undefined),
      joinDate: editingYouth?.joinDate || new Date().toISOString().split("T")[0],
      status: "active",
      engagementScore: editingYouth?.engagementScore || 50,
      engagementStatus: editingYouth?.engagementStatus || "engaged",
      smallGroup: data.smallGroup || undefined,
      ministryAreas: data.ministryAreas,
      discipleshipStatus: data.discipleshipStatus,
      leadershipLevel: data.leadershipLevel,
      attendanceRate: editingYouth?.attendanceRate || 0,
      notes: data.notes,
      ageGroup: calculateAgeGroup(data.dateOfBirth),
    };

    onSave(newYouth);
    toast({
      title: editingYouth ? "Record Updated" : "Record Added",
      description: `${data.firstName} ${data.lastName} has been ${editingYouth ? "updated" : "added"} successfully.`,
    });
    form.reset();
    setStep(1);
    onOpenChange(false);
  };

  const calculateAgeGroup = (dob: string): Youth["ageGroup"] => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age >= 60) return "60+";
    if (age >= 46) return "46-60";
    if (age >= 31) return "31-45";
    if (age >= 18) return "18-30";
    return "under-18";
  };

  const nextStep = async () => {
    const fieldsToValidate: (keyof YouthFormValues)[][] = [
      ["firstName", "lastName", "email", "phone", "dateOfBirth", "gender", "address"],
      ["employmentStatus"],
      ["isBaptized"],
      [],
    ];
    
    const isValid = await form.trigger(fieldsToValidate[step - 1]);
    if (isValid && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {editingYouth ? "Edit Person" : "Add Person"}
          </DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps}: {
              step === 1 ? "Personal Information" :
              step === 2 ? "Education & Employment" :
              step === 3 ? "Background & Involvement" :
              "Teams & Notes"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <ScrollArea className="max-h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="h-4 w-4" />
                    Basic Information
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Contact Details
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="john.doe@email.com" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="+1 (555) 123-4567" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="123 Main Street, City" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Education & Employment */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    Employment Status
                  </div>

                  <FormField
                    control={form.control}
                    name="employmentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Employment Status *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-3"
                          >
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                              <RadioGroupItem value="student" id="student" />
                              <Label htmlFor="student" className="flex items-center gap-2 cursor-pointer">
                                <GraduationCap className="h-4 w-4 text-primary" />
                                Student
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                              <RadioGroupItem value="employed" id="employed" />
                              <Label htmlFor="employed" className="flex items-center gap-2 cursor-pointer">
                                <Briefcase className="h-4 w-4 text-success" />
                                Employed
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                              <RadioGroupItem value="self_employed" id="self_employed" />
                              <Label htmlFor="self_employed" className="flex items-center gap-2 cursor-pointer">
                                <Briefcase className="h-4 w-4 text-accent" />
                                Self-Employed
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                              <RadioGroupItem value="unemployed" id="unemployed" />
                              <Label htmlFor="unemployed" className="flex items-center gap-2 cursor-pointer">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                Seeking Work
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(employmentStatus === "employed" || employmentStatus === "self_employed") && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="occupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title / Occupation</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Software Developer, Teacher" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="employer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{employmentStatus === "self_employed" ? "Business Name" : "Employer"}</FormLabel>
                              <FormControl>
                                <Input placeholder={employmentStatus === "self_employed" ? "Your business name" : "Company name"} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isStudent"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Also a Student</FormLabel>
                                <FormDescription>
                                  Check if working while studying
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  {(employmentStatus === "student" || isStudent) && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        Education Details
                      </div>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="studentLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Education Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="high_school">High School</SelectItem>
                                  <SelectItem value="vocational">Vocational/Technical</SelectItem>
                                  <SelectItem value="college">College/Associate</SelectItem>
                                  <SelectItem value="university">University/Bachelor's</SelectItem>
                                  <SelectItem value="postgraduate">Postgraduate/Master's</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="schoolName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>School/Institution Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Andrews University" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="courseOfStudy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course/Major</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Theology, Nursing" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Background & Growth */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    Background & Involvement
                  </div>

                  <FormField
                    control={form.control}
                    name="isBaptized"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg bg-muted/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base">Completed Orientation</FormLabel>
                          <FormDescription>
                            Has completed the organization's onboarding or membership process
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("isBaptized") && (
                    <FormField
                      control={form.control}
                      name="baptismDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orientation Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="homeChurch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Affiliation</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., campus chapter, local branch, partner group" {...field} />
                        </FormControl>
                        <FormDescription>
                          The branch, chapter, or group they are connected to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sabbathKeepingYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years Involved</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New participant</SelectItem>
                            <SelectItem value="1-2">1-2 years</SelectItem>
                            <SelectItem value="3-5">3-5 years</SelectItem>
                            <SelectItem value="5+">5+ years</SelectItem>
                            <SelectItem value="lifelong">Long-term member</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Development Stage
                  </div>

                  <FormField
                    control={form.control}
                    name="discipleshipStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Development Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new_member">New Member</SelectItem>
                            <SelectItem value="developing">Developing</SelectItem>
                            <SelectItem value="experienced">Experienced</SelectItem>
                            <SelectItem value="leader">Team Leader</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leadershipLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leadership Development</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Not in Leadership</SelectItem>
                            <SelectItem value="emerging">Emerging Leader</SelectItem>
                            <SelectItem value="developing">Developing Leader</SelectItem>
                            <SelectItem value="established">Established Leader</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Ministry & Notes */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Teams & Activities
                  </div>

                  <FormField
                    control={form.control}
                    name="smallGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Small Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign to a small group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Not Assigned</SelectItem>
                            {smallGroupOptions.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ministryAreas"
                    render={() => (
                      <FormItem>
                        <FormLabel>Activity Areas</FormLabel>
                        <FormDescription>
                          Select all teams or activities they are involved in or interested in
                        </FormDescription>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {ministryOptions.map((ministry) => (
                            <FormField
                              key={ministry}
                              control={form.control}
                              name="ministryAreas"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(ministry)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, ministry]);
                                        } else {
                                          field.onChange(current.filter((v) => v !== ministry));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {ministry}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Emergency Contact
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special needs, accessibility requirements, or important notes..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This information will be kept confidential
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </form>
          </Form>
        </ScrollArea>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            Previous
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                form.reset();
                setStep(1);
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            {step < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={form.handleSubmit(onSubmit)}>
                {editingYouth ? "Save Changes" : "Register Member"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
