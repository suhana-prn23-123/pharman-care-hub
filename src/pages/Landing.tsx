import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill, UserCircle, Building2 } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-accent/50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Pill className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pharmacy Management System
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your pharmacy operations with our modern management solution
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50">
            <div className="text-center space-y-6">
              <div className="bg-accent rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <UserCircle className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Customer Portal</h2>
                <p className="text-muted-foreground">
                  Browse medicines and place orders easily
                </p>
              </div>
              <div className="space-y-3">
                <Link to="/customer/register" className="block">
                  <Button className="w-full" size="lg">
                    Register as Customer
                  </Button>
                </Link>
                <Link to="/customer/login" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    Customer Login
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-secondary/50">
            <div className="text-center space-y-6">
              <div className="bg-accent rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <Building2 className="w-10 h-10 text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Owner Portal</h2>
                <p className="text-muted-foreground">
                  Manage your pharmacy inventory and sales
                </p>
              </div>
              <div className="space-y-3">
                <Link to="/owner/register" className="block">
                  <Button className="w-full bg-secondary hover:bg-secondary/90" size="lg">
                    Register as Owner
                  </Button>
                </Link>
                <Link to="/owner/login" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    Owner Login
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;