export interface DeviceInfo {
  id: string;
  clientName: string;
  plan: "basic" | "pro" | "ultimate";
  subscriptionStatus: "active" | "suspended" | "expired";
  subscriptionEndDate: string | null;
  sessionsSavedThisMonth: number;
}
