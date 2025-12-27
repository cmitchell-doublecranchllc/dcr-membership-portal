import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import SignatureCanvas from "react-signature-canvas";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [formData, setFormData] = useState({
    studentName: "",
    studentDOB: "",
    allergies: "",
    medications: "",
    medicalNotes: "",
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    ridingExperience: "",
    membershipTier: "bronze" as "bronze" | "silver" | "gold",
    photoConsent: false,
    smsConsent: false,
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      toast.success("Registration submitted successfully!", {
        description: "Your application is pending approval. You'll receive an email once approved.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast.error("Registration failed", {
        description: error.message,
      });
    },
  });

  const handleSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please sign the liability waiver");
      return;
    }
    if (!formData.smsConsent) {
      toast.error("SMS consent is required to receive important updates");
      return;
    }

    const signatureData = signatureRef.current.toDataURL();
    await signupMutation.mutateAsync({
      ...formData,
      liabilityWaiverSignatureData: signatureData,
      liabilityWaiverSigned: true,
    });
  };

  const clearSignature = () => signatureRef.current?.clear();

  const nextStep = () => {
    if (step === 1 && (!formData.studentName || !formData.studentDOB)) {
      toast.error("Please fill in all required student information");
      return;
    }
    if (step === 2) {
      if (!formData.email || !formData.phone || !formData.emergencyContactName || 
          !formData.emergencyContactPhone || !formData.emergencyContactRelationship) {
        toast.error("Please fill in all required contact information");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }
    if (step === 3 && !formData.ridingExperience) {
      toast.error("Please select your riding experience level");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img src="/logo-cc.png" alt="Double C Ranch" className="h-24" />
            <img src="/logo-pony-club.png" alt="United States Pony Clubs" className="h-24" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Member Registration</h1>
          <p className="text-muted-foreground">Complete your registration to join Double C Ranch</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>{s}</div>
                {s < 4 && <div className={`w-12 h-1 ${step > s ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Student Information"}
              {step === 2 && "Contact & Emergency Information"}
              {step === 3 && "Riding Experience & Membership"}
              {step === 4 && "Liability Waiver & Consent"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about the student/rider"}
              {step === 2 && "Provide contact details for the account holder"}
              {step === 3 && "Share your riding background and membership preference"}
              {step === 4 && "Review and sign the liability waiver"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student's Full Name *</Label>
                  <Input
                    id="studentName"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="Enter student's full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentDOB">Student's Date of Birth *</Label>
                  <Input
                    id="studentDOB"
                    type="date"
                    value={formData.studentDOB}
                    onChange={(e) => setFormData({ ...formData, studentDOB: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="List any allergies (e.g., hay, dust, bee stings, medications)"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    placeholder="List any current medications"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalNotes">Special Medical Conditions or Notes</Label>
                  <Textarea
                    id="medicalNotes"
                    value={formData.medicalNotes}
                    onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                    placeholder="Any other medical information we should know"
                    rows={3}
                  />
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                  />
                  <p className="text-sm text-muted-foreground">This will be used for your account login</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Emergency Contact</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                      <Input
                        id="emergencyContactPhone"
                        type="tel"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactRelationship">Relationship to Student *</Label>
                      <Input
                        id="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                        placeholder="e.g., Parent, Spouse, Sibling"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ridingExperience">Riding Experience Level *</Label>
                  <Select
                    value={formData.ridingExperience}
                    onValueChange={(value) => setFormData({ ...formData, ridingExperience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner - New to riding</SelectItem>
                      <SelectItem value="novice">Novice - Some experience</SelectItem>
                      <SelectItem value="intermediate">Intermediate - Regular rider</SelectItem>
                      <SelectItem value="advanced">Advanced - Experienced rider</SelectItem>
                      <SelectItem value="expert">Expert - Competitive level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="membershipTier">Membership Tier *</Label>
                  <Select
                    value={formData.membershipTier}
                    onValueChange={(value: "bronze" | "silver" | "gold") => setFormData({ ...formData, membershipTier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze - Basic membership</SelectItem>
                      <SelectItem value="silver">Silver - Enhanced benefits</SelectItem>
                      <SelectItem value="gold">Gold - Premium membership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <div className="space-y-4">
                  <div className="border rounded-lg p-6 max-h-96 overflow-y-auto bg-muted/30">
                    <h3 className="font-bold text-center mb-4">
                      WAIVER AND RELEASE OF LIABILITY, ASSUMPTION OF RISK AND INDEMNITY AGREEMENT
                    </h3>
                    <div className="space-y-4 text-sm">
                      <p>
                        For and in consideration of Double C Ranch LLC allowing me, the undersigned, to participate as a riding student or worker at Double C Ranch LLC, located at 2626 Yule Farm, Charlottesville, VA 22901, and to engage in equine-related activities including but not limited to riding, handling, grooming, training, exercising, feeding, or working around horses (collectively referred to as "Equine Activities"), I, for myself, and on behalf of my heirs, next of kin, legal and personal representatives, executors, administrators, successors, and assigns, hereby agree to and make the following contractual representations pursuant to this Agreement (the "Agreement"):
                      </p>
                      
                      <div>
                        <h4 className="font-semibold mb-2">A. RULES AND REGULATIONS:</h4>
                        <p>
                          I hereby agree that I have read, understand, and agree to be bound by all applicable Double C Ranch LLC rules, policies, and safety measures as amended from time to time.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">B. ACKNOWLEDGMENT OF RISK:</h4>
                        <p>
                          I knowingly, willingly, and voluntarily acknowledge the inherent risks associated with equine activities and understand that working with, handling, and riding horses is inherently dangerous, and that participation in any equine activity at Double C Ranch LLC involves risks and dangers including, without limitation:
                        </p>
                        <p className="mt-2">
                          (i) the propensity of an equine to behave in dangerous ways which may result in injury; (ii) the inability to predict an equine's reaction to sound, movements, objects, persons, or animals; (iii) hazards of surface or subsurface conditions; (iv) the potential for serious bodily injury (including broken bones, head or neck injuries), sickness and disease (including communicable diseases), trauma, pain & suffering, permanent disability, paralysis, and death; (v) loss of or damage to personal property (including my mount, tack, and equipment) arising out of the unpredictable behavior of horses; (vi) exposure to extreme conditions and circumstances; (vii) accidents involving other participants, staff, volunteers, or spectators; contact or collision with other participants, horses, natural or manmade objects; adverse weather conditions; (viii) facilities issues and premises conditions; failure of protective equipment (including helmets); (ix) inadequate safety measures; participants of varying skill levels; (x) situations beyond the immediate control of Double C Ranch LLC and its management; (xi) other undefined, not readily foreseeable, and presently unknown risks and dangers ("Risks").
                        </p>
                        <p className="mt-2 font-semibold">
                          CAUTION: HORSEBACK RIDING AND EQUINE ACTIVITIES CAN BE DANGEROUS. PARTICIPATE AT YOUR OWN RISK.
                        </p>
                        <p className="mt-2">
                          Under VA Code Ann. Sec 3.2-6200-6203, an equine activity sponsor or equine professional is not liable for any injury to, or the death of, a participant in equine activities resulting from the inherent risks of equine activities.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">C. ASSUMPTION OF RISK:</h4>
                        <p>
                          I understand that the aforementioned Risks may be caused in whole or in part or result directly or indirectly from my own actions or inactions, the actions or inactions of others at Double C Ranch LLC, or the negligent acts or omissions of the Released Parties defined below, and I hereby voluntarily and knowingly assume all such Risks and responsibility for any damages, liabilities, losses, or expenses that I incur as a result of my participation in equine activities at Double C Ranch LLC. I also agree to be responsible for any injury or damage caused by me, my horse, or my actions at Double C Ranch LLC.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">D. WAIVER AND RELEASE OF LIABILITY, HOLD HARMLESS, AND INDEMNITY:</h4>
                        <p>
                          In conjunction with my participation in equine activities at Double C Ranch LLC, I hereby release, waive, and covenant not to sue, and further agree to indemnify, defend, and hold harmless the following parties: Double C Ranch LLC, its owners, employees, agents, contractors, volunteers, other participants, and visitors (Individually and Collectively, the "Released Parties"), with respect to any liability, claim(s), demand(s), cause(s) of action, damage(s), loss, or expense (including court costs and reasonable attorney fees) of any kind or nature ("Liability") which may arise out of, result from, or relate in any way to my participation in equine activities at Double C Ranch LLC, including claims for Liability caused in whole or in part by the negligent acts or omissions of the Released Parties.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">E. COMPLETE AGREEMENT AND SEVERABILITY CLAUSE:</h4>
                        <p>
                          This Agreement represents the complete understanding between the parties regarding these issues and no oral representations, statements, or inducements have been made apart from this Agreement. If any provision of this Agreement is held to be unlawful, void, or for any reason unenforceable, then that provision shall be deemed severable from this Agreement and shall not affect the validity and enforceability of any remaining provisions.
                        </p>
                      </div>

                      <p className="font-semibold mt-4">
                        I HAVE CAREFULLY READ THIS DOCUMENT IN ITS ENTIRETY, UNDERSTAND ALL OF ITS TERMS AND CONDITIONS, AND KNOW IT CONTAINS AN ASSUMPTION OF RISK, RELEASE AND WAIVER FROM LIABILITY, AS WELL AS A HOLD HARMLESS AND INDEMNIFICATION OBLIGATIONS. By signing below, I confirm that I have read, understand, and agree to be bound by all applicable Double C Ranch LLC policies, as well as all terms and provisions of this Agreement. If, despite this Agreement, I, or anyone on my behalf, makes a claim for Liability against any of the Released Parties, I will indemnify, defend, and hold harmless each of the Released Parties from any such Liabilities as the result of such claim.
                      </p>

                      <p className="mt-2">
                        The parties agree that this agreement may be electronically signed. The parties agree that the electronic signatures appearing on this agreement are the same as handwritten signatures for the purposes of validity, enforceability, and admissibility.
                      </p>

                      <p className="mt-2 font-semibold">
                        Address: 2626 Yule Farm, Charlottesville, VA 22901
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Digital Signature *</Label>
                      <div className="border-2 border-dashed rounded-lg bg-background">
                        <SignatureCanvas
                          ref={signatureRef}
                          canvasProps={{
                            className: "w-full h-40",
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Sign above using your mouse or finger
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearSignature}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="photoConsent"
                        checked={formData.photoConsent}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            photoConsent: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="photoConsent" className="font-normal cursor-pointer">
                        I consent to having photos/videos taken and used for promotional purposes (optional)
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="smsConsent"
                        checked={formData.smsConsent}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            smsConsent: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="smsConsent" className="font-normal cursor-pointer">
                        I consent to receive text messages for lesson reminders and important updates (required) *
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-6 border-t">
              {step > 1 ? (
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setLocation("/")}>
                  Cancel
                </Button>
              )}

              {step < 4 ? (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Submit Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
