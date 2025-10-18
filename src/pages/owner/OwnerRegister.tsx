import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Building2 } from "lucide-react";

const OwnerRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pharmacyName: "",
    email: "",
    address: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.pharmacyName || !formData.email || !formData.address || !formData.phone || !formData.password) {
        toast.error("Please fill in all fields");
        return;
      }

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Generate owner ID
        const { data: idData, error: idError } = await supabase.rpc('generate_owner_id');
        if (idError) throw idError;

        // Create owner profile
        const { error: profileError } = await supabase
          .from('owners')
          .insert({
            owner_id: idData,
            user_id: authData.user.id,
            pharmacy_name: formData.pharmacyName,
            address: formData.address,
            phone: formData.phone,
          });

        if (profileError) throw profileError;

        toast.success(`Registration successful! Your Owner ID is: ${idData}`, {
          duration: 10000,
        });

        setTimeout(() => navigate("/owner/login"), 2000);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-accent/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Building2 className="w-8 h-8 text-secondary" />
          <h1 className="text-3xl font-bold">Owner Registration</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pharmacyName">Pharmacy Name</Label>
            <Input
              id="pharmacyName"
              type="text"
              value={formData.pharmacyName}
              onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Pharmacy Address</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/owner/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default OwnerRegister;