import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { firestore } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import FareRulesManager from '@/components/FareRulesManager';
import ZonesManager from '@/components/ZonesManager';
import { FareRule, Zone } from '@/lib/firebaseModels';
import { useSearchParams } from 'react-router-dom';

interface TaxiType {
  id: string;
  name: string;
  emoji: string;
}

const AdminFareSettings = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'zones' ? 'zones' : 'fare-rules');
  
  const [taxiTypes, setTaxiTypes] = useState<TaxiType[]>([]);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch required data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch taxi types
        const taxiTypesRef = collection(firestore, 'taxiTypes');
        const taxiSnapshot = await getDocs(taxiTypesRef);
        
        const fetchedTaxiTypes = taxiSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TaxiType[];
        
        setTaxiTypes(fetchedTaxiTypes);
        
        // Fetch fare rules
        const fareRulesRef = collection(firestore, 'fareRules');
        const fareRulesSnapshot = await getDocs(fareRulesRef);
        
        const fetchedFareRules = fareRulesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FareRule[];
        
        setFareRules(fetchedFareRules);
        
        // Fetch zones
        const zonesRef = collection(firestore, 'zones');
        const zonesSnapshot = await getDocs(zonesRef);
        
        const fetchedZones = zonesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Zone[];
        
        setZones(fetchedZones);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Update active tab when URL query parameter changes
  useEffect(() => {
    if (tabFromUrl === 'zones') {
      setActiveTab('zones');
    } else if (tabFromUrl === 'fare-rules') {
      setActiveTab('fare-rules');
    }
  }, [tabFromUrl]);
  
  if (isLoading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <Loader2 className="h-12 w-12 text-fleet-red animate-spin mb-4" />
          <p className="text-xl text-gray-500">Loading fare settings...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout userType="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fare Settings & Geofencing</h1>
        <p className="text-gray-500">Manage fare rules and geofencing zones for your fleet</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="fare-rules">Fare Rules</TabsTrigger>
          <TabsTrigger value="zones">Zones & Geofencing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fare-rules">
          <FareRulesManager 
            taxiTypes={taxiTypes} 
            zones={zones.map(zone => ({ id: zone.id, name: zone.name }))} 
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
