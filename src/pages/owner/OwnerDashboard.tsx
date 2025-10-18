import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogOut, Building2, Trash2, Edit2, Calendar, DollarSign, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  price: number;
  expiry_date: string;
}

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    price: "",
    expiryDate: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/owner/login");
      return;
    }

    const { data: ownerData } = await supabase
      .from('owners')
      .select('owner_id')
      .eq('user_id', user.id)
      .single();

    if (!ownerData) {
      toast.error("Owner profile not found");
      await supabase.auth.signOut();
      navigate("/owner/login");
      return;
    }

    setOwnerId(ownerData.owner_id);
    fetchMedicines(ownerData.owner_id);
  };

  const fetchMedicines = async (ownerIdParam: string) => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('owner_id', ownerIdParam)
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

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity || !formData.price || !formData.expiryDate) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('medicines')
        .insert({
          owner_id: ownerId,
          name: formData.name,
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
          expiry_date: formData.expiryDate,
        });

      if (error) throw error;

      toast.success("Medicine added successfully");
      setFormData({ name: "", quantity: "", price: "", expiryDate: "" });
      fetchMedicines(ownerId);
    } catch (error: any) {
      console.error("Add medicine error:", error);
      toast.error(error.message || "Failed to add medicine");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Medicine deleted successfully");
      fetchMedicines(ownerId);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete medicine");
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
            <Building2 className="w-6 h-6 text-secondary" />
            <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Add Medicine Form */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Add New Medicine</h2>
          <form onSubmit={handleAddMedicine} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="name">Medicine Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={loading} className="w-full bg-secondary hover:bg-secondary/90">
                {loading ? "Adding..." : "Add Medicine"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Inventory Table */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Medicine Inventory</h2>
          
          {medicines.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No medicines added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((medicine) => (
                    <TableRow 
                      key={medicine.id}
                      className={
                        isExpiringSoon(medicine.expiry_date) 
                          ? 'bg-destructive/5' 
                          : medicine.quantity < 10 
                          ? 'bg-amber-500/5' 
                          : ''
                      }
                    >
                      <TableCell className="font-medium">
                        {medicine.name}
                        {medicine.quantity < 10 && (
                          <span className="ml-2 text-xs text-amber-600">Low Stock</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          {medicine.quantity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          {medicine.price.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(medicine.expiry_date).toLocaleDateString()}
                          {isExpiringSoon(medicine.expiry_date) && (
                            <span className="text-xs text-destructive">Expiring Soon</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(medicine.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboard;