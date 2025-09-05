import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fareRulesService } from "@/services/fareRulesService";
import { zonesService } from "@/services/zonesService";
import { transportService } from "@/services/transportService";
import FareRulesManager from "@/components/FareRulesManager";
import ZonesManager from "@/components/ZonesManager";
import { FareRule, Zone } from "@/types";
import { useSearchParams } from "react-router-dom";

interface TaxiType {
  id: string;
  name: string;
  emoji: string;
}

const AdminFareSettings = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === "zones" ? "zones" : "fare-rules",
  );

  const [taxiTypes, setTaxiTypes] = useState<TaxiType[]>([]);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch required data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch taxi types from transports API
        const transportsResp = await transportService.getAllTransports();
        if (transportsResp.success && transportsResp.data) {
          const mappedTaxiTypes: TaxiType[] = transportsResp.data.map((t) => ({
            id: t.id,
            name: t.name,
            emoji: t.emoji || "🚗",
          }));
          setTaxiTypes(mappedTaxiTypes);
        } else {
          setTaxiTypes([]);
        }

        // Fetch fare rules
        const fareRulesResp = await fareRulesService.list();
        if (fareRulesResp.success && fareRulesResp.data) {
          setFareRules(fareRulesResp.data as FareRule[]);
        } else {
          setFareRules([]);
        }

        // Fetch zones
        const zonesResp = await zonesService.list();
        if (zonesResp.success && zonesResp.data) {
          setZones(zonesResp.data as Zone[]);
        } else {
          setZones([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update active tab when URL query parameter changes
  useEffect(() => {
    if (tabFromUrl === "zones") {
      setActiveTab("zones");
    } else if (tabFromUrl === "fare-rules") {
      setActiveTab("fare-rules");
    }
  }, [tabFromUrl]);

  if (isLoading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-xl text-gray-500">Loading fare settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fare Settings & Geofencing</h1>
        <p className="text-gray-500">
          Manage fare rules and geofencing zones for your fleet
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="fare-rules">Fare Rules</TabsTrigger>
          <TabsTrigger value="zones">Zones & Geofencing</TabsTrigger>
        </TabsList>

        <TabsContent value="fare-rules">
          <FareRulesManager
            taxiTypes={taxiTypes}
            zones={zones.map((zone) => ({ id: zone.id, name: zone.name }))}
          />
        </TabsContent>

        <TabsContent value="zones">
          <ZonesManager fareRules={fareRules} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminFareSettings;
