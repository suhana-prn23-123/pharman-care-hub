import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Pill, ShoppingCart, Calendar, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  price: number;
  expiry_date: string;
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchMedicines();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/customer/login");
      return;
    }

    const { data: customerData } = await supabase
      .from('customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (!customerData) {
      toast.error("Customer profile not found");
      await supabase.auth.signOut();
      navigate("/customer/login");
      return;
    }

    setCustomerId(customerData.customer_id);
  };

  const fetchMedicines = async () => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .gt('quantity', 0)
      .order('name');

    if (error) {
      toast.error("Failed to fetch medicines");
      console.error(error);
    } else {
      setMedicines(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleOrder = async () => {
    if (!selectedMedicine || !customerId) return;
    
    if (orderQuantity <= 0 || orderQuantity > selectedMedicine.quantity) {
      toast.error("Invalid quantity");
      return;
    }

    setLoading(true);
    try {
      const totalPrice = selectedMedicine.price * orderQuantity;

      const { error } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          medicine_id: selectedMedicine.id,
          quantity: orderQuantity,
          total_price: totalPrice,
        });

      if (error) throw error;

      // Update medicine quantity
      const { error: updateError } = await supabase
        .from('medicines')
        .update({ quantity: selectedMedicine.quantity - orderQuantity })
        .eq('id', selectedMedicine.id);

      if (updateError) throw updateError;

      toast.success(`Order placed successfully! Total: $${totalPrice.toFixed(2)}`);
      setSelectedMedicine(null);
      setOrderQuantity(1);
      fetchMedicines();
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 30;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-accent/50">
      <nav className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Customer Dashboard</h1>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Available Medicines</h2>
        
        {medicines.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No medicines available at the moment</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map((medicine) => (
              <Card 
                key={medicine.id} 
                className={`p-6 hover:shadow-lg transition-all ${
                  isExpiringSoon(medicine.expiry_date) ? 'border-destructive/50' : ''
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold">{medicine.name}</h3>
                    {isExpiringSoon(medicine.expiry_date) && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                        Expiring Soon
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-lg text-foreground">
                        ${medicine.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShoppingCart className="w-4 h-4" />
                      <span>Stock: {medicine.quantity} units</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Expires: {new Date(medicine.expiry_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setSelectedMedicine(medicine)}
                    className="w-full"
                  >
                    Order Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedMedicine} onOpenChange={(open) => !open && setSelectedMedicine(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
            <DialogDescription>
              {selectedMedicine?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Price per unit: ${selectedMedicine?.price.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Available: {selectedMedicine?.quantity} units
              </p>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedMedicine?.quantity}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="bg-accent p-4 rounded-lg">
              <p className="font-semibold text-lg">
                Total: ${((selectedMedicine?.price || 0) * orderQuantity).toFixed(2)}
              </p>
            </div>

            <Button 
              onClick={handleOrder} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Placing Order..." : "Confirm Order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;